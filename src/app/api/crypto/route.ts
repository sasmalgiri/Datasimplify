import { NextResponse } from 'next/server';

// CoinGecko FREE API - 10-30 calls/minute
const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '100');

  try {
    // Fetch from CoinGecko - FREE, no API key needed
    const response = await fetch(
      `${COINGECKO_BASE}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${limit}&page=1&sparkline=false&price_change_percentage=24h,7d`,
      {
        headers: { 'Accept': 'application/json' },
        next: { revalidate: 60 }, // Cache for 60 seconds
      }
    );

    if (!response.ok) {
      console.error('CoinGecko API error:', response.status);
      return NextResponse.json({ data: [], error: 'API error' }, { status: response.status });
    }

    const coins = await response.json();

    return NextResponse.json({
      data: coins,
      total: coins.length,
      source: 'coingecko',
      updated: new Date().toISOString(),
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ data: [], error: 'Failed to fetch data' }, { status: 500 });
  }
}
