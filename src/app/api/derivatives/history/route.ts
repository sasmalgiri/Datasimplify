import { NextResponse } from 'next/server';
import { assertRedistributionAllowed } from '@/lib/redistributionPolicy';

export const dynamic = 'force-dynamic';
export const revalidate = 300; // 5 minutes

// In-memory cache with 5 minute TTL
const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const REQUEST_TIMEOUT = 10000; // 10 seconds

interface FundingRateHistory {
  timestamp: number;
  fundingRate: number;
  fundingTime: string;
}

interface OIHistory {
  timestamp: number;
  openInterest: number;
  openInterestValue: number;
}

// Helper to fetch with timeout
async function fetchWithTimeout(url: string, timeout: number = REQUEST_TIMEOUT): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      next: { revalidate: 300 }
    });
    clearTimeout(timeoutId);
    return res;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// Get from cache or fetch
function getFromCache<T>(key: string): T | null {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data as T;
  }
  return null;
}

function setCache(key: string, data: unknown): void {
  cache.set(key, { data, timestamp: Date.now() });
  // Cleanup old entries (keep cache size manageable)
  if (cache.size > 50) {
    const oldest = [...cache.entries()].sort((a, b) => a[1].timestamp - b[1].timestamp)[0];
    if (oldest) cache.delete(oldest[0]);
  }
}

// Fetch historical funding rates from Binance (free API)
async function fetchFundingRateHistory(symbol: string, limit: number = 100): Promise<FundingRateHistory[]> {
  const cacheKey = `funding_${symbol}_${limit}`;
  const cached = getFromCache<FundingRateHistory[]>(cacheKey);
  if (cached) return cached;

  try {
    const res = await fetchWithTimeout(
      `https://fapi.binance.com/fapi/v1/fundingRate?symbol=${symbol}USDT&limit=${limit}`
    );

    if (res.status === 429) {
      console.warn('Binance rate limit hit for funding rate');
      return cached || [];
    }
    if (!res.ok) return [];

    const data = await res.json();
    if (!Array.isArray(data)) return [];

    const result = data.map((item: { fundingTime: number; fundingRate: string }) => ({
      timestamp: item.fundingTime,
      fundingRate: parseFloat(item.fundingRate) * 100, // Convert to percentage
      fundingTime: new Date(item.fundingTime).toISOString(),
    })).reverse(); // Oldest first for charting

    setCache(cacheKey, result);
    return result;
  } catch (error) {
    console.error('Error fetching funding rate history:', error);
    return [];
  }
}

// Fetch historical open interest from Binance (free API)
async function fetchOIHistory(symbol: string, period: string = '1h', limit: number = 100): Promise<OIHistory[]> {
  const cacheKey = `oi_${symbol}_${period}_${limit}`;
  const cached = getFromCache<OIHistory[]>(cacheKey);
  if (cached) return cached;

  try {
    const res = await fetchWithTimeout(
      `https://fapi.binance.com/futures/data/openInterestHist?symbol=${symbol}USDT&period=${period}&limit=${limit}`
    );

    if (res.status === 429) {
      console.warn('Binance rate limit hit for OI history');
      return cached || [];
    }
    if (!res.ok) return [];

    const data = await res.json();
    if (!Array.isArray(data)) return [];

    const result = data.map((item: { timestamp: number; sumOpenInterest: string; sumOpenInterestValue: string }) => ({
      timestamp: item.timestamp,
      openInterest: parseFloat(item.sumOpenInterest),
      openInterestValue: parseFloat(item.sumOpenInterestValue),
    }));

    setCache(cacheKey, result);
    return result;
  } catch (error) {
    console.error('Error fetching OI history:', error);
    return [];
  }
}

// Fetch long/short ratio history from Binance (free API)
async function fetchLongShortHistory(symbol: string, period: string = '1h', limit: number = 100) {
  const cacheKey = `ls_${symbol}_${period}_${limit}`;
  const cached = getFromCache<unknown[]>(cacheKey);
  if (cached) return cached;

  try {
    const res = await fetchWithTimeout(
      `https://fapi.binance.com/futures/data/globalLongShortAccountRatio?symbol=${symbol}USDT&period=${period}&limit=${limit}`
    );

    if (res.status === 429) {
      console.warn('Binance rate limit hit for L/S ratio');
      return cached || [];
    }
    if (!res.ok) return [];

    const data = await res.json();
    if (!Array.isArray(data)) return [];

    const result = data.map((item: { timestamp: number; longShortRatio: string; longAccount: string; shortAccount: string }) => ({
      timestamp: item.timestamp,
      longShortRatio: parseFloat(item.longShortRatio),
      longPercent: parseFloat(item.longAccount) * 100,
      shortPercent: parseFloat(item.shortAccount) * 100,
    }));

    setCache(cacheKey, result);
    return result;
  } catch (error) {
    console.error('Error fetching L/S ratio history:', error);
    return [];
  }
}

// Fetch top trader long/short ratio history
async function fetchTopTraderHistory(symbol: string, period: string = '1h', limit: number = 100) {
  const cacheKey = `toptrader_${symbol}_${period}_${limit}`;
  const cached = getFromCache<unknown[]>(cacheKey);
  if (cached) return cached;

  try {
    const res = await fetchWithTimeout(
      `https://fapi.binance.com/futures/data/topLongShortPositionRatio?symbol=${symbol}USDT&period=${period}&limit=${limit}`
    );

    if (res.status === 429) {
      console.warn('Binance rate limit hit for top trader');
      return cached || [];
    }
    if (!res.ok) return [];

    const data = await res.json();
    if (!Array.isArray(data)) return [];

    const result = data.map((item: { timestamp: number; longShortRatio: string; longAccount: string; shortAccount: string }) => ({
      timestamp: item.timestamp,
      topTraderLongShortRatio: parseFloat(item.longShortRatio),
      topTraderLongPercent: parseFloat(item.longAccount) * 100,
      topTraderShortPercent: parseFloat(item.shortAccount) * 100,
    }));

    setCache(cacheKey, result);
    return result;
  } catch (error) {
    console.error('Error fetching top trader history:', error);
    return [];
  }
}

export async function GET(request: Request) {
  try {
    assertRedistributionAllowed('binance', { purpose: 'chart', route: '/api/derivatives/history' });

    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol') || 'BTC';
    const type = searchParams.get('type') || 'funding'; // funding, oi, longshort, toptrader
    const period = searchParams.get('period') || '1h'; // 5m, 15m, 30m, 1h, 2h, 4h, 6h, 12h, 1d
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500);

    let data;
    switch (type) {
      case 'funding':
        data = await fetchFundingRateHistory(symbol.toUpperCase(), limit);
        break;
      case 'oi':
        data = await fetchOIHistory(symbol.toUpperCase(), period, limit);
        break;
      case 'longshort':
        data = await fetchLongShortHistory(symbol.toUpperCase(), period, limit);
        break;
      case 'toptrader':
        data = await fetchTopTraderHistory(symbol.toUpperCase(), period, limit);
        break;
      default:
        data = await fetchFundingRateHistory(symbol.toUpperCase(), limit);
    }

    return NextResponse.json({
      success: true,
      symbol: symbol.toUpperCase(),
      type,
      period,
      data,
      dataPoints: data.length,
      source: 'binance',
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Derivatives history API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch derivatives history', data: [] },
      { status: 500 }
    );
  }
}
