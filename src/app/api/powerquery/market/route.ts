/**
 * Power Query Market Data Endpoint
 *
 * Returns flat JSON array optimized for Excel Power Query.
 * No authentication required - uses CoinGecko free tier.
 *
 * Usage in Power Query:
 * = Json.Document(Web.Contents("https://cryptoreportkit.com/api/powerquery/market"))
 *
 * Parameters:
 * - limit: Number of coins (default: 100, max: 250)
 * - currency: vs_currency (default: usd)
 */

import { NextRequest, NextResponse } from 'next/server';

// Cache for 60 seconds to avoid rate limits
let cache: { data: any; timestamp: number } | null = null;
const CACHE_TTL = 60000; // 60 seconds

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 250);
  const currency = searchParams.get('currency') || 'usd';

  // Check cache
  const cacheKey = `${limit}-${currency}`;
  if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
    return NextResponse.json(cache.data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=60',
      },
    });
  }

  try {
    const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=${currency}&order=market_cap_desc&per_page=${limit}&page=1&sparkline=false&price_change_percentage=24h,7d`;

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'CoinGecko API error', status: response.status },
        { status: 502 }
      );
    }

    const rawData = await response.json();

    // Transform to flat structure for Power Query
    const data = rawData.map((coin: any) => ({
      Rank: coin.market_cap_rank,
      ID: coin.id,
      Name: coin.name,
      Symbol: coin.symbol?.toUpperCase(),
      Price: coin.current_price,
      MarketCap: coin.market_cap,
      Volume24h: coin.total_volume,
      Change24h: coin.price_change_percentage_24h,
      Change7d: coin.price_change_percentage_7d_in_currency,
      High24h: coin.high_24h,
      Low24h: coin.low_24h,
      ATH: coin.ath,
      ATHDate: coin.ath_date,
      ATL: coin.atl,
      CirculatingSupply: coin.circulating_supply,
      TotalSupply: coin.total_supply,
      MaxSupply: coin.max_supply,
      LastUpdated: coin.last_updated,
    }));

    // Cache the result
    cache = { data, timestamp: Date.now() };

    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=60',
      },
    });
  } catch (error) {
    console.error('[PowerQuery Market] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch market data' },
      { status: 500 }
    );
  }
}
