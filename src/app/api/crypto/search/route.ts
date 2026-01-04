import { NextResponse } from 'next/server';
import { SUPPORTED_COINS, getCoinGeckoId } from '@/lib/dataTypes';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || '';

  if (!query.trim()) {
    return NextResponse.json({ coins: [] });
  }

  try {
    const q = query.trim().toLowerCase();
    const coins = SUPPORTED_COINS
      .filter(c => c.symbol.toLowerCase().includes(q) || c.name.toLowerCase().includes(q))
      .slice(0, 25)
      .map(c => ({
        id: getCoinGeckoId(c.symbol),
        name: c.name,
        symbol: c.symbol.toLowerCase(),
        market_cap_rank: null,
        thumb: c.image,
        large: c.image,
      }));
    
    return NextResponse.json({
      coins,
      query,
    });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: 'Search failed', coins: [] },
      { status: 500 }
    );
  }
}
