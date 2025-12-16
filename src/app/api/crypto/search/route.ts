import { NextResponse } from 'next/server';
import { searchCoins } from '@/lib/coingecko';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || '';

  if (!query.trim()) {
    return NextResponse.json({ coins: [] });
  }

  try {
    const coins = await searchCoins(query);
    
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
