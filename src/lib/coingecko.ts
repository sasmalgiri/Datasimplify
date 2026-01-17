// CoinGecko API Client - FREE tier: 10K calls/month, 30 calls/min
// Used for: token metadata, logos, lists, fallback pricing

import { CoinMarketData, SearchResult } from '@/types/crypto';

const COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3';

// Simple in-memory cache to reduce API calls
const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 60 * 1000; // 1 minute cache

function getCached<T>(key: string): T | null {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data as T;
  }
  return null;
}

function setCache(key: string, data: unknown): void {
  cache.set(key, { data, timestamp: Date.now() });
}

async function fetchWithCache<T>(url: string, cacheKey: string): Promise<T | null> {
  // Check cache first
  const cached = getCached<T>(cacheKey);
  if (cached) return cached;

  try {
    const headers: HeadersInit = {
      'Accept': 'application/json',
      'User-Agent': 'CryptoReportKit/1.0',
    };
    
    // Add API key if available (higher rate limits)
    const apiKey = process.env.COINGECKO_API_KEY;
    if (apiKey) {
      headers['x-cg-demo-api-key'] = apiKey;
    }

    const response = await fetch(url, { 
      headers,
      next: { revalidate: 60 }, // Cache for 60 seconds
    });
    
    if (!response.ok) {
      console.error(`CoinGecko API error: ${response.status} ${response.statusText}`);
      return null;
    }
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error('CoinGecko returned non-JSON response');
      return null;
    }
    
    const data = await response.json();
    setCache(cacheKey, data);
    return data;
  } catch (error) {
    console.error('CoinGecko fetch error:', error);
    return null;
  }
}

// Get top coins by market cap
export async function getTopCoins(
  page: number = 1,
  perPage: number = 100,
  currency: string = 'usd'
): Promise<CoinMarketData[]> {
  const url = `${COINGECKO_BASE_URL}/coins/markets?vs_currency=${currency}&order=market_cap_desc&per_page=${perPage}&page=${page}&sparkline=false&price_change_percentage=24h,7d,30d`;
  const cacheKey = `top_coins_${page}_${perPage}_${currency}`;
  
  const data = await fetchWithCache<CoinMarketData[]>(url, cacheKey);
  return data || [];
}

// Get single coin details
export async function getCoinDetails(coinId: string): Promise<CoinMarketData | null> {
  const url = `${COINGECKO_BASE_URL}/coins/${coinId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false`;
  const cacheKey = `coin_${coinId}`;
  
  const data = await fetchWithCache<{
    id: string;
    symbol: string;
    name: string;
    image: { large: string };
    market_data: {
      current_price: { usd: number };
      market_cap: { usd: number };
      market_cap_rank: number;
      total_volume: { usd: number };
      high_24h: { usd: number };
      low_24h: { usd: number };
      price_change_24h: number;
      price_change_percentage_24h: number;
      price_change_percentage_7d: number;
      price_change_percentage_30d: number;
      market_cap_change_24h: number;
      market_cap_change_percentage_24h: number;
      circulating_supply: number;
      total_supply: number;
      max_supply: number;
      ath: { usd: number };
      ath_change_percentage: { usd: number };
      ath_date: { usd: string };
      atl: { usd: number };
      atl_change_percentage: { usd: number };
      atl_date: { usd: string };
      fully_diluted_valuation: { usd: number };
    };
    last_updated: string;
    description?: { en: string };
  }>(url, cacheKey);
  
  if (!data) return null;
  
  return {
    id: data.id,
    symbol: data.symbol,
    name: data.name,
    image: data.image.large,
    current_price: data.market_data.current_price.usd,
    market_cap: data.market_data.market_cap.usd,
    market_cap_rank: data.market_data.market_cap_rank,
    fully_diluted_valuation: data.market_data.fully_diluted_valuation?.usd || null,
    total_volume: data.market_data.total_volume.usd,
    high_24h: data.market_data.high_24h.usd,
    low_24h: data.market_data.low_24h.usd,
    price_change_24h: data.market_data.price_change_24h,
    price_change_percentage_24h: data.market_data.price_change_percentage_24h,
    price_change_percentage_7d: data.market_data.price_change_percentage_7d,
    price_change_percentage_30d: data.market_data.price_change_percentage_30d,
    market_cap_change_24h: data.market_data.market_cap_change_24h,
    market_cap_change_percentage_24h: data.market_data.market_cap_change_percentage_24h,
    circulating_supply: data.market_data.circulating_supply,
    total_supply: data.market_data.total_supply,
    max_supply: data.market_data.max_supply,
    ath: data.market_data.ath.usd,
    ath_change_percentage: data.market_data.ath_change_percentage.usd,
    ath_date: data.market_data.ath_date.usd,
    atl: data.market_data.atl.usd,
    atl_change_percentage: data.market_data.atl_change_percentage.usd,
    atl_date: data.market_data.atl_date.usd,
    last_updated: data.last_updated,
    description: data.description?.en,
  } as CoinMarketData;
}

// Get price history for charts
export async function getPriceHistory(
  coinId: string,
  days: number = 30,
  currency: string = 'usd'
): Promise<Array<{ timestamp: number; price: number }>> {
  const url = `${COINGECKO_BASE_URL}/coins/${coinId}/market_chart?vs_currency=${currency}&days=${days}`;
  const cacheKey = `history_${coinId}_${days}_${currency}`;
  
  const data = await fetchWithCache<{ prices: [number, number][] }>(url, cacheKey);
  
  if (!data?.prices) return [];
  
  return data.prices.map(([timestamp, price]) => ({
    timestamp,
    price,
  }));
}

// Search coins
export async function searchCoins(query: string): Promise<SearchResult[]> {
  const url = `${COINGECKO_BASE_URL}/search?query=${encodeURIComponent(query)}`;
  const cacheKey = `search_${query}`;
  
  const data = await fetchWithCache<{ coins: SearchResult[] }>(url, cacheKey);
  
  return data?.coins || [];
}

// Get coin list (for mapping IDs)
export async function getCoinList(): Promise<Array<{ id: string; symbol: string; name: string }>> {
  const url = `${COINGECKO_BASE_URL}/coins/list`;
  const cacheKey = 'coin_list';
  
  const data = await fetchWithCache<Array<{ id: string; symbol: string; name: string }>>(url, cacheKey);
  
  return data || [];
}

// Get trending coins
export async function getTrendingCoins(): Promise<SearchResult[]> {
  const url = `${COINGECKO_BASE_URL}/search/trending`;
  const cacheKey = 'trending';
  
  const data = await fetchWithCache<{ coins: Array<{ item: SearchResult }> }>(url, cacheKey);
  
  return data?.coins.map(c => c.item) || [];
}

// Get global market data
export async function getGlobalData(): Promise<{
  total_market_cap: number;
  total_volume: number;
  market_cap_percentage: { btc: number; eth: number };
  market_cap_change_percentage_24h: number;
  active_cryptocurrencies: number;
} | null> {
  const url = `${COINGECKO_BASE_URL}/global`;
  const cacheKey = 'global';
  
  const data = await fetchWithCache<{
    data: {
      total_market_cap: { usd: number };
      total_volume: { usd: number };
      market_cap_percentage: { btc: number; eth: number };
      market_cap_change_percentage_24h_usd: number;
      active_cryptocurrencies: number;
    };
  }>(url, cacheKey);
  
  if (!data?.data) return null;
  
  return {
    total_market_cap: data.data.total_market_cap.usd,
    total_volume: data.data.total_volume.usd,
    market_cap_percentage: data.data.market_cap_percentage,
    market_cap_change_percentage_24h: data.data.market_cap_change_percentage_24h_usd,
    active_cryptocurrencies: data.data.active_cryptocurrencies,
  };
}
