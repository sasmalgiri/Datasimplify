/**
 * DEX Pools API Route (GeckoTerminal)
 *
 * Returns trending DEX pools from GeckoTerminal (part of CoinGecko)
 * Data is for display only - not redistributable
 *
 * COMPLIANCE: This route is protected against external API access.
 * GeckoTerminal data cannot be redistributed without a Data Redistribution License.
 */

import { NextRequest, NextResponse } from 'next/server';
import { enforceDisplayOnly } from '@/lib/apiSecurity';

// GeckoTerminal uses the same API key as CoinGecko Pro
const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY;
const GECKOTERMINAL_BASE_URL = 'https://api.geckoterminal.com/api/v2';

// Cache data for 5 minutes
interface Pool {
  id: string;
  type: string;
  attributes: {
    name: string;
    address: string;
    base_token_price_usd: string;
    quote_token_price_usd: string;
    base_token_price_native_currency: string;
    quote_token_price_native_currency: string;
    base_token_price_quote_token: string;
    quote_token_price_base_token: string;
    pool_created_at: string;
    reserve_in_usd: string;
    fdv_usd: string;
    market_cap_usd: string;
    price_change_percentage: {
      m5: string;
      h1: string;
      h6: string;
      h24: string;
    };
    transactions: {
      m5: { buys: number; sells: number; buyers: number; sellers: number };
      h1: { buys: number; sells: number; buyers: number; sellers: number };
      h24: { buys: number; sells: number; buyers: number; sellers: number };
    };
    volume_usd: {
      m5: string;
      h1: string;
      h6: string;
      h24: string;
    };
  };
  relationships?: {
    base_token?: { data: { id: string } };
    quote_token?: { data: { id: string } };
    dex?: { data: { id: string } };
  };
}

interface CachedPool {
  id: string;
  name: string;
  address: string;
  network: string;
  dex: string;
  base_token_price_usd: number;
  reserve_usd: number;
  volume_24h: number;
  price_change_24h: number;
  transactions_24h: number;
  created_at: string;
}

let cachedData: {
  pools: CachedPool[] | null;
  timestamp: number;
  network: string;
} = {
  pools: null,
  timestamp: 0,
  network: '',
};

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function GET(request: NextRequest) {
  // Enforce display-only access - block external API scraping
  const blocked = enforceDisplayOnly(request, '/api/crypto/dex-pools');
  if (blocked) return blocked;

  try {
    const { searchParams } = new URL(request.url);
    const network = searchParams.get('network') || 'eth'; // eth, bsc, polygon, arbitrum, etc.
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const type = searchParams.get('type') || 'trending'; // trending, new, top_gainers

    // Check cache first
    const now = Date.now();
    if (cachedData.pools && cachedData.network === network && now - cachedData.timestamp < CACHE_TTL) {
      return NextResponse.json({
        success: true,
        data: cachedData.pools.slice(0, limit),
        cached: true,
        source: 'geckoterminal',
        attribution: 'Data provided by GeckoTerminal (CoinGecko)',
      });
    }

    // Determine endpoint based on type
    let endpoint = '';
    switch (type) {
      case 'new':
        endpoint = `/networks/${network}/new_pools`;
        break;
      case 'top_gainers':
        endpoint = `/networks/${network}/pools`;
        break;
      default:
        endpoint = `/networks/${network}/trending_pools`;
    }

    // Fetch pools from GeckoTerminal
    const response = await fetch(
      `${GECKOTERMINAL_BASE_URL}${endpoint}?page=1`,
      {
        headers: {
          'Accept': 'application/json',
          // GeckoTerminal public API doesn't require auth, but Pro features might
          ...(COINGECKO_API_KEY ? { 'x-cg-pro-api-key': COINGECKO_API_KEY } : {}),
        },
      }
    );

    if (!response.ok) {
      throw new Error(`GeckoTerminal API error: ${response.status}`);
    }

    const data = await response.json();
    const pools: Pool[] = data.data || [];

    // Transform pool data
    const transformedPools: CachedPool[] = pools.slice(0, limit).map((pool) => {
      const attrs = pool.attributes;
      const networkId = pool.id.split('_')[0] || network;
      const dexId = pool.relationships?.dex?.data?.id?.split('_')[1] || 'unknown';

      return {
        id: pool.id,
        name: attrs.name,
        address: attrs.address,
        network: networkId,
        dex: dexId,
        base_token_price_usd: parseFloat(attrs.base_token_price_usd) || 0,
        reserve_usd: parseFloat(attrs.reserve_in_usd) || 0,
        volume_24h: parseFloat(attrs.volume_usd?.h24) || 0,
        price_change_24h: parseFloat(attrs.price_change_percentage?.h24) || 0,
        transactions_24h: (attrs.transactions?.h24?.buys || 0) + (attrs.transactions?.h24?.sells || 0),
        created_at: attrs.pool_created_at,
      };
    });

    // Update cache
    cachedData = {
      pools: transformedPools,
      timestamp: now,
      network,
    };

    return NextResponse.json({
      success: true,
      data: transformedPools,
      cached: false,
      source: 'geckoterminal',
      attribution: 'Data provided by GeckoTerminal (CoinGecko)',
    });
  } catch (error) {
    console.error('[DEX Pools API] Error:', error);

    // Return cached data if available
    if (cachedData.pools) {
      return NextResponse.json({
        success: true,
        data: cachedData.pools,
        cached: true,
        stale: true,
        source: 'geckoterminal',
        attribution: 'Data provided by GeckoTerminal (CoinGecko)',
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch DEX pools',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
