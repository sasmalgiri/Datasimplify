/**
 * Power Query Derivatives Endpoint
 *
 * GET /api/powerquery/derivatives?limit=50
 */

import { NextRequest, NextResponse } from 'next/server';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Cache-Control': 'public, max-age=120',
};

export async function GET(request: NextRequest) {
  const limit = Math.min(parseInt(new URL(request.url).searchParams.get('limit') || '50'), 100);

  try {
    const url = `https://api.coingecko.com/api/v3/derivatives`;
    const response = await fetch(url);
    if (!response.ok) return NextResponse.json({ error: 'API error' }, { status: 502 });

    const raw = await response.json();
    const data = raw.slice(0, limit).map((d: any) => ({
      Market: d.market,
      Symbol: d.symbol,
      IndexPrice: d.index,
      Price: d.price,
      PriceChangePercent24h: d.price_percentage_change_24h,
      ContractType: d.contract_type,
      Basis: d.basis,
      Spread: d.spread,
      FundingRate: d.funding_rate,
      OpenInterest: d.open_interest_usd,
      Volume24h: d.volume_24h,
      LastTradedAt: d.last_traded_at,
      ExpiredAt: d.expired_at,
    }));

    return NextResponse.json(data, { headers: CORS_HEADERS });
  } catch (error) {
    console.error('[PowerQuery Derivatives] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch derivatives' }, { status: 500 });
  }
}
