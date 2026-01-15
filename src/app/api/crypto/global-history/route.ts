/**
 * Global Market History API Route
 *
 * Returns historical global market cap data from CoinGecko
 * Data is for display only - not redistributable
 *
 * COMPLIANCE: This route is protected against external API access.
 * CoinGecko data cannot be redistributed without a Data Redistribution License.
 *
 * ANALYST PLAN LIMITS:
 * - Historical Global Market Cap: 2 years max (730 days)
 */

import { NextRequest, NextResponse } from 'next/server';
import { enforceDisplayOnly } from '@/lib/apiSecurity';

const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY;
const COINGECKO_BASE_URL = 'https://pro-api.coingecko.com/api/v3';

// Analyst plan limit: 2 years of historical data
const MAX_HISTORICAL_DAYS = 730;

// Cache data for 30 minutes
let cachedData: {
  data: GlobalHistory | null;
  timestamp: number;
  days: number;
} = {
  data: null,
  timestamp: 0,
  days: 0,
};

const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

interface GlobalHistory {
  market_cap: Array<[number, number]>;
  volume: Array<[number, number]>;
}

export async function GET(request: NextRequest) {
  // Enforce display-only access - block external API scraping
  const blocked = enforceDisplayOnly(request, '/api/crypto/global-history');
  if (blocked) return blocked;

  try {
    const { searchParams } = new URL(request.url);
    // Limit to Analyst plan max (2 years = 730 days)
    const days = Math.min(parseInt(searchParams.get('days') || '30'), MAX_HISTORICAL_DAYS);

    // Check cache first
    const now = Date.now();
    if (cachedData.data && cachedData.days === days && now - cachedData.timestamp < CACHE_TTL) {
      return NextResponse.json({
        success: true,
        data: cachedData.data,
        cached: true,
        source: 'coingecko',
        attribution: 'Data provided by CoinGecko',
      });
    }

    // Fetch global market chart
    const response = await fetch(
      `${COINGECKO_BASE_URL}/global/market_cap_chart?days=${days}`,
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

    // Transform data for charting
    const marketCapData = data.market_cap_chart?.market_cap || [];
    const volumeData = data.market_cap_chart?.total_volume || [];

    const history: GlobalHistory = {
      market_cap: marketCapData.map((item: [string, number]) => [
        new Date(item[0]).getTime(),
        item[1],
      ]),
      volume: volumeData.map((item: [string, number]) => [
        new Date(item[0]).getTime(),
        item[1],
      ]),
    };

    // Update cache
    cachedData = {
      data: history,
      timestamp: now,
      days,
    };

    return NextResponse.json({
      success: true,
      data: history,
      cached: false,
      source: 'coingecko',
      attribution: 'Data provided by CoinGecko',
    });
  } catch (error) {
    console.error('[Global History API] Error:', error);

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
        error: 'Failed to fetch global market history',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
