/* global CustomFunctions */

/**
 * CryptoReportKit Custom Functions for Excel
 *
 * These functions fetch crypto data from the CRK API using the user's
 * authenticated session (BYOK - Bring Your Own Key architecture).
 */

const API_BASE = 'https://cryptoreportkit.com/api/v1';

// Request cache with TTL
const requestCache = new Map();
const CACHE_TTL = 30000; // 30 seconds

// Token cache (loaded from OfficeRuntime.storage)
let cachedToken = null;

/**
 * Get the authentication token from OfficeRuntime.storage
 * Token is stored by the taskpane after successful dialog login
 *
 * OfficeRuntime.storage is the recommended storage for Excel add-ins
 * as it persists across sessions and is more reliable than localStorage
 */
async function getAuthToken() {
  // Return cached token if available
  if (cachedToken) {
    return cachedToken;
  }

  try {
    // Try OfficeRuntime.storage first (recommended for add-ins)
    if (typeof OfficeRuntime !== 'undefined' && OfficeRuntime.storage) {
      const token = await OfficeRuntime.storage.getItem('crk_auth_token');
      if (token) {
        cachedToken = token;
        return token;
      }
    }

    // Fallback to localStorage for development/testing
    if (typeof localStorage !== 'undefined') {
      const token = localStorage.getItem('crk_auth_token');
      if (token) {
        cachedToken = token;
        return token;
      }
    }

    return null;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
}

/**
 * Clear the cached token (call when logging out)
 */
function clearTokenCache() {
  cachedToken = null;
}

/**
 * Fetch data from the CRK API with authentication
 */
async function fetchWithAuth(endpoint, params = {}) {
  const token = await getAuthToken();

  if (!token) {
    throw new CustomFunctions.Error(
      CustomFunctions.ErrorCode.invalidValue,
      'Not logged in. Open the CRK Panel to sign in.'
    );
  }

  // Build URL with query parameters
  const url = new URL(`${API_BASE}${endpoint}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value));
    }
  });

  // Check cache
  const cacheKey = url.toString();
  const cached = requestCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      if (response.status === 401) {
        throw new CustomFunctions.Error(
          CustomFunctions.ErrorCode.invalidValue,
          'Session expired. Please sign in again via the CRK Panel.'
        );
      }

      if (response.status === 429) {
        throw new CustomFunctions.Error(
          CustomFunctions.ErrorCode.invalidValue,
          'Rate limit exceeded. Connect your own API key for higher limits.'
        );
      }

      throw new CustomFunctions.Error(
        CustomFunctions.ErrorCode.invalidValue,
        errorData.error || `API error: ${response.status}`
      );
    }

    const data = await response.json();

    // Cache the result
    requestCache.set(cacheKey, { data, timestamp: Date.now() });

    return data;
  } catch (error) {
    if (error instanceof CustomFunctions.Error) {
      throw error;
    }
    throw new CustomFunctions.Error(
      CustomFunctions.ErrorCode.invalidValue,
      'Network error. Please check your connection.'
    );
  }
}

/**
 * Get current price of a cryptocurrency
 * @customfunction
 * @param {string} coin Coin ID (e.g., "bitcoin", "ethereum")
 * @param {string} [currency="usd"] Target currency
 * @returns {number} Current price
 */
async function PRICE(coin, currency) {
  if (!coin) {
    throw new CustomFunctions.Error(
      CustomFunctions.ErrorCode.invalidValue,
      'Coin ID is required'
    );
  }

  const curr = currency || 'usd';
  const result = await fetchWithAuth('/price', { coin: coin.toLowerCase(), currency: curr });

  // Handle the response structure from our API
  const priceData = result.data || result;
  const coinData = priceData[coin.toLowerCase()];

  if (!coinData || coinData[curr] === undefined) {
    throw new CustomFunctions.Error(
      CustomFunctions.ErrorCode.invalidValue,
      `Price not found for ${coin}`
    );
  }

  return coinData[curr];
}

/**
 * Get 24-hour price change percentage
 * @customfunction
 * @param {string} coin Coin ID (e.g., "bitcoin")
 * @returns {number} 24h change percentage
 */
async function CHANGE24H(coin) {
  if (!coin) {
    throw new CustomFunctions.Error(
      CustomFunctions.ErrorCode.invalidValue,
      'Coin ID is required'
    );
  }

  const result = await fetchWithAuth('/price', {
    coin: coin.toLowerCase(),
    currency: 'usd',
    include_change: 'true'
  });

  const priceData = result.data || result;
  const coinData = priceData[coin.toLowerCase()];

  if (!coinData || coinData.usd_24h_change === undefined) {
    throw new CustomFunctions.Error(
      CustomFunctions.ErrorCode.invalidValue,
      `Change data not found for ${coin}`
    );
  }

  return coinData.usd_24h_change;
}

/**
 * Get market capitalization
 * @customfunction
 * @param {string} coin Coin ID (e.g., "bitcoin")
 * @param {string} [currency="usd"] Target currency
 * @returns {number} Market cap
 */
async function MARKETCAP(coin, currency) {
  if (!coin) {
    throw new CustomFunctions.Error(
      CustomFunctions.ErrorCode.invalidValue,
      'Coin ID is required'
    );
  }

  const curr = currency || 'usd';
  const result = await fetchWithAuth('/price', {
    coin: coin.toLowerCase(),
    currency: curr,
    include_market_cap: 'true'
  });

  const priceData = result.data || result;
  const coinData = priceData[coin.toLowerCase()];
  const marketCapKey = `${curr}_market_cap`;

  if (!coinData || coinData[marketCapKey] === undefined) {
    throw new CustomFunctions.Error(
      CustomFunctions.ErrorCode.invalidValue,
      `Market cap not found for ${coin}`
    );
  }

  return coinData[marketCapKey];
}

/**
 * Get 24-hour trading volume
 * @customfunction
 * @param {string} coin Coin ID (e.g., "bitcoin")
 * @param {string} [currency="usd"] Target currency
 * @returns {number} 24h volume
 */
async function VOLUME(coin, currency) {
  if (!coin) {
    throw new CustomFunctions.Error(
      CustomFunctions.ErrorCode.invalidValue,
      'Coin ID is required'
    );
  }

  const curr = currency || 'usd';
  const result = await fetchWithAuth('/price', {
    coin: coin.toLowerCase(),
    currency: curr
  });

  const priceData = result.data || result;
  const coinData = priceData[coin.toLowerCase()];
  const volumeKey = `${curr}_24h_vol`;

  if (!coinData || coinData[volumeKey] === undefined) {
    // If volume not available, return 0 or throw
    return 0;
  }

  return coinData[volumeKey];
}

/**
 * Get OHLCV data as a spilled array
 * @customfunction
 * @param {string} coin Coin ID (e.g., "bitcoin")
 * @param {number} [days=30] Number of days (1, 7, 14, 30, 90, 180, 365)
 * @returns {any[][]} OHLCV matrix with header row
 */
async function OHLCV(coin, days) {
  if (!coin) {
    throw new CustomFunctions.Error(
      CustomFunctions.ErrorCode.invalidValue,
      'Coin ID is required'
    );
  }

  const numDays = days || 30;
  const result = await fetchWithAuth('/ohlcv', {
    coin: coin.toLowerCase(),
    days: numDays
  });

  // API returns { data: [...], raw: [...], meta: {...} }
  const rawData = result.raw || result.data || result;

  if (!Array.isArray(rawData) || rawData.length === 0) {
    throw new CustomFunctions.Error(
      CustomFunctions.ErrorCode.invalidValue,
      `No OHLCV data found for ${coin}`
    );
  }

  // Add header row
  const header = ['Date', 'Open', 'High', 'Low', 'Close'];

  // Transform data: [[timestamp, o, h, l, c], ...] -> [[date, o, h, l, c], ...]
  const rows = rawData.map(row => {
    const date = new Date(row[0]);
    return [
      date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      row[1],
      row[2],
      row[3],
      row[4]
    ];
  });

  return [header, ...rows];
}

/**
 * Get coin metadata
 * @customfunction
 * @param {string} coin Coin ID (e.g., "bitcoin")
 * @param {string} field Field name (name, symbol, rank, ath, atl, circulating_supply, total_supply)
 * @returns {any} Field value
 */
async function INFO(coin, field) {
  if (!coin) {
    throw new CustomFunctions.Error(
      CustomFunctions.ErrorCode.invalidValue,
      'Coin ID is required'
    );
  }

  if (!field) {
    throw new CustomFunctions.Error(
      CustomFunctions.ErrorCode.invalidValue,
      'Field name is required'
    );
  }

  // For now, use the price endpoint for basic info
  // In the future, we can add a dedicated /info endpoint
  const result = await fetchWithAuth('/price', {
    coin: coin.toLowerCase(),
    currency: 'usd',
    include_market_cap: 'true',
    include_change: 'true'
  });

  const priceData = result.data || result;
  const coinData = priceData[coin.toLowerCase()];

  if (!coinData) {
    throw new CustomFunctions.Error(
      CustomFunctions.ErrorCode.invalidValue,
      `Data not found for ${coin}`
    );
  }

  // Map field names to data
  const fieldLower = field.toLowerCase();

  switch (fieldLower) {
    case 'price':
    case 'current_price':
      return coinData.usd;
    case 'change':
    case 'change_24h':
    case 'price_change_24h':
      return coinData.usd_24h_change;
    case 'market_cap':
    case 'marketcap':
      return coinData.usd_market_cap;
    default:
      // Try direct field access
      if (coinData[fieldLower] !== undefined) {
        return coinData[fieldLower];
      }
      throw new CustomFunctions.Error(
        CustomFunctions.ErrorCode.invalidValue,
        `Field "${field}" not available. Try: price, change_24h, market_cap`
      );
  }
}

// Register functions with CustomFunctions runtime
CustomFunctions.associate('PRICE', PRICE);
CustomFunctions.associate('CHANGE24H', CHANGE24H);
CustomFunctions.associate('MARKETCAP', MARKETCAP);
CustomFunctions.associate('VOLUME', VOLUME);
CustomFunctions.associate('OHLCV', OHLCV);
CustomFunctions.associate('INFO', INFO);
