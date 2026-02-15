/**
 * Admin API - User Management
 *
 * Protected admin endpoints for managing user subscriptions.
 *
 * GET /api/admin/users - List users (admin only)
 * PATCH /api/admin/users - Update user plan (admin only)
 */

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// Admin emails that can access this endpoint
// In production, this should come from environment variables or database
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').filter(Boolean);

/**
 * Check if the current user is an admin
 */
async function isAdmin(supabase: Awaited<ReturnType<typeof createClient>>): Promise<{
  isAdmin: boolean;
  user: { id: string; email: string } | null;
}> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return { isAdmin: false, user: null };
  }

  // Check if user email is in admin list
  const isAdminUser = ADMIN_EMAILS.includes(user.email.toLowerCase());

  return {
    isAdmin: isAdminUser,
    user: { id: user.id, email: user.email },
  };
}

// GET - List users with their subscription info
export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const { isAdmin: isAdminUser, user } = await isAdmin(supabase);

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isAdminUser) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
  const offset = (page - 1) * limit;

  let query = supabase
    .from('user_profiles')
    .select(
      `
      id,
      email,
      full_name,
      subscription_tier,
      subscription_status,
      downloads_limit,
      downloads_this_month,
      created_at,
      updated_at
    `,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  // Apply search filter if provided
  if (search) {
    query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
  }

  const { data: users, count, error } = await query;

  if (error) {
    console.error('Admin users fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }

  return NextResponse.json({
    users: users || [],
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
    },
  });
}

// PATCH - Update user subscription/plan
export async function PATCH(request: NextRequest) {
  const supabase = await createClient();

  const { isAdmin: isAdminUser, user: adminUser } = await isAdmin(supabase);

  if (!adminUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isAdminUser) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { user_id, subscription_tier, subscription_status, downloads_limit, reason } = body;

  if (!user_id) {
    return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
  }

  // Validate subscription tier
  const validTiers = ['free', 'pro'];
  if (subscription_tier && !validTiers.includes(subscription_tier)) {
    return NextResponse.json(
      { error: `Invalid tier. Must be one of: ${validTiers.join(', ')}` },
      { status: 400 }
    );
  }

  // Validate subscription status
  const validStatuses = ['active', 'cancelled', 'past_due', 'paused', 'trialing'];
  if (subscription_status && !validStatuses.includes(subscription_status)) {
    return NextResponse.json(
      { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
      { status: 400 }
    );
  }

  // Build update object
  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (subscription_tier) {
    updates.subscription_tier = subscription_tier;

    // Update downloads_limit based on tier if not explicitly set
    if (downloads_limit === undefined) {
      const tierLimits = { free: 3, pro: 300 };
      updates.downloads_limit = tierLimits[subscription_tier as keyof typeof tierLimits];
    }
  }

  if (subscription_status) {
    updates.subscription_status = subscription_status;
  }

  if (downloads_limit !== undefined) {
    updates.downloads_limit = downloads_limit;
  }

  // Update the user
  const { data: updatedUser, error: updateError } = await supabase
    .from('user_profiles')
    .update(updates)
    .eq('id', user_id)
    .select()
    .single();

  if (updateError) {
    console.error('Admin user update error:', updateError);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }

  // Log admin action
  void supabase.from('usage_events').insert({
    user_id: adminUser.id,
    event_type: 'admin_plan_override',
    metadata: {
      target_user_id: user_id,
      changes: updates,
      reason: reason || 'Manual override',
      admin_email: adminUser.email,
    },
  });

  return NextResponse.json({
    success: true,
    user: updatedUser,
    message: `User ${user_id} updated successfully`,
  });
}
