/**
 * Power Query DeFi Endpoint
 *
 * GET /api/powerquery/defi?limit=20
 *
 * Returns DeFi protocols ranked by TVL via DefiLlama.
 */

import { NextRequest, NextResponse } from 'next/server';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Cache-Control': 'public, max-age=300',
};

export async function GET(request: NextRequest) {
  const limit = Math.min(parseInt(new URL(request.url).searchParams.get('limit') || '20'), 100);

  try {
    const response = await fetch('https://api.llama.fi/protocols');
    if (!response.ok) return NextResponse.json({ error: 'DefiLlama API error' }, { status: 502 });

    const raw = await response.json();
    const sorted = raw
      .filter((p: any) => p.tvl > 0)
      .sort((a: any, b: any) => b.tvl - a.tvl)
      .slice(0, limit);

    const data = sorted.map((p: any, i: number) => ({
      Rank: i + 1,
      Name: p.name,
      Symbol: p.symbol || '',
      TVL: Math.round(p.tvl),
      Change1d: p.change_1d ? Math.round(p.change_1d * 100) / 100 : null,
      Change7d: p.change_7d ? Math.round(p.change_7d * 100) / 100 : null,
      Category: p.category || '',
      Chain: Array.isArray(p.chains) ? p.chains.join(', ') : p.chain || '',
      URL: p.url || '',
    }));

    return NextResponse.json(data, { headers: CORS_HEADERS });
  } catch (error) {
    console.error('[PowerQuery DeFi] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch DeFi data' }, { status: 500 });
  }
}
