import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Use service role for server-side operations (no RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ── In-memory rate limiter for publish (POST) ──
const PUBLISH_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
const MAX_PUBLISHES_PER_HOUR = 3;
const publishLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkPublishRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = publishLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    publishLimitMap.set(ip, { count: 1, resetAt: now + PUBLISH_LIMIT_WINDOW });
    return true;
  }

  if (entry.count >= MAX_PUBLISHES_PER_HOUR) {
    return false;
  }

  entry.count++;
  return true;
}

// ── Allowed sort fields ──
const SORT_OPTIONS: Record<string, { column: string; ascending: boolean }> = {
  popular: { column: 'view_count', ascending: false },
  recent:  { column: 'created_at', ascending: false },
  forks:   { column: 'fork_count', ascending: false },
};

// ── Allowed tags for validation ──
const ALLOWED_TAGS = new Set([
  'DeFi', 'NFT', 'Layer 1', 'Layer 2', 'Meme', 'Stablecoins',
  'Gaming', 'AI', 'RWA', 'DEX', 'Lending', 'Derivatives',
  'Portfolio', 'Macro', 'Technical', 'On-Chain', 'Whale Tracking',
  'Yield', 'Other',
]);

// ── Type for the response shape ──
interface CommunityDashboard {
  id: string;
  author_name: string;
  author_avatar: string;
  dashboard_name: string;
  icon: string;
  description: string | null;
  widget_config: any;
  grid_columns: number;
  tags: string[];
  fork_count: number;
  view_count: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

// ─────────────────────────────────────────────────────────────
// GET — List published community dashboards
// ─────────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const search = searchParams.get('search')?.trim() || '';
    const sort = searchParams.get('sort') || 'popular';
    const tag = searchParams.get('tag')?.trim() || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));

    const sortConfig = SORT_OPTIONS[sort] || SORT_OPTIONS.popular;
    const offset = (page - 1) * limit;

    // Build query — only published dashboards
    let query = supabase
      .from('community_dashboards')
      .select('*', { count: 'exact' })
      .eq('is_published', true);

    // Search by dashboard name
    if (search) {
      query = query.ilike('dashboard_name', `%${search}%`);
    }

    // Filter by tag
    if (tag) {
      query = query.contains('tags', [tag]);
    }

    // Sort
    query = query.order(sortConfig.column, { ascending: sortConfig.ascending });

    // Pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('[Community GET] Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch community dashboards' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      dashboards: (data || []) as CommunityDashboard[],
      total: count || 0,
      page,
    });
  } catch (err) {
    console.error('[Community GET] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

// ─────────────────────────────────────────────────────────────
// POST — Publish a dashboard (anonymous, rate-limited)
// ─────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';

    // Rate limit check
    if (!checkPublishRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. You can publish up to 3 dashboards per hour.' },
        { status: 429 },
      );
    }

    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const {
      authorName,
      authorAvatar,
      dashboardName,
      icon,
      description,
      widgetConfig,
      gridColumns,
      tags,
    } = body;

    // ── Validation ──
    if (!dashboardName || typeof dashboardName !== 'string' || dashboardName.trim().length === 0) {
      return NextResponse.json(
        { error: 'dashboardName is required' },
        { status: 400 },
      );
    }

    if (!widgetConfig || typeof widgetConfig !== 'object') {
      return NextResponse.json(
        { error: 'widgetConfig is required and must be an object' },
        { status: 400 },
      );
    }

    // Sanitize tags — only allow known tags, max 5
    let sanitizedTags: string[] = [];
    if (Array.isArray(tags)) {
      sanitizedTags = tags
        .filter((t: unknown) => typeof t === 'string' && ALLOWED_TAGS.has(t))
        .slice(0, 5);
    }

    // Insert into Supabase
    const { data, error } = await supabase
      .from('community_dashboards')
      .insert({
        author_name: typeof authorName === 'string' ? authorName.trim().slice(0, 50) : 'Anonymous',
        author_avatar: typeof authorAvatar === 'string' ? authorAvatar.trim().slice(0, 10) : '👤',
        dashboard_name: dashboardName.trim().slice(0, 100),
        icon: typeof icon === 'string' ? icon.trim().slice(0, 10) : '📊',
        description: typeof description === 'string' ? description.trim().slice(0, 500) : null,
        widget_config: widgetConfig,
        grid_columns: typeof gridColumns === 'number' ? Math.min(6, Math.max(1, gridColumns)) : 4,
        tags: sanitizedTags,
        fork_count: 0,
        view_count: 0,
        is_published: true,
      })
      .select('id')
      .single();

    if (error) {
      console.error('[Community POST] Supabase insert error:', error);
      return NextResponse.json(
        { error: 'Failed to publish dashboard' },
        { status: 500 },
      );
    }

    return NextResponse.json({ id: data.id, success: true }, { status: 201 });
  } catch (err) {
    console.error('[Community POST] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

// ─────────────────────────────────────────────────────────────
// PATCH — Increment view_count or fork_count
// ─────────────────────────────────────────────────────────────
export async function PATCH(request: NextRequest) {
  try {
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { id, action } = body;

    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    if (action !== 'view' && action !== 'fork') {
      return NextResponse.json(
        { error: 'action must be "view" or "fork"' },
        { status: 400 },
      );
    }

    const column = action === 'view' ? 'view_count' : 'fork_count';

    // Read current value
    const { data: current, error: readError } = await supabase
      .from('community_dashboards')
      .select(column)
      .eq('id', id)
      .single();

    if (readError || !current) {
      console.error('[Community PATCH] Read error:', readError);
      return NextResponse.json(
        { error: 'Dashboard not found' },
        { status: 404 },
      );
    }

    // Increment
    const newValue = ((current as Record<string, unknown>)[column] as number || 0) + 1;

    const { error: updateError } = await supabase
      .from('community_dashboards')
      .update({ [column]: newValue, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (updateError) {
      console.error('[Community PATCH] Update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update counter' },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[Community PATCH] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
