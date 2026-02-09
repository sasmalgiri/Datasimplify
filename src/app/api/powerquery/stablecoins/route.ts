/**
 * Power Query Stablecoins Endpoint
 *
 * GET /api/powerquery/stablecoins?limit=20
 */

import { NextRequest, NextResponse } from 'next/server';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Cache-Control': 'public, max-age=300',
};

const STABLECOIN_IDS = [
  'tether', 'usd-coin', 'dai', 'first-digital-usd', 'ethena-usde',
  'usds', 'frax', 'true-usd', 'paxos-standard', 'gemini-dollar',
  'liquity-usd', 'celo-dollar', 'rai', 'alchemix-usd', 'euro-coin',
  'stasis-eurs', 'tribe-usd', 'vai', 'nusd', 'bean',
];

export async function GET(request: NextRequest) {
  const limit = Math.min(parseInt(new URL(request.url).searchParams.get('limit') || '20'), 20);
  const ids = STABLECOIN_IDS.slice(0, limit).join(',');

  try {
    const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&sparkline=false`;
    const response = await fetch(url);
    if (!response.ok) return NextResponse.json({ error: 'API error' }, { status: 502 });

    const raw = await response.json();
    const data = raw.map((coin: any, i: number) => ({
      Rank: i + 1,
      Name: coin.name,
      Symbol: coin.symbol?.toUpperCase(),
      Price: coin.current_price,
      MarketCap: coin.market_cap,
      Volume24h: coin.total_volume,
      Change24h: coin.price_change_percentage_24h,
      CirculatingSupply: coin.circulating_supply,
      PegDeviation: coin.current_price ? Math.round((coin.current_price - 1) * 10000) / 100 : null,
    }));

    return NextResponse.json(data, { headers: CORS_HEADERS });
  } catch (error) {
    console.error('[PowerQuery Stablecoins] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch stablecoins' }, { status: 500 });
  }
}
