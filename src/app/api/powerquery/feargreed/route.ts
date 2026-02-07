/**
 * Power Query Fear & Greed Index Endpoint
 *
 * Returns Fear & Greed Index for Excel Power Query.
 *
 * Usage in Power Query:
 * = Json.Document(Web.Contents("https://cryptoreportkit.com/api/powerquery/feargreed"))
 *
 * Parameters:
 * - limit: Number of days (default: 30, max: 365)
 */

import { NextRequest, NextResponse } from 'next/server';

// Cache for 1 hour
let cache: { data: any; timestamp: number; limit: number } | null = null;
const CACHE_TTL = 3600000;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get('limit') || '30'), 365);

  if (cache && cache.limit === limit && Date.now() - cache.timestamp < CACHE_TTL) {
    return NextResponse.json(cache.data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  }

  try {
    const response = await fetch(`https://api.alternative.me/fng/?limit=${limit}`, {
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Fear & Greed API error' }, { status: 502 });
    }

    const rawData = await response.json();

    // Flat structure for Power Query
    const data = (rawData.data || []).map((item: any) => ({
      Date: new Date(parseInt(item.timestamp) * 1000).toISOString().split('T')[0],
      Value: parseInt(item.value),
      Classification: item.value_classification,
      Timestamp: parseInt(item.timestamp),
    }));

    cache = { data, timestamp: Date.now(), limit };

    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('[PowerQuery FearGreed] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch fear & greed data' }, { status: 500 });
  }
}
