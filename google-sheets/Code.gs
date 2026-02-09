/**
 * CryptoReportKit for Google Sheets
 *
 * BYOK Architecture: API keys stored in user's PropertiesService
 * All API calls go directly to CoinGecko - never through CRK servers
 *
 * Top 15 custom functions ported from the Excel add-in.
 */

// ============================================
// CONFIGURATION
// ============================================

var COINGECKO_PRO = 'https://pro-api.coingecko.com/api/v3';
var COINGECKO_FREE = 'https://api.coingecko.com/api/v3';
var CACHE_TTL_SECONDS = 30;

// ============================================
// API KEY MANAGEMENT (BYOK)
// ============================================

function getApiKey_() {
  return PropertiesService.getUserProperties().getProperty('crk_coingecko_key') || '';
}

function setApiKey(key) {
  PropertiesService.getUserProperties().setProperty('crk_coingecko_key', key);
  return 'API key saved successfully';
}

function clearApiKey() {
  PropertiesService.getUserProperties().deleteProperty('crk_coingecko_key');
  return 'API key removed';
}

// ============================================
// FETCH HELPER WITH CACHE
// ============================================

function fetchCoinGecko_(endpoint, params) {
  var apiKey = getApiKey_();
  var baseUrl = apiKey ? COINGECKO_PRO : COINGECKO_FREE;
  var url = baseUrl + endpoint;

  // Build query string
  var queryParts = [];
  if (params) {
    for (var key in params) {
      if (params[key] !== undefined && params[key] !== null) {
        queryParts.push(encodeURIComponent(key) + '=' + encodeURIComponent(params[key]));
      }
    }
  }
  if (queryParts.length > 0) url += '?' + queryParts.join('&');

  // Check cache
  var cache = CacheService.getScriptCache();
  var cacheKey = Utilities.base64Encode(url);
  var cached = cache.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  // Fetch
  var options = { muteHttpExceptions: true };
  if (apiKey) {
    options.headers = { 'x-cg-pro-api-key': apiKey };
  }

  var response = UrlFetchApp.fetch(url, options);
  var code = response.getResponseCode();

  if (code === 401 && apiKey) {
    // Fallback to free API
    var freeUrl = COINGECKO_FREE + endpoint;
    if (queryParts.length > 0) freeUrl += '?' + queryParts.join('&');
    response = UrlFetchApp.fetch(freeUrl, { muteHttpExceptions: true });
    code = response.getResponseCode();
  }

  if (code !== 200) {
    throw new Error('API error: ' + code);
  }

  var data = JSON.parse(response.getContentText());

  // Cache for 30 seconds
  try {
    cache.put(cacheKey, JSON.stringify(data), CACHE_TTL_SECONDS);
  } catch (e) { /* cache too large, skip */ }

  return data;
}

// ============================================
// CUSTOM FUNCTIONS
// ============================================

/**
 * Get current price of a cryptocurrency
 * @param {string} coin Coin ID (e.g., "bitcoin", "ethereum")
 * @param {string} currency Currency (default: "usd")
 * @return {number} Current price
 * @customfunction
 */
function CRKPRICE(coin, currency) {
  currency = currency || 'usd';
  var data = fetchCoinGecko_('/simple/price', {
    ids: coin.toLowerCase(),
    vs_currencies: currency.toLowerCase(),
  });
  return data[coin.toLowerCase()][currency.toLowerCase()];
}

/**
 * Get 24-hour price change percentage
 * @param {string} coin Coin ID
 * @return {number} 24h change percentage
 * @customfunction
 */
function CRKCHANGE24H(coin) {
  var data = fetchCoinGecko_('/simple/price', {
    ids: coin.toLowerCase(),
    vs_currencies: 'usd',
    include_24hr_change: 'true',
  });
  return data[coin.toLowerCase()].usd_24h_change;
}

/**
 * Get market capitalization
 * @param {string} coin Coin ID
 * @return {number} Market cap in USD
 * @customfunction
 */
function CRKMARKETCAP(coin) {
  var data = fetchCoinGecko_('/simple/price', {
    ids: coin.toLowerCase(),
    vs_currencies: 'usd',
    include_market_cap: 'true',
  });
  return data[coin.toLowerCase()].usd_market_cap;
}

/**
 * Get 24h trading volume
 * @param {string} coin Coin ID
 * @return {number} 24h volume in USD
 * @customfunction
 */
function CRKVOLUME(coin) {
  var data = fetchCoinGecko_('/simple/price', {
    ids: coin.toLowerCase(),
    vs_currencies: 'usd',
    include_24hr_vol: 'true',
  });
  return data[coin.toLowerCase()].usd_24h_vol;
}

/**
 * Get market cap rank
 * @param {string} coin Coin ID
 * @return {number} Rank
 * @customfunction
 */
function CRKRANK(coin) {
  var data = fetchCoinGecko_('/coins/' + coin.toLowerCase(), {
    localization: 'false',
    tickers: 'false',
    market_data: 'false',
    community_data: 'false',
    developer_data: 'false',
  });
  return data.market_cap_rank;
}

/**
 * Get Fear & Greed Index
 * @param {string} field "value" or "class" (default: value)
 * @return {string|number} Index value or classification
 * @customfunction
 */
function CRKFEARGREED(field) {
  var response = UrlFetchApp.fetch('https://api.alternative.me/fng/?limit=1');
  var data = JSON.parse(response.getContentText());
  var fng = data.data[0];
  if (field && field.toLowerCase() === 'class') {
    return fng.value_classification;
  }
  return parseInt(fng.value, 10);
}

/**
 * Get Bitcoin dominance
 * @return {number} BTC dominance percentage
 * @customfunction
 */
function CRKBTCDOM() {
  var data = fetchCoinGecko_('/global', {});
  return data.data.market_cap_percentage.btc;
}

/**
 * Get global market data
 * @param {string} field Field name
 * @return {number} Value
 * @customfunction
 */
function CRKGLOBAL(field) {
  var data = fetchCoinGecko_('/global', {});
  var d = data.data;
  if (!field) return d.total_market_cap.usd;
  field = field.toLowerCase();
  if (field === 'total_market_cap') return d.total_market_cap.usd;
  if (field === 'total_volume') return d.total_volume.usd;
  if (field === 'btc_dominance') return d.market_cap_percentage.btc;
  if (field === 'active_cryptocurrencies') return d.active_cryptocurrencies;
  return 'Unknown field';
}

/**
 * Get batch prices for multiple coins
 * @param {string} coins Comma-separated coin IDs
 * @param {string} field Field: price, change_24h, market_cap, volume
 * @return {Array} Matrix of results
 * @customfunction
 */
function CRKBATCH(coins, field) {
  field = field || 'price';
  var data = fetchCoinGecko_('/simple/price', {
    ids: coins.toLowerCase(),
    vs_currencies: 'usd',
    include_24hr_change: 'true',
    include_market_cap: 'true',
    include_24hr_vol: 'true',
  });

  var coinList = coins.toLowerCase().split(',');
  var rows = [['Coin', field.charAt(0).toUpperCase() + field.slice(1)]];
  for (var i = 0; i < coinList.length; i++) {
    var coin = coinList[i].trim();
    var info = data[coin];
    if (!info) { rows.push([coin, 'N/A']); continue; }
    var value;
    if (field === 'price') value = info.usd;
    else if (field === 'change_24h') value = info.usd_24h_change;
    else if (field === 'market_cap') value = info.usd_market_cap;
    else if (field === 'volume') value = info.usd_24h_vol;
    else value = info.usd;
    rows.push([coin, value]);
  }
  return rows;
}

/**
 * Search for coins
 * @param {string} query Search query
 * @param {number} limit Results limit (default: 10)
 * @return {Array} Search results
 * @customfunction
 */
function CRKSEARCH(query, limit) {
  limit = limit || 10;
  var data = fetchCoinGecko_('/search', { query: query });
  var coins = data.coins || [];
  var rows = [['ID', 'Symbol', 'Name', 'Market Cap Rank']];
  var count = Math.min(coins.length, limit);
  for (var i = 0; i < count; i++) {
    rows.push([coins[i].id, coins[i].symbol, coins[i].name, coins[i].market_cap_rank || 'N/A']);
  }
  return rows;
}

/**
 * Calculate Simple Moving Average
 * @param {string} coin Coin ID
 * @param {number} period SMA period (default: 20)
 * @return {number} SMA value
 * @customfunction
 */
function CRKSMA(coin, period) {
  period = period || 20;
  var data = fetchCoinGecko_('/coins/' + coin.toLowerCase() + '/market_chart', {
    vs_currency: 'usd',
    days: Math.max(period + 5, 30).toString(),
  });
  var prices = data.prices || [];
  if (prices.length < period) return 'Insufficient data';
  var sum = 0;
  for (var i = prices.length - period; i < prices.length; i++) {
    sum += prices[i][1];
  }
  return Math.round((sum / period) * 100) / 100;
}

/**
 * Calculate RSI
 * @param {string} coin Coin ID
 * @param {number} period RSI period (default: 14)
 * @return {number} RSI value (0-100)
 * @customfunction
 */
function CRKRSI(coin, period) {
  period = period || 14;
  var data = fetchCoinGecko_('/coins/' + coin.toLowerCase() + '/market_chart', {
    vs_currency: 'usd',
    days: (period + 10).toString(),
  });
  var prices = data.prices || [];
  if (prices.length < period + 1) return 'Insufficient data';

  var gains = 0, losses = 0;
  for (var i = prices.length - period; i < prices.length; i++) {
    var change = prices[i][1] - prices[i - 1][1];
    if (change > 0) gains += change;
    else losses += Math.abs(change);
  }

  var avgGain = gains / period;
  var avgLoss = losses / period;
  if (avgLoss === 0) return 100;
  var rs = avgGain / avgLoss;
  return Math.round((100 - (100 / (1 + rs))) * 100) / 100;
}

/**
 * Get Total Value Locked for a DeFi protocol
 * @param {string} protocol Protocol ID (e.g., "aave", "uniswap")
 * @return {number} TVL in USD
 * @customfunction
 */
function CRKTVL(protocol) {
  var response = UrlFetchApp.fetch('https://api.llama.fi/tvl/' + protocol.toLowerCase());
  return parseFloat(response.getContentText());
}

/**
 * Convert between crypto/fiat
 * @param {number} amount Amount to convert
 * @param {string} from Source coin ID
 * @param {string} to Target coin ID or currency
 * @return {number} Converted amount
 * @customfunction
 */
function CRKCONVERT(amount, from, to) {
  var data = fetchCoinGecko_('/simple/price', {
    ids: from.toLowerCase() + ',' + to.toLowerCase(),
    vs_currencies: 'usd',
  });
  var fromPrice = data[from.toLowerCase()] ? data[from.toLowerCase()].usd : 1;
  var toPrice = data[to.toLowerCase()] ? data[to.toLowerCase()].usd : 1;
  return Math.round((amount * fromPrice / toPrice) * 100000000) / 100000000;
}

// ============================================
// SIDEBAR UI
// ============================================

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('CRK')
    .addItem('Set API Key', 'showApiKeyDialog')
    .addItem('Remove API Key', 'clearApiKey')
    .addSeparator()
    .addItem('About CryptoReportKit', 'showAbout')
    .addToUi();
}

function showApiKeyDialog() {
  var html = HtmlService.createHtmlOutputFromFile('Sidebar')
    .setWidth(300)
    .setTitle('CRK API Key');
  SpreadsheetApp.getUi().showSidebar(html);
}

function showAbout() {
  var ui = SpreadsheetApp.getUi();
  ui.alert(
    'CryptoReportKit for Google Sheets',
    '15 crypto functions with BYOK architecture.\\n\\n' +
    'Functions: CRKPRICE, CRKCHANGE24H, CRKMARKETCAP, CRKVOLUME, ' +
    'CRKRANK, CRKFEARGREED, CRKBTCDOM, CRKGLOBAL, CRKBATCH, ' +
    'CRKSEARCH, CRKSMA, CRKRSI, CRKTVL, CRKCONVERT\\n\\n' +
    'Visit cryptoreportkit.com for more.',
    ui.ButtonSet.OK
  );
}
