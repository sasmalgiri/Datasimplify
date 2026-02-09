/**
 * Power Query Top Gainers Endpoint
 *
 * GET /api/powerquery/gainers?limit=20
 */

import { NextRequest, NextResponse } from 'next/server';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Cache-Control': 'public, max-age=120',
};

export async function GET(request: NextRequest) {
  const limit = Math.min(parseInt(new URL(request.url).searchParams.get('limit') || '20'), 100);

  try {
    const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=1&sparkline=false&price_change_percentage=24h`;
    const response = await fetch(url);
    if (!response.ok) return NextResponse.json({ error: 'API error' }, { status: 502 });

    const raw = await response.json();
    const sorted = raw
      .filter((c: any) => c.price_change_percentage_24h != null)
      .sort((a: any, b: any) => b.price_change_percentage_24h - a.price_change_percentage_24h)
      .slice(0, limit);

    const data = sorted.map((coin: any, i: number) => ({
      Rank: i + 1,
      ID: coin.id,
      Name: coin.name,
      Symbol: coin.symbol?.toUpperCase(),
      Price: coin.current_price,
      Change24h: Math.round(coin.price_change_percentage_24h * 100) / 100,
      Volume24h: coin.total_volume,
      MarketCap: coin.market_cap,
    }));

    return NextResponse.json(data, { headers: CORS_HEADERS });
  } catch (error) {
    console.error('[PowerQuery Gainers] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch gainers' }, { status: 500 });
  }
}
