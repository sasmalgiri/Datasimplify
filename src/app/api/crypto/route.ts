import { NextResponse } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase';
import { getBulkMarketDataFromCache, saveBulkMarketDataToCache, getMarketDataFromCache } from '@/lib/supabaseData';
import { fetchMarketOverview } from '@/lib/dataApi';
import { findCoinByGeckoId, getCoinGeckoId } from '@/lib/dataTypes';
import { assertRedistributionAllowed, isRedistributionPolicyEnabled, isSourceRedistributable } from '@/lib/redistributionPolicy';
import {
  validationError,
  internalError,
  validatePositiveNumber,
  parseNumericParam
} from '@/lib/apiErrors';

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
          const filteredCached = isRedistributionPolicyEnabled()
            ? cached.filter((row: any) => isSourceRedistributable(row?.data_source || row?.source || ''))
            : cached;

          // Filter cached data for requested IDs (match by id or symbol)
          const matchedCoins = filteredCached.filter((coin: { id: string; symbol: string }) =>
            idList.includes(coin.id.toLowerCase()) ||
            idList.some(reqId => reqId.toLowerCase().includes(coin.symbol.toLowerCase()))
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

      // 2. Derive specific coins from Binance via our supported universe
      assertRedistributionAllowed('binance', { purpose: 'chart', route: '/api/crypto' });
      const symbols = idList
        .map(id => findCoinByGeckoId(id))
        .filter((c): c is NonNullable<ReturnType<typeof findCoinByGeckoId>> => c != null)
        .map(c => c.symbol);

      const market = await fetchMarketOverview({ symbols });
      const coins = market.map((coin, idx) => ({
        id: getCoinGeckoId(coin.symbol),
        symbol: coin.symbol.toLowerCase(),
        name: coin.name,
        image: coin.image,
        current_price: coin.price,
        market_cap: coin.marketCap,
        market_cap_rank: idx + 1,
        price_change_24h: coin.priceChange24h,
        price_change_percentage_24h: coin.priceChangePercent24h,
        total_volume: coin.quoteVolume24h,
        high_24h: coin.high24h,
        low_24h: coin.low24h,
        circulating_supply: coin.circulatingSupply,
        max_supply: coin.maxSupply,
        ath: coin.price,
        ath_change_percentage: 0,
      }));

      // 3. Save to cache
      if (isSupabaseConfigured && coins.length > 0) {
        await saveBulkMarketDataToCache(coins);
      }

      return NextResponse.json({
        success: true,
        data: coins,
        total: coins.length,
        source: 'binance-derived',
        updated: new Date().toISOString(),
      });
    }

    // Default behavior: fetch top coins by market cap
    // 1. Try cache first
    if (isSupabaseConfigured) {
      const cached = await getBulkMarketDataFromCache(limit);
      if (cached && cached.length > 0) {
        const filteredCached = isRedistributionPolicyEnabled()
          ? cached.filter((row: any) => isSourceRedistributable(row?.data_source || row?.source || ''))
          : cached;

        if (filteredCached.length > 0) {
        return NextResponse.json({
          success: true,
          data: filteredCached,
          total: filteredCached.length,
          source: 'cache',
          updated: new Date().toISOString(),
        });
        }
      }
    }

    // 2. Derive from Binance (supported universe only)
    assertRedistributionAllowed('binance', { purpose: 'chart', route: '/api/crypto' });
    const market = await fetchMarketOverview();
    const limited = market.slice(0, limit);
    const coins = limited.map((coin, idx) => ({
      id: getCoinGeckoId(coin.symbol),
      symbol: coin.symbol.toLowerCase(),
      name: coin.name,
      image: coin.image,
      current_price: coin.price,
      market_cap: coin.marketCap,
      market_cap_rank: idx + 1,
      price_change_24h: coin.priceChange24h,
      price_change_percentage_24h: coin.priceChangePercent24h,
      total_volume: coin.quoteVolume24h,
      high_24h: coin.high24h,
      low_24h: coin.low24h,
      circulating_supply: coin.circulatingSupply,
      max_supply: coin.maxSupply,
      ath: coin.price,
      ath_change_percentage: 0,
    }));

    // 3. Save to cache
    if (isSupabaseConfigured && coins.length > 0) {
      await saveBulkMarketDataToCache(coins);
    }

    return NextResponse.json({
      success: true,
      data: coins,
      total: coins.length,
      source: 'binance-derived',
      updated: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Crypto API error:', error);
    // On error, try stale cache
    if (isSupabaseConfigured) {
      const staleCache = await getBulkMarketDataFromCache(limit);
      if (staleCache && staleCache.length > 0) {
        const filteredStale = isRedistributionPolicyEnabled()
          ? staleCache.filter((row: any) => isSourceRedistributable(row?.data_source || row?.source || ''))
          : staleCache;

        if (filteredStale.length > 0) {
        return NextResponse.json({
          success: true,
          data: filteredStale,
          total: filteredStale.length,
          source: 'stale-cache',
          updated: new Date().toISOString(),
        });
        }
      }
    }
    return internalError('Unable to fetch market data. Please try again later.');
  }
}
