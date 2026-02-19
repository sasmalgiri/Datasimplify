import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, getSupabaseClient } from '@/lib/supabase/api-auth';
import { FEATURES } from '@/lib/featureFlags';

/**
 * GET /api/v1/workspaces — List user's workspaces
 * POST /api/v1/workspaces — Create a new workspace
 * PATCH /api/v1/workspaces — Update a workspace (requires ?id=)
 * DELETE /api/v1/workspaces — Delete a workspace (requires ?id=)
 *
 * Feature-flagged: requires NEXT_PUBLIC_FEATURE_ADDIN_V2=true
 */

const MAX_WORKSPACES = 10;

export async function GET(req: NextRequest) {
  if (!FEATURES.addinV2) {
    return NextResponse.json({ error: 'Feature not enabled' }, { status: 404 });
  }

  const { user, error: authError } = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 });
  }

  const supabase = await getSupabaseClient(req);
  if (!supabase) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }

  const { data, error } = await supabase
    .from('user_workspaces')
    .select('id, name, mode, config, is_active, created_at, updated_at')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('[Workspaces GET]', error);
    return NextResponse.json({ error: 'Failed to fetch workspaces' }, { status: 500 });
  }

  return NextResponse.json({ workspaces: data || [] });
}

export async function POST(req: NextRequest) {
  if (!FEATURES.addinV2) {
    return NextResponse.json({ error: 'Feature not enabled' }, { status: 404 });
  }

  const { user, error: authError } = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 });
  }

  const supabase = await getSupabaseClient(req);
  if (!supabase) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }

  // Check workspace limit
  const { count } = await supabase
    .from('user_workspaces')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id);

  if ((count || 0) >= MAX_WORKSPACES) {
    return NextResponse.json(
      { error: `Maximum ${MAX_WORKSPACES} workspaces allowed` },
      { status: 402 },
    );
  }

  let body: { name?: string; mode?: string; config?: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const name = (body.name || 'My Workspace').slice(0, 100);
  const mode = body.mode === 'holdings' ? 'holdings' : 'watchlist';
  const config = body.config || {};

  const { data, error } = await supabase
    .from('user_workspaces')
    .insert({
      user_id: user.id,
      name,
      mode,
      config,
    })
    .select('id, name, mode, config, is_active, created_at, updated_at')
    .single();

  if (error) {
    console.error('[Workspaces POST]', error);
    return NextResponse.json({ error: 'Failed to create workspace' }, { status: 500 });
  }

  return NextResponse.json({ workspace: data }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  if (!FEATURES.addinV2) {
    return NextResponse.json({ error: 'Feature not enabled' }, { status: 404 });
  }

  const { user, error: authError } = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 });
  }

  const id = req.nextUrl.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Workspace id required (?id=)' }, { status: 400 });
  }

  const supabase = await getSupabaseClient(req);
  if (!supabase) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }

  let body: { name?: string; mode?: string; config?: Record<string, unknown>; is_active?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.name !== undefined) update.name = String(body.name).slice(0, 100);
  if (body.mode !== undefined) update.mode = body.mode === 'holdings' ? 'holdings' : 'watchlist';
  if (body.config !== undefined) update.config = body.config;
  if (body.is_active !== undefined) update.is_active = Boolean(body.is_active);

  const { data, error } = await supabase
    .from('user_workspaces')
    .update(update)
    .eq('id', id)
    .eq('user_id', user.id)
    .select('id, name, mode, config, is_active, created_at, updated_at')
    .single();

  if (error) {
    console.error('[Workspaces PATCH]', error);
    return NextResponse.json({ error: 'Failed to update workspace' }, { status: 500 });
  }

  return NextResponse.json({ workspace: data });
}

export async function DELETE(req: NextRequest) {
  if (!FEATURES.addinV2) {
    return NextResponse.json({ error: 'Feature not enabled' }, { status: 404 });
  }

  const { user, error: authError } = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 });
  }

  const id = req.nextUrl.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Workspace id required (?id=)' }, { status: 400 });
  }

  const supabase = await getSupabaseClient(req);
  if (!supabase) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }

  const { error } = await supabase
    .from('user_workspaces')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    console.error('[Workspaces DELETE]', error);
    return NextResponse.json({ error: 'Failed to delete workspace' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
