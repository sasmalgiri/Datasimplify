import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getMarketDataFromCache } from '@/lib/supabaseData';
import { isSupabaseConfigured, supabaseAdmin } from '@/lib/supabase';
import { enforceMinInterval } from '@/lib/serverRateLimit';

function getClientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return req.headers.get('x-real-ip') || 'unknown';
}

function parseSymbols(raw: string | null): string[] | undefined {
  if (!raw) return undefined;
  const symbols = raw
    .split(',')
    .map(s => s.trim().toUpperCase())
    .filter(Boolean);

  return symbols.length > 0 ? symbols : undefined;
}

async function resolveTierFromBearerToken(req: Request): Promise<'free' | 'starter' | 'pro' | 'business'> {
  const authHeader = req.headers.get('authorization') || '';
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  const token = match?.[1];
  if (!token) return 'free';

  // If Supabase isn't configured, we can't verify access tokens.
  if (!isSupabaseConfigured || !supabaseAdmin) return 'free';

  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
  const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();
  if (!supabaseUrl || !supabaseAnonKey) return 'free';

  try {
    // Validate the user token with Supabase Auth.
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: userData, error: userError } = await authClient.auth.getUser(token);
    if (userError || !userData?.user?.id) return 'free';

    const userId = userData.user.id;
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('subscription_tier')
      .eq('id', userId)
      .single();

    if (profileError || !profile?.subscription_tier) return 'free';

    const tier = profile.subscription_tier as 'free' | 'starter' | 'pro' | 'business';
    if (tier === 'starter' || tier === 'pro' || tier === 'business') return tier;
    return 'free';
  } catch {
    return 'free';
  }
}

function jsonWithCaching(body: unknown, init?: { status?: number; headers?: Record<string, string> }) {
  const payload = JSON.stringify(body);

  // Weak ETag based on payload length + first/last bytes (fast + good enough).
  const etag = `W/\"${payload.length}-${payload.charCodeAt(0) || 0}-${payload.charCodeAt(payload.length - 1) || 0}\"`;

  return new NextResponse(payload, {
    status: init?.status ?? 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      // CDN-friendly caching: serve cached snapshot, refresh in background.
      'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=300',
      ETag: etag,
      ...(init?.headers || {}),
    },
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const symbols = parseSymbols(searchParams.get('symbols'));
  const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') || '20')));

  // Resolve tier for rate-limit decisions (free by default).
  const tier = await resolveTierFromBearerToken(request);

  // Safe-by-default throttling.
  // Free users: minimum 60s between requests for the same IP+symbols.
  // Pro/Business: minimum 10s.
  const minIntervalMs = tier === 'pro' || tier === 'business' ? 10_000 : 60_000;

  // Keep key granular so a single workbook doesn't DOS your API,
  // while still allowing different datasets without too much blocking.
  const ip = getClientIp(request);
  const symbolsKey = (symbols || []).slice(0, 20).join(',') || 'top';
  const limiterKey = `excel_market:${tier}:${ip}:${symbolsKey}:${limit}`;

  const limitResult = enforceMinInterval({ key: limiterKey, minIntervalMs });
  if (!limitResult.ok) {
    return jsonWithCaching(
      {
        error: 'Too many refresh requests. Please wait and try again.',
        retryAfterSeconds: limitResult.retryAfterSeconds,
        tier,
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(limitResult.retryAfterSeconds),
          'X-Min-Refresh-Seconds': String(Math.ceil(minIntervalMs / 1000)),
        },
      }
    );
  }

  // Conditional requests to reduce bandwidth.
  const ifNoneMatch = request.headers.get('if-none-match');

  try {
    // Prefer Supabase cache to avoid hitting external APIs.
    const rows = isSupabaseConfigured
      ? await getMarketDataFromCache({
          symbols,
          sortBy: 'market_cap',
          limit,
        })
      : [];

    const data = (rows || []).map(r => ({
      symbol: r.symbol,
      name: r.name || r.symbol,
      price: r.price ?? null,
      price_change_percent_24h: r.price_change_percent_24h ?? null,
      volume_24h: (r.volume_24h ?? r.quote_volume_24h) ?? null,
      market_cap: r.market_cap ?? null,
      updated_at: r.updated_at ?? null,
    }));

    const body = {
      data,
      metadata: {
        dataset: 'market',
        tier,
        symbols: symbols || null,
        limit,
        generatedAt: new Date().toISOString(),
        // UX hint for the add-in UI (server enforces too).
        minRefreshSeconds: Math.ceil(minIntervalMs / 1000),
        source: isSupabaseConfigured ? 'Supabase cache' : 'Cache unavailable',
      },
    };

    const response = jsonWithCaching(body, {
      headers: {
        'X-Min-Refresh-Seconds': String(Math.ceil(minIntervalMs / 1000)),
      },
    });

    // If ETag matches, return 304.
    const etag = response.headers.get('etag');
    if (etag && ifNoneMatch && ifNoneMatch === etag) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          'Cache-Control': response.headers.get('cache-control') || 'public, s-maxage=30, stale-while-revalidate=300',
          ETag: etag,
        },
      });
    }

    return response;
  } catch (error) {
    console.error('Excel market API error:', error);
    return jsonWithCaching(
      {
        error: 'Unable to fetch market snapshot right now. Please try again.',
        tier,
      },
      { status: 500 }
    );
  }
}
