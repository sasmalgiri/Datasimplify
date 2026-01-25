/* global CustomFunctions, OfficeRuntime */

/**
 * CRK Custom Functions for Excel
 *
 * These functions fetch live crypto data using user's BYOK API keys
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
  // Add header row
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

/**
 * Get coin metadata
 * @customfunction
 * @param {string} coin Coin ID
 * @param {string} field Field name
 * @returns {any} Field value
 */
async function INFO(coin, field) {
  const data = await fetchWithAuth('/price', { coin });
  return data[field] ?? '#N/A';
}

// Register functions with CustomFunctions
CustomFunctions.associate('PRICE', PRICE);
CustomFunctions.associate('CHANGE24H', CHANGE24H);
CustomFunctions.associate('MARKETCAP', MARKETCAP);
CustomFunctions.associate('VOLUME', VOLUME);
CustomFunctions.associate('OHLCV', OHLCV);
CustomFunctions.associate('INFO', INFO);
