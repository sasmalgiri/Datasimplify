/**
 * CoinGecko Cache Layer
 *
 * Implements server-side caching to minimize API calls.
 * All CoinGecko data should flow through this cache.
 *
 * In production, this would use Redis or Supabase.
 * For now, uses in-memory cache with TTL.
 */

import {
  CACHE_TTL,
  getCoinsMarkets,
  getCoinOHLC,
  getCoinMarketChart,
  getGlobalData,
  getCoinDetails,
  CoinGeckoCoin,
  CoinGeckoGlobal,
} from './client';

interface CacheEntry<T> {
  data: T;
  fetchedAt: number;
  expiresAt: number;
}

// In-memory cache (would use Redis/Supabase in production)
const cache = new Map<string, CacheEntry<unknown>>();

/**
 * Get cached data or fetch from API
 */
async function getCachedOrFetch<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<{ success: boolean; data?: T; error?: string }>
): Promise<{ data: T | null; cached: boolean; fetchedAt: number; error?: string }> {
  // Check cache
  const cached = cache.get(key) as CacheEntry<T> | undefined;
  if (cached && Date.now() < cached.expiresAt) {
    return {
      data: cached.data,
      cached: true,
      fetchedAt: cached.fetchedAt,
    };
  }

  // Fetch from API
  const result = await fetcher();

  if (!result.success || !result.data) {
    // Return stale data if available
    if (cached) {
      console.warn(`[CoinGecko Cache] Returning stale data for ${key}: ${result.error}`);
      return {
        data: cached.data,
        cached: true,
        fetchedAt: cached.fetchedAt,
        error: result.error,
      };
    }
    return {
      data: null,
      cached: false,
      fetchedAt: Date.now(),
      error: result.error,
    };
  }

  // Store in cache
  const now = Date.now();
  cache.set(key, {
    data: result.data,
    fetchedAt: now,
    expiresAt: now + ttlSeconds * 1000,
  });

  return {
    data: result.data,
    cached: false,
    fetchedAt: now,
  };
}

// === Cached API Methods ===

export interface CachedCoinData {
  coins: CoinGeckoCoin[];
  fetchedAt: number;
  cached: boolean;
  error?: string;
}

/**
 * Get top coins by market cap (cached)
 */
export async function getCachedCoinsMarkets(
  vsCurrency = 'usd',
  page = 1,
  perPage = 100
): Promise<CachedCoinData> {
  const key = `coins_markets_${vsCurrency}_${page}_${perPage}`;

  const result = await getCachedOrFetch<CoinGeckoCoin[]>(key, CACHE_TTL.prices, () =>
    getCoinsMarkets(vsCurrency, page, perPage)
  );

  return {
    coins: result.data || [],
    fetchedAt: result.fetchedAt,
    cached: result.cached,
    error: result.error,
  };
}

export interface CachedOHLCData {
  ohlc: number[][];
  fetchedAt: number;
  cached: boolean;
  error?: string;
}

/**
 * Get coin OHLC data (cached)
 */
export async function getCachedCoinOHLC(
  coinId: string,
  vsCurrency = 'usd',
  days = 30
): Promise<CachedOHLCData> {
  const key = `ohlc_${coinId}_${vsCurrency}_${days}`;

  const result = await getCachedOrFetch<number[][]>(key, CACHE_TTL.ohlcv, () =>
    getCoinOHLC(coinId, vsCurrency, days)
  );

  return {
    ohlc: result.data || [],
    fetchedAt: result.fetchedAt,
    cached: result.cached,
    error: result.error,
  };
}

export interface CachedMarketChartData {
  prices: number[][];
  marketCaps: number[][];
  volumes: number[][];
  fetchedAt: number;
  cached: boolean;
  error?: string;
}

/**
 * Get coin market chart (cached)
 */
export async function getCachedCoinMarketChart(
  coinId: string,
  vsCurrency = 'usd',
  days: number | 'max' = 30
): Promise<CachedMarketChartData> {
  const key = `market_chart_${coinId}_${vsCurrency}_${days}`;

  const result = await getCachedOrFetch<{
    prices: number[][];
    market_caps: number[][];
    total_volumes: number[][];
  }>(key, days === 'max' ? CACHE_TTL.historical : CACHE_TTL.ohlcv, () =>
    getCoinMarketChart(coinId, vsCurrency, days)
  );

  return {
    prices: result.data?.prices || [],
    marketCaps: result.data?.market_caps || [],
    volumes: result.data?.total_volumes || [],
    fetchedAt: result.fetchedAt,
    cached: result.cached,
    error: result.error,
  };
}

export interface CachedGlobalData {
  totalMarketCap: number;
  totalVolume: number;
  btcDominance: number;
  marketCapChange24h: number;
  activeCryptos: number;
  markets: number;
  fetchedAt: number;
  cached: boolean;
  error?: string;
}

/**
 * Get global market data (cached)
 */
export async function getCachedGlobalData(): Promise<CachedGlobalData> {
  const key = 'global_data';

  const result = await getCachedOrFetch<CoinGeckoGlobal>(key, CACHE_TTL.global, () =>
    getGlobalData()
  );

  const data = result.data?.data;

  return {
    totalMarketCap: data?.total_market_cap?.usd || 0,
    totalVolume: data?.total_volume?.usd || 0,
    btcDominance: data?.market_cap_percentage?.btc || 0,
    marketCapChange24h: data?.market_cap_change_percentage_24h_usd || 0,
    activeCryptos: data?.active_cryptocurrencies || 0,
    markets: data?.markets || 0,
    fetchedAt: result.fetchedAt,
    cached: result.cached,
    error: result.error,
  };
}

export interface CachedCoinDetails {
  id: string;
  symbol: string;
  name: string;
  description: string;
  image: string;
  categories: string[];
  genesisDate: string | null;
  fetchedAt: number;
  cached: boolean;
  error?: string;
}

/**
 * Get coin details (cached)
 */
export async function getCachedCoinDetails(coinId: string): Promise<CachedCoinDetails> {
  const key = `coin_details_${coinId}`;

  const result = await getCachedOrFetch<{
    id: string;
    symbol: string;
    name: string;
    description: { en: string };
    image: { large: string };
    categories: string[];
    genesis_date: string | null;
  }>(key, CACHE_TTL.metadata, () => getCoinDetails(coinId));

  return {
    id: result.data?.id || coinId,
    symbol: result.data?.symbol || '',
    name: result.data?.name || '',
    description: result.data?.description?.en || '',
    image: result.data?.image?.large || '',
    categories: result.data?.categories || [],
    genesisDate: result.data?.genesis_date || null,
    fetchedAt: result.fetchedAt,
    cached: result.cached,
    error: result.error,
  };
}

// === Cache Management ===

/**
 * Clear all cached data
 */
export function clearCache(): void {
  cache.clear();
  console.log('[CoinGecko Cache] Cache cleared');
}

/**
 * Clear cached data for a specific key pattern
 */
export function clearCachePattern(pattern: string): number {
  let cleared = 0;
  for (const key of cache.keys()) {
    if (key.includes(pattern)) {
      cache.delete(key);
      cleared++;
    }
  }
  console.log(`[CoinGecko Cache] Cleared ${cleared} entries matching "${pattern}"`);
  return cleared;
}

/**
 * Get cache statistics
 */
export function getCacheStats(): {
  entries: number;
  keys: string[];
  oldestEntry: number | null;
  newestEntry: number | null;
} {
  const entries = cache.size;
  const keys = Array.from(cache.keys());

  let oldest: number | null = null;
  let newest: number | null = null;

  for (const entry of cache.values()) {
    const e = entry as CacheEntry<unknown>;
    if (oldest === null || e.fetchedAt < oldest) oldest = e.fetchedAt;
    if (newest === null || e.fetchedAt > newest) newest = e.fetchedAt;
  }

  return {
    entries,
    keys,
    oldestEntry: oldest,
    newestEntry: newest,
  };
}

/**
 * Warm up cache by pre-fetching common data
 */
export async function warmUpCache(): Promise<void> {
  console.log('[CoinGecko Cache] Warming up cache...');

  // Fetch top 200 coins (2 pages)
  await getCachedCoinsMarkets('usd', 1, 100);
  await getCachedCoinsMarkets('usd', 2, 100);

  // Fetch global data
  await getCachedGlobalData();

  console.log('[CoinGecko Cache] Cache warm-up complete');
}
