import { NextResponse } from 'next/server';
import { findCoinByGeckoId, getCoinGeckoId, SUPPORTED_COINS } from '@/lib/dataTypes';
import { FEATURES } from '@/lib/featureFlags';
import { isSupabaseConfigured } from '@/lib/supabase';
import { getCoinFromCache, saveBulkMarketDataToCache } from '@/lib/supabaseData';
import { assertRedistributionAllowed } from '@/lib/redistributionPolicy';

const BINANCE_BASE = 'https://api.binance.com/api/v3';

// In-memory cache for quick access (fallback when Supabase not available)
const coinCache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes for API route cache

function getMemoryCache<T>(key: string): T | null {
  const cached = coinCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data as T;
  }
  return null;
}

function setMemoryCache(key: string, data: unknown): void {
  coinCache.set(key, { data, timestamp: Date.now() });
}

// Try Supabase cache first, then memory cache
async function getCached<T>(key: string): Promise<T | null> {
  // Try memory cache first (fastest)
  const memCached = getMemoryCache<T>(key);
  if (memCached) return memCached;

  // Try Supabase cache if configured
  if (isSupabaseConfigured) {
    try {
      const symbol = key.toUpperCase();
      const dbCached = await getCoinFromCache(symbol);
      if (dbCached) {
        // Transform DB format to API format
        const transformed = {
          id: dbCached.coingecko_id || symbol.toLowerCase(),
          symbol: symbol.toLowerCase(),
          name: dbCached.name || symbol,
          image: dbCached.image_url || '',
          current_price: dbCached.price ?? null,
          market_cap: dbCached.market_cap ?? null,
          market_cap_rank: 0,
          price_change_24h: dbCached.price_change_24h ?? null,
          price_change_percentage_24h: dbCached.price_change_percent_24h ?? null,
          total_volume: dbCached.volume_24h ?? null,
          high_24h: dbCached.high_24h ?? null,
          low_24h: dbCached.low_24h ?? null,
          circulating_supply: dbCached.circulating_supply ?? null,
          max_supply: dbCached.max_supply ?? null,
        };
        // Update memory cache
        setMemoryCache(key, transformed);
        return transformed as T;
      }
    } catch (error) {
      console.error('Supabase cache error:', error);
    }
  }

  return null;
}

// Save to both memory and Supabase cache
async function setCache(key: string, data: unknown): Promise<void> {
  setMemoryCache(key, data);

  // Save to Supabase if configured
  if (isSupabaseConfigured && data && typeof data === 'object') {
    try {
      const coinData = data as Record<string, unknown>;
      await saveBulkMarketDataToCache([{
        id: (coinData.id as string) || key.toLowerCase(),
        symbol: (coinData.symbol as string) || key,
        name: (coinData.name as string) || '',
        current_price: typeof coinData.current_price === 'number' && Number.isFinite(coinData.current_price) ? (coinData.current_price as number) : 0,
        market_cap: typeof coinData.market_cap === 'number' && Number.isFinite(coinData.market_cap) ? (coinData.market_cap as number) : 0,
        market_cap_rank: typeof coinData.market_cap_rank === 'number' && Number.isFinite(coinData.market_cap_rank) ? (coinData.market_cap_rank as number) : 0,
        price_change_24h: typeof coinData.price_change_24h === 'number' && Number.isFinite(coinData.price_change_24h) ? (coinData.price_change_24h as number) : undefined,
        price_change_percentage_24h: typeof coinData.price_change_percentage_24h === 'number' && Number.isFinite(coinData.price_change_percentage_24h) ? (coinData.price_change_percentage_24h as number) : undefined,
        total_volume: typeof coinData.total_volume === 'number' && Number.isFinite(coinData.total_volume) ? (coinData.total_volume as number) : undefined,
        high_24h: typeof coinData.high_24h === 'number' && Number.isFinite(coinData.high_24h) ? (coinData.high_24h as number) : undefined,
        low_24h: typeof coinData.low_24h === 'number' && Number.isFinite(coinData.low_24h) ? (coinData.low_24h as number) : undefined,
        circulating_supply: typeof coinData.circulating_supply === 'number' && Number.isFinite(coinData.circulating_supply) ? (coinData.circulating_supply as number) : undefined,
        max_supply: typeof coinData.max_supply === 'number' && Number.isFinite(coinData.max_supply) ? (coinData.max_supply as number) : null,
      }]);
    } catch (error) {
      console.error('Supabase save error:', error);
    }
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  assertRedistributionAllowed('binance', { purpose: 'chart', route: '/api/crypto/[id]' });

  // Check cache first (Supabase + memory)
  const cached = await getCached(id);
  if (cached) {
    return NextResponse.json(cached, {
      headers: { 'X-Cache': 'HIT' }
    });
  }

  try {
    const bySymbol = SUPPORTED_COINS.find(c => c.symbol.toLowerCase() === id.toLowerCase());
    const byGeckoId = findCoinByGeckoId(id);
    const coinInfo = bySymbol || byGeckoId;

    if (!coinInfo) {
      return NextResponse.json(
        { error: 'Coin not found', searchedId: id },
        { status: 404 }
      );
    }

    const response = await fetch(
      `${BINANCE_BASE}/ticker/24hr?symbol=${encodeURIComponent(coinInfo.binanceSymbol)}`,
      { headers: { Accept: 'application/json' }, next: { revalidate: 60 } }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch coin ticker', status: response.status },
        { status: 502 }
      );
    }

    const ticker: {
      lastPrice: string;
      openPrice: string;
      highPrice: string;
      lowPrice: string;
      quoteVolume: string;
      priceChange: string;
      priceChangePercent: string;
    } = await response.json();

    const currentPrice = Number.parseFloat(ticker.lastPrice);
    const openPrice = Number.parseFloat(ticker.openPrice);
    const high24h = Number.parseFloat(ticker.highPrice);
    const low24h = Number.parseFloat(ticker.lowPrice);
    const totalVolume = Number.parseFloat(ticker.quoteVolume);
    const priceChange24h = Number.parseFloat(ticker.priceChange);
    const priceChangePct24h = Number.parseFloat(ticker.priceChangePercent);

    const marketCap = (Number.isFinite(currentPrice) ? currentPrice : 0) * coinInfo.circulatingSupply;
    const prevMarketCap = (Number.isFinite(openPrice) ? openPrice : 0) * coinInfo.circulatingSupply;
    const marketCapChange24h = marketCap - prevMarketCap;
    const marketCapChangePct24h = prevMarketCap > 0 ? (marketCapChange24h / prevMarketCap) * 100 : 0;

    const maxSupply = coinInfo.maxSupply;
    const fullyDiluted = typeof maxSupply === 'number' ? maxSupply * (Number.isFinite(currentPrice) ? currentPrice : 0) : null;
    const now = new Date().toISOString();

    const coin = {
      id: getCoinGeckoId(coinInfo.symbol),
      symbol: coinInfo.symbol.toLowerCase(),
      name: coinInfo.name,
      image: FEATURES.coingecko ? coinInfo.image : '/globe.svg',
      current_price: Number.isFinite(currentPrice) ? currentPrice : 0,
      market_cap: Number.isFinite(marketCap) ? marketCap : 0,
      market_cap_rank: 0,
      fully_diluted_valuation: fullyDiluted,
      total_volume: Number.isFinite(totalVolume) ? totalVolume : 0,
      high_24h: Number.isFinite(high24h) ? high24h : 0,
      low_24h: Number.isFinite(low24h) ? low24h : 0,
      price_change_24h: Number.isFinite(priceChange24h) ? priceChange24h : 0,
      price_change_percentage_24h: Number.isFinite(priceChangePct24h) ? priceChangePct24h : 0,
      market_cap_change_24h: Number.isFinite(marketCapChange24h) ? marketCapChange24h : 0,
      market_cap_change_percentage_24h: Number.isFinite(marketCapChangePct24h) ? marketCapChangePct24h : 0,
      circulating_supply: coinInfo.circulatingSupply,
      total_supply: null,
      max_supply: maxSupply,
      ath: Number.isFinite(high24h) ? high24h : (Number.isFinite(currentPrice) ? currentPrice : 0),
      ath_change_percentage: 0,
      ath_date: now,
      atl: Number.isFinite(low24h) ? low24h : (Number.isFinite(currentPrice) ? currentPrice : 0),
      atl_change_percentage: 0,
      atl_date: now,
      last_updated: now,
    };

    // Cache the result (Supabase + memory)
    await setCache(id, coin);

    return NextResponse.json(coin, {
      headers: { 'X-Cache': 'MISS' }
    });
  } catch (error) {
    console.error('Coin detail API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch coin data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
