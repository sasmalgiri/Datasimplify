/**
 * CoinGecko API Client (Display-Only)
 *
 * IMPORTANT: This client is for DISPLAY-ONLY purposes.
 * CoinGecko data CANNOT be included in downloads without a redistribution license.
 *
 * Key requirements:
 * - Server-side only (never call from client)
 * - Central fetcher via scheduled jobs (not per-user calls)
 * - Circuit breakers (errors count toward rate limit)
 * - Rate limit: 500 req/min for Analyst plan
 */

// Rate limit configuration (Analyst plan)
const RATE_LIMIT = {
  requestsPerMinute: 500,
  requestsPerDay: 16666, // ~500k/month
};

// Circuit breaker configuration
const CIRCUIT_BREAKER = {
  failureThreshold: 5, // Open circuit after 5 consecutive failures
  resetTimeout: 60000, // Try again after 60 seconds
};

// Cache TTL configuration (in seconds)
export const CACHE_TTL = {
  prices: 60, // 60 seconds for current prices
  ohlcv: 300, // 5 minutes for OHLCV data
  metadata: 3600, // 1 hour for coin metadata
  historical: 86400, // 24 hours for historical data
  global: 300, // 5 minutes for global market data
};

interface RateLimitState {
  requestCount: number;
  windowStart: number;
  dailyCount: number;
  dayStart: number;
}

interface CircuitBreakerState {
  failures: number;
  lastFailure: number;
  isOpen: boolean;
}

// In-memory state (would use Redis in production)
let rateLimitState: RateLimitState = {
  requestCount: 0,
  windowStart: Date.now(),
  dailyCount: 0,
  dayStart: Date.now(),
};

let circuitBreakerState: CircuitBreakerState = {
  failures: 0,
  lastFailure: 0,
  isOpen: false,
};

/**
 * Check and update rate limit
 */
function checkRateLimit(): boolean {
  const now = Date.now();

  // Reset minute window
  if (now - rateLimitState.windowStart > 60000) {
    rateLimitState.requestCount = 0;
    rateLimitState.windowStart = now;
  }

  // Reset daily window
  if (now - rateLimitState.dayStart > 86400000) {
    rateLimitState.dailyCount = 0;
    rateLimitState.dayStart = now;
  }

  // Check limits
  if (rateLimitState.requestCount >= RATE_LIMIT.requestsPerMinute) {
    console.warn('[CoinGecko] Rate limit reached (per minute)');
    return false;
  }

  if (rateLimitState.dailyCount >= RATE_LIMIT.requestsPerDay) {
    console.warn('[CoinGecko] Rate limit reached (daily)');
    return false;
  }

  return true;
}

/**
 * Increment rate limit counters
 */
function incrementRateLimit(): void {
  rateLimitState.requestCount++;
  rateLimitState.dailyCount++;
}

/**
 * Check circuit breaker state
 */
function isCircuitOpen(): boolean {
  if (!circuitBreakerState.isOpen) return false;

  // Check if reset timeout has passed
  const now = Date.now();
  if (now - circuitBreakerState.lastFailure > CIRCUIT_BREAKER.resetTimeout) {
    // Try to close circuit (half-open state)
    circuitBreakerState.isOpen = false;
    circuitBreakerState.failures = 0;
    console.log('[CoinGecko] Circuit breaker reset (half-open)');
    return false;
  }

  return true;
}

/**
 * Record API failure
 */
function recordFailure(): void {
  circuitBreakerState.failures++;
  circuitBreakerState.lastFailure = Date.now();

  if (circuitBreakerState.failures >= CIRCUIT_BREAKER.failureThreshold) {
    circuitBreakerState.isOpen = true;
    console.error('[CoinGecko] Circuit breaker opened after repeated failures');
  }
}

/**
 * Record API success
 */
function recordSuccess(): void {
  circuitBreakerState.failures = 0;
  circuitBreakerState.isOpen = false;
}

/**
 * Get CoinGecko API base URL
 */
function getBaseUrl(): string {
  // Pro API uses different base URL
  const apiKey = process.env.COINGECKO_API_KEY;
  if (apiKey) {
    return 'https://pro-api.coingecko.com/api/v3';
  }
  return 'https://api.coingecko.com/api/v3';
}

/**
 * Get request headers
 */
function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  const apiKey = process.env.COINGECKO_API_KEY;
  if (apiKey) {
    headers['x-cg-pro-api-key'] = apiKey;
  }

  return headers;
}

export interface CoinGeckoResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  cached?: boolean;
  fetchedAt?: number;
}

/**
 * Make a CoinGecko API request with rate limiting and circuit breaker
 */
export async function fetchFromCoinGecko<T>(
  endpoint: string,
  params: Record<string, string | number | boolean> = {}
): Promise<CoinGeckoResponse<T>> {
  // Check circuit breaker
  if (isCircuitOpen()) {
    return {
      success: false,
      error: 'Circuit breaker is open - too many recent failures',
    };
  }

  // Check rate limit
  if (!checkRateLimit()) {
    return {
      success: false,
      error: 'Rate limit exceeded',
    };
  }

  // Build URL
  const baseUrl = getBaseUrl();
  const url = new URL(`${baseUrl}${endpoint}`);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, String(value));
  });

  // Increment rate limit BEFORE request (errors count toward limit)
  incrementRateLimit();

  try {
    const response = await fetch(url.toString(), {
      headers: getHeaders(),
      next: { revalidate: 0 }, // Disable Next.js caching (we manage our own)
    });

    if (!response.ok) {
      recordFailure();

      // Handle specific error codes
      if (response.status === 429) {
        return {
          success: false,
          error: 'CoinGecko rate limit exceeded (429)',
        };
      }

      return {
        success: false,
        error: `CoinGecko API error: ${response.status} ${response.statusText}`,
      };
    }

    const data = await response.json();
    recordSuccess();

    return {
      success: true,
      data: data as T,
      fetchedAt: Date.now(),
    };
  } catch (error) {
    recordFailure();
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// === API Endpoint Wrappers ===

export interface CoinGeckoCoin {
  id: string;
  symbol: string;
  name: string;
  image?: string;
  current_price?: number;
  market_cap?: number;
  market_cap_rank?: number;
  price_change_percentage_24h?: number;
  total_volume?: number;
  high_24h?: number;
  low_24h?: number;
  circulating_supply?: number;
  total_supply?: number;
  ath?: number;
  ath_change_percentage?: number;
  atl?: number;
  last_updated?: string;
}

export interface CoinGeckoOHLCV {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface CoinGeckoGlobal {
  data: {
    total_market_cap: Record<string, number>;
    total_volume: Record<string, number>;
    market_cap_percentage: Record<string, number>;
    market_cap_change_percentage_24h_usd: number;
    active_cryptocurrencies: number;
    markets: number;
  };
}

/**
 * Get coins markets (paginated list)
 */
export async function getCoinsMarkets(
  vsCurrency = 'usd',
  page = 1,
  perPage = 100
): Promise<CoinGeckoResponse<CoinGeckoCoin[]>> {
  return fetchFromCoinGecko<CoinGeckoCoin[]>('/coins/markets', {
    vs_currency: vsCurrency,
    order: 'market_cap_desc',
    per_page: perPage,
    page,
    sparkline: false,
    price_change_percentage: '24h,7d',
  });
}

/**
 * Get coin OHLC data
 */
export async function getCoinOHLC(
  coinId: string,
  vsCurrency = 'usd',
  days = 30
): Promise<CoinGeckoResponse<number[][]>> {
  return fetchFromCoinGecko<number[][]>(`/coins/${coinId}/ohlc`, {
    vs_currency: vsCurrency,
    days,
  });
}

/**
 * Get coin market chart (historical prices)
 */
export async function getCoinMarketChart(
  coinId: string,
  vsCurrency = 'usd',
  days: number | 'max' = 30
): Promise<
  CoinGeckoResponse<{
    prices: number[][];
    market_caps: number[][];
    total_volumes: number[][];
  }>
> {
  return fetchFromCoinGecko(`/coins/${coinId}/market_chart`, {
    vs_currency: vsCurrency,
    days: String(days),
  });
}

/**
 * Get global market data
 */
export async function getGlobalData(): Promise<CoinGeckoResponse<CoinGeckoGlobal>> {
  return fetchFromCoinGecko<CoinGeckoGlobal>('/global');
}

/**
 * Get coin details
 */
export async function getCoinDetails(coinId: string): Promise<
  CoinGeckoResponse<{
    id: string;
    symbol: string;
    name: string;
    description: { en: string };
    links: Record<string, unknown>;
    image: { large: string; small: string; thumb: string };
    market_data: Record<string, unknown>;
    categories: string[];
    genesis_date: string | null;
  }>
> {
  return fetchFromCoinGecko(`/coins/${coinId}`, {
    localization: false,
    tickers: false,
    market_data: true,
    community_data: false,
    developer_data: false,
    sparkline: false,
  });
}

/**
 * Get rate limit status (for monitoring)
 */
export function getRateLimitStatus(): {
  minuteUsed: number;
  minuteLimit: number;
  dailyUsed: number;
  dailyLimit: number;
  circuitOpen: boolean;
} {
  return {
    minuteUsed: rateLimitState.requestCount,
    minuteLimit: RATE_LIMIT.requestsPerMinute,
    dailyUsed: rateLimitState.dailyCount,
    dailyLimit: RATE_LIMIT.requestsPerDay,
    circuitOpen: circuitBreakerState.isOpen,
  };
}
