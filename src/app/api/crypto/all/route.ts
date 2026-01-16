/**
 * All Coins API Route
 *
 * PRIMARY: Binance (441+ tradeable coins with real-time data)
 * FALLBACK: CoinGecko (additional coins NOT on Binance)
 *
 * No duplicates - Binance data always preferred when available
 *
 * Query params:
 * - source: 'binance' | 'coingecko' | 'combined' (default: combined)
 * - limit: number (default: 100, max: 1500)
 * - sortBy: 'volume' | 'price_change' | 'market_cap' (default: market_cap)
 * - sortOrder: 'asc' | 'desc' (default: desc)
 * - category: filter by category
 */

import { NextRequest, NextResponse } from 'next/server';
import { fetchAllCoins, type MarketData } from '@/lib/dataApi';
import { getCoinsMarkets } from '@/lib/coingecko/client';
import { assertRedistributionAllowed } from '@/lib/redistributionPolicy';
import { enforceDisplayOnly } from '@/lib/apiSecurity';
import { FEATURES } from '@/lib/featureFlags';

export const dynamic = 'force-dynamic';
export const revalidate = 60; // 1 minute

// Cache for CoinGecko data
let geckoCache: {
  data: MarketData[];
  timestamp: number;
  symbols: Set<string>;
} | null = null;
const GECKO_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function fetchCoinGeckoCoins(): Promise<{ coins: MarketData[]; symbols: Set<string> }> {
  // Return cache if valid
  if (geckoCache && Date.now() - geckoCache.timestamp < GECKO_CACHE_TTL) {
    return { coins: geckoCache.data, symbols: geckoCache.symbols };
  }

  if (!FEATURES.coingecko) {
    return { coins: [], symbols: new Set() };
  }

  try {
    // FALLBACK SOURCE: Fetch top 1000 coins from CoinGecko
    // Only used for coins NOT available on Binance
    // CoinGecko free tier: ~30 calls/min, 250 per page max
    const [p1, p2, p3, p4] = await Promise.all([
      getCoinsMarkets('usd', 1, 250),
      getCoinsMarkets('usd', 2, 250),
      getCoinsMarkets('usd', 3, 250),
      getCoinsMarkets('usd', 4, 250),
    ]);

    const allGeckoCoins = [
      ...(p1.data || []),
      ...(p2.data || []),
      ...(p3.data || []),
      ...(p4.data || []),
    ];

    const symbols = new Set<string>();
    const coins: MarketData[] = allGeckoCoins.map(coin => {
      symbols.add(coin.symbol.toUpperCase());
      // Calculate price change from percentage (approximate)
      const priceChange24h = coin.current_price && coin.price_change_percentage_24h
        ? (coin.current_price * coin.price_change_percentage_24h) / 100
        : 0;
      return {
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        image: coin.image || '/globe.svg',
        category: 'coingecko', // Mark as from CoinGecko
        price: coin.current_price || 0,
        priceChange24h,
        priceChangePercent24h: coin.price_change_percentage_24h || 0,
        open24h: 0,
        high24h: coin.high_24h || 0,
        low24h: coin.low_24h || 0,
        volume24h: 0,
        quoteVolume24h: coin.total_volume || 0,
        tradesCount24h: 0,
        marketCap: coin.market_cap || 0,
        circulatingSupply: coin.circulating_supply || 0,
        maxSupply: coin.total_supply || null,
        bidPrice: 0,
        askPrice: 0,
        spread: 0,
        spreadPercent: 0,
        vwap: coin.current_price || 0,
        updatedAt: new Date().toISOString(),
        source: 'coingecko' as const,
      };
    });

    // Update cache
    geckoCache = {
      data: coins,
      timestamp: Date.now(),
      symbols,
    };

    return { coins, symbols };
  } catch (error) {
    console.error('Error fetching CoinGecko coins:', error);
    // Return stale cache if available
    if (geckoCache) {
      return { coins: geckoCache.data, symbols: geckoCache.symbols };
    }
    return { coins: [], symbols: new Set() };
  }
}

export async function GET(request: NextRequest) {
  // Enforce display-only access - block external API scraping
  const blocked = enforceDisplayOnly(request, '/api/crypto/all');
  if (blocked) return blocked;

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 1500);
  const source = searchParams.get('source') || 'combined';
  const sortBy = (searchParams.get('sortBy') || 'market_cap') as 'volume' | 'price_change' | 'market_cap';
  const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';
  const category = searchParams.get('category') || undefined;

  try {
    let allCoins: (MarketData & { source?: string })[] = [];
    let binanceCount = 0;
    let geckoCount = 0;

    // PRIMARY SOURCE: Binance (real-time trading data, always preferred)
    if (source === 'binance' || source === 'combined') {
      assertRedistributionAllowed('binance', { purpose: 'chart', route: '/api/crypto/all' });
      const binanceCoins = await fetchAllCoins({
        limit: source === 'combined' ? 1000 : limit, // Get all for combining
        sortBy: sortBy === 'market_cap' ? 'volume' : sortBy,
        sortOrder,
        category
      });
      binanceCount = binanceCoins.length;
      allCoins = binanceCoins.map(c => ({ ...c, source: 'binance' }));
    }

    // FALLBACK SOURCE: CoinGecko (only for coins NOT on Binance)
    if (source === 'coingecko' || source === 'combined') {
      const { coins: geckoCoins } = await fetchCoinGeckoCoins();

      if (source === 'coingecko') {
        // CoinGecko-only mode
        allCoins = geckoCoins;
        geckoCount = geckoCoins.length;
      } else {
        // Combined mode: NO DUPLICATES - only add coins missing from Binance
        const binanceSymbols = new Set(allCoins.map(c => c.symbol.toUpperCase()));
        const uniqueGeckoCoins = geckoCoins.filter(c => !binanceSymbols.has(c.symbol.toUpperCase()));
        geckoCount = uniqueGeckoCoins.length;
        allCoins = [...allCoins, ...uniqueGeckoCoins];
      }
    }

    // Sort combined results
    allCoins.sort((a, b) => {
      let aVal: number, bVal: number;
      switch (sortBy) {
        case 'volume':
          aVal = a.quoteVolume24h;
          bVal = b.quoteVolume24h;
          break;
        case 'price_change':
          aVal = a.priceChangePercent24h;
          bVal = b.priceChangePercent24h;
          break;
        case 'market_cap':
        default:
          aVal = a.marketCap;
          bVal = b.marketCap;
      }
      return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
    });

    // Apply limit
    const limitedCoins = allCoins.slice(0, limit);

    return NextResponse.json({
      success: true,
      data: limitedCoins,
      total: limitedCoins.length,
      totalAvailable: allCoins.length,
      breakdown: {
        binance: binanceCount,
        coingecko: geckoCount,
      },
      source,
      attribution: source !== 'binance' ? 'Market data includes CoinGecko (display-only)' : undefined,
      updated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('All Coins API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch coins', data: [] },
      { status: 500 }
    );
  }
}
