/**
 * Power Query Exchanges Endpoint
 *
 * GET /api/powerquery/exchanges?limit=50
 */

import { NextRequest, NextResponse } from 'next/server';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Cache-Control': 'public, max-age=300',
};

export async function GET(request: NextRequest) {
  const limit = Math.min(parseInt(new URL(request.url).searchParams.get('limit') || '50'), 100);

  try {
    const url = `https://api.coingecko.com/api/v3/exchanges?per_page=${limit}&page=1`;
    const response = await fetch(url);
    if (!response.ok) return NextResponse.json({ error: 'API error' }, { status: 502 });

    const raw = await response.json();
    const data = raw.map((ex: any, i: number) => ({
      Rank: i + 1,
      ID: ex.id,
      Name: ex.name,
      Country: ex.country || '',
      YearEstablished: ex.year_established || '',
      TrustScore: ex.trust_score,
      TrustScoreRank: ex.trust_score_rank,
      TradeVolume24hBTC: ex.trade_volume_24h_btc,
      URL: ex.url || '',
    }));

    return NextResponse.json(data, { headers: CORS_HEADERS });
  } catch (error) {
    console.error('[PowerQuery Exchanges] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch exchanges' }, { status: 500 });
  }
}
