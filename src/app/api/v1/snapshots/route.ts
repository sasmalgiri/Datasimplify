import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, getSupabaseClient } from '@/lib/supabase/api-auth';
import { FEATURES } from '@/lib/featureFlags';

/**
 * GET /api/v1/snapshots — List snapshots for a workspace (with diff vs previous)
 * POST /api/v1/snapshots — Create a new snapshot after refresh
 *
 * Feature-flagged: requires NEXT_PUBLIC_FEATURE_ADDIN_V2=true
 */

const MAX_SNAPSHOTS_PER_WORKSPACE = 100;

interface PositionSnapshot {
  symbol: string;
  coinId: string;
  price: number;
  change24h: number;
  marketCap: number;
}

interface Snapshot {
  id: string;
  workspace_id: string;
  kpi_return_7d: number | null;
  kpi_return_30d: number | null;
  kpi_value: number | null;
  asset_count: number;
  top_mover_symbol: string | null;
  top_mover_change: number | null;
  used_cache: boolean;
  positions_json: PositionSnapshot[] | null;
  created_at: string;
}

interface SnapshotWithDiff extends Snapshot {
  diff: {
    return_7d_change: number | null;
    return_30d_change: number | null;
    value_change: number | null;
    value_pct_change: number | null;
  } | null;
}

export async function GET(req: NextRequest) {
  if (!FEATURES.addinV2) {
    return NextResponse.json({ error: 'Feature not enabled' }, { status: 404 });
  }

  const { user, error: authError } = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 });
  }

  const workspaceId = req.nextUrl.searchParams.get('workspace_id');
  if (!workspaceId) {
    return NextResponse.json({ error: 'workspace_id required' }, { status: 400 });
  }

  const limit = Math.min(Number(req.nextUrl.searchParams.get('limit')) || 20, 100);

  const supabase = await getSupabaseClient(req);
  if (!supabase) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }

  const { data, error } = await supabase
    .from('workspace_snapshots')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[Snapshots GET]', error);
    return NextResponse.json({ error: 'Failed to fetch snapshots' }, { status: 500 });
  }

  const snapshots = (data || []) as Snapshot[];

  // Compute diffs vs previous snapshot
  const withDiffs: SnapshotWithDiff[] = snapshots.map((snap, i) => {
    const prev = snapshots[i + 1]; // next in array = previous in time
    if (!prev) {
      return { ...snap, diff: null };
    }

    const valueDiff = snap.kpi_value != null && prev.kpi_value != null
      ? snap.kpi_value - prev.kpi_value
      : null;

    const valuePctChange = valueDiff != null && prev.kpi_value != null && prev.kpi_value !== 0
      ? (valueDiff / prev.kpi_value) * 100
      : null;

    return {
      ...snap,
      diff: {
        return_7d_change: snap.kpi_return_7d != null && prev.kpi_return_7d != null
          ? snap.kpi_return_7d - prev.kpi_return_7d
          : null,
        return_30d_change: snap.kpi_return_30d != null && prev.kpi_return_30d != null
          ? snap.kpi_return_30d - prev.kpi_return_30d
          : null,
        value_change: valueDiff,
        value_pct_change: valuePctChange != null ? Number(valuePctChange.toFixed(2)) : null,
      },
    };
  });

  return NextResponse.json({ snapshots: withDiffs });
}

export async function POST(req: NextRequest) {
  if (!FEATURES.addinV2) {
    return NextResponse.json({ error: 'Feature not enabled' }, { status: 404 });
  }

  const { user, error: authError } = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 });
  }

  let body: {
    workspace_id?: string;
    kpi_return_7d?: number;
    kpi_return_30d?: number;
    kpi_value?: number;
    asset_count?: number;
    top_mover_symbol?: string;
    top_mover_change?: number;
    used_cache?: boolean;
    positions_json?: PositionSnapshot[];
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body.workspace_id) {
    return NextResponse.json({ error: 'workspace_id required' }, { status: 400 });
  }

  const supabase = await getSupabaseClient(req);
  if (!supabase) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }

  // Verify workspace belongs to user
  const { data: ws } = await supabase
    .from('user_workspaces')
    .select('id')
    .eq('id', body.workspace_id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!ws) {
    return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
  }

  // Enforce snapshot limit (delete oldest if over limit)
  const { count } = await supabase
    .from('workspace_snapshots')
    .select('id', { count: 'exact', head: true })
    .eq('workspace_id', body.workspace_id);

  if ((count || 0) >= MAX_SNAPSHOTS_PER_WORKSPACE) {
    // Delete oldest snapshots beyond limit
    const { data: oldest } = await supabase
      .from('workspace_snapshots')
      .select('id')
      .eq('workspace_id', body.workspace_id)
      .order('created_at', { ascending: true })
      .limit((count || 0) - MAX_SNAPSHOTS_PER_WORKSPACE + 1);

    if (oldest?.length) {
      await supabase
        .from('workspace_snapshots')
        .delete()
        .in('id', oldest.map((s) => s.id));
    }
  }

  const { data, error } = await supabase
    .from('workspace_snapshots')
    .insert({
      workspace_id: body.workspace_id,
      user_id: user.id,
      kpi_return_7d: body.kpi_return_7d ?? null,
      kpi_return_30d: body.kpi_return_30d ?? null,
      kpi_value: body.kpi_value ?? null,
      asset_count: body.asset_count ?? 0,
      top_mover_symbol: body.top_mover_symbol ?? null,
      top_mover_change: body.top_mover_change ?? null,
      used_cache: body.used_cache ?? false,
      positions_json: body.positions_json ?? null,
    })
    .select()
    .single();

  if (error) {
    console.error('[Snapshots POST]', error);
    return NextResponse.json({ error: 'Failed to create snapshot' }, { status: 500 });
  }

  // Also upsert portfolio history for the day
  const today = new Date().toISOString().split('T')[0];
  if (body.kpi_value != null) {
    await supabase
      .from('portfolio_history')
      .upsert({
        user_id: user.id,
        workspace_id: body.workspace_id,
        total_value: body.kpi_value,
        return_7d: body.kpi_return_7d ?? null,
        return_30d: body.kpi_return_30d ?? null,
        asset_count: body.asset_count ?? 0,
        snapshot_date: today,
      }, {
        onConflict: 'user_id,workspace_id,snapshot_date',
      });
  }

  return NextResponse.json({ snapshot: data }, { status: 201 });
}
