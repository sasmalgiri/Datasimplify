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
const rateLimitState: RateLimitState = {
  requestCount: 0,
  windowStart: Date.now(),
  dailyCount: 0,
  dayStart: Date.now(),
};

const circuitBreakerState: CircuitBreakerState = {
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

// === NEW ANALYST PLAN ENDPOINTS ===

export interface TrendingCoin {
  item: {
    id: string;
    coin_id: number;
    name: string;
    symbol: string;
    market_cap_rank: number;
    thumb: string;
    small: string;
    large: string;
    slug: string;
    price_btc: number;
    score: number;
    data?: {
      price: number;
      price_btc: string;
      price_change_percentage_24h: Record<string, number>;
      market_cap: string;
      market_cap_btc: string;
      total_volume: string;
      total_volume_btc: string;
      sparkline: string;
      content: { title: string; description: string } | null;
    };
  };
}

export interface TrendingResponse {
  coins: TrendingCoin[];
  nfts?: Array<{
    id: string;
    name: string;
    symbol: string;
    thumb: string;
  }>;
  categories?: Array<{
    id: number;
    name: string;
    market_cap_1h_change: number;
    slug: string;
  }>;
}

/**
 * Get trending coins (Analyst plan feature)
 * Returns top 7 trending coins based on search activity
 */
export async function getTrendingCoins(): Promise<CoinGeckoResponse<TrendingResponse>> {
  return fetchFromCoinGecko<TrendingResponse>('/search/trending');
}

export interface CoinCategory {
  id: string;
  name: string;
  market_cap?: number;
  market_cap_change_24h?: number;
  content?: string;
  top_3_coins?: string[];
  volume_24h?: number;
  updated_at?: string;
}

/**
 * Get all coin categories
 */
export async function getCategories(): Promise<CoinGeckoResponse<CoinCategory[]>> {
  return fetchFromCoinGecko<CoinCategory[]>('/coins/categories');
}

/**
 * Get coins by category
 */
export async function getCoinsByCategory(
  categoryId: string,
  vsCurrency = 'usd',
  page = 1,
  perPage = 100
): Promise<CoinGeckoResponse<CoinGeckoCoin[]>> {
  return fetchFromCoinGecko<CoinGeckoCoin[]>('/coins/markets', {
    vs_currency: vsCurrency,
    category: categoryId,
    order: 'market_cap_desc',
    per_page: perPage,
    page,
    sparkline: false,
    price_change_percentage: '24h,7d',
  });
}

/**
 * Get top gainers (coins with highest 24h price increase)
 * Uses market data sorted by price change
 */
export async function getTopGainers(
  vsCurrency = 'usd',
  limit = 10
): Promise<CoinGeckoResponse<CoinGeckoCoin[]>> {
  // Fetch top 250 coins and sort by price change
  const result = await fetchFromCoinGecko<CoinGeckoCoin[]>('/coins/markets', {
    vs_currency: vsCurrency,
    order: 'market_cap_desc',
    per_page: 250,
    page: 1,
    sparkline: false,
    price_change_percentage: '24h',
  });

  if (!result.success || !result.data) {
    return result;
  }

  // Sort by 24h price change (descending) and take top gainers
  const gainers = result.data
    .filter((coin) => coin.price_change_percentage_24h && coin.price_change_percentage_24h > 0)
    .sort((a, b) => (b.price_change_percentage_24h || 0) - (a.price_change_percentage_24h || 0))
    .slice(0, limit);

  return {
    success: true,
    data: gainers,
    fetchedAt: result.fetchedAt,
  };
}

/**
 * Get top losers (coins with highest 24h price decrease)
 * Uses market data sorted by price change
 */
export async function getTopLosers(
  vsCurrency = 'usd',
  limit = 10
): Promise<CoinGeckoResponse<CoinGeckoCoin[]>> {
  // Fetch top 250 coins and sort by price change
  const result = await fetchFromCoinGecko<CoinGeckoCoin[]>('/coins/markets', {
    vs_currency: vsCurrency,
    order: 'market_cap_desc',
    per_page: 250,
    page: 1,
    sparkline: false,
    price_change_percentage: '24h',
  });

  if (!result.success || !result.data) {
    return result;
  }

  // Sort by 24h price change (ascending) and take top losers
  const losers = result.data
    .filter((coin) => coin.price_change_percentage_24h && coin.price_change_percentage_24h < 0)
    .sort((a, b) => (a.price_change_percentage_24h || 0) - (b.price_change_percentage_24h || 0))
    .slice(0, limit);

  return {
    success: true,
    data: losers,
    fetchedAt: result.fetchedAt,
  };
}

/**
 * Get global market chart (historical global data)
 * Available for Analyst plan
 */
export async function getGlobalMarketChart(
  days: number | 'max' = 30
): Promise<
  CoinGeckoResponse<{
    market_cap_chart: { [date: string]: number[] };
  }>
> {
  return fetchFromCoinGecko('/global/market_cap_chart', {
    days: String(days),
  });
}

/**
 * Search for coins by query
 */
export async function searchCoins(
  query: string
): Promise<
  CoinGeckoResponse<{
    coins: Array<{
      id: string;
      name: string;
      api_symbol: string;
      symbol: string;
      market_cap_rank: number;
      thumb: string;
      large: string;
    }>;
    exchanges: Array<{ id: string; name: string; market_type: string; thumb: string; large: string }>;
    categories: Array<{ id: number; name: string }>;
    nfts: Array<{ id: string; name: string; symbol: string; thumb: string }>;
  }>
> {
  return fetchFromCoinGecko('/search', { query });
}

// === DEVELOPER AND SOCIAL DATA ===

export interface DeveloperData {
  forks: number;
  stars: number;
  subscribers: number;
  total_issues: number;
  closed_issues: number;
  pull_requests_merged: number;
  pull_request_contributors: number;
  code_additions_deletions_4_weeks: {
    additions: number;
    deletions: number;
  };
  commit_count_4_weeks: number;
  last_4_weeks_commit_activity_series: number[];
}

export interface CommunityData {
  facebook_likes: number | null;
  twitter_followers: number | null;
  reddit_average_posts_48h: number;
  reddit_average_comments_48h: number;
  reddit_subscribers: number;
  reddit_accounts_active_48h: number;
  telegram_channel_user_count: number | null;
}

export interface CoinDetailedInfo {
  id: string;
  symbol: string;
  name: string;
  description: { en: string };
  links: {
    homepage: string[];
    blockchain_site: string[];
    official_forum_url: string[];
    chat_url: string[];
    announcement_url: string[];
    twitter_screen_name: string | null;
    facebook_username: string | null;
    telegram_channel_identifier: string | null;
    subreddit_url: string | null;
    repos_url: {
      github: string[];
      bitbucket: string[];
    };
  };
  image: { large: string; small: string; thumb: string };
  market_data: {
    current_price: Record<string, number>;
    market_cap: Record<string, number>;
    total_volume: Record<string, number>;
    price_change_percentage_24h: number;
    price_change_percentage_7d: number;
    price_change_percentage_30d: number;
  };
  categories: string[];
  genesis_date: string | null;
  developer_data: DeveloperData;
  community_data: CommunityData;
  public_interest_stats: {
    alexa_rank: number | null;
    bing_matches: number | null;
  };
  sentiment_votes_up_percentage: number;
  sentiment_votes_down_percentage: number;
  watchlist_portfolio_users: number;
  last_updated: string;
}

/**
 * Get detailed coin info with developer and community data
 * (Analyst plan feature)
 */
export async function getCoinDetailedInfo(coinId: string): Promise<CoinGeckoResponse<CoinDetailedInfo>> {
  return fetchFromCoinGecko<CoinDetailedInfo>(`/coins/${coinId}`, {
    localization: false,
    tickers: false,
    market_data: true,
    community_data: true,
    developer_data: true,
    sparkline: false,
  });
}
