/**
 * Exchanges API Route
 *
 * Returns exchange rankings from CoinGecko
 * Data is for display only - not redistributable
 *
 * COMPLIANCE: This route is protected against external API access.
 * CoinGecko data cannot be redistributed without a Data Redistribution License.
 */

import { NextRequest, NextResponse } from 'next/server';
import { enforceDisplayOnly } from '@/lib/apiSecurity';

const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY;
// Use free API if no key, Pro API if key available
const COINGECKO_BASE_URL = COINGECKO_API_KEY
  ? 'https://pro-api.coingecko.com/api/v3'
  : 'https://api.coingecko.com/api/v3';

// Cache data for 5 minutes
let cachedData: {
  exchanges: Exchange[] | null;
  timestamp: number;
} = {
  exchanges: null,
  timestamp: 0,
};

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface ExchangeResponse {
  id: string;
  name: string;
  year_established: number | null;
  country: string | null;
  description?: string;
  url: string;
  image: string;
  has_trading_incentive?: boolean;
  trust_score: number;
  trust_score_rank: number;
  trade_volume_24h_btc: number;
  trade_volume_24h_btc_normalized: number;
}

interface Exchange {
  id: string;
  name: string;
  year_established: number | null;
  country: string | null;
  url: string;
  image: string;
  trust_score: number;
  trust_score_rank: number;
  trade_volume_24h_btc: number;
  trade_volume_24h_btc_normalized: number;
}

export async function GET(request: NextRequest) {
  // Enforce display-only access - block external API scraping
  const blocked = enforceDisplayOnly(request, '/api/crypto/exchanges');
  if (blocked) return blocked;

  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const page = parseInt(searchParams.get('page') || '1');

    // Check cache first
    const now = Date.now();
    if (cachedData.exchanges && now - cachedData.timestamp < CACHE_TTL) {
      return NextResponse.json({
        success: true,
        data: cachedData.exchanges.slice(0, limit),
        cached: true,
        source: 'coingecko',
        attribution: 'Data provided by CoinGecko',
      });
    }

    // Fetch exchanges
    const headers: Record<string, string> = { 'Accept': 'application/json' };
    if (COINGECKO_API_KEY) {
      headers['x-cg-pro-api-key'] = COINGECKO_API_KEY;
    }

    const response = await fetch(
      `${COINGECKO_BASE_URL}/exchanges?per_page=${limit}&page=${page}`,
      { headers }
    );

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data: ExchangeResponse[] = await response.json();

    const exchanges = data.map((exchange) => ({
      id: exchange.id,
      name: exchange.name,
      year_established: exchange.year_established,
      country: exchange.country,
      url: exchange.url,
      image: exchange.image,
      trust_score: exchange.trust_score,
      trust_score_rank: exchange.trust_score_rank,
      trade_volume_24h_btc: exchange.trade_volume_24h_btc,
      trade_volume_24h_btc_normalized: exchange.trade_volume_24h_btc_normalized,
    }));

    // Update cache
    cachedData = {
      exchanges,
      timestamp: now,
    };

    return NextResponse.json({
      success: true,
      data: exchanges,
      cached: false,
      source: 'coingecko',
      attribution: 'Data provided by CoinGecko',
    });
  } catch (error) {
    console.error('[Exchanges API] Error:', error);

    // Return cached data if available
    if (cachedData.exchanges) {
      return NextResponse.json({
        success: true,
        data: cachedData.exchanges,
        cached: true,
        stale: true,
        source: 'coingecko',
        attribution: 'Data provided by CoinGecko',
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch exchanges',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
