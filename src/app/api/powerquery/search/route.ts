/**
 * Power Query Search Endpoint
 *
 * GET /api/powerquery/search?q=bitcoin&limit=10
 */

import { NextRequest, NextResponse } from 'next/server';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Cache-Control': 'public, max-age=60',
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || searchParams.get('query') || '';
  const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);

  if (!query) {
    return NextResponse.json({ error: 'Query parameter "q" is required' }, { status: 400 });
  }

  try {
    const url = `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(query)}`;
    const response = await fetch(url);
    if (!response.ok) return NextResponse.json({ error: 'API error' }, { status: 502 });

    const raw = await response.json();
    const coins = (raw.coins || []).slice(0, limit);

    const data = coins.map((c: any) => ({
      ID: c.id,
      Name: c.name,
      Symbol: c.symbol,
      MarketCapRank: c.market_cap_rank || null,
      Thumb: c.thumb || '',
    }));

    return NextResponse.json(data, { headers: CORS_HEADERS });
  } catch (error) {
    console.error('[PowerQuery Search] Error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
