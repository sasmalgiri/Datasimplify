/**
 * Trending Coins API Route
 *
 * Returns top trending coins from CoinGecko Analyst API
 * Data is for display only - not redistributable
 *
 * COMPLIANCE: This route is protected against external API access.
 * CoinGecko data cannot be redistributed without a Data Redistribution License.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTrendingCoins, TrendingResponse } from '@/lib/coingecko/client';
import { enforceDisplayOnly } from '@/lib/apiSecurity';

// Cache trending data for 5 minutes
let cachedData: {
  data: TrendingResponse | null;
  timestamp: number;
} = {
  data: null,
  timestamp: 0,
};

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function GET(request: NextRequest) {
  // Enforce display-only access - block external API scraping
  const blocked = enforceDisplayOnly(request, '/api/crypto/trending');
  if (blocked) return blocked;

  try {
    // Check cache first
    const now = Date.now();
    if (cachedData.data && now - cachedData.timestamp < CACHE_TTL) {
      return NextResponse.json({
        success: true,
        data: cachedData.data,
        cached: true,
        source: 'coingecko',
        attribution: 'Data provided by CoinGecko',
      });
    }

    // Fetch fresh data
    const result = await getTrendingCoins();

    if (!result.success || !result.data) {
      // Return cached data if available, even if stale
      if (cachedData.data) {
        return NextResponse.json({
          success: true,
          data: cachedData.data,
          cached: true,
          stale: true,
          source: 'coingecko',
          attribution: 'Data provided by CoinGecko',
        });
      }

      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to fetch trending coins',
        },
        { status: 500 }
      );
    }

    // Update cache
    cachedData = {
      data: result.data,
      timestamp: now,
    };

    // Transform data for easier consumption
    const trending = result.data.coins.map((coin) => ({
      id: coin.item.id,
      name: coin.item.name,
      symbol: coin.item.symbol.toUpperCase(),
      thumb: coin.item.thumb,
      small: coin.item.small,
      large: coin.item.large,
      market_cap_rank: coin.item.market_cap_rank,
      price_btc: coin.item.price_btc,
      score: coin.item.score,
      // Include extended data if available
      price_usd: coin.item.data?.price,
      price_change_24h: coin.item.data?.price_change_percentage_24h?.usd,
      market_cap: coin.item.data?.market_cap,
      total_volume: coin.item.data?.total_volume,
      sparkline: coin.item.data?.sparkline,
    }));

    return NextResponse.json({
      success: true,
      data: {
        coins: trending,
        nfts: result.data.nfts,
        categories: result.data.categories,
      },
      cached: false,
      source: 'coingecko',
      attribution: 'Data provided by CoinGecko',
      fetchedAt: result.fetchedAt,
    });
  } catch (error) {
    console.error('[Trending API] Error:', error);

    // Return cached data if available
    if (cachedData.data) {
      return NextResponse.json({
        success: true,
        data: cachedData.data,
        cached: true,
        stale: true,
        source: 'coingecko',
        attribution: 'Data provided by CoinGecko',
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch trending coins',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
