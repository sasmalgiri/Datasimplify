/**
 * Power Query Trending Coins Endpoint
 *
 * Returns trending coins for Excel Power Query.
 *
 * Usage in Power Query:
 * = Json.Document(Web.Contents("https://cryptoreportkit.com/api/powerquery/trending"))
 */

import { NextResponse } from 'next/server';

// Cache for 5 minutes (trending updates less frequently)
let cache: { data: any; timestamp: number } | null = null;
const CACHE_TTL = 300000;

export async function GET() {
  if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
    return NextResponse.json(cache.data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=300',
      },
    });
  }

  try {
    const response = await fetch('https://api.coingecko.com/api/v3/search/trending', {
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'CoinGecko API error' }, { status: 502 });
    }

    const rawData = await response.json();

    // Flat structure for Power Query
    const data = (rawData.coins || []).map((item: any, index: number) => ({
      TrendRank: index + 1,
      ID: item.item?.id,
      Name: item.item?.name,
      Symbol: item.item?.symbol?.toUpperCase(),
      MarketCapRank: item.item?.market_cap_rank,
      PriceBTC: item.item?.price_btc,
      Score: item.item?.score,
    }));

    cache = { data, timestamp: Date.now() };

    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=300',
      },
    });
  } catch (error) {
    console.error('[PowerQuery Trending] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch trending data' }, { status: 500 });
  }
}
