/**
 * Coin Categories API Route
 *
 * Returns coin categories from CoinGecko
 * Data is for display only - not redistributable
 *
 * COMPLIANCE: This route is protected against external API access.
 * CoinGecko data cannot be redistributed without a Data Redistribution License.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCategories } from '@/lib/coingecko/client';
import { enforceDisplayOnly } from '@/lib/apiSecurity';

// Cache data for 30 minutes (categories don't change often)
let cachedData: {
  categories: Category[] | null;
  timestamp: number;
} = {
  categories: null,
  timestamp: 0,
};

const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

interface Category {
  id: string;
  name: string;
  market_cap?: number;
  market_cap_change_24h?: number;
  volume_24h?: number;
  top_3_coins?: string[];
}

export async function GET(request: NextRequest) {
  // Enforce display-only access - block external API scraping
  const blocked = enforceDisplayOnly(request, '/api/crypto/categories');
  if (blocked) return blocked;

  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

    // Check cache first
    const now = Date.now();
    if (cachedData.categories && now - cachedData.timestamp < CACHE_TTL) {
      return NextResponse.json({
        success: true,
        data: cachedData.categories.slice(0, limit),
        cached: true,
        source: 'coingecko',
        attribution: 'Data provided by CoinGecko',
      });
    }

    // Fetch fresh data
    const result = await getCategories();

    if (!result.success || !result.data) {
      // Return cached data if available
      if (cachedData.categories) {
        return NextResponse.json({
          success: true,
          data: cachedData.categories.slice(0, limit),
          cached: true,
          stale: true,
          source: 'coingecko',
          attribution: 'Data provided by CoinGecko',
        });
      }

      return NextResponse.json(
        { success: false, error: result.error || 'Failed to fetch categories' },
        { status: 500 }
      );
    }

    // Transform and sort by market cap
    const categories = result.data
      .filter((cat: Category) => cat.market_cap && cat.market_cap > 0)
      .sort((a: Category, b: Category) => (b.market_cap || 0) - (a.market_cap || 0))
      .map((cat: Category) => ({
        id: cat.id,
        name: cat.name,
        market_cap: cat.market_cap,
        market_cap_change_24h: cat.market_cap_change_24h,
        volume_24h: cat.volume_24h,
        top_3_coins: cat.top_3_coins,
      }));

    // Update cache
    cachedData = {
      categories,
      timestamp: now,
    };

    return NextResponse.json({
      success: true,
      data: categories.slice(0, limit),
      cached: false,
      source: 'coingecko',
      attribution: 'Data provided by CoinGecko',
    });
  } catch (error) {
    console.error('[Categories API] Error:', error);

    // Return cached data if available
    if (cachedData.categories) {
      return NextResponse.json({
        success: true,
        data: cachedData.categories,
        cached: true,
        stale: true,
        source: 'coingecko',
        attribution: 'Data provided by CoinGecko',
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch categories',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
