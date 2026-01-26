/**
 * Trending Coins API Route
 *
 * Returns top trending coins from CoinGecko
 * Data is for display only - not redistributable
 *
 * COMPLIANCE: This route is protected against external API access.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTrendingCoins, TrendingResponse } from '@/lib/coingecko/client';
import { enforceDisplayOnly } from '@/lib/apiSecurity';
import { fetchMarketOverview } from '@/lib/dataApi';

// Cache trending data for 5 minutes
let cachedData: {
  data: TrendingResponse | null;
  timestamp: number;
  source: string;
} = {
  data: null,
  timestamp: 0,
  source: '',
};

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Fallback to internal market data - derive "trending" from high volume + positive price change
async function getMarketDataTrending(): Promise<TrendingResponse | null> {
  try {
    const marketData = await fetchMarketOverview({ sortBy: 'volume', sortOrder: 'desc' });

    if (!marketData || marketData.length === 0) {
      return null;
    }

    // Get top 10 by volume that also have positive price change
    const trending = marketData
      .filter(coin => coin.priceChangePercent24h > 0)
      .slice(0, 10);

    // If not enough positive, just use top by volume
    const finalList = trending.length >= 7
      ? trending.slice(0, 7)
      : marketData.slice(0, 7);

    const coins = finalList.map((coin, index) => {
      return {
        item: {
          id: coin.symbol.toLowerCase(),
          coin_id: index,
          name: coin.name,
          symbol: coin.symbol,
          market_cap_rank: index + 1,
          thumb: coin.image || '/globe.svg',
          small: coin.image || '/globe.svg',
          large: coin.image || '/globe.svg',
          slug: coin.symbol.toLowerCase(),
          price_btc: 0,
          score: index,
          data: {
            price: coin.price,
            price_btc: '0',
            price_change_percentage_24h: { usd: coin.priceChangePercent24h },
            market_cap: coin.marketCap.toString(),
            market_cap_btc: '0',
            total_volume: coin.quoteVolume24h.toString(),
            total_volume_btc: '0',
            sparkline: '',
            content: null,
          },
        },
      };
    });

    return {
      coins,
      nfts: [],
      categories: [],
    };
  } catch (error) {
    console.error('[Trending API] Market data fallback error:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  // Enforce display-only access - block external API scraping
  const blocked = enforceDisplayOnly(request, '/api/crypto/trending');
  if (blocked) return blocked;

  try {
    // Check cache first
    const now = Date.now();
    if (cachedData.data && now - cachedData.timestamp < CACHE_TTL) {
      const trending = cachedData.data.coins.map((coin) => ({
        id: coin.item.id,
        name: coin.item.name,
        symbol: coin.item.symbol.toUpperCase(),
        thumb: coin.item.thumb,
        small: coin.item.small,
        large: coin.item.large,
        market_cap_rank: coin.item.market_cap_rank,
        price_btc: coin.item.price_btc,
        score: coin.item.score,
        price_usd: coin.item.data?.price,
        price_change_24h: coin.item.data?.price_change_percentage_24h?.usd,
        market_cap: coin.item.data?.market_cap,
        total_volume: coin.item.data?.total_volume,
        sparkline: coin.item.data?.sparkline,
      }));

      return NextResponse.json({
        success: true,
        data: { coins: trending, nfts: cachedData.data.nfts, categories: cachedData.data.categories },
        cached: true,
        source: cachedData.source,
        attribution: 'Data provided by CoinGecko',
      });
    }

    // Try CoinGecko first
    const result = await getTrendingCoins();

    if (result.success && result.data) {
      // Update cache with CoinGecko data
      cachedData = {
        data: result.data,
        timestamp: now,
        source: 'coingecko',
      };

      const trending = result.data.coins.map((coin) => ({
        id: coin.item.id,
        name: coin.item.name,
        symbol: coin.item.symbol.toUpperCase(),
        thumb: coin.item.thumb,
        small: coin.item.small,
        large: coin.item.large,
        market_cap_rank: coin.item.market_cap_rank,
        price_btc: coin.item.price_btc,
        score: coin.item.score,
        price_usd: coin.item.data?.price,
        price_change_24h: coin.item.data?.price_change_percentage_24h?.usd,
        market_cap: coin.item.data?.market_cap,
        total_volume: coin.item.data?.total_volume,
        sparkline: coin.item.data?.sparkline,
      }));

      return NextResponse.json({
        success: true,
        data: {
          coins: trending,
          nfts: result.data.nfts,
          categories: result.data.categories,
        },
        cached: false,
        source: 'coingecko',
        attribution: 'Data provided by CoinGecko',
        fetchedAt: result.fetchedAt,
      });
    }

    // CoinGecko failed - try market data fallback
    console.log('[Trending API] CoinGecko failed, trying market data fallback');
    const marketDataTrending = await getMarketDataTrending();

    if (marketDataTrending) {
      // Update cache with fallback data
      cachedData = {
        data: marketDataTrending,
        timestamp: now,
        source: 'coingecko',
      };

      const trending = marketDataTrending.coins.map((coin) => ({
        id: coin.item.id,
        name: coin.item.name,
        symbol: coin.item.symbol.toUpperCase(),
        thumb: coin.item.thumb,
        small: coin.item.small,
        large: coin.item.large,
        market_cap_rank: coin.item.market_cap_rank,
        price_btc: coin.item.price_btc,
        score: coin.item.score,
        price_usd: coin.item.data?.price,
        price_change_24h: coin.item.data?.price_change_percentage_24h?.usd,
        market_cap: coin.item.data?.market_cap,
        total_volume: coin.item.data?.total_volume,
        sparkline: coin.item.data?.sparkline,
      }));

      return NextResponse.json({
        success: true,
        data: {
          coins: trending,
          nfts: [],
          categories: [],
        },
        cached: false,
        source: 'coingecko',
        attribution: 'Data provided by CoinGecko (trending approximation)',
      });
    }

    // Failed - return cached data if available
    if (cachedData.data) {
      const trending = cachedData.data.coins.map((coin) => ({
        id: coin.item.id,
        name: coin.item.name,
        symbol: coin.item.symbol.toUpperCase(),
        thumb: coin.item.thumb,
        small: coin.item.small,
        large: coin.item.large,
        market_cap_rank: coin.item.market_cap_rank,
        price_btc: coin.item.price_btc,
        score: coin.item.score,
        price_usd: coin.item.data?.price,
        price_change_24h: coin.item.data?.price_change_percentage_24h?.usd,
        market_cap: coin.item.data?.market_cap,
        total_volume: coin.item.data?.total_volume,
        sparkline: coin.item.data?.sparkline,
      }));

      return NextResponse.json({
        success: true,
        data: { coins: trending, nfts: cachedData.data.nfts, categories: cachedData.data.categories },
        cached: true,
        stale: true,
        source: cachedData.source,
        attribution: 'Data provided by CoinGecko',
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch trending coins from all sources',
      },
      { status: 500 }
    );
  } catch (error) {
    console.error('[Trending API] Error:', error);

    // Return cached data if available
    if (cachedData.data) {
      const trending = cachedData.data.coins.map((coin) => ({
        id: coin.item.id,
        name: coin.item.name,
        symbol: coin.item.symbol.toUpperCase(),
        thumb: coin.item.thumb,
        small: coin.item.small,
        large: coin.item.large,
        market_cap_rank: coin.item.market_cap_rank,
        price_btc: coin.item.price_btc,
        score: coin.item.score,
        price_usd: coin.item.data?.price,
        price_change_24h: coin.item.data?.price_change_percentage_24h?.usd,
        market_cap: coin.item.data?.market_cap,
        total_volume: coin.item.data?.total_volume,
        sparkline: coin.item.data?.sparkline,
      }));

      return NextResponse.json({
        success: true,
        data: { coins: trending, nfts: cachedData.data.nfts, categories: cachedData.data.categories },
        cached: true,
        stale: true,
        source: cachedData.source,
        attribution: 'Data provided by CoinGecko',
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch trending coins',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
