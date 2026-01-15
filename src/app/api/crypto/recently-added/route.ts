/**
 * Recently Added Coins API Route
 *
 * Returns recently listed coins from CoinGecko
 * Data is for display only - not redistributable
 *
 * COMPLIANCE: This route is protected against external API access.
 */

import { NextRequest, NextResponse } from 'next/server';
import { enforceDisplayOnly } from '@/lib/apiSecurity';

const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY;
const COINGECKO_BASE_URL = 'https://pro-api.coingecko.com/api/v3';

// Cache data for 10 minutes
let cachedData: {
  coins: RecentCoin[] | null;
  timestamp: number;
} = {
  coins: null,
  timestamp: 0,
};

const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

interface RecentCoin {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number | null;
  total_volume: number;
  price_change_percentage_24h: number;
  ath: number;
  ath_date: string;
}

export async function GET(request: NextRequest) {
  // Enforce display-only access - block external API scraping
  const blocked = enforceDisplayOnly(request, '/api/crypto/recently-added');
  if (blocked) return blocked;

  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);

    // Check cache first
    const now = Date.now();
    if (cachedData.coins && now - cachedData.timestamp < CACHE_TTL) {
      return NextResponse.json({
        success: true,
        data: cachedData.coins.slice(0, limit),
        cached: true,
        source: 'coingecko',
        attribution: 'Data provided by CoinGecko',
      });
    }

    // Fetch coins sorted by newest first (using market data with low market cap filter)
    const response = await fetch(
      `${COINGECKO_BASE_URL}/coins/markets?vs_currency=usd&order=id_asc&per_page=250&page=1&sparkline=false`,
      {
        headers: {
          'x-cg-pro-api-key': COINGECKO_API_KEY || '',
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data = await response.json();

    // Filter to coins that are likely recently added (no market cap rank or very high rank)
    // and sort by ATH date (newer = more recently added)
    const recentCoins = data
      .filter((coin: RecentCoin) => coin.ath_date)
      .sort((a: RecentCoin, b: RecentCoin) => {
        return new Date(b.ath_date).getTime() - new Date(a.ath_date).getTime();
      })
      .slice(0, 50)
      .map((coin: RecentCoin) => ({
        id: coin.id,
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        image: coin.image,
        current_price: coin.current_price || 0,
        market_cap: coin.market_cap || 0,
        market_cap_rank: coin.market_cap_rank,
        total_volume: coin.total_volume || 0,
        price_change_percentage_24h: coin.price_change_percentage_24h || 0,
        listed_date: coin.ath_date,
      }));

    // Update cache
    cachedData = {
      coins: recentCoins,
      timestamp: now,
    };

    return NextResponse.json({
      success: true,
      data: recentCoins.slice(0, limit),
      cached: false,
      source: 'coingecko',
      attribution: 'Data provided by CoinGecko',
    });
  } catch (error) {
    console.error('[Recently Added API] Error:', error);

    // Return cached data if available
    if (cachedData.coins) {
      return NextResponse.json({
        success: true,
        data: cachedData.coins,
        cached: true,
        stale: true,
        source: 'coingecko',
        attribution: 'Data provided by CoinGecko',
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch recently added coins',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
