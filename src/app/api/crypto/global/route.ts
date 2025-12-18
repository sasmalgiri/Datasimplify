import { NextResponse } from 'next/server';

// CoinGecko FREE API
const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';

export async function GET() {
  try {
    const response = await fetch(`${COINGECKO_BASE}/global`, {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 60 }, // Cache for 60 seconds
    });

    if (!response.ok) {
      console.error('CoinGecko global API error:', response.status);
      return NextResponse.json({ data: null, error: 'API error' }, { status: response.status });
    }

    const result = await response.json();

    return NextResponse.json({
      data: result.data,
      source: 'coingecko',
      updated: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Global API error:', error);
    return NextResponse.json({ data: null, error: 'Failed to fetch' }, { status: 500 });
  }
}
