import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, getSupabaseClient } from '@/lib/supabase/api-auth';

/**
 * GET /api/user/preferences — Read user preferences
 * PATCH /api/user/preferences — Shallow-merge into preferences JSONB
 */

export async function GET(req: NextRequest) {
  const { user, error: authError } = await getAuthUser(req);
  if (!user) {
    return NextResponse.json(
      { error: authError || 'Unauthorized' },
      { status: 401 },
    );
  }

  const supabase = await getSupabaseClient(req);
  if (!supabase) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }

  const { data, error } = await (supabase as any)
    .from('user_profiles')
    .select('preferences')
    .eq('id', user.id)
    .maybeSingle();

  if (error) {
    console.error('[Preferences GET]', error);
    return NextResponse.json(
      { error: 'Failed to fetch preferences' },
      { status: 500 },
    );
  }

  return NextResponse.json({ preferences: data?.preferences ?? {} });
}

export async function PATCH(req: NextRequest) {
  const { user, error: authError } = await getAuthUser(req);
  if (!user) {
    return NextResponse.json(
      { error: authError || 'Unauthorized' },
      { status: 401 },
    );
  }

  const supabase = await getSupabaseClient(req);
  if (!supabase) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }

  let body: { preferences?: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!body.preferences || typeof body.preferences !== 'object') {
    return NextResponse.json(
      { error: 'preferences object required' },
      { status: 400 },
    );
  }

  // Read current preferences
  const { data: current } = await (supabase as any)
    .from('user_profiles')
    .select('preferences')
    .eq('id', user.id)
    .maybeSingle();

  const merged = { ...(current?.preferences ?? {}), ...body.preferences };

  // Write merged preferences
  const { error } = await (supabase as any)
    .from('user_profiles')
    .update({ preferences: merged, updated_at: new Date().toISOString() })
    .eq('id', user.id);

  if (error) {
    console.error('[Preferences PATCH]', error);
    return NextResponse.json(
      { error: 'Failed to update preferences' },
      { status: 500 },
    );
  }

  return NextResponse.json({ preferences: merged });
}
