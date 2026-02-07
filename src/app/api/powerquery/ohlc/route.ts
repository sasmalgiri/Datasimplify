/**
 * Power Query OHLC Data Endpoint
 *
 * Returns OHLC candlestick data for Excel Power Query.
 *
 * Usage in Power Query:
 * = Json.Document(Web.Contents("https://cryptoreportkit.com/api/powerquery/ohlc?coin=bitcoin&days=30"))
 *
 * Parameters:
 * - coin: Coin ID (required, e.g., "bitcoin", "ethereum")
 * - days: Number of days (default: 30, options: 1, 7, 14, 30, 90, 180, 365)
 */

import { NextRequest, NextResponse } from 'next/server';

// Cache for 15 minutes
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 900000;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const coin = searchParams.get('coin')?.toLowerCase();
  const days = searchParams.get('days') || '30';

  if (!coin) {
    return NextResponse.json(
      { error: 'coin parameter is required (e.g., coin=bitcoin)' },
      { status: 400 }
    );
  }

  const cacheKey = `${coin}-${days}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return NextResponse.json(cached.data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=900',
      },
    });
  }

  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/${coin}/ohlc?vs_currency=usd&days=${days}`,
      { headers: { 'Accept': 'application/json' } }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ error: `Coin "${coin}" not found` }, { status: 404 });
      }
      return NextResponse.json({ error: 'CoinGecko API error' }, { status: 502 });
    }

    const rawData = await response.json();

    // Flat structure for Power Query - array of OHLC records
    const data = rawData.map((item: number[]) => ({
      DateTime: new Date(item[0]).toISOString(),
      Date: new Date(item[0]).toISOString().split('T')[0],
      Time: new Date(item[0]).toISOString().split('T')[1].split('.')[0],
      Open: item[1],
      High: item[2],
      Low: item[3],
      Close: item[4],
      Timestamp: item[0],
    }));

    cache.set(cacheKey, { data, timestamp: Date.now() });

    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=900',
      },
    });
  } catch (error) {
    console.error('[PowerQuery OHLC] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch OHLC data' }, { status: 500 });
  }
}
