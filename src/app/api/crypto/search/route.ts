import { NextResponse } from 'next/server';
import { searchCoins as searchDiscoveredCoins } from '@/lib/coinDiscovery';

const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';

// In-memory cache for CoinGecko search results
const searchCache = new Map<string, { data: unknown; ts: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || '';

  if (!query.trim()) {
    return NextResponse.json({ coins: [] });
  }

  const q = query.trim().toLowerCase();

  try {
    // 1) Try CoinGecko's native /search endpoint (searches ALL 12,000+ coins)
    const cacheKey = `search_${q}`;
    const cached = searchCache.get(cacheKey);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      return NextResponse.json(cached.data);
    }

    const headers: HeadersInit = { Accept: 'application/json' };
    const apiKey = process.env.COINGECKO_API_KEY;
    if (apiKey) {
      headers['x-cg-demo-api-key'] = apiKey;
    }

    const res = await fetch(
      `${COINGECKO_BASE}/search?query=${encodeURIComponent(q)}`,
      { headers, next: { revalidate: 300 } },
    );

    if (res.ok) {
      const data = await res.json();
      const coins = (data.coins || []).slice(0, 25).map((c: any) => ({
        id: c.id,
        name: c.name,
        symbol: c.symbol,
        market_cap_rank: c.market_cap_rank ?? null,
        thumb: c.thumb || c.large || '/globe.svg',
        large: c.large || c.thumb || '/globe.svg',
      }));

      const result = { coins, query: q };
      searchCache.set(cacheKey, { data: result, ts: Date.now() });
      return NextResponse.json(result);
    }

    // CoinGecko returned an error (rate limit, etc.) — fall through to local search
    console.warn('[Search] CoinGecko search failed:', res.status);
  } catch (error) {
    console.error('[Search] CoinGecko search error:', error);
  }

  // 2) Fallback: search locally discovered coins (top 1500 by market cap)
  try {
    const discovered = await searchDiscoveredCoins(q);
    const coins = discovered.slice(0, 25).map((c) => ({
      id: c.geckoId,
      name: c.name,
      symbol: c.symbol.toLowerCase(),
      market_cap_rank: c.marketCapRank ?? null,
      thumb: c.image || '/globe.svg',
      large: c.image || '/globe.svg',
    }));

    return NextResponse.json({ coins, query: q });
  } catch (error) {
    console.error('[Search] Fallback search error:', error);
    return NextResponse.json({ error: 'Search failed', coins: [] }, { status: 500 });
  }
}
