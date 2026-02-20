/**
 * Admin API - User Management
 *
 * Protected admin endpoints for managing user subscriptions.
 * Uses service role client to bypass RLS for admin access.
 *
 * GET /api/admin/users - List users (admin only)
 * PATCH /api/admin/users - Update user plan (admin only)
 */

import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').filter(Boolean);

/**
 * Create a service role client that bypasses RLS
 */
function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createServiceClient(url, key);
}

/**
 * Check if the current user is an admin (uses cookie-based auth)
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

  const isAdminUser = ADMIN_EMAILS.includes(user.email.toLowerCase());
  return {
    isAdmin: isAdminUser,
    user: { id: user.id, email: user.email },
  };
}

// GET - List users with their subscription info
export async function GET(request: NextRequest) {
  // Auth check with cookie-based client
  const supabase = await createClient();
  const { isAdmin: isAdminUser, user } = await isAdmin(supabase);

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!isAdminUser) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Use service role client to bypass RLS for admin data access
  const serviceClient = getServiceClient();
  if (!serviceClient) {
    return NextResponse.json(
      { error: 'Server configuration error: SUPABASE_SERVICE_ROLE_KEY not set' },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
  const offset = (page - 1) * limit;

  let query = serviceClient
    .from('user_profiles')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (search) {
    query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
  }

  const { data: users, count, error } = await query;

  if (error) {
    console.error('Admin users fetch error:', error.message, error.details, error.hint);
    return NextResponse.json(
      { error: 'Failed to fetch users', details: error.message },
      { status: 500 }
    );
  }

  // Normalize rows - provide defaults for optional columns
  const normalizedUsers = (users || []).map((u: Record<string, unknown>) => ({
    id: u.id || '',
    email: u.email || '',
    full_name: u.full_name || null,
    subscription_tier: u.subscription_tier || 'free',
    subscription_status: u.subscription_status || null,
    downloads_limit: u.downloads_limit ?? u.download_limit ?? 30,
    downloads_this_month: u.downloads_this_month ?? u.download_count ?? 0,
    created_at: u.created_at || '',
    updated_at: u.updated_at || '',
  }));

  return NextResponse.json({
    users: normalizedUsers,
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
  // Auth check with cookie-based client
  const supabase = await createClient();
  const { isAdmin: isAdminUser, user: adminUser } = await isAdmin(supabase);

  if (!adminUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!isAdminUser) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Use service role client to bypass RLS for admin updates
  const serviceClient = getServiceClient();
  if (!serviceClient) {
    return NextResponse.json(
      { error: 'Server configuration error: SUPABASE_SERVICE_ROLE_KEY not set' },
      { status: 500 }
    );
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

  const validTiers = ['free', 'pro'];
  if (subscription_tier && !validTiers.includes(subscription_tier)) {
    return NextResponse.json(
      { error: `Invalid tier. Must be one of: ${validTiers.join(', ')}` },
      { status: 400 }
    );
  }

  const validStatuses = ['active', 'cancelled', 'past_due', 'paused', 'trialing'];
  if (subscription_status && !validStatuses.includes(subscription_status)) {
    return NextResponse.json(
      { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
      { status: 400 }
    );
  }

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (subscription_tier) {
    updates.subscription_tier = subscription_tier;
    if (downloads_limit === undefined) {
      const tierLimits = { free: 30, pro: 300 };
      updates.downloads_limit = tierLimits[subscription_tier as keyof typeof tierLimits];
    }
  }

  if (subscription_status) {
    updates.subscription_status = subscription_status;
  }

  if (downloads_limit !== undefined) {
    updates.downloads_limit = downloads_limit;
  }

  const { data: updatedUser, error: updateError } = await serviceClient
    .from('user_profiles')
    .update(updates)
    .eq('id', user_id)
    .select()
    .single();

  if (updateError) {
    console.error('Admin user update error:', updateError);
    return NextResponse.json(
      { error: 'Failed to update user', details: updateError.message },
      { status: 500 }
    );
  }

  // Log admin action
  void serviceClient.from('usage_events').insert({
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
