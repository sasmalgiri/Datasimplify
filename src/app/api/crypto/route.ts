import { NextResponse } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase';
import { getBulkMarketDataFromCache, saveBulkMarketDataToCache, getMarketDataFromCache } from '@/lib/supabaseData';
import {
  validationError,
  externalApiError,
  internalError,
  validatePositiveNumber,
  parseNumericParam
} from '@/lib/apiErrors';

// CoinGecko FREE API - 10-30 calls/minute
const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';
const MAX_LIMIT = 250;
const DEFAULT_LIMIT = 100;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limitParam = searchParams.get('limit');
  const ids = searchParams.get('ids'); // comma-separated list of coin IDs

  // Validate limit parameter
  if (limitParam) {
    const limitError = validatePositiveNumber(limitParam, 'Limit', 1, MAX_LIMIT);
    if (limitError) {
      return validationError(limitError);
    }
  }

  const limit = parseNumericParam(limitParam, DEFAULT_LIMIT, 1, MAX_LIMIT);

  try {
    // If specific IDs are requested (for Compare page)
    if (ids) {
      const idList = ids.split(',').map(id => id.trim().toLowerCase()).filter(Boolean);

      if (idList.length === 0) {
        return validationError('Please provide at least one valid coin ID.');
      }

      if (idList.length > 50) {
        return validationError('Maximum 50 coins can be requested at once.');
      }

      // 1. Try cache first for specific coins
      if (isSupabaseConfigured) {
        const cached = await getMarketDataFromCache({ limit: MAX_LIMIT });
        if (cached && cached.length > 0) {
          // Filter cached data for requested IDs
          const matchedCoins = cached.filter((coin: { id: string }) =>
            idList.includes(coin.id.toLowerCase())
          );

          // If we have all requested coins in cache, return them
          if (matchedCoins.length === idList.length) {
            return NextResponse.json({
              success: true,
              data: matchedCoins,
              total: matchedCoins.length,
              source: 'cache',
              updated: new Date().toISOString(),
            });
          }
        }
      }

      // 2. Fetch specific coins from CoinGecko with extended price change data
      const response = await fetch(
        `${COINGECKO_BASE}/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&sparkline=false&price_change_percentage=24h,7d,30d,1y`,
        {
          headers: { 'Accept': 'application/json' },
          next: { revalidate: 60 },
        }
      );

      if (!response.ok) {
        console.error('CoinGecko API error:', response.status);
        // On API error, try to return stale cache if available
        if (isSupabaseConfigured) {
          const staleCache = await getMarketDataFromCache({ limit: MAX_LIMIT });
          if (staleCache && staleCache.length > 0) {
            const matchedCoins = staleCache.filter((coin: { id: string }) =>
              idList.includes(coin.id.toLowerCase())
            );
            if (matchedCoins.length > 0) {
              return NextResponse.json({
                success: true,
                data: matchedCoins,
                total: matchedCoins.length,
                source: 'stale-cache',
                updated: new Date().toISOString(),
              });
            }
          }
        }

        if (response.status === 429) {
          return NextResponse.json({
            success: false,
            error: 'Rate limit exceeded. Please wait a moment and try again.',
            code: 'E003',
            data: []
          }, { status: 429 });
        }

        return externalApiError('CoinGecko');
      }

      const coins = await response.json();

      // 3. Save to cache
      if (isSupabaseConfigured && Array.isArray(coins) && coins.length > 0) {
        await saveBulkMarketDataToCache(coins);
      }

      return NextResponse.json({
        success: true,
        data: coins,
        total: coins.length,
        source: 'coingecko',
        updated: new Date().toISOString(),
      });
    }

    // Default behavior: fetch top coins by market cap
    // 1. Try cache first
    if (isSupabaseConfigured) {
      const cached = await getBulkMarketDataFromCache(limit);
      if (cached && cached.length > 0) {
        return NextResponse.json({
          success: true,
          data: cached,
          total: cached.length,
          source: 'cache',
          updated: new Date().toISOString(),
        });
      }
    }

    // 2. Fetch from CoinGecko
    const response = await fetch(
      `${COINGECKO_BASE}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${limit}&page=1&sparkline=false&price_change_percentage=24h,7d`,
      {
        headers: { 'Accept': 'application/json' },
        next: { revalidate: 60 },
      }
    );

    if (!response.ok) {
      console.error('CoinGecko API error:', response.status);
      // On API error, try to return stale cache if available
      if (isSupabaseConfigured) {
        const staleCache = await getBulkMarketDataFromCache(limit);
        if (staleCache && staleCache.length > 0) {
          return NextResponse.json({
            success: true,
            data: staleCache,
            total: staleCache.length,
            source: 'stale-cache',
            updated: new Date().toISOString(),
          });
        }
      }

      if (response.status === 429) {
        return NextResponse.json({
          success: false,
          error: 'Rate limit exceeded. Please wait a moment and try again.',
          code: 'E003',
          data: []
        }, { status: 429 });
      }

      return externalApiError('CoinGecko');
    }

    const coins = await response.json();

    // 3. Save to cache
    if (isSupabaseConfigured && Array.isArray(coins) && coins.length > 0) {
      await saveBulkMarketDataToCache(coins);
    }

    return NextResponse.json({
      success: true,
      data: coins,
      total: coins.length,
      source: 'coingecko',
      updated: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Crypto API error:', error);
    // On error, try stale cache
    if (isSupabaseConfigured) {
      const staleCache = await getBulkMarketDataFromCache(limit);
      if (staleCache && staleCache.length > 0) {
        return NextResponse.json({
          success: true,
          data: staleCache,
          total: staleCache.length,
          source: 'stale-cache',
          updated: new Date().toISOString(),
        });
      }
    }
    return internalError('Unable to fetch market data. Please try again later.');
  }
}
