import { NextResponse } from 'next/server';
import { getCoinDetails } from '@/lib/coingecko';
import { getCoinGeckoId, SUPPORTED_COINS } from '@/lib/dataTypes';
import { isSupabaseConfigured } from '@/lib/supabase';
import { getCoinFromCache, saveBulkMarketDataToCache } from '@/lib/supabaseData';

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
          current_price: dbCached.price || 0,
          market_cap: dbCached.market_cap || 0,
          market_cap_rank: 0,
          price_change_24h: dbCached.price_change_24h || 0,
          price_change_percentage_24h: dbCached.price_change_percent_24h || 0,
          total_volume: dbCached.volume_24h || 0,
          high_24h: dbCached.high_24h || 0,
          low_24h: dbCached.low_24h || 0,
          circulating_supply: dbCached.circulating_supply || 0,
          max_supply: dbCached.max_supply || null,
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
        current_price: (coinData.current_price as number) || 0,
        market_cap: (coinData.market_cap as number) || 0,
        market_cap_rank: (coinData.market_cap_rank as number) || 0,
        price_change_24h: (coinData.price_change_24h as number) || 0,
        price_change_percentage_24h: (coinData.price_change_percentage_24h as number) || 0,
        total_volume: (coinData.total_volume as number) || 0,
        high_24h: (coinData.high_24h as number) || 0,
        low_24h: (coinData.low_24h as number) || 0,
        circulating_supply: (coinData.circulating_supply as number) || 0,
        max_supply: (coinData.max_supply as number | null) || null,
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

  // Check cache first (Supabase + memory)
  const cached = await getCached(id);
  if (cached) {
    return NextResponse.json(cached, {
      headers: { 'X-Cache': 'HIT' }
    });
  }

  try {
    // First try using the ID directly (it could be a CoinGecko slug like "the-open-network")
    let coin = await getCoinDetails(id);

    // If not found, try converting from symbol to CoinGecko ID
    if (!coin) {
      const geckoId = getCoinGeckoId(id);
      if (geckoId !== id.toLowerCase()) {
        coin = await getCoinDetails(geckoId);
      }
    }

    // If still not found, check if it's in our supported coins and get the correct ID
    if (!coin) {
      const supportedCoin = SUPPORTED_COINS.find(
        c => c.symbol.toLowerCase() === id.toLowerCase() ||
             c.name.toLowerCase() === id.toLowerCase()
      );
      if (supportedCoin) {
        const geckoId = getCoinGeckoId(supportedCoin.symbol);
        coin = await getCoinDetails(geckoId);
      }
    }

    if (!coin) {
      return NextResponse.json(
        { error: 'Coin not found', searchedId: id },
        { status: 404 }
      );
    }

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
