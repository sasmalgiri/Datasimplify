/**
 * Power Query Batch Prices Endpoint
 *
 * GET /api/powerquery/batch?coins=bitcoin,ethereum,solana&fields=all
 */

import { NextRequest, NextResponse } from 'next/server';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Cache-Control': 'public, max-age=60',
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const coins = searchParams.get('coins') || 'bitcoin,ethereum';

  try {
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coins}&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true`;
    const response = await fetch(url);
    if (!response.ok) return NextResponse.json({ error: 'API error' }, { status: 502 });

    const raw = await response.json();
    const data = Object.entries(raw).map(([id, info]: [string, any]) => ({
      ID: id,
      Price: info.usd,
      MarketCap: info.usd_market_cap,
      Volume24h: info.usd_24h_vol,
      Change24h: info.usd_24h_change ? Math.round(info.usd_24h_change * 100) / 100 : null,
    }));

    return NextResponse.json(data, { headers: CORS_HEADERS });
  } catch (error) {
    console.error('[PowerQuery Batch] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch batch prices' }, { status: 500 });
  }
}
