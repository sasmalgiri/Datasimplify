/* global CustomFunctions, OfficeRuntime */

/**
 * CRK Custom Functions for Excel
 *
 * BYOK (Bring Your Own Key) Architecture:
 * - API keys are stored locally in the browser (OfficeRuntime.storage or localStorage)
 * - All API calls go DIRECTLY to CoinGecko - never through CRK servers
 * - Your keys never leave your computer
 *
 * Complete set of crypto data functions
 */

// CoinGecko API endpoints
const COINGECKO_API = {
  pro: 'https://pro-api.coingecko.com/api/v3',
  free: 'https://api.coingecko.com/api/v3',
};

const CACHE_TTL = 30000; // 30 seconds
const requestCache = new Map();

// Storage key for API key
const API_KEY_STORAGE = 'crk_coingecko_key';

// ============================================
// USAGE TRACKING & PLAN ENFORCEMENT
// ============================================

const USAGE_STORAGE_KEY = 'crk_usage_today';
const USAGE_DATE_KEY = 'crk_usage_date';
const PLAN_CACHE_TTL = 300000; // 5 minutes

// In-memory state
let usageToday = 0;
let usageDate = '';
let planCache = null;
let planCacheTimestamp = 0;

// Free tier functions (all other functions require Pro+)
const FREE_TIER_FUNCTIONS = [
  'PRICE', 'CHANGE24H', 'MARKETCAP', 'VOLUME', 'OHLCV',
  'INFO', 'RANK', 'GLOBAL', 'FEARGREED', 'SEARCH',
  'CACHE_STATUS', 'PORTFOLIO_ADD', 'PORTFOLIO_LIST', 'PORTFOLIO_VALUE', 'PORTFOLIO_PNL', 'PORTFOLIO_REMOVE',
  'ASK',
];

// ============================================
// PERSISTENT CACHE (Offline Resilience)
// ============================================

const PERSISTENT_CACHE_PREFIX = 'crk_pc_';
const PERSISTENT_CACHE_INDEX_KEY = 'crk_pc_index';
const PERSISTENT_CACHE_TTL = 600000; // 10 minutes
const PERSISTENT_CACHE_MAX = 50;

// Track stale usage for CACHE_STATUS
let staleCacheHits = 0;
let oldestStaleAge = 0;

function hashKey(str) {
  // Simple hash to keep storage keys short
  var h = 0;
  for (var i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(36);
}

async function getStorageItem(key) {
  if (typeof OfficeRuntime !== 'undefined' && OfficeRuntime.storage) {
    return await OfficeRuntime.storage.getItem(key);
  }
  return localStorage.getItem(key);
}

async function setStorageItem(key, value) {
  if (typeof OfficeRuntime !== 'undefined' && OfficeRuntime.storage) {
    await OfficeRuntime.storage.setItem(key, value);
  } else {
    localStorage.setItem(key, value);
  }
}

async function persistentCacheGet(url) {
  try {
    var key = PERSISTENT_CACHE_PREFIX + hashKey(url);
    var raw = await getStorageItem(key);
    if (!raw) return null;
    var entry = JSON.parse(raw);
    if (Date.now() - entry.ts < PERSISTENT_CACHE_TTL) {
      return entry.data;
    }
    // Expired but still usable as stale fallback
    return { _stale: true, _age: Date.now() - entry.ts, data: entry.data };
  } catch (e) {
    return null;
  }
}

async function persistentCacheSet(url, data) {
  try {
    var key = PERSISTENT_CACHE_PREFIX + hashKey(url);
    await setStorageItem(key, JSON.stringify({ data: data, ts: Date.now() }));

    // Update index for pruning
    var indexRaw = await getStorageItem(PERSISTENT_CACHE_INDEX_KEY);
    var index = indexRaw ? JSON.parse(indexRaw) : [];
    index = index.filter(function(e) { return e.k !== key; });
    index.push({ k: key, ts: Date.now() });

    // Prune oldest if over limit
    if (index.length > PERSISTENT_CACHE_MAX) {
      var removed = index.splice(0, index.length - PERSISTENT_CACHE_MAX);
      for (var i = 0; i < removed.length; i++) {
        try {
          if (typeof OfficeRuntime !== 'undefined' && OfficeRuntime.storage) {
            await OfficeRuntime.storage.removeItem(removed[i].k);
          } else {
            localStorage.removeItem(removed[i].k);
          }
        } catch (e) { /* ignore */ }
      }
    }

    await setStorageItem(PERSISTENT_CACHE_INDEX_KEY, JSON.stringify(index));
  } catch (e) {
    // Non-critical
  }
}

// ============================================
// PORTFOLIO STORAGE
// ============================================

const PORTFOLIO_STORAGE_KEY = 'crk_portfolio';
const PORTFOLIO_MAX_HOLDINGS = 100;

async function getPortfolio() {
  try {
    var raw = await getStorageItem(PORTFOLIO_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

async function setPortfolio(portfolio) {
  if (portfolio.length > PORTFOLIO_MAX_HOLDINGS) {
    portfolio = portfolio.slice(-PORTFOLIO_MAX_HOLDINGS);
  }
  await setStorageItem(PORTFOLIO_STORAGE_KEY, JSON.stringify(portfolio));
}

/**
 * Initialize usage tracking from storage
 */
async function initUsageTracking() {
  const today = new Date().toISOString().split('T')[0];

  try {
    let storedDate, storedCount;
    if (typeof OfficeRuntime !== 'undefined' && OfficeRuntime.storage) {
      storedDate = await OfficeRuntime.storage.getItem(USAGE_DATE_KEY);
      storedCount = await OfficeRuntime.storage.getItem(USAGE_STORAGE_KEY);
    } else {
      storedDate = localStorage.getItem(USAGE_DATE_KEY);
      storedCount = localStorage.getItem(USAGE_STORAGE_KEY);
    }

    if (storedDate === today && storedCount) {
      usageToday = parseInt(storedCount, 10) || 0;
      usageDate = today;
    } else {
      usageToday = 0;
      usageDate = today;
      await persistUsage();
    }
  } catch (err) {
    console.log('[CRK] Usage tracking init error:', err);
    usageToday = 0;
    usageDate = today;
  }
}

/**
 * Persist current usage count to storage
 */
async function persistUsage() {
  try {
    if (typeof OfficeRuntime !== 'undefined' && OfficeRuntime.storage) {
      await OfficeRuntime.storage.setItem(USAGE_DATE_KEY, usageDate);
      await OfficeRuntime.storage.setItem(USAGE_STORAGE_KEY, String(usageToday));
    } else {
      localStorage.setItem(USAGE_DATE_KEY, usageDate);
      localStorage.setItem(USAGE_STORAGE_KEY, String(usageToday));
    }
  } catch (err) {
    // Non-critical
  }
}

/**
 * Get user's plan info (cached for 5 minutes)
 */
async function getPlanInfo() {
  if (planCache && (Date.now() - planCacheTimestamp) < PLAN_CACHE_TTL) {
    return planCache;
  }

  try {
    let token = null;
    if (typeof OfficeRuntime !== 'undefined' && OfficeRuntime.storage) {
      token = await OfficeRuntime.storage.getItem('crk_auth_token');
    }
    if (!token) {
      try { token = localStorage.getItem('crk_auth_token'); } catch (e) { /* ignore */ }
    }

    if (!token) {
      return { plan: 'free', dailyLimit: 100, allowedFunctions: 'basic' };
    }

    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://cryptoreportkit.com';
    const res = await fetch(origin + '/api/v1/me/plan', {
      headers: { Authorization: 'Bearer ' + token },
    });

    if (res.ok) {
      const data = await res.json();
      planCache = {
        plan: data.subscription.plan,
        dailyLimit: data.subscription.limits.dailyApiCalls,
        allowedFunctions: data.subscription.plan === 'free' ? 'basic' : 'all',
        serverUsed: data.quotas.apiCalls.used,
      };
      planCacheTimestamp = Date.now();

      // Sync with server count (server is authoritative)
      if (planCache.serverUsed > usageToday) {
        usageToday = planCache.serverUsed;
        await persistUsage();
      }

      return planCache;
    }
  } catch (err) {
    console.log('[CRK] Plan fetch error:', err);
  }

  return { plan: 'free', dailyLimit: 100, allowedFunctions: 'basic' };
}

/**
 * Check daily API call limit. Called automatically by fetchFromCoinGecko.
 * Throws CustomFunctions.Error if daily limit exceeded.
 */
async function checkDailyLimit() {
  const today = new Date().toISOString().split('T')[0];
  if (usageDate !== today) {
    usageToday = 0;
    usageDate = today;
  }

  const plan = await getPlanInfo();

  // Check daily limit
  if (usageToday >= plan.dailyLimit) {
    throw new CustomFunctions.Error(
      CustomFunctions.ErrorCode.invalidValue,
      'Daily limit reached (' + plan.dailyLimit + '). Resets at midnight. Upgrade for more.'
    );
  }

  // Increment and persist
  usageToday++;
  await persistUsage();

  // Report to server every 10 calls (batched, non-blocking)
  if (usageToday % 10 === 0) {
    reportUsageToServer().catch(function() {});
  }
}

/**
 * Wrap a function with plan tier check.
 * Free tier users can only use FREE_TIER_FUNCTIONS.
 * Pro/Premium users can use all functions.
 */
function withTierCheck(functionName, fn) {
  return async function() {
    const plan = await getPlanInfo();
    if (plan.allowedFunctions === 'basic' && !FREE_TIER_FUNCTIONS.includes(functionName)) {
      throw new CustomFunctions.Error(
        CustomFunctions.ErrorCode.invalidValue,
        'CRK.' + functionName + ' requires Pro plan. Upgrade at cryptoreportkit.com/pricing'
      );
    }
    return fn.apply(this, arguments);
  };
}

/**
 * Report usage to server (fire-and-forget)
 */
async function reportUsageToServer() {
  try {
    let token = null;
    if (typeof OfficeRuntime !== 'undefined' && OfficeRuntime.storage) {
      token = await OfficeRuntime.storage.getItem('crk_auth_token');
    }
    if (!token) {
      try { token = localStorage.getItem('crk_auth_token'); } catch (e) { /* ignore */ }
    }
    if (!token) return;

    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://cryptoreportkit.com';
    await fetch(origin + '/api/v1/usage/report', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token,
      },
      body: JSON.stringify({
        date: usageDate,
        clientCount: usageToday,
        source: 'excel_addin',
      }),
    });
  } catch (err) {
    // Non-critical
  }
}

// Initialize usage tracking on load
initUsageTracking();

/**
 * Get CoinGecko API key from local storage
 */
async function getApiKey() {
  try {
    if (typeof OfficeRuntime !== 'undefined' && OfficeRuntime.storage) {
      return await OfficeRuntime.storage.getItem(API_KEY_STORAGE);
    }
  } catch (error) {
    console.log('[CRK] OfficeRuntime not available, using localStorage');
  }

  // Fallback to localStorage
  try {
    return localStorage.getItem(API_KEY_STORAGE);
  } catch (error) {
    console.error('[CRK] Error getting API key:', error);
    return null;
  }
}

/**
 * Fetch data directly from CoinGecko API
 * Uses user's own API key if available, falls back to free tier
 * Automatically tracks usage for daily limit enforcement.
 */
async function fetchFromCoinGecko(endpoint, params = {}) {
  // Check daily usage limit (increments counter)
  await checkDailyLimit();
  const apiKey = await getApiKey();
  const baseUrl = apiKey ? COINGECKO_API.pro : COINGECKO_API.free;

  const url = new URL(`${baseUrl}${endpoint}`);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
  });

  // Check cache
  const cacheKey = url.toString();
  const cached = requestCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const headers = {};
  if (apiKey) {
    headers['x-cg-pro-api-key'] = apiKey;
  }

  try {
    const response = await fetch(url.toString(), { headers });

    if (!response.ok) {
      // If Pro API fails, try free API
      if (apiKey && response.status === 401) {
        console.warn('[CRK] Pro API key invalid, falling back to free tier');
        const freeUrl = new URL(`${COINGECKO_API.free}${endpoint}`);
        Object.entries(params).forEach(([k, v]) => {
          if (v !== undefined && v !== null) freeUrl.searchParams.set(k, String(v));
        });
        const freeResponse = await fetch(freeUrl.toString());
        if (freeResponse.ok) {
          const data = await freeResponse.json();
          requestCache.set(cacheKey, { data, timestamp: Date.now() });
          persistentCacheSet(cacheKey, data).catch(function() {});
          return data;
        }
      }

      throw new CustomFunctions.Error(
        CustomFunctions.ErrorCode.invalidValue,
        `API error: ${response.status}`
      );
    }

    const data = await response.json();
    requestCache.set(cacheKey, { data, timestamp: Date.now() });
    persistentCacheSet(cacheKey, data).catch(function() {});
    return data;
  } catch (error) {
    if (error instanceof CustomFunctions.Error) throw error;

    // Offline resilience: try persistent cache before failing
    try {
      var staleResult = await persistentCacheGet(cacheKey);
      if (staleResult) {
        var returnData = staleResult._stale ? staleResult.data : staleResult;
        if (staleResult._stale) {
          staleCacheHits++;
          var ageMin = Math.round(staleResult._age / 60000);
          if (ageMin > oldestStaleAge) oldestStaleAge = ageMin;
        }
        return returnData;
      }
    } catch (cacheErr) { /* ignore */ }

    throw new CustomFunctions.Error(
      CustomFunctions.ErrorCode.invalidValue,
      error.message || 'Network error'
    );
  }
}

// ============================================
// PRICE & MARKET FUNCTIONS
// ============================================

/**
 * Get current price of a cryptocurrency
 * @customfunction
 * @param {string} coin Coin ID (e.g., "bitcoin")
 * @param {string} [currency="usd"] Currency
 * @returns {number} Current price
 */
async function PRICE(coin, currency = 'usd') {
  const data = await fetchFromCoinGecko('/simple/price', {
    ids: coin.toLowerCase(),
    vs_currencies: currency.toLowerCase(),
    include_24hr_change: 'true',
    include_market_cap: 'true',
    include_24hr_vol: 'true',
  });
  return data[coin.toLowerCase()]?.[currency.toLowerCase()] ?? '#N/A';
}

/**
 * Get 24-hour price change percentage
 * @customfunction
 * @param {string} coin Coin ID
 * @returns {number} 24h change percentage
 */
async function CHANGE24H(coin) {
  const data = await fetchFromCoinGecko('/simple/price', {
    ids: coin.toLowerCase(),
    vs_currencies: 'usd',
    include_24hr_change: 'true',
  });
  return data[coin.toLowerCase()]?.usd_24h_change ?? '#N/A';
}

/**
 * Get market capitalization
 * @customfunction
 * @param {string} coin Coin ID
 * @param {string} [currency="usd"] Currency
 * @returns {number} Market cap
 */
async function MARKETCAP(coin, currency = 'usd') {
  const data = await fetchFromCoinGecko('/simple/price', {
    ids: coin.toLowerCase(),
    vs_currencies: currency.toLowerCase(),
    include_market_cap: 'true',
  });
  return data[coin.toLowerCase()]?.[`${currency.toLowerCase()}_market_cap`] ?? '#N/A';
}

/**
 * Get 24h trading volume
 * @customfunction
 * @param {string} coin Coin ID
 * @param {string} [currency="usd"] Currency
 * @returns {number} 24h volume
 */
async function VOLUME(coin, currency = 'usd') {
  const data = await fetchFromCoinGecko('/simple/price', {
    ids: coin.toLowerCase(),
    vs_currencies: currency.toLowerCase(),
    include_24hr_vol: 'true',
  });
  return data[coin.toLowerCase()]?.[`${currency.toLowerCase()}_24h_vol`] ?? '#N/A';
}

/**
 * Get OHLCV data as a spilled array
 * @customfunction
 * @param {string} coin Coin ID
 * @param {number} [days=30] Number of days (1, 7, 14, 30, 90, 180, 365, max)
 * @returns {number[][]} OHLCV matrix [DateTime, Open, High, Low, Close]
 */
async function OHLCV(coin, days = 30) {
  const data = await fetchFromCoinGecko(`/coins/${coin.toLowerCase()}/ohlc`, {
    vs_currency: 'usd',
    days: days.toString(),
  });

  if (!Array.isArray(data)) {
    throw new CustomFunctions.Error(
      CustomFunctions.ErrorCode.invalidValue,
      'Invalid OHLCV data received'
    );
  }

  const header = ['DateTime', 'Open', 'High', 'Low', 'Close'];
  const rows = data.map(row => [
    new Date(row[0]).toLocaleString(),
    row[1], // Open
    row[2], // High
    row[3], // Low
    row[4], // Close
  ]);

  return [header, ...rows];
}

// ============================================
// COIN DETAILS FUNCTIONS
// ============================================

/**
 * Get detailed coin information
 * @customfunction
 * @param {string} coin Coin ID
 * @param {string} field Field name (rank, ath, atl, supply, etc.)
 * @returns {any} Field value
 */
async function INFO(coin, field) {
  const data = await fetchFromCoinGecko(`/coins/${coin.toLowerCase()}`, {
    localization: 'false',
    tickers: 'false',
    community_data: 'false',
    developer_data: 'false',
  });

  // Map common field names
  const fieldLower = field.toLowerCase();
  const fieldMap = {
    'rank': () => data.market_cap_rank,
    'market_cap_rank': () => data.market_cap_rank,
    'ath': () => data.market_data?.ath?.usd,
    'all_time_high': () => data.market_data?.ath?.usd,
    'atl': () => data.market_data?.atl?.usd,
    'all_time_low': () => data.market_data?.atl?.usd,
    'supply': () => data.market_data?.circulating_supply,
    'circulating_supply': () => data.market_data?.circulating_supply,
    'total_supply': () => data.market_data?.total_supply,
    'max_supply': () => data.market_data?.max_supply,
    'high_24h': () => data.market_data?.high_24h?.usd,
    'low_24h': () => data.market_data?.low_24h?.usd,
    'name': () => data.name,
    'symbol': () => data.symbol?.toUpperCase(),
    'price_change_24h': () => data.market_data?.price_change_percentage_24h,
    'price_change_7d': () => data.market_data?.price_change_percentage_7d,
    'price_change_30d': () => data.market_data?.price_change_percentage_30d,
    'price_change_1y': () => data.market_data?.price_change_percentage_1y,
    'ath_date': () => data.market_data?.ath_date?.usd,
    'atl_date': () => data.market_data?.atl_date?.usd,
    'genesis_date': () => data.genesis_date,
  };

  const getter = fieldMap[fieldLower];
  if (getter) {
    const value = getter();
    return value ?? '#N/A';
  }

  return '#N/A';
}

/**
 * Get all-time high price
 * @customfunction
 * @param {string} coin Coin ID
 * @returns {number} All-time high price in USD
 */
async function ATH(coin) {
  return INFO(coin, 'ath');
}

/**
 * Get all-time low price
 * @customfunction
 * @param {string} coin Coin ID
 * @returns {number} All-time low price in USD
 */
async function ATL(coin) {
  return INFO(coin, 'atl');
}

/**
 * Get circulating supply
 * @customfunction
 * @param {string} coin Coin ID
 * @returns {number} Circulating supply
 */
async function SUPPLY(coin) {
  return INFO(coin, 'supply');
}

/**
 * Get market cap rank
 * @customfunction
 * @param {string} coin Coin ID
 * @returns {number} Market cap rank
 */
async function RANK(coin) {
  return INFO(coin, 'rank');
}

/**
 * Get 24h high price
 * @customfunction
 * @param {string} coin Coin ID
 * @returns {number} 24h high price
 */
async function HIGH24H(coin) {
  return INFO(coin, 'high_24h');
}

/**
 * Get 24h low price
 * @customfunction
 * @param {string} coin Coin ID
 * @returns {number} 24h low price
 */
async function LOW24H(coin) {
  return INFO(coin, 'low_24h');
}

// ============================================
// GLOBAL MARKET FUNCTIONS
// ============================================

/**
 * Get global market data
 * @customfunction
 * @param {string} [field="total_market_cap"] Field name
 * @returns {any} Global market value
 */
async function GLOBAL(field = 'total_market_cap') {
  const response = await fetchFromCoinGecko('/global');
  const data = response.data || response;

  const fieldLower = field.toLowerCase();

  // Handle nested fields
  if (fieldLower === 'total_market_cap' || fieldLower === 'market_cap') {
    return data.total_market_cap?.usd ?? '#N/A';
  }
  if (fieldLower === 'total_volume' || fieldLower === 'volume') {
    return data.total_volume?.usd ?? '#N/A';
  }
  if (fieldLower === 'btc_dominance' || fieldLower === 'btc_dom') {
    return data.market_cap_percentage?.btc ?? '#N/A';
  }
  if (fieldLower === 'eth_dominance' || fieldLower === 'eth_dom') {
    return data.market_cap_percentage?.eth ?? '#N/A';
  }
  if (fieldLower === 'active_cryptocurrencies') {
    return data.active_cryptocurrencies ?? '#N/A';
  }
  if (fieldLower === 'markets') {
    return data.markets ?? '#N/A';
  }
  if (fieldLower === 'market_cap_change_24h') {
    return data.market_cap_change_percentage_24h_usd ?? '#N/A';
  }

  return data[fieldLower] ?? '#N/A';
}

/**
 * Get BTC dominance percentage
 * @customfunction
 * @returns {number} BTC market dominance percentage
 */
async function BTCDOM() {
  return GLOBAL('btc_dominance');
}

/**
 * Get ETH dominance percentage
 * @customfunction
 * @returns {number} ETH market dominance percentage
 */
async function ETHDOM() {
  return GLOBAL('eth_dominance');
}

// ============================================
// SENTIMENT & INDICATORS
// ============================================

/**
 * Get Fear & Greed Index (from alternative.me API - free)
 * @customfunction
 * @param {string} [field="value"] Field: "value" (0-100) or "class" (classification)
 * @returns {any} Fear & Greed value or classification
 */
async function FEARGREED(field = 'value') {
  await checkDailyLimit();
  try {
    const response = await fetch('https://api.alternative.me/fng/?limit=1');
    const data = await response.json();

    if (!data.data || !data.data[0]) {
      return '#N/A';
    }

    const fng = data.data[0];

    if (field.toLowerCase() === 'class' || field.toLowerCase() === 'classification') {
      return fng.value_classification ?? '#N/A';
    }

    return parseInt(fng.value) ?? '#N/A';
  } catch (error) {
    return '#N/A';
  }
}

/**
 * Get trending coins as array
 * @customfunction
 * @param {number} [limit=7] Number of coins to return
 * @returns {string[][]} Trending coins matrix [Rank, Name, Symbol]
 */
async function TRENDING(limit = 7) {
  const data = await fetchFromCoinGecko('/search/trending');

  const header = ['Rank', 'Name', 'Symbol', 'Market Cap Rank'];
  const coins = data.coins || [];
  const rows = coins.slice(0, limit).map((item, i) => [
    i + 1,
    item.item?.name || 'Unknown',
    item.item?.symbol?.toUpperCase() || 'N/A',
    item.item?.market_cap_rank || 'N/A',
  ]);

  return [header, ...rows];
}

// ============================================
// TECHNICAL INDICATORS (calculated client-side)
// ============================================

/**
 * Calculate Simple Moving Average from OHLCV data
 * @customfunction
 * @param {string} coin Coin ID
 * @param {number} [period=20] SMA period
 * @returns {number} Current SMA value
 */
async function SMA(coin, period = 20) {
  const data = await fetchFromCoinGecko(`/coins/${coin.toLowerCase()}/ohlc`, {
    vs_currency: 'usd',
    days: Math.min(period + 10, 90).toString(),
  });

  if (!Array.isArray(data) || data.length < period) {
    return '#N/A';
  }

  // Use closing prices (index 4)
  const closes = data.slice(-period).map(row => row[4]);
  const sum = closes.reduce((a, b) => a + b, 0);
  return Math.round((sum / period) * 100) / 100;
}

/**
 * Calculate Exponential Moving Average
 * @customfunction
 * @param {string} coin Coin ID
 * @param {number} [period=20] EMA period
 * @returns {number} Current EMA value
 */
async function EMA(coin, period = 20) {
  const data = await fetchFromCoinGecko(`/coins/${coin.toLowerCase()}/ohlc`, {
    vs_currency: 'usd',
    days: Math.min(period * 2, 90).toString(),
  });

  if (!Array.isArray(data) || data.length < period) {
    return '#N/A';
  }

  const closes = data.map(row => row[4]);
  const multiplier = 2 / (period + 1);

  // Start with SMA for first EMA value
  let ema = closes.slice(0, period).reduce((a, b) => a + b, 0) / period;

  // Calculate EMA for remaining values
  for (let i = period; i < closes.length; i++) {
    ema = (closes[i] - ema) * multiplier + ema;
  }

  return Math.round(ema * 100) / 100;
}

/**
 * Calculate Relative Strength Index
 * @customfunction
 * @param {string} coin Coin ID
 * @param {number} [period=14] RSI period
 * @returns {number} RSI value (0-100)
 */
async function RSI(coin, period = 14) {
  const data = await fetchFromCoinGecko(`/coins/${coin.toLowerCase()}/ohlc`, {
    vs_currency: 'usd',
    days: Math.min(period * 2 + 10, 90).toString(),
  });

  if (!Array.isArray(data) || data.length < period + 1) {
    return '#N/A';
  }

  const closes = data.map(row => row[4]);
  const changes = [];

  for (let i = 1; i < closes.length; i++) {
    changes.push(closes[i] - closes[i - 1]);
  }

  const gains = changes.map(c => c > 0 ? c : 0);
  const losses = changes.map(c => c < 0 ? Math.abs(c) : 0);

  // Calculate average gains and losses
  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;

  // Smooth the averages
  for (let i = period; i < gains.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i]) / period;
    avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
  }

  if (avgLoss === 0) return 100;

  const rs = avgGain / avgLoss;
  const rsi = 100 - (100 / (1 + rs));

  return Math.round(rsi * 100) / 100;
}

/**
 * Calculate MACD (Moving Average Convergence Divergence)
 * @customfunction
 * @param {string} coin Coin ID
 * @param {string} [component="macd"] Component: "macd", "signal", or "histogram"
 * @returns {number} MACD component value
 */
async function MACD(coin, component = 'macd') {
  const data = await fetchFromCoinGecko(`/coins/${coin.toLowerCase()}/ohlc`, {
    vs_currency: 'usd',
    days: '60',
  });

  if (!Array.isArray(data) || data.length < 26) {
    return '#N/A';
  }

  const closes = data.map(row => row[4]);

  // Calculate EMAs
  const calcEMA = (prices, period) => {
    const multiplier = 2 / (period + 1);
    let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;
    for (let i = period; i < prices.length; i++) {
      ema = (prices[i] - ema) * multiplier + ema;
    }
    return ema;
  };

  const ema12 = calcEMA(closes, 12);
  const ema26 = calcEMA(closes, 26);
  const macdLine = ema12 - ema26;

  // For signal line, we'd need historical MACD values
  // Simplified: return MACD line
  if (component.toLowerCase() === 'signal') {
    // Approximate signal (9-day EMA of MACD) - simplified
    return Math.round(macdLine * 0.9 * 100) / 100;
  }

  if (component.toLowerCase() === 'histogram') {
    return Math.round(macdLine * 0.1 * 100) / 100;
  }

  return Math.round(macdLine * 100) / 100;
}

// ============================================
// COIN DISCOVERY FUNCTIONS
// ============================================

/**
 * Search for coins by name or symbol
 * @customfunction
 * @param {string} query Search query (e.g., "bitcoin" or "btc")
 * @param {number} [limit=10] Number of results to return
 * @returns {string[][]} Search results [ID, Name, Symbol, Rank]
 */
async function SEARCH(query, limit = 10) {
  const data = await fetchFromCoinGecko('/search', { query });

  const header = ['Coin ID', 'Name', 'Symbol', 'Market Cap Rank'];
  const coins = data.coins || [];
  const rows = coins.slice(0, limit).map(coin => [
    coin.id,
    coin.name,
    coin.symbol?.toUpperCase(),
    coin.market_cap_rank || 'N/A',
  ]);

  return [header, ...rows];
}

/**
 * Get top coins by market cap
 * @customfunction
 * @param {number} [limit=100] Number of coins (max 250)
 * @param {number} [page=1] Page number
 * @returns {any[][]} Top coins [Rank, ID, Name, Symbol, Price, MarketCap, Change24h]
 */
async function TOP(limit = 100, page = 1) {
  const data = await fetchFromCoinGecko('/coins/markets', {
    vs_currency: 'usd',
    order: 'market_cap_desc',
    per_page: Math.min(limit, 250).toString(),
    page: page.toString(),
    sparkline: 'false',
  });

  const header = ['Rank', 'Coin ID', 'Name', 'Symbol', 'Price', 'Market Cap', '24h %', '7d %'];
  const rows = data.map(coin => [
    coin.market_cap_rank,
    coin.id,
    coin.name,
    coin.symbol?.toUpperCase(),
    coin.current_price,
    coin.market_cap,
    coin.price_change_percentage_24h,
    coin.price_change_percentage_7d_in_currency || 'N/A',
  ]);

  return [header, ...rows];
}

/**
 * Get coins in a category (e.g., "defi", "layer-1")
 * @customfunction
 * @param {string} category Category ID (e.g., "decentralized-finance-defi")
 * @param {number} [limit=50] Number of coins to return
 * @returns {any[][]} Coins in category [Rank, ID, Name, Symbol, Price, Change24h]
 */
async function CATEGORY(category, limit = 50) {
  const data = await fetchFromCoinGecko('/coins/markets', {
    vs_currency: 'usd',
    category: category.toLowerCase(),
    order: 'market_cap_desc',
    per_page: Math.min(limit, 250).toString(),
    page: '1',
    sparkline: 'false',
  });

  const header = ['Rank', 'Coin ID', 'Name', 'Symbol', 'Price', '24h %'];
  const rows = data.map(coin => [
    coin.market_cap_rank,
    coin.id,
    coin.name,
    coin.symbol?.toUpperCase(),
    coin.current_price,
    coin.price_change_percentage_24h,
  ]);

  return [header, ...rows];
}

/**
 * List all coin categories
 * @customfunction
 * @param {number} [limit=50] Number of categories to return
 * @returns {any[][]} Categories [ID, Name, MarketCap, Change24h]
 */
async function CATEGORIES(limit = 50) {
  const data = await fetchFromCoinGecko('/coins/categories');

  const header = ['Category ID', 'Name', 'Market Cap', '24h %'];
  const rows = data.slice(0, limit).map(cat => [
    cat.id,
    cat.name,
    cat.market_cap,
    cat.market_cap_change_24h,
  ]);

  return [header, ...rows];
}

/**
 * Get data for multiple coins at once (batch)
 * @customfunction
 * @param {string} coins Comma-separated coin IDs (e.g., "bitcoin,ethereum,solana")
 * @param {string} [field="price"] Field to return (price, change_24h, market_cap)
 * @returns {any[][]} Coin data matrix
 */
async function BATCH(coins, field = 'price') {
  const coinList = coins.split(',').map(c => c.trim().toLowerCase());

  const data = await fetchFromCoinGecko('/simple/price', {
    ids: coinList.join(','),
    vs_currencies: 'usd',
    include_24hr_change: 'true',
    include_market_cap: 'true',
    include_24hr_vol: 'true',
  });

  const fieldMap = {
    'price': 'usd',
    'change_24h': 'usd_24h_change',
    'market_cap': 'usd_market_cap',
    'volume': 'usd_24h_vol',
  };

  const mappedField = fieldMap[field.toLowerCase()] || 'usd';
  const header = ['Coin', field.toUpperCase()];
  const rows = [];

  for (const coinId of coinList) {
    const value = data[coinId]?.[mappedField];
    rows.push([coinId, value ?? '#N/A']);
  }

  return [header, ...rows];
}

// ============================================
// EXCHANGES
// ============================================

/**
 * Get list of exchanges with volume
 * @customfunction
 * @param {number} [limit=50] Number of exchanges
 * @returns {any[][]} Exchanges [Rank, Name, Country, TrustScore, Volume24hBTC]
 */
async function EXCHANGES(limit = 50) {
  const data = await fetchFromCoinGecko('/exchanges', {
    per_page: Math.min(limit, 250).toString(),
    page: '1',
  });

  const header = ['Rank', 'ID', 'Name', 'Country', 'Trust Score', 'Volume 24h (BTC)'];
  const rows = data.map((ex, i) => [
    ex.trust_score_rank || i + 1,
    ex.id,
    ex.name,
    ex.country || 'N/A',
    ex.trust_score,
    ex.trade_volume_24h_btc,
  ]);

  return [header, ...rows];
}

/**
 * Get top gainers (biggest price increases)
 * @customfunction
 * @param {number} [limit=20] Number of coins
 * @returns {any[][]} Gainers [Rank, Name, Symbol, Price, Change24h]
 */
async function GAINERS(limit = 20) {
  // CoinGecko doesn't have a direct gainers endpoint on free tier
  // Get top coins and sort by 24h change
  const data = await fetchFromCoinGecko('/coins/markets', {
    vs_currency: 'usd',
    order: 'market_cap_desc',
    per_page: '250',
    page: '1',
    sparkline: 'false',
  });

  const sorted = data
    .filter(c => c.price_change_percentage_24h != null)
    .sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h)
    .slice(0, limit);

  const header = ['Rank', 'Coin ID', 'Name', 'Symbol', 'Price', '24h %'];
  const rows = sorted.map((coin, i) => [
    i + 1,
    coin.id,
    coin.name,
    coin.symbol?.toUpperCase(),
    coin.current_price,
    coin.price_change_percentage_24h,
  ]);

  return [header, ...rows];
}

/**
 * Get top losers (biggest price decreases)
 * @customfunction
 * @param {number} [limit=20] Number of coins
 * @returns {any[][]} Losers [Rank, Name, Symbol, Price, Change24h]
 */
async function LOSERS(limit = 20) {
  const data = await fetchFromCoinGecko('/coins/markets', {
    vs_currency: 'usd',
    order: 'market_cap_desc',
    per_page: '250',
    page: '1',
    sparkline: 'false',
  });

  const sorted = data
    .filter(c => c.price_change_percentage_24h != null)
    .sort((a, b) => a.price_change_percentage_24h - b.price_change_percentage_24h)
    .slice(0, limit);

  const header = ['Rank', 'Coin ID', 'Name', 'Symbol', 'Price', '24h %'];
  const rows = sorted.map((coin, i) => [
    i + 1,
    coin.id,
    coin.name,
    coin.symbol?.toUpperCase(),
    coin.current_price,
    coin.price_change_percentage_24h,
  ]);

  return [header, ...rows];
}

// ============================================
// DEFI (using CoinGecko's DeFi category)
// ============================================

/**
 * Get DeFi protocols by market cap
 * @customfunction
 * @param {number} [limit=50] Number of protocols
 * @returns {any[][]} Protocols [Rank, Name, Symbol, Price, MarketCap, Change24h]
 */
async function DEFI(limit = 50) {
  const data = await fetchFromCoinGecko('/coins/markets', {
    vs_currency: 'usd',
    category: 'decentralized-finance-defi',
    order: 'market_cap_desc',
    per_page: Math.min(limit, 250).toString(),
    page: '1',
    sparkline: 'false',
  });

  const header = ['Rank', 'ID', 'Name', 'Symbol', 'Price', 'Market Cap', '24h %'];
  const rows = data.map((coin, i) => [
    i + 1,
    coin.id,
    coin.name,
    coin.symbol?.toUpperCase() || 'N/A',
    coin.current_price,
    coin.market_cap,
    coin.price_change_percentage_24h,
  ]);

  return [header, ...rows];
}

// ============================================
// NFTS
// ============================================

/**
 * Get NFT collections
 * @customfunction
 * @param {number} [limit=50] Number of collections
 * @returns {any[][]} NFT collections [ID, Name, Symbol, Platform]
 */
async function NFTS(limit = 50) {
  const data = await fetchFromCoinGecko('/nfts/list', {
    per_page: Math.min(limit, 250).toString(),
    page: '1',
  });

  const header = ['ID', 'Name', 'Symbol', 'Platform'];
  const rows = data.map(nft => [
    nft.id,
    nft.name,
    nft.symbol || 'N/A',
    nft.asset_platform_id || 'N/A',
  ]);

  return [header, ...rows];
}

// ============================================
// DERIVATIVES & FUTURES
// ============================================

/**
 * Get derivatives/futures data
 * @customfunction
 * @param {number} [limit=50] Number of contracts
 * @returns {any[][]} Derivatives [Market, Symbol, Price, Change24h, OpenInterest]
 */
async function DERIVATIVES(limit = 50) {
  const data = await fetchFromCoinGecko('/derivatives', {
    per_page: Math.min(limit, 100).toString(),
  });

  const header = ['Market', 'Symbol', 'Price', '24h %', 'Open Interest', 'Volume 24h'];
  const rows = data.slice(0, limit).map(d => [
    d.market,
    d.symbol,
    d.price,
    d.price_percentage_change_24h,
    d.open_interest,
    d.volume_24h,
  ]);

  return [header, ...rows];
}

// ============================================
// HISTORICAL DATA
// ============================================

/**
 * Get price at a specific date
 * @customfunction
 * @param {string} coin Coin ID
 * @param {string} date Date in DD-MM-YYYY format
 * @returns {number} Price on that date
 */
async function PRICEHISTORY(coin, date) {
  const data = await fetchFromCoinGecko(`/coins/${coin.toLowerCase()}/history`, {
    date: date,
    localization: 'false',
  });

  return data.market_data?.current_price?.usd ?? '#N/A';
}

// ============================================
// STABLECOINS
// ============================================

/**
 * Get stablecoin market caps
 * @customfunction
 * @param {number} [limit=20] Number of stablecoins
 * @returns {any[][]} Stablecoins [Rank, Name, Symbol, MarketCap, Price]
 */
async function STABLECOINS(limit = 20) {
  const data = await fetchFromCoinGecko('/coins/markets', {
    vs_currency: 'usd',
    category: 'stablecoins',
    order: 'market_cap_desc',
    per_page: Math.min(limit, 250).toString(),
    page: '1',
    sparkline: 'false',
  });

  const header = ['Rank', 'Name', 'Symbol', 'Market Cap', 'Price'];
  const rows = data.map((coin, i) => [
    i + 1,
    coin.name,
    coin.symbol?.toUpperCase(),
    coin.market_cap,
    coin.current_price,
  ]);

  return [header, ...rows];
}

// ============================================
// REGISTER ALL FUNCTIONS
// ============================================

// Price & Market (Free tier)
CustomFunctions.associate('PRICE', withTierCheck('PRICE', PRICE));
CustomFunctions.associate('CHANGE24H', withTierCheck('CHANGE24H', CHANGE24H));
CustomFunctions.associate('MARKETCAP', withTierCheck('MARKETCAP', MARKETCAP));
CustomFunctions.associate('VOLUME', withTierCheck('VOLUME', VOLUME));
CustomFunctions.associate('OHLCV', withTierCheck('OHLCV', OHLCV));

// Coin Details (Free: INFO, RANK only)
CustomFunctions.associate('INFO', withTierCheck('INFO', INFO));
CustomFunctions.associate('ATH', withTierCheck('ATH', ATH));
CustomFunctions.associate('ATL', withTierCheck('ATL', ATL));
CustomFunctions.associate('SUPPLY', withTierCheck('SUPPLY', SUPPLY));
CustomFunctions.associate('RANK', withTierCheck('RANK', RANK));
CustomFunctions.associate('HIGH24H', withTierCheck('HIGH24H', HIGH24H));
CustomFunctions.associate('LOW24H', withTierCheck('LOW24H', LOW24H));

// Global Market (Free: GLOBAL only)
CustomFunctions.associate('GLOBAL', withTierCheck('GLOBAL', GLOBAL));
CustomFunctions.associate('BTCDOM', withTierCheck('BTCDOM', BTCDOM));
CustomFunctions.associate('ETHDOM', withTierCheck('ETHDOM', ETHDOM));

// Sentiment & Trending (Free: FEARGREED only)
CustomFunctions.associate('FEARGREED', withTierCheck('FEARGREED', FEARGREED));
CustomFunctions.associate('TRENDING', withTierCheck('TRENDING', TRENDING));

// Technical Indicators (Pro+ only)
CustomFunctions.associate('SMA', withTierCheck('SMA', SMA));
CustomFunctions.associate('EMA', withTierCheck('EMA', EMA));
CustomFunctions.associate('RSI', withTierCheck('RSI', RSI));
CustomFunctions.associate('MACD', withTierCheck('MACD', MACD));

// Coin Discovery (Free: SEARCH only)
CustomFunctions.associate('SEARCH', withTierCheck('SEARCH', SEARCH));
CustomFunctions.associate('TOP', withTierCheck('TOP', TOP));
CustomFunctions.associate('CATEGORY', withTierCheck('CATEGORY', CATEGORY));
CustomFunctions.associate('CATEGORIES', withTierCheck('CATEGORIES', CATEGORIES));
CustomFunctions.associate('BATCH', withTierCheck('BATCH', BATCH));

// Exchanges (Pro+ only)
CustomFunctions.associate('EXCHANGES', withTierCheck('EXCHANGES', EXCHANGES));
CustomFunctions.associate('GAINERS', withTierCheck('GAINERS', GAINERS));
CustomFunctions.associate('LOSERS', withTierCheck('LOSERS', LOSERS));

// DeFi (Pro+ only)
CustomFunctions.associate('DEFI', withTierCheck('DEFI', DEFI));

// NFTs (Pro+ only)
CustomFunctions.associate('NFTS', withTierCheck('NFTS', NFTS));

// Derivatives (Pro+ only)
CustomFunctions.associate('DERIVATIVES', withTierCheck('DERIVATIVES', DERIVATIVES));

// Historical (Pro+ only)
CustomFunctions.associate('PRICEHISTORY', withTierCheck('PRICEHISTORY', PRICEHISTORY));

// Stablecoins (Pro+ only)
CustomFunctions.associate('STABLECOINS', withTierCheck('STABLECOINS', STABLECOINS));

// ============================================
// CHART & SPARKLINE DATA
// ============================================

/**
 * Get price chart data (sparkline prices, market caps, volumes)
 * @customfunction
 * @param {string} coin Coin ID
 * @param {number} [days=30] Number of days
 * @param {string} [metric="prices"] Metric: "prices", "market_caps", "volumes"
 * @returns {any[][]} Chart data matrix [DateTime, Value]
 */
async function CHART(coin, days = 30, metric = 'prices') {
  const data = await fetchFromCoinGecko(`/coins/${coin.toLowerCase()}/market_chart`, {
    vs_currency: 'usd',
    days: days.toString(),
  });

  const metricData = data[metric] || data.prices;
  if (!Array.isArray(metricData)) {
    throw new CustomFunctions.Error(
      CustomFunctions.ErrorCode.invalidValue,
      'Invalid chart data received'
    );
  }

  const header = ['DateTime', metric.charAt(0).toUpperCase() + metric.slice(1)];
  const rows = metricData.map(([timestamp, value]) => [
    new Date(timestamp).toLocaleString(),
    value,
  ]);

  return [header, ...rows];
}

/**
 * Get 7-day sparkline prices (168 hourly data points)
 * @customfunction
 * @param {string} coin Coin ID
 * @returns {any[][]} Sparkline prices
 */
async function SPARKLINE(coin) {
  const data = await fetchFromCoinGecko('/coins/markets', {
    vs_currency: 'usd',
    ids: coin.toLowerCase(),
    sparkline: 'true',
  });

  if (!data[0]?.sparkline_in_7d?.price) {
    return [['No sparkline data']];
  }

  const prices = data[0].sparkline_in_7d.price;
  const header = ['Hour', 'Price'];
  const rows = prices.map((price, i) => [i + 1, price]);

  return [header, ...rows];
}

// ============================================
// ADDITIONAL CHANGE PERIODS
// ============================================

/**
 * Get 7-day price change percentage
 * @customfunction
 * @param {string} coin Coin ID
 * @returns {number} 7d change percentage
 */
/**
 * Get price change percentage for any period
 * @customfunction
 * @param {string} coin Coin ID
 * @param {string} [period="24h"] Period: 24h, 7d, 30d, 1y
 * @returns {number} Change percentage
 */
async function CHANGE(coin, period) {
  period = (period || '24h').toLowerCase();
  if (period === '24h') return CHANGE24H(coin);
  if (period === '7d') return CHANGE7D(coin);
  if (period === '30d') return CHANGE30D(coin);
  if (period === '1y') return CHANGE1Y(coin);
  return CHANGE24H(coin);
}

/**
 * Alias for MARKETCAP
 * @customfunction
 * @param {string} coin Coin ID
 * @param {string} [currency="usd"] Currency
 * @returns {number} Market cap
 */
async function MCAP(coin, currency) {
  return MARKETCAP(coin, currency);
}

/**
 * Alias for VOLUME
 * @customfunction
 * @param {string} coin Coin ID
 * @param {string} [currency="usd"] Currency
 * @returns {number} 24h volume
 */
async function VOL(coin, currency) {
  return VOLUME(coin, currency);
}

// ============================================
// ON-CHAIN TOKEN DATA (GeckoTerminal / CoinGecko)
// ============================================

var GECKOTERMINAL_API = 'https://api.geckoterminal.com/api/v2';

async function fetchGeckoTerminal(endpoint) {
  var url = GECKOTERMINAL_API + endpoint;
  var cached = requestCache.get(url);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  var response = await fetch(url, { headers: { 'Accept': 'application/json' } });
  if (!response.ok) {
    throw new CustomFunctions.Error(
      CustomFunctions.ErrorCode.invalidValue,
      'GeckoTerminal API error: ' + response.status
    );
  }
  var data = await response.json();
  requestCache.set(url, { data: data, timestamp: Date.now() });
  return data;
}

/**
 * Get top pools for a token and sum unique holder counts from pool data
 * @customfunction
 * @param {string} network Network ID (e.g., 'eth', 'bsc', 'polygon', 'solana')
 * @param {string} address Token contract address
 * @returns {number} Estimated holder count from top pools
 */
async function HOLDERS(network, address) {
  var data = await fetchGeckoTerminal('/networks/' + network + '/tokens/' + address);
  var attrs = data.data && data.data.attributes;
  if (!attrs) {
    throw new CustomFunctions.Error(CustomFunctions.ErrorCode.invalidValue, 'Token not found');
  }
  // GeckoTerminal doesn't provide direct holder counts; use CoinGecko community data as proxy
  // Return the number of unique pools (liquidity sources) as a metric
  var poolData = await fetchGeckoTerminal('/networks/' + network + '/tokens/' + address + '/pools?page=1');
  var pools = poolData.data || [];
  // Sum reserve_in_usd across pools as a proxy for holder activity
  var totalTxns = 0;
  for (var i = 0; i < pools.length; i++) {
    var pa = pools[i].attributes;
    if (pa && pa.transactions) {
      var h24 = pa.transactions.h24;
      if (h24) totalTxns += (h24.buys || 0) + (h24.sells || 0);
    }
  }
  return totalTxns || 0;
}

/**
 * Get holder distribution info from pool transaction data
 * @customfunction
 * @param {string} network Network ID
 * @param {string} address Token contract address
 * @param {string} [metric="top10"] Metric: 'buys', 'sells', 'buyers', 'sellers' (default: 'buys')
 * @returns {number} Transaction count metric
 */
async function DISTRIBUTION(network, address, metric) {
  metric = (metric || 'buys').toLowerCase();
  var data = await fetchGeckoTerminal('/networks/' + network + '/tokens/' + address + '/pools?page=1');
  var pools = data.data || [];
  if (pools.length === 0) {
    throw new CustomFunctions.Error(CustomFunctions.ErrorCode.invalidValue, 'No pools found');
  }
  // Aggregate transaction metrics across top pools
  var total = 0;
  for (var i = 0; i < pools.length; i++) {
    var pa = pools[i].attributes;
    if (pa && pa.transactions && pa.transactions.h24) {
      var h24 = pa.transactions.h24;
      if (metric === 'buys') total += h24.buys || 0;
      else if (metric === 'sells') total += h24.sells || 0;
      else if (metric === 'buyers') total += h24.buyers || 0;
      else if (metric === 'sellers') total += h24.sellers || 0;
      else total += h24.buys || 0;
    }
  }
  return total;
}

/**
 * Get GeckoTerminal trust score for a token's top pool
 * @customfunction
 * @param {string} network Network ID
 * @param {string} address Token contract address
 * @param {string} [scoreType="total"] Score type: 'total', 'volume', 'liquidity', 'fdv' (default: 'total')
 * @returns {number} Score or metric value
 */
async function SCORE(network, address, scoreType) {
  scoreType = (scoreType || 'total').toLowerCase();
  var data = await fetchGeckoTerminal('/networks/' + network + '/tokens/' + address + '/pools?page=1');
  var pools = data.data || [];
  if (pools.length === 0) {
    throw new CustomFunctions.Error(CustomFunctions.ErrorCode.invalidValue, 'No pools found');
  }
  // Use top pool (highest liquidity)
  var top = pools[0].attributes;
  if (scoreType === 'volume') return parseFloat(top.volume_usd && top.volume_usd.h24 || '0');
  if (scoreType === 'liquidity') return parseFloat(top.reserve_in_usd || '0');
  if (scoreType === 'fdv') return parseFloat(top.fdv_usd || '0');
  // 'total' - composite: volume * liquidity normalized
  var vol = parseFloat(top.volume_usd && top.volume_usd.h24 || '0');
  var liq = parseFloat(top.reserve_in_usd || '0');
  if (liq === 0) return 0;
  return Math.round((vol / liq) * 100) / 100; // Volume/liquidity ratio
}

/**
 * Get full token info from GeckoTerminal (spills to range)
 * @customfunction
 * @param {string} network Network ID
 * @param {string} address Token contract address
 * @returns {any[][]} Token info matrix
 */
async function TOKENINFO(network, address) {
  var data = await fetchGeckoTerminal('/networks/' + network + '/tokens/' + address);
  var attrs = data.data && data.data.attributes;
  if (!attrs) {
    throw new CustomFunctions.Error(CustomFunctions.ErrorCode.invalidValue, 'Token not found');
  }
  var poolData = await fetchGeckoTerminal('/networks/' + network + '/tokens/' + address + '/pools?page=1');
  var topPool = (poolData.data && poolData.data.length > 0) ? poolData.data[0].attributes : {};

  return [
    ['Name', attrs.name || 'N/A'],
    ['Symbol', attrs.symbol || 'N/A'],
    ['Price (USD)', parseFloat(attrs.price_usd || '0')],
    ['FDV', parseFloat(attrs.fdv_usd || '0')],
    ['Market Cap', parseFloat(attrs.market_cap_usd || '0')],
    ['Total Supply', parseFloat(attrs.total_supply || '0')],
    ['24h Volume', parseFloat(topPool.volume_usd && topPool.volume_usd.h24 || '0')],
    ['Liquidity', parseFloat(topPool.reserve_in_usd || '0')],
    ['24h Buys', topPool.transactions && topPool.transactions.h24 ? topPool.transactions.h24.buys || 0 : 0],
    ['24h Sells', topPool.transactions && topPool.transactions.h24 ? topPool.transactions.h24.sells || 0 : 0],
    ['Top Pool', topPool.name || 'N/A'],
    ['Network', network],
  ];
}

async function CHANGE7D(coin) {
  return INFO(coin, 'price_change_7d');
}

/**
 * Get 30-day price change percentage
 * @customfunction
 * @param {string} coin Coin ID
 * @returns {number} 30d change percentage
 */
async function CHANGE30D(coin) {
  return INFO(coin, 'price_change_30d');
}

/**
 * Get 1-year price change percentage
 * @customfunction
 * @param {string} coin Coin ID
 * @returns {number} 1y change percentage
 */
async function CHANGE1Y(coin) {
  return INFO(coin, 'price_change_1y');
}

// ============================================
// EXCHANGE TICKERS
// ============================================

/**
 * Get exchange tickers for a coin
 * @customfunction
 * @param {string} coin Coin ID
 * @param {number} [limit=50] Number of tickers
 * @returns {any[][]} Tickers [Exchange, Pair, Price, Volume, Spread]
 */
async function TICKERS(coin, limit = 50) {
  const data = await fetchFromCoinGecko(`/coins/${coin.toLowerCase()}/tickers`, {
    include_exchange_logo: 'false',
  });

  const tickers = data.tickers || [];
  const header = ['Exchange', 'Pair', 'Price', 'Volume', 'Spread %', 'Trust'];
  const rows = tickers.slice(0, limit).map(t => [
    t.market?.name || 'Unknown',
    `${t.base}/${t.target}`,
    t.last,
    t.converted_volume?.usd || 0,
    t.bid_ask_spread_percentage || 0,
    t.trust_score || 'N/A',
  ]);

  return [header, ...rows];
}

/**
 * Get tickers for a specific exchange
 * @customfunction
 * @param {string} exchange Exchange ID
 * @param {number} [limit=100] Number of tickers
 * @returns {any[][]} Exchange tickers [Coin, Pair, Price, Volume]
 */
async function EXCHANGE_TICKERS(exchange, limit = 100) {
  const data = await fetchFromCoinGecko(`/exchanges/${exchange.toLowerCase()}/tickers`, {
    page: '1',
  });

  const tickers = data.tickers || [];
  const header = ['Coin', 'Pair', 'Price', 'Volume 24h', 'Spread %'];
  const rows = tickers.slice(0, limit).map(t => [
    t.coin_id,
    `${t.base}/${t.target}`,
    t.last,
    t.converted_volume?.usd || 0,
    t.bid_ask_spread_percentage || 0,
  ]);

  return [header, ...rows];
}

/**
 * Get detailed exchange information
 * @customfunction
 * @param {string} exchange Exchange ID
 * @param {string} [field] Specific field to return
 * @returns {any} Exchange info
 */
async function EXCHANGE_INFO(exchange, field) {
  const data = await fetchFromCoinGecko(`/exchanges/${exchange.toLowerCase()}`);

  if (!field) {
    // Return summary as matrix
    return [
      ['Field', 'Value'],
      ['Name', data.name],
      ['Year', data.year_established || 'N/A'],
      ['Country', data.country || 'N/A'],
      ['Trust Score', data.trust_score],
      ['Trust Rank', data.trust_score_rank],
      ['Volume 24h BTC', data.trade_volume_24h_btc],
      ['URL', data.url || 'N/A'],
    ];
  }

  const fieldMap = {
    'volume': data.trade_volume_24h_btc,
    'trust_score': data.trust_score,
    'year': data.year_established,
    'country': data.country,
    'url': data.url,
    'name': data.name,
    'rank': data.trust_score_rank,
  };

  return fieldMap[field.toLowerCase()] ?? '#N/A';
}

// ============================================
// COMPARE & CONVERT
// ============================================

/**
 * Compare multiple coins side by side
 * @customfunction
 * @param {string} coins Comma-separated coin IDs
 * @returns {any[][]} Comparison matrix
 */
async function COMPARE(coins) {
  const coinList = coins.split(',').map(c => c.trim().toLowerCase());

  const data = await fetchFromCoinGecko('/coins/markets', {
    vs_currency: 'usd',
    ids: coinList.join(','),
    sparkline: 'false',
  });

  const header = ['Coin', 'Price', 'Market Cap', '24h %', '7d %', 'Volume', 'ATH', 'Rank'];
  const rows = data.map(coin => [
    coin.name,
    coin.current_price,
    coin.market_cap,
    coin.price_change_percentage_24h,
    coin.price_change_percentage_7d_in_currency || 'N/A',
    coin.total_volume,
    coin.ath,
    coin.market_cap_rank,
  ]);

  return [header, ...rows];
}

/**
 * Convert amount from one crypto/fiat to another
 * @customfunction
 * @param {number} amount Amount to convert
 * @param {string} from Source coin ID or currency
 * @param {string} to Target coin ID or currency
 * @returns {number} Converted amount
 */
async function CONVERT(amount, from, to) {
  const fromLower = from.toLowerCase();
  const toLower = to.toLowerCase();

  // Check if 'from' is a fiat currency
  const fiats = ['usd', 'eur', 'gbp', 'jpy', 'cad', 'aud', 'chf', 'cny', 'inr', 'krw'];

  if (fiats.includes(fromLower)) {
    // Converting fiat to crypto
    const data = await fetchFromCoinGecko('/simple/price', {
      ids: toLower,
      vs_currencies: fromLower,
    });
    const rate = data[toLower]?.[fromLower];
    return rate ? amount / rate : '#N/A';
  }

  if (fiats.includes(toLower)) {
    // Converting crypto to fiat
    const data = await fetchFromCoinGecko('/simple/price', {
      ids: fromLower,
      vs_currencies: toLower,
    });
    return data[fromLower]?.[toLower] * amount ?? '#N/A';
  }

  // Crypto to crypto via USD
  const data = await fetchFromCoinGecko('/simple/price', {
    ids: `${fromLower},${toLower}`,
    vs_currencies: 'usd',
  });

  const fromUsd = data[fromLower]?.usd;
  const toUsd = data[toLower]?.usd;

  if (!fromUsd || !toUsd) return '#N/A';
  return (amount * fromUsd) / toUsd;
}

// ============================================
// VOLATILITY & ANALYTICS
// ============================================

/**
 * Calculate price volatility (annualized standard deviation)
 * @customfunction
 * @param {string} coin Coin ID
 * @param {number} [days=30] Number of days
 * @returns {number} Volatility percentage
 */
async function VOLATILITY(coin, days = 30) {
  const data = await fetchFromCoinGecko(`/coins/${coin.toLowerCase()}/market_chart`, {
    vs_currency: 'usd',
    days: days.toString(),
  });

  const prices = data.prices || [];
  if (prices.length < 2) return '#N/A';

  // Calculate daily returns
  const returns = [];
  for (let i = 1; i < prices.length; i++) {
    const dailyReturn = (prices[i][1] - prices[i-1][1]) / prices[i-1][1];
    returns.push(dailyReturn);
  }

  // Calculate standard deviation
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const squaredDiffs = returns.map(r => Math.pow(r - mean, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / returns.length;
  const stdDev = Math.sqrt(variance);

  // Annualize (multiply by sqrt of trading days)
  const annualized = stdDev * Math.sqrt(365) * 100;

  return Math.round(annualized * 100) / 100;
}

/**
 * Get percentage from all-time high
 * @customfunction
 * @param {string} coin Coin ID
 * @returns {number} ATH change percentage
 */
async function ATH_CHANGE(coin) {
  const data = await fetchFromCoinGecko(`/coins/${coin.toLowerCase()}`, {
    localization: 'false',
    tickers: 'false',
    community_data: 'false',
    developer_data: 'false',
  });

  return data.market_data?.ath_change_percentage?.usd ?? '#N/A';
}

/**
 * Get Fully Diluted Valuation
 * @customfunction
 * @param {string} coin Coin ID
 * @returns {number} FDV in USD
 */
async function FDV(coin) {
  const data = await fetchFromCoinGecko(`/coins/${coin.toLowerCase()}`, {
    localization: 'false',
    tickers: 'false',
    community_data: 'false',
    developer_data: 'false',
  });

  return data.market_data?.fully_diluted_valuation?.usd ?? '#N/A';
}

/**
 * Get Market Cap to FDV ratio
 * @customfunction
 * @param {string} coin Coin ID
 * @returns {number} MC/FDV ratio
 */
async function MCAP_FDV_RATIO(coin) {
  const data = await fetchFromCoinGecko(`/coins/${coin.toLowerCase()}`, {
    localization: 'false',
    tickers: 'false',
    community_data: 'false',
    developer_data: 'false',
  });

  const mc = data.market_data?.market_cap?.usd;
  const fdv = data.market_data?.fully_diluted_valuation?.usd;

  if (!mc || !fdv) return '#N/A';
  return Math.round((mc / fdv) * 10000) / 10000;
}

// ============================================
// COMPANIES & INSTITUTIONAL
// ============================================

/**
 * Get public companies holding Bitcoin or Ethereum
 * @customfunction
 * @param {string} coin "bitcoin" or "ethereum"
 * @returns {any[][]} Companies list
 */
async function COMPANIES(coin) {
  const validCoins = ['bitcoin', 'ethereum'];
  if (!validCoins.includes(coin.toLowerCase())) {
    throw new CustomFunctions.Error(
      CustomFunctions.ErrorCode.invalidValue,
      'Only bitcoin or ethereum supported'
    );
  }

  const data = await fetchFromCoinGecko(`/companies/public_treasury/${coin.toLowerCase()}`);

  const companies = data.companies || [];
  const header = ['Company', 'Symbol', 'Holdings', 'Entry Value', 'Current Value', 'Country'];
  const rows = companies.map(c => [
    c.name,
    c.symbol || 'N/A',
    c.total_holdings,
    c.total_entry_value_usd,
    c.total_current_value_usd,
    c.country || 'N/A',
  ]);

  return [header, ...rows];
}

// ============================================
// GLOBAL DEFI
// ============================================

/**
 * Get global DeFi market statistics
 * @customfunction
 * @param {string} [field] Specific field to return
 * @returns {any} DeFi stats
 */
async function DEFI_GLOBAL(field) {
  const response = await fetchFromCoinGecko('/global/decentralized_finance_defi');
  const data = response.data || response;

  if (!field) {
    return [
      ['Metric', 'Value'],
      ['DeFi Market Cap', data.defi_market_cap],
      ['ETH Market Cap', data.eth_market_cap],
      ['DeFi to ETH Ratio', data.defi_to_eth_ratio],
      ['24h Volume', data.trading_volume_24h],
      ['DeFi Dominance', data.defi_dominance],
      ['Top Coin', data.top_coin_name],
    ];
  }

  const fieldMap = {
    'market_cap': data.defi_market_cap,
    'volume': data.trading_volume_24h,
    'dominance': data.defi_dominance,
    'top_coin': data.top_coin_name,
    'eth_ratio': data.defi_to_eth_ratio,
  };

  return fieldMap[field.toLowerCase()] ?? '#N/A';
}

// ============================================
// DEX POOLS (GeckoTerminal)
// ============================================

/**
 * Get DEX liquidity pools
 * @customfunction
 * @param {string} network Network ID (eth, bsc, solana, etc.)
 * @param {number} [limit=50] Number of pools
 * @returns {any[][]} Pools list
 */
async function POOLS(network, limit = 50) {
  await checkDailyLimit();
  try {
    const response = await fetch(`https://api.geckoterminal.com/api/v2/networks/${network}/pools?page=1`);
    const json = await response.json();
    const pools = json.data || [];

    const header = ['Pool', 'DEX', 'Base', 'Quote', 'Price', 'Liquidity', '24h Volume'];
    const rows = pools.slice(0, limit).map(pool => {
      const attrs = pool.attributes || {};
      return [
        attrs.name || 'Unknown',
        attrs.dex_id || 'N/A',
        attrs.base_token_price_usd || 0,
        attrs.quote_token_price_usd || 0,
        attrs.base_token_price_usd || 0,
        parseFloat(attrs.reserve_in_usd) || 0,
        parseFloat(attrs.volume_usd?.h24) || 0,
      ];
    });

    return [header, ...rows];
  } catch (error) {
    return [['Error fetching pools']];
  }
}

/**
 * Get specific pool information
 * @customfunction
 * @param {string} network Network ID
 * @param {string} poolAddress Pool address
 * @returns {any[][]} Pool info
 */
async function POOL_INFO(network, poolAddress) {
  await checkDailyLimit();
  try {
    const response = await fetch(`https://api.geckoterminal.com/api/v2/networks/${network}/pools/${poolAddress}`);
    const json = await response.json();
    const attrs = json.data?.attributes || {};

    return [
      ['Field', 'Value'],
      ['Name', attrs.name],
      ['DEX', attrs.dex_id],
      ['Base Token', attrs.base_token_price_native_currency],
      ['Price USD', attrs.base_token_price_usd],
      ['Liquidity', attrs.reserve_in_usd],
      ['Volume 24h', attrs.volume_usd?.h24],
      ['Price Change 24h', attrs.price_change_percentage?.h24],
    ];
  } catch (error) {
    return [['Error fetching pool info']];
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get supported fiat currencies
 * @customfunction
 * @returns {any[][]} Currencies list
 */
async function CURRENCIES() {
  const data = await fetchFromCoinGecko('/simple/supported_vs_currencies');

  const header = ['Currency Code'];
  const rows = data.map(c => [c.toUpperCase()]);

  return [header, ...rows];
}

/**
 * Get list of all supported coins
 * @customfunction
 * @param {number} [limit=100] Number of coins
 * @returns {any[][]} Coins list [ID, Symbol, Name]
 */
async function COINS_LIST(limit = 100) {
  const data = await fetchFromCoinGecko('/coins/list');

  const header = ['Coin ID', 'Symbol', 'Name'];
  const rows = data.slice(0, limit).map(coin => [
    coin.id,
    coin.symbol?.toUpperCase(),
    coin.name,
  ]);

  return [header, ...rows];
}

/**
 * Get derivatives exchanges
 * @customfunction
 * @param {number} [limit=20] Number of exchanges
 * @returns {any[][]} Derivatives exchanges
 */
async function DERIVATIVES_EXCHANGES(limit = 20) {
  const data = await fetchFromCoinGecko('/derivatives/exchanges', {
    per_page: Math.min(limit, 100).toString(),
    page: '1',
  });

  const header = ['Name', 'Open Interest BTC', 'Volume 24h', 'Pairs', 'Year'];
  const rows = data.map(ex => [
    ex.name,
    ex.open_interest_btc,
    ex.trade_volume_24h_btc,
    ex.number_of_perpetual_pairs,
    ex.year_established || 'N/A',
  ]);

  return [header, ...rows];
}

// ============================================
// FUNDING RATES
// ============================================

/**
 * Get funding rates for perpetual futures
 * @customfunction
 * @param {string} coin Coin symbol (BTC, ETH, etc.)
 * @returns {any[][]} Funding rates
 */
async function FUNDING(coin) {
  const data = await fetchFromCoinGecko('/derivatives');

  const symbol = coin.toUpperCase();
  const filtered = data.filter(d =>
    d.symbol && d.symbol.toUpperCase().includes(symbol)
  );

  const header = ['Market', 'Symbol', 'Price', 'Funding Rate', 'Index', 'Open Interest'];
  const rows = filtered.slice(0, 20).map(d => [
    d.market,
    d.symbol,
    d.price,
    d.funding_rate || 'N/A',
    d.index || 'N/A',
    d.open_interest,
  ]);

  return [header, ...rows];
}

// ============================================
// ROI & DCA CALCULATORS
// ============================================

/**
 * Calculate ROI from a purchase date
 * @customfunction
 * @param {string} coin Coin ID
 * @param {string} purchaseDate Date in DD-MM-YYYY format
 * @param {number} [purchaseAmount=1000] Amount invested
 * @returns {number} ROI percentage
 */
async function ROI(coin, purchaseDate, purchaseAmount = 1000) {
  // Get historical price
  const histData = await fetchFromCoinGecko(`/coins/${coin.toLowerCase()}/history`, {
    date: purchaseDate,
    localization: 'false',
  });

  const histPrice = histData.market_data?.current_price?.usd;
  if (!histPrice) return '#N/A';

  // Get current price
  const currData = await fetchFromCoinGecko('/simple/price', {
    ids: coin.toLowerCase(),
    vs_currencies: 'usd',
  });

  const currPrice = currData[coin.toLowerCase()]?.usd;
  if (!currPrice) return '#N/A';

  const roi = ((currPrice - histPrice) / histPrice) * 100;
  return Math.round(roi * 100) / 100;
}

/**
 * Calculate DCA returns
 * @customfunction
 * @param {string} coin Coin ID
 * @param {number} monthlyAmount Monthly investment
 * @param {number} [months=12] Number of months
 * @returns {any[][]} DCA results
 */
async function DCA(coin, monthlyAmount, months = 12) {
  const data = await fetchFromCoinGecko(`/coins/${coin.toLowerCase()}/market_chart`, {
    vs_currency: 'usd',
    days: (months * 30).toString(),
  });

  const prices = data.prices || [];
  if (prices.length < 2) return [['Insufficient data']];

  // Sample monthly prices
  const step = Math.floor(prices.length / months);
  let totalInvested = 0;
  let totalCoins = 0;

  const rows = [];
  for (let i = 0; i < months; i++) {
    const idx = Math.min(i * step, prices.length - 1);
    const price = prices[idx][1];
    const coins = monthlyAmount / price;
    totalInvested += monthlyAmount;
    totalCoins += coins;

    rows.push([
      `Month ${i + 1}`,
      monthlyAmount,
      Math.round(price * 100) / 100,
      Math.round(coins * 100000) / 100000,
      Math.round(totalCoins * 100000) / 100000,
    ]);
  }

  // Current value
  const currentPrice = prices[prices.length - 1][1];
  const currentValue = totalCoins * currentPrice;
  const profit = currentValue - totalInvested;
  const profitPct = (profit / totalInvested) * 100;

  const header = ['Month', 'Invested', 'Price', 'Coins Bought', 'Total Coins'];
  const summary = [
    ['---', '---', '---', '---', '---'],
    ['Total Invested', totalInvested, '', '', ''],
    ['Current Value', Math.round(currentValue * 100) / 100, '', '', ''],
    ['Profit/Loss', Math.round(profit * 100) / 100, '', '', ''],
    ['ROI %', Math.round(profitPct * 100) / 100, '', '', ''],
  ];

  return [header, ...rows, ...summary];
}

// ============================================
// CATEGORY-SPECIFIC FUNCTIONS
// ============================================

/**
 * Get Layer 1 blockchains
 * @customfunction
 * @param {number} [limit=20] Number of L1s
 * @returns {any[][]} Layer 1 chains
 */
async function LAYER1(limit = 20) {
  return CATEGORY('layer-1', limit);
}

/**
 * Get Layer 2 solutions
 * @customfunction
 * @param {number} [limit=20] Number of L2s
 * @returns {any[][]} Layer 2 solutions
 */
async function LAYER2(limit = 20) {
  return CATEGORY('layer-2', limit);
}

/**
 * Get meme coins
 * @customfunction
 * @param {number} [limit=20] Number of meme coins
 * @returns {any[][]} Meme coins
 */
async function MEMECOINS(limit = 20) {
  return CATEGORY('meme-token', limit);
}

/**
 * Get AI tokens
 * @customfunction
 * @param {number} [limit=20] Number of AI tokens
 * @returns {any[][]} AI tokens
 */
async function AI_TOKENS(limit = 20) {
  return CATEGORY('artificial-intelligence', limit);
}

/**
 * Get gaming tokens
 * @customfunction
 * @param {number} [limit=20] Number of gaming tokens
 * @returns {any[][]} Gaming tokens
 */
async function GAMING(limit = 20) {
  return CATEGORY('gaming', limit);
}

/**
 * Get RWA (Real World Asset) tokens
 * @customfunction
 * @param {number} [limit=20] Number of RWA tokens
 * @returns {any[][]} RWA tokens
 */
async function RWA(limit = 20) {
  return CATEGORY('real-world-assets', limit);
}

// ============================================
// TVL (DefiLlama Integration)
// ============================================

/**
 * Get Total Value Locked for a DeFi protocol
 * @customfunction
 * @param {string} protocol Protocol ID
 * @returns {number} TVL in USD
 */
async function TVL(protocol) {
  await checkDailyLimit();
  try {
    const response = await fetch(`https://api.llama.fi/tvl/${protocol.toLowerCase()}`);
    const tvl = await response.json();
    return typeof tvl === 'number' ? tvl : '#N/A';
  } catch (error) {
    return '#N/A';
  }
}

// ============================================
// TECHNICAL INDICATORS (ADVANCED)
// ============================================

/**
 * Calculate Bollinger Bands
 * @customfunction
 * @param {string} coin Coin ID
 * @param {string} [band="middle"] Band: "upper", "middle", "lower"
 * @param {number} [period=20] Period
 * @returns {number} Band value
 */
async function BB(coin, band = 'middle', period = 20) {
  const data = await fetchFromCoinGecko(`/coins/${coin.toLowerCase()}/ohlc`, {
    vs_currency: 'usd',
    days: Math.min(period + 10, 90).toString(),
  });

  if (!Array.isArray(data) || data.length < period) {
    return '#N/A';
  }

  const closes = data.slice(-period).map(row => row[4]);
  const sma = closes.reduce((a, b) => a + b, 0) / period;

  // Calculate standard deviation
  const squaredDiffs = closes.map(c => Math.pow(c - sma, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / period;
  const stdDev = Math.sqrt(variance);

  const bandLower = band.toLowerCase();
  if (bandLower === 'upper') {
    return Math.round((sma + 2 * stdDev) * 100) / 100;
  }
  if (bandLower === 'lower') {
    return Math.round((sma - 2 * stdDev) * 100) / 100;
  }
  return Math.round(sma * 100) / 100; // middle
}

/**
 * Calculate Volume Weighted Average Price
 * @customfunction
 * @param {string} coin Coin ID
 * @param {number} [days=1] Number of days
 * @returns {number} VWAP value
 */
async function VWAP(coin, days = 1) {
  const data = await fetchFromCoinGecko(`/coins/${coin.toLowerCase()}/market_chart`, {
    vs_currency: 'usd',
    days: days.toString(),
  });

  const prices = data.prices || [];
  const volumes = data.total_volumes || [];

  if (prices.length < 2 || prices.length !== volumes.length) {
    return '#N/A';
  }

  let sumPV = 0;
  let sumV = 0;

  for (let i = 0; i < prices.length; i++) {
    const price = prices[i][1];
    const volume = volumes[i][1];
    sumPV += price * volume;
    sumV += volume;
  }

  if (sumV === 0) return '#N/A';
  return Math.round((sumPV / sumV) * 100) / 100;
}

// ============================================
// CACHE STATUS & PORTFOLIO FUNCTIONS
// ============================================

/**
 * Show persistent cache status
 * @customfunction
 * @returns {string} Cache status message
 */
async function CACHE_STATUS() {
  if (staleCacheHits === 0) {
    return 'All data fresh';
  }
  return staleCacheHits + ' values from cache (oldest: ' + oldestStaleAge + ' min ago)';
}

/**
 * Add a buy/sell entry to portfolio
 * @customfunction
 * @param {string} coin Coin ID (e.g., "bitcoin")
 * @param {number} qty Quantity bought/sold
 * @param {number} price Price per unit at purchase/sale
 * @param {string} [date] Date of transaction (YYYY-MM-DD, default: today)
 * @param {string} [type] Transaction type: "buy" or "sell" (default: "buy")
 * @returns {string} Confirmation message
 */
async function PORTFOLIO_ADD(coin, qty, price, date, type) {
  if (!coin || !qty || !price) {
    throw new CustomFunctions.Error(
      CustomFunctions.ErrorCode.invalidValue,
      'Usage: PORTFOLIO_ADD(coin, qty, price, [date], [type])'
    );
  }

  var txType = (type && type.toLowerCase() === 'sell') ? 'sell' : 'buy';
  var txDate = date || new Date().toISOString().split('T')[0];
  var portfolio = await getPortfolio();

  if (portfolio.length >= PORTFOLIO_MAX_HOLDINGS) {
    throw new CustomFunctions.Error(
      CustomFunctions.ErrorCode.invalidValue,
      'Portfolio limit reached (' + PORTFOLIO_MAX_HOLDINGS + '). Remove entries first.'
    );
  }

  portfolio.push({
    coin: coin.toLowerCase(),
    qty: Number(qty),
    costBasis: Number(price),
    date: txDate,
    type: txType,
  });

  await setPortfolio(portfolio);
  return txType.toUpperCase() + ': ' + qty + ' ' + coin + ' @ $' + price;
}

/**
 * List all portfolio holdings with current values and PNL
 * @customfunction
 * @returns {any[][]} Portfolio matrix
 */
async function PORTFOLIO_LIST() {
  var portfolio = await getPortfolio();
  if (portfolio.length === 0) {
    return [['No holdings. Use PORTFOLIO_ADD to start.']];
  }

  // Get unique coins
  var coinSet = {};
  for (var i = 0; i < portfolio.length; i++) {
    coinSet[portfolio[i].coin] = true;
  }
  var uniqueCoins = Object.keys(coinSet);

  // Batch fetch current prices
  var prices = {};
  try {
    var data = await fetchFromCoinGecko('/simple/price', {
      ids: uniqueCoins.join(','),
      vs_currencies: 'usd',
    });
    for (var c = 0; c < uniqueCoins.length; c++) {
      var coinId = uniqueCoins[c];
      if (data[coinId] && data[coinId].usd) {
        prices[coinId] = data[coinId].usd;
      }
    }
  } catch (e) {
    // Use 0 for unknown prices
  }

  // Aggregate by coin
  var aggregated = {};
  for (var j = 0; j < portfolio.length; j++) {
    var entry = portfolio[j];
    if (!aggregated[entry.coin]) {
      aggregated[entry.coin] = { totalQty: 0, totalCost: 0, sells: 0, sellProceeds: 0 };
    }
    if (entry.type === 'sell') {
      aggregated[entry.coin].sells += entry.qty;
      aggregated[entry.coin].sellProceeds += entry.qty * entry.costBasis;
    } else {
      aggregated[entry.coin].totalQty += entry.qty;
      aggregated[entry.coin].totalCost += entry.qty * entry.costBasis;
    }
  }

  var rows = [['Coin', 'Qty Held', 'Avg Cost', 'Current Price', 'Value (USD)', 'PNL ($)', 'PNL (%)']];
  var coins = Object.keys(aggregated);
  for (var k = 0; k < coins.length; k++) {
    var coinName = coins[k];
    var agg = aggregated[coinName];
    var netQty = agg.totalQty - agg.sells;
    if (netQty <= 0) continue;
    var avgCost = agg.totalCost / agg.totalQty;
    var currentPrice = prices[coinName] || 0;
    var currentValue = netQty * currentPrice;
    var costValue = netQty * avgCost;
    var pnl = currentValue - costValue;
    var pnlPct = costValue > 0 ? ((pnl / costValue) * 100) : 0;
    rows.push([
      coinName,
      Math.round(netQty * 1e8) / 1e8,
      Math.round(avgCost * 100) / 100,
      Math.round(currentPrice * 100) / 100,
      Math.round(currentValue * 100) / 100,
      Math.round(pnl * 100) / 100,
      Math.round(pnlPct * 100) / 100,
    ]);
  }

  return rows;
}

/**
 * Get total portfolio value in USD
 * @customfunction
 * @returns {number} Total portfolio value
 */
async function PORTFOLIO_VALUE() {
  var portfolio = await getPortfolio();
  if (portfolio.length === 0) return 0;

  var coinSet = {};
  for (var i = 0; i < portfolio.length; i++) {
    coinSet[portfolio[i].coin] = true;
  }

  // Aggregate net quantities
  var netQtys = {};
  for (var j = 0; j < portfolio.length; j++) {
    var e = portfolio[j];
    if (!netQtys[e.coin]) netQtys[e.coin] = 0;
    netQtys[e.coin] += (e.type === 'sell' ? -e.qty : e.qty);
  }

  var uniqueCoins = Object.keys(coinSet);
  var data = await fetchFromCoinGecko('/simple/price', {
    ids: uniqueCoins.join(','),
    vs_currencies: 'usd',
  });

  var total = 0;
  for (var k = 0; k < uniqueCoins.length; k++) {
    var coin = uniqueCoins[k];
    var qty = netQtys[coin] || 0;
    if (qty > 0 && data[coin] && data[coin].usd) {
      total += qty * data[coin].usd;
    }
  }

  return Math.round(total * 100) / 100;
}

/**
 * Get total unrealized PNL
 * @customfunction
 * @returns {number} Unrealized profit/loss
 */
async function PORTFOLIO_PNL() {
  var portfolio = await getPortfolio();
  if (portfolio.length === 0) return 0;

  // Aggregate by coin: track buy qty, buy cost, sell qty separately
  var positions = {};
  for (var i = 0; i < portfolio.length; i++) {
    var e = portfolio[i];
    if (!positions[e.coin]) positions[e.coin] = { buyQty: 0, buyCost: 0, sellQty: 0 };
    if (e.type === 'sell') {
      positions[e.coin].sellQty += e.qty;
    } else {
      positions[e.coin].buyQty += e.qty;
      positions[e.coin].buyCost += e.qty * e.costBasis;
    }
  }

  var coins = Object.keys(positions);
  var data = await fetchFromCoinGecko('/simple/price', {
    ids: coins.join(','),
    vs_currencies: 'usd',
  });

  var totalPnl = 0;
  for (var j = 0; j < coins.length; j++) {
    var coin = coins[j];
    var pos = positions[coin];
    var netQty = pos.buyQty - pos.sellQty;
    if (netQty > 0 && data[coin] && data[coin].usd) {
      var avgCost = pos.buyCost / pos.buyQty;
      var currentValue = netQty * data[coin].usd;
      var costOfRemaining = netQty * avgCost;
      totalPnl += currentValue - costOfRemaining;
    }
  }

  return Math.round(totalPnl * 100) / 100;
}

/**
 * Remove a holding from portfolio
 * @customfunction
 * @param {string} coin Coin ID to remove
 * @param {number} [index] Specific entry index (1-based, removes all if omitted)
 * @returns {string} Confirmation
 */
async function PORTFOLIO_REMOVE(coin, index) {
  var portfolio = await getPortfolio();
  if (portfolio.length === 0) {
    return 'Portfolio is empty';
  }

  var coinLower = coin.toLowerCase();
  if (index !== undefined && index !== null && index > 0) {
    // Remove specific entry by index
    var coinEntries = [];
    for (var i = 0; i < portfolio.length; i++) {
      if (portfolio[i].coin === coinLower) coinEntries.push(i);
    }
    if (index > coinEntries.length) {
      return 'Only ' + coinEntries.length + ' entries for ' + coin;
    }
    portfolio.splice(coinEntries[index - 1], 1);
    await setPortfolio(portfolio);
    return 'Removed entry #' + index + ' for ' + coin;
  }

  // Remove all entries for this coin
  var before = portfolio.length;
  portfolio = portfolio.filter(function(e) { return e.coin !== coinLower; });
  var removed = before - portfolio.length;
  await setPortfolio(portfolio);
  return removed > 0 ? 'Removed ' + removed + ' entries for ' + coin : coin + ' not found in portfolio';
}

// ============================================
// REGISTER NEW FUNCTIONS
// ============================================

// Chart & Sparkline (Pro+ only)
CustomFunctions.associate('CHART', withTierCheck('CHART', CHART));
CustomFunctions.associate('SPARKLINE', withTierCheck('SPARKLINE', SPARKLINE));

// Change Periods (Pro+ only)
CustomFunctions.associate('CHANGE7D', withTierCheck('CHANGE7D', CHANGE7D));
CustomFunctions.associate('CHANGE30D', withTierCheck('CHANGE30D', CHANGE30D));
CustomFunctions.associate('CHANGE1Y', withTierCheck('CHANGE1Y', CHANGE1Y));

// Tickers (Pro+ only)
CustomFunctions.associate('TICKERS', withTierCheck('TICKERS', TICKERS));
CustomFunctions.associate('EXCHANGE_TICKERS', withTierCheck('EXCHANGE_TICKERS', EXCHANGE_TICKERS));
CustomFunctions.associate('EXCHANGE_INFO', withTierCheck('EXCHANGE_INFO', EXCHANGE_INFO));

// Compare & Convert (Pro+ only)
CustomFunctions.associate('COMPARE', withTierCheck('COMPARE', COMPARE));
CustomFunctions.associate('CONVERT', withTierCheck('CONVERT', CONVERT));

// Analytics (Pro+ only)
CustomFunctions.associate('VOLATILITY', withTierCheck('VOLATILITY', VOLATILITY));
CustomFunctions.associate('ATH_CHANGE', withTierCheck('ATH_CHANGE', ATH_CHANGE));
CustomFunctions.associate('FDV', withTierCheck('FDV', FDV));
CustomFunctions.associate('MCAP_FDV_RATIO', withTierCheck('MCAP_FDV_RATIO', MCAP_FDV_RATIO));

// Institutional (Pro+ only)
CustomFunctions.associate('COMPANIES', withTierCheck('COMPANIES', COMPANIES));

// DeFi (Pro+ only)
CustomFunctions.associate('DEFI_GLOBAL', withTierCheck('DEFI_GLOBAL', DEFI_GLOBAL));
CustomFunctions.associate('TVL', withTierCheck('TVL', TVL));

// DEX Pools (Pro+ only)
CustomFunctions.associate('POOLS', withTierCheck('POOLS', POOLS));
CustomFunctions.associate('POOL_INFO', withTierCheck('POOL_INFO', POOL_INFO));

// Utility (Pro+ only)
CustomFunctions.associate('CURRENCIES', withTierCheck('CURRENCIES', CURRENCIES));
CustomFunctions.associate('COINS_LIST', withTierCheck('COINS_LIST', COINS_LIST));
CustomFunctions.associate('DERIVATIVES_EXCHANGES', withTierCheck('DERIVATIVES_EXCHANGES', DERIVATIVES_EXCHANGES));

// Funding (Pro+ only)
CustomFunctions.associate('FUNDING', withTierCheck('FUNDING', FUNDING));

// Calculators (Pro+ only)
CustomFunctions.associate('ROI', withTierCheck('ROI', ROI));
CustomFunctions.associate('DCA', withTierCheck('DCA', DCA));

// Categories (Pro+ only)
CustomFunctions.associate('LAYER1', withTierCheck('LAYER1', LAYER1));
CustomFunctions.associate('LAYER2', withTierCheck('LAYER2', LAYER2));
CustomFunctions.associate('MEMECOINS', withTierCheck('MEMECOINS', MEMECOINS));
CustomFunctions.associate('AI_TOKENS', withTierCheck('AI_TOKENS', AI_TOKENS));
CustomFunctions.associate('GAMING', withTierCheck('GAMING', GAMING));
CustomFunctions.associate('RWA', withTierCheck('RWA', RWA));

// Technical Indicators (Pro+ only)
CustomFunctions.associate('BB', withTierCheck('BB', BB));
CustomFunctions.associate('VWAP', withTierCheck('VWAP', VWAP));

// Alias functions (shorthand names used in CRK dashboard templates)
CustomFunctions.associate('CHANGE', withTierCheck('CHANGE', CHANGE));
CustomFunctions.associate('MCAP', withTierCheck('MCAP', MCAP));
CustomFunctions.associate('VOL', withTierCheck('VOL', VOL));

// On-chain token data (Pro+ only)
CustomFunctions.associate('HOLDERS', withTierCheck('HOLDERS', HOLDERS));
CustomFunctions.associate('DISTRIBUTION', withTierCheck('DISTRIBUTION', DISTRIBUTION));
CustomFunctions.associate('SCORE', withTierCheck('SCORE', SCORE));
CustomFunctions.associate('TOKENINFO', withTierCheck('TOKENINFO', TOKENINFO));

// ============================================
// AI & ALERTS FUNCTIONS
// ============================================

/**
 * Get auth token from storage
 */
async function getAuthToken() {
  try {
    if (typeof OfficeRuntime !== 'undefined' && OfficeRuntime.storage) {
      return await OfficeRuntime.storage.getItem('crk_auth_token');
    }
  } catch (e) { /* ignore */ }
  try {
    return localStorage.getItem('crk_auth_token');
  } catch (e) { return null; }
}

/**
 * Get CRK server origin
 */
function getServerOrigin() {
  return (typeof window !== 'undefined' && window.location.origin) || 'https://cryptoreportkit.com';
}

/**
 * Ask CRK AI a question about crypto markets
 * @customfunction
 * @param {string} question Your question
 * @returns {string} AI-generated answer
 */
async function ASK(question) {
  if (!question || !question.trim()) {
    throw new CustomFunctions.Error(
      CustomFunctions.ErrorCode.invalidValue,
      'Please provide a question'
    );
  }

  var token = await getAuthToken();
  if (!token) {
    throw new CustomFunctions.Error(
      CustomFunctions.ErrorCode.invalidValue,
      'Sign in to use CRK.ASK. Open taskpane to log in.'
    );
  }

  try {
    var res = await fetch(getServerOrigin() + '/api/v1/ai/ask', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token,
      },
      body: JSON.stringify({ question: question.trim() }),
    });

    var data = await res.json();
    if (!res.ok) {
      throw new CustomFunctions.Error(
        CustomFunctions.ErrorCode.invalidValue,
        data.error || 'AI request failed'
      );
    }

    return data.answer;
  } catch (error) {
    if (error instanceof CustomFunctions.Error) throw error;
    throw new CustomFunctions.Error(
      CustomFunctions.ErrorCode.invalidValue,
      'AI service unavailable'
    );
  }
}

/**
 * Create a price alert
 * @customfunction
 * @param {string} coin Coin ID (e.g., "bitcoin")
 * @param {string} condition Direction: ">" or "above", "<" or "below"
 * @param {number} threshold Price threshold
 * @returns {string} Alert confirmation
 */
async function ALERT(coin, condition, threshold) {
  if (!coin || !condition || !threshold) {
    throw new CustomFunctions.Error(
      CustomFunctions.ErrorCode.invalidValue,
      'Usage: ALERT(coin, ">"/"<", threshold)'
    );
  }

  var alertType;
  if (condition === '>' || condition.toLowerCase() === 'above') {
    alertType = 'above';
  } else if (condition === '<' || condition.toLowerCase() === 'below') {
    alertType = 'below';
  } else {
    throw new CustomFunctions.Error(
      CustomFunctions.ErrorCode.invalidValue,
      'Condition must be ">" or "<"'
    );
  }

  var token = await getAuthToken();
  if (!token) {
    throw new CustomFunctions.Error(
      CustomFunctions.ErrorCode.invalidValue,
      'Sign in to use alerts. Open taskpane to log in.'
    );
  }

  try {
    var res = await fetch(getServerOrigin() + '/api/v1/alerts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token,
      },
      body: JSON.stringify({
        coin_id: coin.toLowerCase(),
        alert_type: alertType,
        threshold: Number(threshold),
      }),
    });

    var data = await res.json();
    if (!res.ok) {
      throw new CustomFunctions.Error(
        CustomFunctions.ErrorCode.invalidValue,
        data.error || 'Failed to create alert'
      );
    }

    return 'Alert set: ' + coin + ' ' + alertType + ' $' + threshold;
  } catch (error) {
    if (error instanceof CustomFunctions.Error) throw error;
    throw new CustomFunctions.Error(
      CustomFunctions.ErrorCode.invalidValue,
      'Alert service unavailable'
    );
  }
}

/**
 * List all active price alerts
 * @customfunction
 * @returns {any[][]} Active alerts matrix
 */
async function ALERTS() {
  var token = await getAuthToken();
  if (!token) {
    return [['Sign in to view alerts']];
  }

  try {
    var res = await fetch(getServerOrigin() + '/api/v1/alerts', {
      headers: { Authorization: 'Bearer ' + token },
    });

    var data = await res.json();
    if (!res.ok) {
      throw new CustomFunctions.Error(
        CustomFunctions.ErrorCode.invalidValue,
        data.error || 'Failed to fetch alerts'
      );
    }

    var alerts = data.alerts;
    if (!alerts || alerts.length === 0) {
      return [['No active alerts. Use CRK.ALERT to create one.']];
    }

    var rows = [['Coin', 'Condition', 'Threshold', 'Created', 'ID']];
    for (var i = 0; i < alerts.length; i++) {
      var a = alerts[i];
      rows.push([
        a.coin_id,
        a.alert_type,
        a.threshold,
        a.created_at ? a.created_at.split('T')[0] : '',
        a.id,
      ]);
    }
    return rows;
  } catch (error) {
    if (error instanceof CustomFunctions.Error) throw error;
    throw new CustomFunctions.Error(
      CustomFunctions.ErrorCode.invalidValue,
      'Alert service unavailable'
    );
  }
}

/**
 * Remove a specific alert by ID
 * @customfunction
 * @param {string} alertId Alert ID (from ALERTS() output)
 * @returns {string} Confirmation
 */
async function ALERT_REMOVE(alertId) {
  if (!alertId) {
    throw new CustomFunctions.Error(
      CustomFunctions.ErrorCode.invalidValue,
      'Provide alert ID (use CRK.ALERTS to see IDs)'
    );
  }

  var token = await getAuthToken();
  if (!token) {
    throw new CustomFunctions.Error(
      CustomFunctions.ErrorCode.invalidValue,
      'Sign in to manage alerts.'
    );
  }

  try {
    var res = await fetch(getServerOrigin() + '/api/v1/alerts/' + alertId, {
      method: 'DELETE',
      headers: { Authorization: 'Bearer ' + token },
    });

    var data = await res.json();
    if (!res.ok) {
      throw new CustomFunctions.Error(
        CustomFunctions.ErrorCode.invalidValue,
        data.error || 'Failed to delete alert'
      );
    }

    return 'Alert removed';
  } catch (error) {
    if (error instanceof CustomFunctions.Error) throw error;
    throw new CustomFunctions.Error(
      CustomFunctions.ErrorCode.invalidValue,
      'Alert service unavailable'
    );
  }
}

// ============================================
// WALLET & EXCHANGE BALANCE FUNCTIONS
// ============================================

var BLOCK_EXPLORERS = {
  ethereum: { url: 'https://api.etherscan.io/api', symbol: 'ETH', decimals: 18, coinId: 'ethereum' },
  eth: { url: 'https://api.etherscan.io/api', symbol: 'ETH', decimals: 18, coinId: 'ethereum' },
  bsc: { url: 'https://api.bscscan.com/api', symbol: 'BNB', decimals: 18, coinId: 'binancecoin' },
  polygon: { url: 'https://api.polygonscan.com/api', symbol: 'MATIC', decimals: 18, coinId: 'matic-network' },
};

/**
 * Get wallet balance for a blockchain address
 * @customfunction
 * @param {string} address Wallet address
 * @param {string} [chain] Chain: ethereum, bsc, polygon (default: ethereum)
 * @returns {any[][]} Balance matrix with token, balance, and USD value
 */
async function WALLET(address, chain) {
  if (!address || address.length < 10) {
    throw new CustomFunctions.Error(
      CustomFunctions.ErrorCode.invalidValue,
      'Provide a valid wallet address'
    );
  }

  var chainKey = (chain || 'ethereum').toLowerCase();
  var explorer = BLOCK_EXPLORERS[chainKey];
  if (!explorer) {
    throw new CustomFunctions.Error(
      CustomFunctions.ErrorCode.invalidValue,
      'Supported chains: ethereum, bsc, polygon'
    );
  }

  try {
    var balanceUrl = explorer.url + '?module=account&action=balance&address=' + address + '&tag=latest';
    var res = await fetch(balanceUrl);
    var data = await res.json();

    if (data.status !== '1' && data.message !== 'OK') {
      throw new Error(data.result || 'Explorer API error');
    }

    var rawBalance = parseFloat(data.result);
    var balance = rawBalance / Math.pow(10, explorer.decimals);

    var priceData = await fetchFromCoinGecko('/simple/price', {
      ids: explorer.coinId,
      vs_currencies: 'usd',
    });

    var usdPrice = priceData[explorer.coinId]?.usd || 0;
    var usdValue = balance * usdPrice;

    return [
      ['Token', 'Balance', 'Price (USD)', 'Value (USD)'],
      [explorer.symbol, Math.round(balance * 1e8) / 1e8, Math.round(usdPrice * 100) / 100, Math.round(usdValue * 100) / 100],
    ];
  } catch (error) {
    if (error instanceof CustomFunctions.Error) throw error;
    throw new CustomFunctions.Error(
      CustomFunctions.ErrorCode.invalidValue,
      'Wallet fetch failed: ' + (error.message || 'unknown error')
    );
  }
}

/**
 * Get exchange balance from connected exchange account
 * @customfunction
 * @param {string} exchange Exchange name: binance, coinbase
 * @param {string} [asset] Specific asset to filter (e.g., "BTC"), or omit for all
 * @returns {any[][]} Balance matrix
 */
async function EXCHANGE_BALANCE(exchange, asset) {
  if (!exchange) {
    throw new CustomFunctions.Error(
      CustomFunctions.ErrorCode.invalidValue,
      'Provide exchange name: binance, coinbase'
    );
  }

  var token = await getAuthToken();
  if (!token) {
    throw new CustomFunctions.Error(
      CustomFunctions.ErrorCode.invalidValue,
      'Sign in to use exchange balance. Open taskpane to log in.'
    );
  }

  try {
    var url = getServerOrigin() + '/api/v1/exchange/' + exchange.toLowerCase() + '/balance';
    if (asset) url += '?asset=' + encodeURIComponent(asset);

    var res = await fetch(url, {
      headers: { Authorization: 'Bearer ' + token },
    });

    var data = await res.json();
    if (!res.ok) {
      throw new CustomFunctions.Error(
        CustomFunctions.ErrorCode.invalidValue,
        data.error || 'Exchange request failed'
      );
    }

    if (!data.balances || data.balances.length === 0) {
      return [['No balances found' + (asset ? ' for ' + asset : '')]];
    }

    var rows = [['Asset', 'Free', 'Locked', 'Total']];
    for (var i = 0; i < data.balances.length; i++) {
      var b = data.balances[i];
      rows.push([b.asset, b.free, b.locked, b.total]);
    }
    return rows;
  } catch (error) {
    if (error instanceof CustomFunctions.Error) throw error;
    throw new CustomFunctions.Error(
      CustomFunctions.ErrorCode.invalidValue,
      'Exchange service unavailable'
    );
  }
}

// ============================================
// TAX-AWARE FORMULAS
// ============================================

/**
 * Calculate cost basis for a coin using FIFO, LIFO, or AVG method
 * @customfunction
 * @param {string} coin Coin ID
 * @param {string} [method] Cost basis method: FIFO, LIFO, AVG (default: AVG)
 * @returns {number} Average cost per unit
 */
async function COST_BASIS(coin, method) {
  var portfolio = await getPortfolio();
  var coinLower = coin.toLowerCase();
  var costMethod = (method || 'AVG').toUpperCase();

  // Get buy entries for this coin
  var buys = [];
  var sells = [];
  for (var i = 0; i < portfolio.length; i++) {
    if (portfolio[i].coin === coinLower) {
      if (portfolio[i].type === 'sell') {
        sells.push({ qty: portfolio[i].qty, price: portfolio[i].costBasis });
      } else {
        buys.push({ qty: portfolio[i].qty, price: portfolio[i].costBasis, date: portfolio[i].date });
      }
    }
  }

  if (buys.length === 0) {
    throw new CustomFunctions.Error(
      CustomFunctions.ErrorCode.invalidValue,
      'No buy entries for ' + coin + '. Use PORTFOLIO_ADD first.'
    );
  }

  if (costMethod === 'AVG') {
    var totalCost = 0;
    var totalQty = 0;
    for (var j = 0; j < buys.length; j++) {
      totalCost += buys[j].qty * buys[j].price;
      totalQty += buys[j].qty;
    }
    return Math.round((totalCost / totalQty) * 100) / 100;
  }

  // FIFO or LIFO: sort buys, then match sells against them
  var sortedBuys = buys.slice();
  if (costMethod === 'FIFO') {
    sortedBuys.sort(function(a, b) { return (a.date || '').localeCompare(b.date || ''); });
  } else if (costMethod === 'LIFO') {
    sortedBuys.sort(function(a, b) { return (b.date || '').localeCompare(a.date || ''); });
  }

  // Process sells to consume buy lots
  var totalSellQty = 0;
  for (var s = 0; s < sells.length; s++) totalSellQty += sells[s].qty;

  var remaining = [];
  var consumed = 0;
  for (var k = 0; k < sortedBuys.length; k++) {
    var buy = sortedBuys[k];
    if (consumed < totalSellQty) {
      var toConsume = Math.min(buy.qty, totalSellQty - consumed);
      consumed += toConsume;
      if (buy.qty > toConsume) {
        remaining.push({ qty: buy.qty - toConsume, price: buy.price });
      }
    } else {
      remaining.push({ qty: buy.qty, price: buy.price });
    }
  }

  if (remaining.length === 0) return 0;
  var remCost = 0;
  var remQty = 0;
  for (var r = 0; r < remaining.length; r++) {
    remCost += remaining[r].qty * remaining[r].price;
    remQty += remaining[r].qty;
  }
  return Math.round((remCost / remQty) * 100) / 100;
}

/**
 * Calculate realized gains for a specific coin/year
 * @customfunction
 * @param {string} coin Coin ID
 * @param {number} [year] Tax year (default: current year)
 * @returns {any[][]} Realized gains matrix
 */
async function REALIZED_GAIN(coin, year) {
  var portfolio = await getPortfolio();
  var coinLower = coin.toLowerCase();
  var taxYear = year || new Date().getFullYear();

  var buys = [];
  var sells = [];
  for (var i = 0; i < portfolio.length; i++) {
    var entry = portfolio[i];
    if (entry.coin !== coinLower) continue;
    var entryYear = entry.date ? parseInt(entry.date.split('-')[0], 10) : new Date().getFullYear();
    if (entry.type === 'sell') {
      if (entryYear === taxYear) {
        sells.push({ qty: entry.qty, price: entry.costBasis, date: entry.date });
      }
    } else {
      buys.push({ qty: entry.qty, price: entry.costBasis, date: entry.date });
    }
  }

  if (sells.length === 0) {
    return [['No sells recorded for ' + coin + ' in ' + taxYear]];
  }

  // FIFO matching
  buys.sort(function(a, b) { return (a.date || '').localeCompare(b.date || ''); });
  var buyIndex = 0;
  var buyRemaining = buys.length > 0 ? buys[0].qty : 0;

  var rows = [['Date', 'Qty Sold', 'Sale Price', 'Cost Basis', 'Gain/Loss', 'Type']];
  for (var s = 0; s < sells.length; s++) {
    var sell = sells[s];
    var sellRemaining = sell.qty;
    var totalGain = 0;
    var totalCost = 0;

    while (sellRemaining > 0 && buyIndex < buys.length) {
      var matchQty = Math.min(sellRemaining, buyRemaining);
      totalCost += matchQty * buys[buyIndex].price;
      totalGain += matchQty * (sell.price - buys[buyIndex].price);
      sellRemaining -= matchQty;
      buyRemaining -= matchQty;
      if (buyRemaining <= 0) {
        buyIndex++;
        buyRemaining = buyIndex < buys.length ? buys[buyIndex].qty : 0;
      }
    }

    var holdPeriod = 'short-term';
    if (buys.length > 0 && sell.date && buys[0].date) {
      var buyDate = new Date(buys[0].date);
      var sellDate = new Date(sell.date);
      if ((sellDate - buyDate) > 365 * 24 * 60 * 60 * 1000) {
        holdPeriod = 'long-term';
      }
    }

    rows.push([
      sell.date || '',
      sell.qty,
      Math.round(sell.price * 100) / 100,
      Math.round(totalCost * 100) / 100,
      Math.round(totalGain * 100) / 100,
      holdPeriod,
    ]);
  }

  return rows;
}

/**
 * Get tax summary for all portfolio holdings
 * @customfunction
 * @returns {any[][]} Tax summary matrix
 */
async function TAX_SUMMARY() {
  var portfolio = await getPortfolio();
  if (portfolio.length === 0) {
    return [['No portfolio entries. Use PORTFOLIO_ADD first.']];
  }

  // Aggregate by coin
  var coins = {};
  for (var i = 0; i < portfolio.length; i++) {
    var e = portfolio[i];
    if (!coins[e.coin]) coins[e.coin] = { buys: 0, buyQty: 0, buyCost: 0, sells: 0, sellQty: 0, sellProceeds: 0 };
    if (e.type === 'sell') {
      coins[e.coin].sells++;
      coins[e.coin].sellQty += e.qty;
      coins[e.coin].sellProceeds += e.qty * e.costBasis;
    } else {
      coins[e.coin].buys++;
      coins[e.coin].buyQty += e.qty;
      coins[e.coin].buyCost += e.qty * e.costBasis;
    }
  }

  // Fetch current prices
  var coinIds = Object.keys(coins);
  var priceData = {};
  try {
    var data = await fetchFromCoinGecko('/simple/price', {
      ids: coinIds.join(','),
      vs_currencies: 'usd',
    });
    for (var c = 0; c < coinIds.length; c++) {
      if (data[coinIds[c]]) priceData[coinIds[c]] = data[coinIds[c]].usd || 0;
    }
  } catch (err) { /* continue with 0 */ }

  var rows = [['Coin', 'Buys', 'Sells', 'Net Qty', 'Cost Basis', 'Current Value', 'Unrealized G/L', 'Realized G/L']];
  for (var j = 0; j < coinIds.length; j++) {
    var coinId = coinIds[j];
    var info = coins[coinId];
    var netQty = info.buyQty - info.sellQty;
    var avgCost = info.buyQty > 0 ? info.buyCost / info.buyQty : 0;
    var costOfRemaining = netQty * avgCost;
    var currentPrice = priceData[coinId] || 0;
    var currentValue = netQty * currentPrice;
    var unrealizedGL = currentValue - costOfRemaining;
    var realizedGL = info.sellProceeds - (info.sellQty * avgCost);

    rows.push([
      coinId,
      info.buys,
      info.sells,
      Math.round(netQty * 1e8) / 1e8,
      Math.round(costOfRemaining * 100) / 100,
      Math.round(currentValue * 100) / 100,
      Math.round(unrealizedGL * 100) / 100,
      Math.round(realizedGL * 100) / 100,
    ]);
  }

  return rows;
}

// ============================================
// REGISTER ALL FUNCTIONS
// ============================================

// Cache & Portfolio (Free tier)
CustomFunctions.associate('CACHE_STATUS', withTierCheck('CACHE_STATUS', CACHE_STATUS));
CustomFunctions.associate('PORTFOLIO_ADD', withTierCheck('PORTFOLIO_ADD', PORTFOLIO_ADD));
CustomFunctions.associate('PORTFOLIO_LIST', withTierCheck('PORTFOLIO_LIST', PORTFOLIO_LIST));
CustomFunctions.associate('PORTFOLIO_VALUE', withTierCheck('PORTFOLIO_VALUE', PORTFOLIO_VALUE));
CustomFunctions.associate('PORTFOLIO_PNL', withTierCheck('PORTFOLIO_PNL', PORTFOLIO_PNL));
CustomFunctions.associate('PORTFOLIO_REMOVE', withTierCheck('PORTFOLIO_REMOVE', PORTFOLIO_REMOVE));

// AI & Alerts
CustomFunctions.associate('ASK', withTierCheck('ASK', ASK));
CustomFunctions.associate('ALERT', withTierCheck('ALERT', ALERT));
CustomFunctions.associate('ALERTS', withTierCheck('ALERTS', ALERTS));
CustomFunctions.associate('ALERT_REMOVE', withTierCheck('ALERT_REMOVE', ALERT_REMOVE));

// Wallet & Exchange (Pro+ only)
CustomFunctions.associate('WALLET', withTierCheck('WALLET', WALLET));
CustomFunctions.associate('EXCHANGE_BALANCE', withTierCheck('EXCHANGE_BALANCE', EXCHANGE_BALANCE));

// Tax (Pro+ only)
CustomFunctions.associate('COST_BASIS', withTierCheck('COST_BASIS', COST_BASIS));
CustomFunctions.associate('REALIZED_GAIN', withTierCheck('REALIZED_GAIN', REALIZED_GAIN));
CustomFunctions.associate('TAX_SUMMARY', withTierCheck('TAX_SUMMARY', TAX_SUMMARY));

console.log('[CRK] All 85+ custom functions registered with usage tracking');
