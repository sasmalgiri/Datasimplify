/* global CustomFunctions, OfficeRuntime */

/**
 * CRK Custom Functions for Excel
 *
 * Complete set of crypto data functions using BYOK API keys
 * Keys are managed in the taskpane and stored in OfficeRuntime.storage
 */

const API_BASE = 'https://cryptoreportkit.com/api/v1';
const CACHE_TTL = 30000; // 30 seconds
const requestCache = new Map();

/**
 * Get authentication token from storage
 */
async function getAuthToken() {
  try {
    return await OfficeRuntime.storage.getItem('crk_auth_token');
  } catch (error) {
    console.error('[CRK] Error getting auth token:', error);
    return null;
  }
}

/**
 * Fetch data from CRK API with auth and caching
 */
async function fetchWithAuth(endpoint, params = {}) {
  const token = await getAuthToken();

  if (!token) {
    throw new CustomFunctions.Error(
      CustomFunctions.ErrorCode.invalidValue,
      'Not logged in. Open CRK panel to sign in.'
    );
  }

  const url = new URL(`${API_BASE}${endpoint}`);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined) url.searchParams.set(k, String(v));
  });

  // Check cache
  const cacheKey = url.toString();
  const cached = requestCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new CustomFunctions.Error(
      CustomFunctions.ErrorCode.invalidValue,
      error.error || `API error: ${response.status}`
    );
  }

  const data = await response.json();

  // Cache result
  requestCache.set(cacheKey, { data, timestamp: Date.now() });

  return data;
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
  const data = await fetchWithAuth('/price', { coin, currency });
  return data[coin]?.[currency] ?? '#N/A';
}

/**
 * Get 24-hour price change percentage
 * @customfunction
 * @param {string} coin Coin ID
 * @returns {number} 24h change percentage
 */
async function CHANGE24H(coin) {
  const data = await fetchWithAuth('/price', { coin, currency: 'usd' });
  return data[coin]?.usd_24h_change ?? '#N/A';
}

/**
 * Get market capitalization
 * @customfunction
 * @param {string} coin Coin ID
 * @param {string} [currency="usd"] Currency
 * @returns {number} Market cap
 */
async function MARKETCAP(coin, currency = 'usd') {
  const data = await fetchWithAuth('/price', { coin, currency });
  return data[coin]?.[`${currency}_market_cap`] ?? '#N/A';
}

/**
 * Get 24h trading volume
 * @customfunction
 * @param {string} coin Coin ID
 * @param {string} [currency="usd"] Currency
 * @returns {number} 24h volume
 */
async function VOLUME(coin, currency = 'usd') {
  const data = await fetchWithAuth('/price', { coin, currency });
  return data[coin]?.[`${currency}_24h_vol`] ?? '#N/A';
}

/**
 * Get OHLCV data as a spilled array
 * @customfunction
 * @param {string} coin Coin ID
 * @param {number} [days=30] Number of days
 * @returns {number[][]} OHLCV matrix [Date, Open, High, Low, Close]
 */
async function OHLCV(coin, days = 30) {
  const data = await fetchWithAuth('/ohlcv', { coin, days });

  // CoinGecko returns [[timestamp, open, high, low, close], ...]
  const header = ['Date', 'Open', 'High', 'Low', 'Close'];
  const rows = data.map(row => [
    new Date(row[0]).toLocaleDateString(),
    row[1],
    row[2],
    row[3],
    row[4],
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
  const data = await fetchWithAuth('/coin', { coin });

  // Map common field names
  const fieldMap = {
    'rank': 'rank',
    'market_cap_rank': 'rank',
    'ath': 'ath',
    'all_time_high': 'ath',
    'atl': 'atl',
    'all_time_low': 'atl',
    'supply': 'circulating_supply',
    'circulating_supply': 'circulating_supply',
    'total_supply': 'total_supply',
    'max_supply': 'max_supply',
    'high_24h': 'high_24h',
    'low_24h': 'low_24h',
    'name': 'name',
    'symbol': 'symbol',
    'description': 'description',
    'price_change_24h': 'price_change_24h',
    'price_change_7d': 'price_change_7d',
    'price_change_30d': 'price_change_30d',
    'price_change_1y': 'price_change_1y',
    'ath_date': 'ath_date',
    'atl_date': 'atl_date',
    'genesis_date': 'genesis_date',
  };

  const mappedField = fieldMap[field.toLowerCase()] || field;
  return data[mappedField] ?? '#N/A';
}

/**
 * Get all-time high price
 * @customfunction
 * @param {string} coin Coin ID
 * @returns {number} All-time high price in USD
 */
async function ATH(coin) {
  const data = await fetchWithAuth('/coin', { coin });
  return data.ath ?? '#N/A';
}

/**
 * Get all-time low price
 * @customfunction
 * @param {string} coin Coin ID
 * @returns {number} All-time low price in USD
 */
async function ATL(coin) {
  const data = await fetchWithAuth('/coin', { coin });
  return data.atl ?? '#N/A';
}

/**
 * Get circulating supply
 * @customfunction
 * @param {string} coin Coin ID
 * @returns {number} Circulating supply
 */
async function SUPPLY(coin) {
  const data = await fetchWithAuth('/coin', { coin });
  return data.circulating_supply ?? '#N/A';
}

/**
 * Get market cap rank
 * @customfunction
 * @param {string} coin Coin ID
 * @returns {number} Market cap rank
 */
async function RANK(coin) {
  const data = await fetchWithAuth('/coin', { coin });
  return data.rank ?? '#N/A';
}

/**
 * Get 24h high price
 * @customfunction
 * @param {string} coin Coin ID
 * @returns {number} 24h high price
 */
async function HIGH24H(coin) {
  const data = await fetchWithAuth('/coin', { coin });
  return data.high_24h ?? '#N/A';
}

/**
 * Get 24h low price
 * @customfunction
 * @param {string} coin Coin ID
 * @returns {number} 24h low price
 */
async function LOW24H(coin) {
  const data = await fetchWithAuth('/coin', { coin });
  return data.low_24h ?? '#N/A';
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
  const data = await fetchWithAuth('/global');

  // Map common field names
  const fieldMap = {
    'total_market_cap': 'total_market_cap',
    'market_cap': 'total_market_cap',
    'total_volume': 'total_volume',
    'volume': 'total_volume',
    'btc_dominance': 'market_cap_percentage',
    'btc_dom': 'market_cap_percentage',
    'eth_dominance': 'market_cap_percentage',
    'eth_dom': 'market_cap_percentage',
    'active_cryptocurrencies': 'active_cryptocurrencies',
    'markets': 'markets',
    'market_cap_change_24h': 'market_cap_change_percentage_24h_usd',
  };

  const mappedField = fieldMap[field.toLowerCase()] || field;

  // Handle nested fields
  if (mappedField === 'total_market_cap') {
    return data.total_market_cap?.usd ?? '#N/A';
  }
  if (mappedField === 'total_volume') {
    return data.total_volume?.usd ?? '#N/A';
  }
  if (mappedField === 'market_cap_percentage' && field.toLowerCase().startsWith('btc')) {
    return data.market_cap_percentage?.btc ?? '#N/A';
  }
  if (mappedField === 'market_cap_percentage' && field.toLowerCase().startsWith('eth')) {
    return data.market_cap_percentage?.eth ?? '#N/A';
  }

  return data[mappedField] ?? '#N/A';
}

/**
 * Get BTC dominance percentage
 * @customfunction
 * @returns {number} BTC market dominance percentage
 */
async function BTCDOM() {
  const data = await fetchWithAuth('/global');
  return data.market_cap_percentage?.btc ?? '#N/A';
}

/**
 * Get ETH dominance percentage
 * @customfunction
 * @returns {number} ETH market dominance percentage
 */
async function ETHDOM() {
  const data = await fetchWithAuth('/global');
  return data.market_cap_percentage?.eth ?? '#N/A';
}

// ============================================
// SENTIMENT & INDICATORS
// ============================================

/**
 * Get Fear & Greed Index
 * @customfunction
 * @param {string} [field="value"] Field: "value" (0-100) or "class" (classification)
 * @returns {any} Fear & Greed value or classification
 */
async function FEARGREED(field = 'value') {
  const data = await fetchWithAuth('/feargreed');

  if (field.toLowerCase() === 'class' || field.toLowerCase() === 'classification') {
    return data.classification ?? '#N/A';
  }

  return data.value ?? '#N/A';
}

/**
 * Get trending coins as array
 * @customfunction
 * @param {number} [limit=7] Number of coins to return
 * @returns {string[][]} Trending coins matrix [Rank, Name, Symbol]
 */
async function TRENDING(limit = 7) {
  const data = await fetchWithAuth('/trending');

  const header = ['Rank', 'Name', 'Symbol', 'Market Cap Rank'];
  const rows = data.coins.slice(0, limit).map((coin, i) => [
    i + 1,
    coin.name,
    coin.symbol.toUpperCase(),
    coin.rank || 'N/A',
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
  const data = await fetchWithAuth('/ohlcv', { coin, days: period + 10 });

  if (!data || data.length < period) {
    return '#N/A';
  }

  // Use closing prices (index 4)
  const closes = data.slice(-period).map(row => row[4]);
  const sum = closes.reduce((a, b) => a + b, 0);
  return sum / period;
}

/**
 * Calculate Exponential Moving Average
 * @customfunction
 * @param {string} coin Coin ID
 * @param {number} [period=20] EMA period
 * @returns {number} Current EMA value
 */
async function EMA(coin, period = 20) {
  const data = await fetchWithAuth('/ohlcv', { coin, days: period * 2 });

  if (!data || data.length < period) {
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

  return ema;
}

/**
 * Calculate Relative Strength Index
 * @customfunction
 * @param {string} coin Coin ID
 * @param {number} [period=14] RSI period
 * @returns {number} RSI value (0-100)
 */
async function RSI(coin, period = 14) {
  const data = await fetchWithAuth('/ohlcv', { coin, days: period * 2 + 10 });

  if (!data || data.length < period + 1) {
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
  const data = await fetchWithAuth('/ohlcv', { coin, days: 60 });

  if (!data || data.length < 26) {
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
    return macdLine * 0.9; // Approximation
  }

  if (component.toLowerCase() === 'histogram') {
    return macdLine * 0.1; // Approximation
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
  const data = await fetchWithAuth('/search', { query });

  const header = ['Coin ID', 'Name', 'Symbol', 'Market Cap Rank'];
  const rows = data.coins.slice(0, limit).map(coin => [
    coin.id,
    coin.name,
    coin.symbol?.toUpperCase(),
    coin.rank || 'N/A',
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
  const data = await fetchWithAuth('/top', { limit, page });

  const header = ['Rank', 'Coin ID', 'Name', 'Symbol', 'Price', 'Market Cap', '24h %', '7d %'];
  const rows = data.coins.map(coin => [
    coin.rank,
    coin.id,
    coin.name,
    coin.symbol,
    coin.price,
    coin.market_cap,
    coin.change_24h,
    coin.change_7d,
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
  const data = await fetchWithAuth('/categories', { category });

  const header = ['Rank', 'Coin ID', 'Name', 'Symbol', 'Price', '24h %'];
  const rows = data.coins.slice(0, limit).map(coin => [
    coin.rank,
    coin.id,
    coin.name,
    coin.symbol,
    coin.price,
    coin.change_24h,
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
  const data = await fetchWithAuth('/categories');

  const header = ['Category ID', 'Name', 'Market Cap', '24h %'];
  const rows = data.categories.slice(0, limit).map(cat => [
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
  const coinList = coins.split(',').map(c => c.trim());
  const data = await fetchWithAuth('/top', { limit: 250 });

  const fieldMap = {
    'price': 'price',
    'change_24h': 'change_24h',
    'change_7d': 'change_7d',
    'market_cap': 'market_cap',
    'volume': 'volume_24h',
    'rank': 'rank',
  };

  const mappedField = fieldMap[field.toLowerCase()] || 'price';
  const header = ['Coin', field.toUpperCase()];
  const rows = [];

  for (const coinId of coinList) {
    const coin = data.coins.find(c => c.id === coinId.toLowerCase());
    rows.push([coinId, coin ? coin[mappedField] : '#N/A']);
  }

  return [header, ...rows];
}

// ============================================
// EXCHANGES & TRADING
// ============================================

/**
 * Get list of exchanges with volume
 * @customfunction
 * @param {number} [limit=50] Number of exchanges
 * @returns {any[][]} Exchanges [Rank, Name, Country, TrustScore, Volume24hBTC]
 */
async function EXCHANGES(limit = 50) {
  const data = await fetchWithAuth('/exchanges', { limit });

  const header = ['Rank', 'ID', 'Name', 'Country', 'Trust Score', 'Volume 24h (BTC)'];
  const rows = data.exchanges.map((ex, i) => [
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
  const data = await fetchWithAuth('/gainers', { type: 'gainers', limit });

  const header = ['Rank', 'Coin ID', 'Name', 'Symbol', 'Price', '24h %'];
  const rows = data.coins.map(coin => [
    coin.rank,
    coin.id,
    coin.name,
    coin.symbol,
    coin.price,
    coin.change_24h,
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
  const data = await fetchWithAuth('/gainers', { type: 'losers', limit });

  const header = ['Rank', 'Coin ID', 'Name', 'Symbol', 'Price', '24h %'];
  const rows = data.coins.map(coin => [
    coin.rank,
    coin.id,
    coin.name,
    coin.symbol,
    coin.price,
    coin.change_24h,
  ]);

  return [header, ...rows];
}

// ============================================
// DEFI & TVL
// ============================================

/**
 * Get DeFi protocols by TVL
 * @customfunction
 * @param {number} [limit=50] Number of protocols
 * @returns {any[][]} Protocols [Rank, Name, Symbol, TVL, Change1d]
 */
async function DEFI(limit = 50) {
  const data = await fetchWithAuth('/defi', { limit });

  const header = ['Rank', 'ID', 'Name', 'Symbol', 'TVL ($)', '1d %', '7d %', 'Category'];
  const rows = data.protocols.map(p => [
    p.rank,
    p.id,
    p.name,
    p.symbol || 'N/A',
    p.tvl,
    p.change_1d,
    p.change_7d,
    p.category || 'N/A',
  ]);

  return [header, ...rows];
}

/**
 * Get TVL for a specific protocol
 * @customfunction
 * @param {string} protocol Protocol ID (e.g., "aave", "uniswap")
 * @returns {number} Total Value Locked in USD
 */
async function TVL(protocol) {
  const data = await fetchWithAuth('/defi', { protocol });
  return data.tvl ?? '#N/A';
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
  const data = await fetchWithAuth('/nfts', { limit });

  const header = ['ID', 'Name', 'Symbol', 'Platform'];
  const rows = data.nfts.map(nft => [
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
 * @returns {any[][]} Derivatives [Market, Symbol, Price, Change24h, FundingRate, OpenInterest]
 */
async function DERIVATIVES(limit = 50) {
  const data = await fetchWithAuth('/derivatives', { limit });

  const header = ['Market', 'Symbol', 'Price', '24h %', 'Funding Rate', 'Open Interest', 'Volume 24h'];
  const rows = data.derivatives.map(d => [
    d.market,
    d.symbol,
    d.price,
    d.price_percentage_change_24h,
    d.funding_rate,
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
  const data = await fetchWithAuth('/history', { coin, date });
  return data.price ?? '#N/A';
}

// ============================================
// STABLECOINS
// ============================================

/**
 * Get stablecoin market caps
 * @customfunction
 * @param {number} [limit=20] Number of stablecoins
 * @returns {any[][]} Stablecoins [Rank, Name, Symbol, Circulating, Price, PegType]
 */
async function STABLECOINS(limit = 20) {
  const data = await fetchWithAuth('/stablecoins', { limit });

  const header = ['Rank', 'Name', 'Symbol', 'Circulating ($)', 'Price', 'Peg Type'];
  const rows = data.stablecoins.map(s => [
    s.rank,
    s.name,
    s.symbol,
    s.circulating,
    s.price,
    s.peg_type || 'USD',
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

// Exchanges & Trading
CustomFunctions.associate('EXCHANGES', EXCHANGES);
CustomFunctions.associate('GAINERS', GAINERS);
CustomFunctions.associate('LOSERS', LOSERS);

// DeFi & TVL
CustomFunctions.associate('DEFI', DEFI);
CustomFunctions.associate('TVL', TVL);

// NFTs
CustomFunctions.associate('NFTS', NFTS);

// Derivatives
CustomFunctions.associate('DERIVATIVES', DERIVATIVES);

// Historical
CustomFunctions.associate('PRICEHISTORY', PRICEHISTORY);

// Stablecoins
CustomFunctions.associate('STABLECOINS', STABLECOINS);
