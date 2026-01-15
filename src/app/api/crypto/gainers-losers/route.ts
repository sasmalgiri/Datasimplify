/**
 * Top Gainers & Losers API Route
 *
 * Returns top performing and worst performing coins from CoinGecko
 * Data is for display only - not redistributable
 *
 * COMPLIANCE: This route is protected against external API access.
 * CoinGecko data cannot be redistributed without a Data Redistribution License.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTopGainers, getTopLosers, CoinGeckoCoin } from '@/lib/coingecko/client';
import { enforceDisplayOnly } from '@/lib/apiSecurity';

// Cache data for 5 minutes
let cachedData: {
  gainers: CoinGeckoCoin[] | null;
  losers: CoinGeckoCoin[] | null;
  timestamp: number;
} = {
  gainers: null,
  losers: null,
  timestamp: 0,
};

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function GET(request: NextRequest) {
  // Enforce display-only access - block external API scraping
  const blocked = enforceDisplayOnly(request, '/api/crypto/gainers-losers');
  if (blocked) return blocked;

  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'both'; // 'gainers', 'losers', or 'both'
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);
    const currency = searchParams.get('currency') || 'usd';

    // Check cache first
    const now = Date.now();
    const cacheValid = now - cachedData.timestamp < CACHE_TTL;

    if (cacheValid && cachedData.gainers && cachedData.losers) {
      const responseData: {
        gainers?: CoinGeckoCoin[];
        losers?: CoinGeckoCoin[];
      } = {};

      if (type === 'gainers' || type === 'both') {
        responseData.gainers = cachedData.gainers.slice(0, limit);
      }
      if (type === 'losers' || type === 'both') {
        responseData.losers = cachedData.losers.slice(0, limit);
      }

      return NextResponse.json({
        success: true,
        data: responseData,
        cached: true,
        source: 'coingecko',
        attribution: 'Data provided by CoinGecko',
      });
    }

    // Fetch fresh data
    const [gainersResult, losersResult] = await Promise.all([
      type === 'losers' ? Promise.resolve(null) : getTopGainers(currency, 50),
      type === 'gainers' ? Promise.resolve(null) : getTopLosers(currency, 50),
    ]);

    // Update cache
    if (gainersResult?.success && gainersResult.data) {
      cachedData.gainers = gainersResult.data;
    }
    if (losersResult?.success && losersResult.data) {
      cachedData.losers = losersResult.data;
    }
    cachedData.timestamp = now;

    // Check for errors
    if (type === 'gainers' && !gainersResult?.success) {
      if (cachedData.gainers) {
        return NextResponse.json({
          success: true,
          data: { gainers: cachedData.gainers.slice(0, limit) },
          cached: true,
          stale: true,
          source: 'coingecko',
          attribution: 'Data provided by CoinGecko',
        });
      }
      return NextResponse.json(
        { success: false, error: gainersResult?.error || 'Failed to fetch gainers' },
        { status: 500 }
      );
    }

    if (type === 'losers' && !losersResult?.success) {
      if (cachedData.losers) {
        return NextResponse.json({
          success: true,
          data: { losers: cachedData.losers.slice(0, limit) },
          cached: true,
          stale: true,
          source: 'coingecko',
          attribution: 'Data provided by CoinGecko',
        });
      }
      return NextResponse.json(
        { success: false, error: losersResult?.error || 'Failed to fetch losers' },
        { status: 500 }
      );
    }

    // Build response
    const responseData: {
      gainers?: Array<{
        id: string;
        symbol: string;
        name: string;
        image?: string;
        current_price: number;
        price_change_percentage_24h: number;
        market_cap: number;
        market_cap_rank: number;
        total_volume: number;
      }>;
      losers?: Array<{
        id: string;
        symbol: string;
        name: string;
        image?: string;
        current_price: number;
        price_change_percentage_24h: number;
        market_cap: number;
        market_cap_rank: number;
        total_volume: number;
      }>;
    } = {};

    if ((type === 'gainers' || type === 'both') && gainersResult?.data) {
      responseData.gainers = gainersResult.data.slice(0, limit).map((coin) => ({
        id: coin.id,
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        image: coin.image,
        current_price: coin.current_price || 0,
        price_change_percentage_24h: coin.price_change_percentage_24h || 0,
        market_cap: coin.market_cap || 0,
        market_cap_rank: coin.market_cap_rank || 0,
        total_volume: coin.total_volume || 0,
      }));
    }

    if ((type === 'losers' || type === 'both') && losersResult?.data) {
      responseData.losers = losersResult.data.slice(0, limit).map((coin) => ({
        id: coin.id,
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        image: coin.image,
        current_price: coin.current_price || 0,
        price_change_percentage_24h: coin.price_change_percentage_24h || 0,
        market_cap: coin.market_cap || 0,
        market_cap_rank: coin.market_cap_rank || 0,
        total_volume: coin.total_volume || 0,
      }));
    }

    return NextResponse.json({
      success: true,
      data: responseData,
      cached: false,
      source: 'coingecko',
      attribution: 'Data provided by CoinGecko',
      fetchedAt: gainersResult?.fetchedAt || losersResult?.fetchedAt,
    });
  } catch (error) {
    console.error('[Gainers/Losers API] Error:', error);

    // Return cached data if available
    if (cachedData.gainers || cachedData.losers) {
      return NextResponse.json({
        success: true,
        data: {
          gainers: cachedData.gainers,
          losers: cachedData.losers,
        },
        cached: true,
        stale: true,
        source: 'coingecko',
        attribution: 'Data provided by CoinGecko',
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch market movers',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
