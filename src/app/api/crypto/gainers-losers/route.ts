/**
 * Top Gainers & Losers API Route
 *
 * Returns top performing and worst performing coins
 * Uses CoinGecko data
 * Data is for display only - not redistributable
 *
 * COMPLIANCE: This route is protected against external API access.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTopGainers, getTopLosers } from '@/lib/coingecko/client';
import { enforceDisplayOnly } from '@/lib/apiSecurity';
import { fetchGainersLosers } from '@/lib/dataApi';

interface NormalizedCoin {
  id: string;
  symbol: string;
  name: string;
  image?: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap: number;
  market_cap_rank: number;
  total_volume: number;
}

// Cache data for 5 minutes
let cachedData: {
  gainers: NormalizedCoin[] | null;
  losers: NormalizedCoin[] | null;
  timestamp: number;
  source: string;
} = {
  gainers: null,
  losers: null,
  timestamp: 0,
  source: '',
};

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Fallback to internal API data
async function getDataApiFallback(limit: number): Promise<{
  gainers: NormalizedCoin[];
  losers: NormalizedCoin[];
} | null> {
  try {
    const data = await fetchGainersLosers({ type: 'both', limit: limit * 2 });

    if (!data || data.length === 0) {
      return null;
    }

    const gainers = data
      .filter(coin => coin.type === 'gainer')
      .slice(0, limit)
      .map((coin, idx) => ({
        id: coin.symbol.toLowerCase(),
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        image: coin.image,
        current_price: coin.price,
        price_change_percentage_24h: coin.priceChangePercent24h,
        market_cap: coin.marketCap,
        market_cap_rank: idx + 1,
        total_volume: coin.volume24h,
      }));

    const losers = data
      .filter(coin => coin.type === 'loser')
      .slice(0, limit)
      .map((coin, idx) => ({
        id: coin.symbol.toLowerCase(),
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        image: coin.image,
        current_price: coin.price,
        price_change_percentage_24h: coin.priceChangePercent24h,
        market_cap: coin.marketCap,
        market_cap_rank: idx + 1,
        total_volume: coin.volume24h,
      }));

    return { gainers, losers };
  } catch (error) {
    console.error('[Gainers/Losers API] Fallback error:', error);
    return null;
  }
}

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
        gainers?: NormalizedCoin[];
        losers?: NormalizedCoin[];
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
        source: cachedData.source,
        attribution: 'Data provided by CoinGecko',
      });
    }

    // Try CoinGecko first
    const [gainersResult, losersResult] = await Promise.all([
      type === 'losers' ? Promise.resolve(null) : getTopGainers(currency, 50),
      type === 'gainers' ? Promise.resolve(null) : getTopLosers(currency, 50),
    ]);

    const coingeckoSuccess =
      (type === 'gainers' && gainersResult?.success) ||
      (type === 'losers' && losersResult?.success) ||
      (type === 'both' && (gainersResult?.success || losersResult?.success));

    if (coingeckoSuccess) {
      // Update cache with CoinGecko data
      if (gainersResult?.success && gainersResult.data) {
        cachedData.gainers = gainersResult.data.map((coin, idx) => ({
          id: coin.id,
          symbol: coin.symbol.toUpperCase(),
          name: coin.name,
          image: coin.image,
          current_price: coin.current_price || 0,
          price_change_percentage_24h: coin.price_change_percentage_24h || 0,
          market_cap: coin.market_cap || 0,
          market_cap_rank: coin.market_cap_rank || idx + 1,
          total_volume: coin.total_volume || 0,
        }));
      }
      if (losersResult?.success && losersResult.data) {
        cachedData.losers = losersResult.data.map((coin, idx) => ({
          id: coin.id,
          symbol: coin.symbol.toUpperCase(),
          name: coin.name,
          image: coin.image,
          current_price: coin.current_price || 0,
          price_change_percentage_24h: coin.price_change_percentage_24h || 0,
          market_cap: coin.market_cap || 0,
          market_cap_rank: coin.market_cap_rank || idx + 1,
          total_volume: coin.total_volume || 0,
        }));
      }
      cachedData.timestamp = now;
      cachedData.source = 'coingecko';

      const responseData: {
        gainers?: NormalizedCoin[];
        losers?: NormalizedCoin[];
      } = {};

      if ((type === 'gainers' || type === 'both') && cachedData.gainers) {
        responseData.gainers = cachedData.gainers.slice(0, limit);
      }
      if ((type === 'losers' || type === 'both') && cachedData.losers) {
        responseData.losers = cachedData.losers.slice(0, limit);
      }

      return NextResponse.json({
        success: true,
        data: responseData,
        cached: false,
        source: 'coingecko',
        attribution: 'Data provided by CoinGecko',
        fetchedAt: gainersResult?.fetchedAt || losersResult?.fetchedAt,
      });
    }

    // CoinGecko failed - try fallback
    console.log('[Gainers/Losers API] CoinGecko failed, trying fallback');
    const fallbackData = await getDataApiFallback(limit);

    if (fallbackData) {
      // Update cache with fallback data
      cachedData.gainers = fallbackData.gainers;
      cachedData.losers = fallbackData.losers;
      cachedData.timestamp = now;
      cachedData.source = 'coingecko';

      const responseData: {
        gainers?: NormalizedCoin[];
        losers?: NormalizedCoin[];
      } = {};

      if (type === 'gainers' || type === 'both') {
        responseData.gainers = fallbackData.gainers.slice(0, limit);
      }
      if (type === 'losers' || type === 'both') {
        responseData.losers = fallbackData.losers.slice(0, limit);
      }

      return NextResponse.json({
        success: true,
        data: responseData,
        cached: false,
        source: 'coingecko',
        attribution: 'Data provided by CoinGecko',
      });
    }

    // Failed - return cached data if available
    if (cachedData.gainers || cachedData.losers) {
      const responseData: {
        gainers?: NormalizedCoin[];
        losers?: NormalizedCoin[];
      } = {};

      if ((type === 'gainers' || type === 'both') && cachedData.gainers) {
        responseData.gainers = cachedData.gainers.slice(0, limit);
      }
      if ((type === 'losers' || type === 'both') && cachedData.losers) {
        responseData.losers = cachedData.losers.slice(0, limit);
      }

      return NextResponse.json({
        success: true,
        data: responseData,
        cached: true,
        stale: true,
        source: cachedData.source,
        attribution: 'Data provided by CoinGecko',
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch market movers from all sources',
      },
      { status: 500 }
    );
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
        source: cachedData.source,
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
