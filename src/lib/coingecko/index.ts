/**
 * CoinGecko Module (Display-Only)
 *
 * IMPORTANT: CoinGecko data is for DISPLAY-ONLY purposes.
 * Do NOT include CoinGecko data in downloads (CSV/XLSX/JSON).
 *
 * To use CoinGecko data in downloads, you need a separate
 * Data Redistribution License from CoinGecko.
 */

// Client and API methods
export {
  fetchFromCoinGecko,
  getCoinsMarkets,
  getCoinOHLC,
  getCoinMarketChart,
  getGlobalData,
  getCoinDetails,
  getRateLimitStatus,
  CACHE_TTL,
  type CoinGeckoCoin,
  type CoinGeckoOHLCV,
  type CoinGeckoGlobal,
  type CoinGeckoResponse,
} from './client';

// Cached API methods (prefer these for most use cases)
export {
  getCachedCoinsMarkets,
  getCachedCoinOHLC,
  getCachedCoinMarketChart,
  getCachedGlobalData,
  getCachedCoinDetails,
  clearCache,
  clearCachePattern,
  getCacheStats,
  warmUpCache,
  type CachedCoinData,
  type CachedOHLCData,
  type CachedMarketChartData,
  type CachedGlobalData,
  type CachedCoinDetails,
} from './cache';

// Budget management
export {
  ANALYST_PLAN,
  BUDGET_ALLOCATION,
  BUDGET_SUMMARY,
  trackCall,
  canMakeCall,
  getBudgetStatus,
  getMonthlyProjection,
  logBudgetSummary,
} from './budget';

// Display-only constant (for documentation)
export const COINGECKO_LICENSE = {
  type: 'display-only',
  attribution: 'Data by CoinGecko',
  attributionUrl: 'https://www.coingecko.com/',
  downloadAllowed: false,
  apiMirrorAllowed: false,
  uiDisplayAllowed: true,
};
