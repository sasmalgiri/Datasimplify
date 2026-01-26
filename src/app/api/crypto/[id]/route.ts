/**
 * Coin Detail API Route
 *
 * Returns individual coin data from CoinGecko
 * Data is for display only - not redistributable
 *
 * COMPLIANCE: This route is protected against external API access.
 */

import { NextRequest, NextResponse } from 'next/server';
import { findCoinByGeckoId, getCoinGeckoId, SUPPORTED_COINS } from '@/lib/dataTypes';
import { FEATURES } from '@/lib/featureFlags';
import { isSupabaseConfigured } from '@/lib/supabase';
import { getCoinFromCache, saveBulkMarketDataToCache } from '@/lib/supabaseData';
import { assertRedistributionAllowed } from '@/lib/redistributionPolicy';
import { enforceDisplayOnly } from '@/lib/apiSecurity';

const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';

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
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Enforce display-only access - block external API scraping
  const blocked = enforceDisplayOnly(request, '/api/crypto/[id]');
  if (blocked) return blocked;

  const { id } = await params;

  assertRedistributionAllowed('coingecko', { purpose: 'chart', route: '/api/crypto/[id]' });

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

    const geckoId = getCoinGeckoId(coinInfo.symbol);
    const response = await fetch(
      `${COINGECKO_BASE}/coins/${geckoId}?localization=false&tickers=false&community_data=false&developer_data=false`,
      { headers: { Accept: 'application/json' }, next: { revalidate: 60 } }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch coin data', status: response.status },
        { status: 502 }
      );
    }

    const data = await response.json();
    const marketData = data.market_data || {};

    const currentPrice = marketData.current_price?.usd ?? 0;
    const high24h = marketData.high_24h?.usd ?? 0;
    const low24h = marketData.low_24h?.usd ?? 0;
    const totalVolume = marketData.total_volume?.usd ?? 0;
    const priceChange24h = marketData.price_change_24h ?? 0;
    const priceChangePct24h = marketData.price_change_percentage_24h ?? 0;
    const marketCap = marketData.market_cap?.usd ?? 0;
    const marketCapChange24h = marketData.market_cap_change_24h ?? 0;
    const marketCapChangePct24h = marketData.market_cap_change_percentage_24h ?? 0;

    const maxSupply = coinInfo.maxSupply;
    const fullyDiluted = marketData.fully_diluted_valuation?.usd ?? null;
    const now = new Date().toISOString();

    const coin = {
      id: geckoId,
      symbol: coinInfo.symbol.toLowerCase(),
      name: coinInfo.name,
      image: FEATURES.coingecko ? coinInfo.image : '/globe.svg',
      current_price: Number.isFinite(currentPrice) ? currentPrice : 0,
      market_cap: Number.isFinite(marketCap) ? marketCap : 0,
      market_cap_rank: marketData.market_cap_rank ?? 0,
      fully_diluted_valuation: fullyDiluted,
      total_volume: Number.isFinite(totalVolume) ? totalVolume : 0,
      high_24h: Number.isFinite(high24h) ? high24h : 0,
      low_24h: Number.isFinite(low24h) ? low24h : 0,
      price_change_24h: Number.isFinite(priceChange24h) ? priceChange24h : 0,
      price_change_percentage_24h: Number.isFinite(priceChangePct24h) ? priceChangePct24h : 0,
      market_cap_change_24h: Number.isFinite(marketCapChange24h) ? marketCapChange24h : 0,
      market_cap_change_percentage_24h: Number.isFinite(marketCapChangePct24h) ? marketCapChangePct24h : 0,
      circulating_supply: marketData.circulating_supply ?? coinInfo.circulatingSupply,
      total_supply: marketData.total_supply ?? null,
      max_supply: marketData.max_supply ?? maxSupply,
      ath: marketData.ath?.usd ?? high24h,
      ath_change_percentage: marketData.ath_change_percentage?.usd ?? 0,
      ath_date: marketData.ath_date?.usd ?? now,
      atl: marketData.atl?.usd ?? low24h,
      atl_change_percentage: marketData.atl_change_percentage?.usd ?? 0,
      atl_date: marketData.atl_date?.usd ?? now,
      last_updated: marketData.last_updated ?? now,
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
