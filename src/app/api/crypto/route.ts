/**
 * Crypto Market API Route
 *
 * Returns market data from CoinGecko (with Supabase cache)
 * Data is for display only - not redistributable
 *
 * COMPLIANCE: This route is protected against external API access.
 */

import { NextRequest, NextResponse } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase';
import { getBulkMarketDataFromCache, saveBulkMarketDataToCache, getMarketDataFromCache } from '@/lib/supabaseData';
import { fetchMarketOverview } from '@/lib/dataApi';
// getGeckoId no longer needed - using geckoId from MarketData directly
import { assertRedistributionAllowed } from '@/lib/redistributionPolicy';
import { enforceDisplayOnly } from '@/lib/apiSecurity';
import {
  validationError,
  internalError,
  validatePositiveNumber,
  parseNumericParam
} from '@/lib/apiErrors';

const MAX_LIMIT = 2000;
const DEFAULT_LIMIT = 250;

export async function GET(request: NextRequest) {
  // Enforce display-only access - block external API scraping
  const blocked = enforceDisplayOnly(request, '/api/crypto');
  if (blocked) return blocked;

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

      // 1. Try cache first for specific coins (all cached data is from CoinGecko which is redistributable)
      if (isSupabaseConfigured) {
        const cached = await getMarketDataFromCache({ limit: MAX_LIMIT });
        if (cached && cached.length > 0) {
          // Filter cached data for requested IDs (match by id, symbol, or name)
          const matchedCoins = cached.filter((coin: { id: string; symbol: string; name?: string }) =>
            idList.includes(coin.id?.toLowerCase() || '') ||
            idList.includes(coin.symbol?.toLowerCase() || '') ||
            idList.includes((coin.name?.toLowerCase() || '').replace(/\s+/g, '-'))
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

      // 2. Fetch from CoinGecko via dataApi
      assertRedistributionAllowed('coingecko', { purpose: 'chart', route: '/api/crypto' });

      // Fetch market overview and match by geckoId, symbol, or name
      const market = await fetchMarketOverview();
      const matchedMarket = market.filter(coin =>
        idList.includes(coin.geckoId?.toLowerCase()) ||  // Match by CoinGecko ID (e.g., "bitcoin")
        idList.includes(coin.symbol.toLowerCase()) ||    // Match by symbol (e.g., "btc")
        idList.includes(coin.name.toLowerCase().replace(/\s+/g, '-'))  // Match by name slug
      );

      const coins = matchedMarket.map((coin, idx) => {
        return {
          id: coin.geckoId || coin.symbol.toLowerCase(),
          symbol: coin.symbol.toLowerCase(),
          name: coin.name,
          image: coin.image,
          current_price: coin.price,
          market_cap: coin.marketCap,
          market_cap_rank: coin.marketCapRank || idx + 1,
          price_change_24h: coin.priceChange24h,
          price_change_percentage_24h: coin.priceChangePercent24h,
          total_volume: coin.quoteVolume24h,
          high_24h: coin.high24h,
          low_24h: coin.low24h,
          circulating_supply: coin.circulatingSupply,
          max_supply: coin.maxSupply,
          ath: coin.ath,
          ath_change_percentage: coin.price > 0 && coin.ath > 0 ? ((coin.price - coin.ath) / coin.ath) * 100 : 0,
        };
      });

      // 3. Save to cache
      if (isSupabaseConfigured && coins.length > 0) {
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
    // 1. Try cache first (all cached data is from CoinGecko which is redistributable)
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
    assertRedistributionAllowed('coingecko', { purpose: 'chart', route: '/api/crypto' });
    const market = await fetchMarketOverview();
    const limited = market.slice(0, limit);

    const coins = limited.map((coin, idx) => {
      return {
        id: coin.geckoId || coin.symbol.toLowerCase(),
        symbol: coin.symbol.toLowerCase(),
        name: coin.name,
        image: coin.image,
        current_price: coin.price,
        market_cap: coin.marketCap,
        market_cap_rank: coin.marketCapRank || idx + 1,
        price_change_24h: coin.priceChange24h,
        price_change_percentage_24h: coin.priceChangePercent24h,
        total_volume: coin.quoteVolume24h,
        high_24h: coin.high24h,
        low_24h: coin.low24h,
        circulating_supply: coin.circulatingSupply,
        max_supply: coin.maxSupply,
        ath: coin.ath,
        ath_change_percentage: coin.price > 0 && coin.ath > 0 ? ((coin.price - coin.ath) / coin.ath) * 100 : 0,
      };
    });

    // 3. Save to cache
    if (isSupabaseConfigured && coins.length > 0) {
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
    // On error, try stale cache (all cached data is from CoinGecko which is redistributable)
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
