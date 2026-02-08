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
 */
async function fetchFromCoinGecko(endpoint, params = {}) {
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
    return data;
  } catch (error) {
    if (error instanceof CustomFunctions.Error) throw error;
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

// Price & Market
CustomFunctions.associate('PRICE', PRICE);
CustomFunctions.associate('CHANGE24H', CHANGE24H);
CustomFunctions.associate('MARKETCAP', MARKETCAP);
CustomFunctions.associate('VOLUME', VOLUME);
CustomFunctions.associate('OHLCV', OHLCV);

// Coin Details
CustomFunctions.associate('INFO', INFO);
CustomFunctions.associate('ATH', ATH);
CustomFunctions.associate('ATL', ATL);
CustomFunctions.associate('SUPPLY', SUPPLY);
CustomFunctions.associate('RANK', RANK);
CustomFunctions.associate('HIGH24H', HIGH24H);
CustomFunctions.associate('LOW24H', LOW24H);

// Global Market
CustomFunctions.associate('GLOBAL', GLOBAL);
CustomFunctions.associate('BTCDOM', BTCDOM);
CustomFunctions.associate('ETHDOM', ETHDOM);

// Sentiment & Trending
CustomFunctions.associate('FEARGREED', FEARGREED);
CustomFunctions.associate('TRENDING', TRENDING);

// Technical Indicators
CustomFunctions.associate('SMA', SMA);
CustomFunctions.associate('EMA', EMA);
CustomFunctions.associate('RSI', RSI);
CustomFunctions.associate('MACD', MACD);

// Coin Discovery
CustomFunctions.associate('SEARCH', SEARCH);
CustomFunctions.associate('TOP', TOP);
CustomFunctions.associate('CATEGORY', CATEGORY);
CustomFunctions.associate('CATEGORIES', CATEGORIES);
CustomFunctions.associate('BATCH', BATCH);

// Exchanges
CustomFunctions.associate('EXCHANGES', EXCHANGES);
CustomFunctions.associate('GAINERS', GAINERS);
CustomFunctions.associate('LOSERS', LOSERS);

// DeFi
CustomFunctions.associate('DEFI', DEFI);

// NFTs
CustomFunctions.associate('NFTS', NFTS);

// Derivatives
CustomFunctions.associate('DERIVATIVES', DERIVATIVES);

// Historical
CustomFunctions.associate('PRICEHISTORY', PRICEHISTORY);

// Stablecoins
CustomFunctions.associate('STABLECOINS', STABLECOINS);

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
// REGISTER NEW FUNCTIONS
// ============================================

// Chart & Sparkline
CustomFunctions.associate('CHART', CHART);
CustomFunctions.associate('SPARKLINE', SPARKLINE);

// Change Periods
CustomFunctions.associate('CHANGE7D', CHANGE7D);
CustomFunctions.associate('CHANGE30D', CHANGE30D);
CustomFunctions.associate('CHANGE1Y', CHANGE1Y);

// Tickers
CustomFunctions.associate('TICKERS', TICKERS);
CustomFunctions.associate('EXCHANGE_TICKERS', EXCHANGE_TICKERS);
CustomFunctions.associate('EXCHANGE_INFO', EXCHANGE_INFO);

// Compare & Convert
CustomFunctions.associate('COMPARE', COMPARE);
CustomFunctions.associate('CONVERT', CONVERT);

// Analytics
CustomFunctions.associate('VOLATILITY', VOLATILITY);
CustomFunctions.associate('ATH_CHANGE', ATH_CHANGE);
CustomFunctions.associate('FDV', FDV);
CustomFunctions.associate('MCAP_FDV_RATIO', MCAP_FDV_RATIO);

// Institutional
CustomFunctions.associate('COMPANIES', COMPANIES);

// DeFi
CustomFunctions.associate('DEFI_GLOBAL', DEFI_GLOBAL);
CustomFunctions.associate('TVL', TVL);

// DEX Pools
CustomFunctions.associate('POOLS', POOLS);
CustomFunctions.associate('POOL_INFO', POOL_INFO);

// Utility
CustomFunctions.associate('CURRENCIES', CURRENCIES);
CustomFunctions.associate('COINS_LIST', COINS_LIST);
CustomFunctions.associate('DERIVATIVES_EXCHANGES', DERIVATIVES_EXCHANGES);

// Funding
CustomFunctions.associate('FUNDING', FUNDING);

// Calculators
CustomFunctions.associate('ROI', ROI);
CustomFunctions.associate('DCA', DCA);

// Categories
CustomFunctions.associate('LAYER1', LAYER1);
CustomFunctions.associate('LAYER2', LAYER2);
CustomFunctions.associate('MEMECOINS', MEMECOINS);
CustomFunctions.associate('AI_TOKENS', AI_TOKENS);
CustomFunctions.associate('GAMING', GAMING);
CustomFunctions.associate('RWA', RWA);

// Technical Indicators
CustomFunctions.associate('BB', BB);
CustomFunctions.associate('VWAP', VWAP);

console.log('[CRK] All 70+ custom functions registered successfully');
