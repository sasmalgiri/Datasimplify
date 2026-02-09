/**
 * Power Query Categories Endpoint
 *
 * GET /api/powerquery/categories - List all categories
 * GET /api/powerquery/categories?id=layer-1 - Coins in a specific category
 */

import { NextRequest, NextResponse } from 'next/server';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Cache-Control': 'public, max-age=300',
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const categoryId = searchParams.get('id');
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 250);

  try {
    if (categoryId) {
      // Coins in a specific category
      const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&category=${categoryId}&order=market_cap_desc&per_page=${limit}&sparkline=false`;
      const response = await fetch(url);
      if (!response.ok) return NextResponse.json({ error: 'API error' }, { status: 502 });

      const raw = await response.json();
      const data = raw.map((coin: any, i: number) => ({
        Rank: i + 1,
        ID: coin.id,
        Name: coin.name,
        Symbol: coin.symbol?.toUpperCase(),
        Price: coin.current_price,
        MarketCap: coin.market_cap,
        Volume24h: coin.total_volume,
        Change24h: coin.price_change_percentage_24h,
        Category: categoryId,
      }));

      return NextResponse.json(data, { headers: CORS_HEADERS });
    }

    // List all categories
    const url = `https://api.coingecko.com/api/v3/coins/categories`;
    const response = await fetch(url);
    if (!response.ok) return NextResponse.json({ error: 'API error' }, { status: 502 });

    const raw = await response.json();
    const data = raw.slice(0, limit).map((cat: any, i: number) => ({
      Rank: i + 1,
      ID: cat.id,
      Name: cat.name,
      MarketCap: cat.market_cap,
      MarketCapChange24h: cat.market_cap_change_24h,
      Volume24h: cat.volume_24h,
      TopCoins: (cat.top_3_coins || []).length,
    }));

    return NextResponse.json(data, { headers: CORS_HEADERS });
  } catch (error) {
    console.error('[PowerQuery Categories] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}
