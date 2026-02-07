/**
 * Power Query Global Market Data Endpoint
 *
 * Returns global market statistics for Excel Power Query.
 *
 * Usage in Power Query:
 * = Json.Document(Web.Contents("https://cryptoreportkit.com/api/powerquery/global"))
 */

import { NextResponse } from 'next/server';

// Cache for 60 seconds
let cache: { data: any; timestamp: number } | null = null;
const CACHE_TTL = 60000;

export async function GET() {
  if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
    return NextResponse.json(cache.data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=60',
      },
    });
  }

  try {
    const response = await fetch('https://api.coingecko.com/api/v3/global', {
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'CoinGecko API error' }, { status: 502 });
    }

    const rawData = await response.json();
    const d = rawData.data;

    // Flat structure for Power Query
    const data = {
      TotalMarketCapUSD: d.total_market_cap?.usd,
      TotalVolumeUSD: d.total_volume?.usd,
      MarketCapChange24h: d.market_cap_change_percentage_24h_usd,
      BTCDominance: d.market_cap_percentage?.btc,
      ETHDominance: d.market_cap_percentage?.eth,
      ActiveCryptocurrencies: d.active_cryptocurrencies,
      Markets: d.markets,
      UpdatedAt: d.updated_at,
    };

    cache = { data, timestamp: Date.now() };

    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=60',
      },
    });
  } catch (error) {
    console.error('[PowerQuery Global] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch global data' }, { status: 500 });
  }
}
