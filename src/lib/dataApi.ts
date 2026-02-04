// ============================================
// COMPREHENSIVE DATA API - CoinGecko Primary
// ============================================

import { FEATURES } from './featureFlags';
import {
  discoverCoins,
  getDiscoveredCoin,
  getTopGainers,
  getTopLosers,
  getGeckoId,
  type DiscoveredCoin
} from './coinDiscovery';
// Order book and trades removed - CoinGecko doesn't provide this data

const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';
const DEFAULT_COIN_IMAGE = '/globe.svg';

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface MarketData {
  symbol: string;
  name: string;
  geckoId: string;  // CoinGecko ID (e.g., "bitcoin", "ethereum")
  image: string;
  category: string;
  price: number;
  priceChange24h: number;
  priceChangePercent24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  quoteVolume24h: number;
  marketCap: number;
  marketCapRank: number | null;
  circulatingSupply: number;
  totalSupply: number | null;
  maxSupply: number | null;
  ath: number;
  athDate: string;
  atl: number;
  atlDate: string;
  updatedAt: string;
}

export interface OHLCVData {
  symbol: string;
  interval: string;
  openTime: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  closeTime: string;
}

export interface GlobalStats {
  totalMarketCap: number;
  totalVolume24h: number;
  btcDominance: number;
  ethDominance: number;
  marketCapChange24h: number;
  activeCryptocurrencies: number;
  updatedAt: string;
}

export interface GainerLoser {
  symbol: string;
  name: string;
  image: string;
  price: number;
  priceChangePercent24h: number;
  volume24h: number;
  marketCap: number;
  type: 'gainer' | 'loser';
}

export interface CategoryStats {
  category: string;
  categoryName: string;
  coinCount: number;
  totalMarketCap: number;
  totalVolume24h: number;
  avgPriceChange24h: number;
  topPerformer: string;
  worstPerformer: string;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function mapDiscoveredCoinToMarketData(coin: DiscoveredCoin): MarketData {
  return {
    symbol: coin.symbol,
    name: coin.name,
    geckoId: coin.geckoId,  // CoinGecko ID for matching by ID
    image: FEATURES.coingecko ? coin.image : DEFAULT_COIN_IMAGE,
    category: coin.category,
    price: coin.currentPrice,
    priceChange24h: coin.currentPrice * (coin.priceChangePercent24h / 100),
    priceChangePercent24h: coin.priceChangePercent24h,
    high24h: 0, // Not available in markets endpoint
    low24h: 0,
    volume24h: coin.volume24h,
    quoteVolume24h: coin.volume24h,
    marketCap: coin.marketCap,
    marketCapRank: coin.marketCapRank,
    circulatingSupply: coin.circulatingSupply,
    totalSupply: coin.totalSupply,
    maxSupply: coin.maxSupply,
    ath: coin.ath,
    athDate: coin.athDate,
    atl: coin.atl,
    atlDate: coin.atlDate,
    updatedAt: new Date().toISOString(),
  };
}

// ============================================
// API FUNCTIONS
// ============================================

/**
 * 1. MARKET OVERVIEW - All coins with full data from CoinGecko
 */
export async function fetchMarketOverview(options?: {
  symbols?: string[];
  category?: string;
  minMarketCap?: number;
  sortBy?: 'market_cap' | 'volume' | 'price_change' | 'price';
  sortOrder?: 'asc' | 'desc';
}): Promise<MarketData[]> {
  try {
    const discoveredCoins = await discoverCoins();

    let coins = discoveredCoins.map(mapDiscoveredCoinToMarketData);

    // Filter by selected symbols
    if (options?.symbols && options.symbols.length > 0) {
      const symbolSet = new Set(options.symbols.map(s => s.toUpperCase()));
      coins = coins.filter(c => symbolSet.has(c.symbol.toUpperCase()));
    }

    // Filter by category
    if (options?.category && options.category !== 'all') {
      coins = coins.filter(c => c.category === options.category);
    }

    // Filter by min market cap
    if (options?.minMarketCap) {
      coins = coins.filter(c => c.marketCap >= options.minMarketCap!);
    }

    // Sort
    const sortBy = options?.sortBy || 'market_cap';
    const sortOrder = options?.sortOrder || 'desc';

    coins.sort((a, b) => {
      let aVal: number, bVal: number;
      switch (sortBy) {
        case 'volume': aVal = a.quoteVolume24h; bVal = b.quoteVolume24h; break;
        case 'price_change': aVal = a.priceChangePercent24h; bVal = b.priceChangePercent24h; break;
        case 'price': aVal = a.price; bVal = b.price; break;
        default: aVal = a.marketCap; bVal = b.marketCap;
      }
      return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
    });

    return coins;
  } catch (error) {
    console.error('Error fetching market overview:', error);
    return [];
  }
}

/**
 * 1b. FETCH ALL COINS - From CoinGecko markets
 */
export async function fetchAllCoins(options?: {
  limit?: number;
  sortBy?: 'volume' | 'price_change' | 'price' | 'market_cap';
  sortOrder?: 'asc' | 'desc';
  category?: string;
}): Promise<MarketData[]> {
  try {
    const discoveredCoins = await discoverCoins();

    let coins = discoveredCoins.map(mapDiscoveredCoinToMarketData);

    // Filter by category
    if (options?.category && options.category !== 'all') {
      coins = coins.filter(c => c.category === options.category);
    }

    // Sort
    const sortBy = options?.sortBy || 'market_cap';
    const sortOrder = options?.sortOrder || 'desc';

    coins.sort((a, b) => {
      let aVal: number, bVal: number;
      switch (sortBy) {
        case 'volume': aVal = a.quoteVolume24h; bVal = b.quoteVolume24h; break;
        case 'price_change': aVal = a.priceChangePercent24h; bVal = b.priceChangePercent24h; break;
        case 'price': aVal = a.price; bVal = b.price; break;
        default: aVal = a.marketCap; bVal = b.marketCap;
      }
      return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
    });

    // Apply limit
    const limit = options?.limit || coins.length;
    return coins.slice(0, limit);
  } catch (error) {
    console.error('Error fetching all coins:', error);
    return [];
  }
}

/**
 * Get count of all available coins
 */
export async function getAvailableCoinCount(): Promise<number> {
  const coins = await discoverCoins();
  return coins.length;
}

/**
 * 2. HISTORICAL OHLCV DATA - From CoinGecko
 */
export async function fetchHistoricalPrices(options: {
  symbol: string;
  interval: '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d' | '1w' | '1M';
  limit?: number;
}): Promise<OHLCVData[]> {
  try {
    const coin = await getDiscoveredCoin(options.symbol);
    if (!coin) {
      console.warn(`Symbol ${options.symbol} not found`);
      return [];
    }

    // Map interval to CoinGecko days parameter
    // CoinGecko OHLC endpoint accepts: 1, 7, 14, 30, 90, 180, 365, max
    let days: number;
    switch (options.interval) {
      case '1m':
      case '5m':
      case '15m':
      case '30m':
        days = 1; // 1 day gives 5-minute candles
        break;
      case '1h':
        days = 7; // 7 days gives hourly candles
        break;
      case '4h':
        days = 30; // 30 days gives 4-hour candles
        break;
      case '1d':
        days = 90;
        break;
      case '1w':
        days = 180;
        break;
      case '1M':
        days = 365;
        break;
      default:
        days = 30;
    }

    const limit = options.limit || 100;

    const response = await fetch(
      `${COINGECKO_BASE}/coins/${coin.geckoId}/ohlc?vs_currency=usd&days=${days}`,
      {
        headers: { 'Accept': 'application/json' },
        next: { revalidate: 300 }
      }
    );

    if (!response.ok) {
      console.error(`CoinGecko OHLC failed: ${response.status}`);
      return [];
    }

    const ohlcData: [number, number, number, number, number][] = await response.json();

    // CoinGecko returns [timestamp, open, high, low, close]
    return ohlcData.slice(-limit).map((k) => ({
      symbol: options.symbol,
      interval: options.interval,
      openTime: new Date(k[0]).toISOString(),
      open: k[1],
      high: k[2],
      low: k[3],
      close: k[4],
      volume: 0, // OHLC endpoint doesn't include volume
      closeTime: new Date(k[0]).toISOString(),
    }));
  } catch (error) {
    console.error('Error fetching historical prices:', error);
    return [];
  }
}

/**
 * 3. GLOBAL MARKET STATS - From CoinGecko
 */
export async function fetchGlobalStats(): Promise<GlobalStats | null> {
  try {
    const response = await fetch(`${COINGECKO_BASE}/global`, {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 300 }
    });

    if (!response.ok) {
      console.error(`CoinGecko global failed: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const global = data.data;

    return {
      totalMarketCap: global.total_market_cap?.usd || 0,
      totalVolume24h: global.total_volume?.usd || 0,
      btcDominance: global.market_cap_percentage?.btc || 0,
      ethDominance: global.market_cap_percentage?.eth || 0,
      marketCapChange24h: global.market_cap_change_percentage_24h_usd || 0,
      activeCryptocurrencies: global.active_cryptocurrencies || 0,
      updatedAt: new Date(global.updated_at * 1000).toISOString(),
    };
  } catch (error) {
    console.error('Error fetching global stats:', error);
    return null;
  }
}

/**
 * 6. TOP GAINERS & LOSERS - From CoinGecko via coinDiscovery
 */
export async function fetchGainersLosers(options?: {
  type?: 'both' | 'gainers' | 'losers';
  limit?: number;
}): Promise<GainerLoser[]> {
  try {
    const type = options?.type || 'both';
    const limit = options?.limit || 20;
    const results: GainerLoser[] = [];

    if (type === 'both' || type === 'gainers') {
      const gainers = await getTopGainers(limit);
      results.push(...gainers.map(c => ({
        symbol: c.symbol,
        name: c.name,
        image: FEATURES.coingecko ? c.image : DEFAULT_COIN_IMAGE,
        price: c.currentPrice,
        priceChangePercent24h: c.priceChangePercent24h,
        volume24h: c.volume24h,
        marketCap: c.marketCap,
        type: 'gainer' as const,
      })));
    }

    if (type === 'both' || type === 'losers') {
      const losers = await getTopLosers(limit);
      results.push(...losers.map(c => ({
        symbol: c.symbol,
        name: c.name,
        image: FEATURES.coingecko ? c.image : DEFAULT_COIN_IMAGE,
        price: c.currentPrice,
        priceChangePercent24h: c.priceChangePercent24h,
        volume24h: c.volume24h,
        marketCap: c.marketCap,
        type: 'loser' as const,
      })));
    }

    return results;
  } catch (error) {
    console.error('Error fetching gainers/losers:', error);
    return [];
  }
}

/**
 * 7. CATEGORY STATS - Calculated from discovered coins
 */
export async function fetchCategoryStats(): Promise<CategoryStats[]> {
  try {
    const discoveredCoins = await discoverCoins();
    const marketData = discoveredCoins.map(mapDiscoveredCoinToMarketData);

    const categories: Record<string, MarketData[]> = {};

    // Group by category
    for (const coin of marketData) {
      if (!categories[coin.category]) {
        categories[coin.category] = [];
      }
      categories[coin.category].push(coin);
    }

    const categoryNames: Record<string, string> = {
      'layer1': 'Layer 1',
      'layer2': 'Layer 2',
      'defi': 'DeFi',
      'gaming': 'Gaming/Metaverse',
      'meme': 'Meme Coins',
      'exchange': 'Exchange Tokens',
      'payments': 'Payments',
      'storage': 'Storage',
      'privacy': 'Privacy',
      'ai': 'AI & ML',
      'infrastructure': 'Infrastructure',
      'stablecoin': 'Stablecoins',
      'other': 'Other',
    };

    const stats: CategoryStats[] = [];

    for (const [category, coins] of Object.entries(categories)) {
      const totalMarketCap = coins.reduce((sum, c) => sum + c.marketCap, 0);
      const totalVolume = coins.reduce((sum, c) => sum + c.quoteVolume24h, 0);
      const avgChange = coins.reduce((sum, c) => sum + c.priceChangePercent24h, 0) / coins.length;

      const sorted = [...coins].sort((a, b) => b.priceChangePercent24h - a.priceChangePercent24h);

      stats.push({
        category,
        categoryName: categoryNames[category] || category,
        coinCount: coins.length,
        totalMarketCap,
        totalVolume24h: totalVolume,
        avgPriceChange24h: avgChange,
        topPerformer: sorted[0]?.symbol || '',
        worstPerformer: sorted[sorted.length - 1]?.symbol || '',
      });
    }

    return stats.sort((a, b) => b.totalMarketCap - a.totalMarketCap);
  } catch (error) {
    console.error('Error fetching category stats:', error);
    return [];
  }
}

/**
 * 8. TRENDING COINS - From CoinGecko trending endpoint
 */
export async function fetchTrendingCoins(): Promise<{
  symbol: string;
  name: string;
  image: string;
  marketCapRank: number | null;
  priceChange24h?: number;
}[]> {
  try {
    const response = await fetch(`${COINGECKO_BASE}/search/trending`, {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 600 } // 10 minutes
    });

    if (!response.ok) {
      console.error(`CoinGecko trending failed: ${response.status}`);
      return [];
    }

    const data = await response.json();

    return (data.coins || []).map((item: { item: {
      symbol: string;
      name: string;
      small: string;
      market_cap_rank: number | null;
      data?: { price_change_percentage_24h?: { usd?: number } };
    } }) => ({
      symbol: item.item.symbol.toUpperCase(),
      name: item.item.name,
      image: item.item.small || DEFAULT_COIN_IMAGE,
      marketCapRank: item.item.market_cap_rank,
      priceChange24h: item.item.data?.price_change_percentage_24h?.usd,
    }));
  } catch (error) {
    console.error('Error fetching trending coins:', error);
    return [];
  }
}

/**
 * 9. SINGLE COIN DETAILED DATA - From CoinGecko
 */
export async function fetchCoinDetails(symbol: string): Promise<{
  symbol: string;
  name: string;
  geckoId: string;
  image: string;
  description: string;
  links: {
    homepage?: string;
    blockchain?: string[];
    twitter?: string;
    telegram?: string;
    reddit?: string;
    github?: string[];
  };
  marketData: MarketData;
  priceHistory7d?: number[];
} | null> {
  try {
    const coin = await getDiscoveredCoin(symbol);
    if (!coin) return null;

    const response = await fetch(
      `${COINGECKO_BASE}/coins/${coin.geckoId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=true`,
      {
        headers: { 'Accept': 'application/json' },
        next: { revalidate: 300 }
      }
    );

    if (!response.ok) {
      console.error(`CoinGecko coin details failed: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const md = data.market_data;

    return {
      symbol: data.symbol.toUpperCase(),
      name: data.name,
      geckoId: data.id,
      image: data.image?.large || DEFAULT_COIN_IMAGE,
      description: data.description?.en || '',
      links: {
        homepage: data.links?.homepage?.[0],
        blockchain: data.links?.blockchain_site?.filter((s: string) => s),
        twitter: data.links?.twitter_screen_name ? `https://twitter.com/${data.links.twitter_screen_name}` : undefined,
        telegram: data.links?.telegram_channel_identifier ? `https://t.me/${data.links.telegram_channel_identifier}` : undefined,
        reddit: data.links?.subreddit_url,
        github: data.links?.repos_url?.github?.filter((s: string) => s),
      },
      marketData: {
        symbol: data.symbol.toUpperCase(),
        name: data.name,
        geckoId: data.id,  // CoinGecko ID for matching
        image: data.image?.large || DEFAULT_COIN_IMAGE,
        category: coin.category,
        price: md?.current_price?.usd || 0,
        priceChange24h: md?.price_change_24h || 0,
        priceChangePercent24h: md?.price_change_percentage_24h || 0,
        high24h: md?.high_24h?.usd || 0,
        low24h: md?.low_24h?.usd || 0,
        volume24h: md?.total_volume?.usd || 0,
        quoteVolume24h: md?.total_volume?.usd || 0,
        marketCap: md?.market_cap?.usd || 0,
        marketCapRank: md?.market_cap_rank || null,
        circulatingSupply: md?.circulating_supply || 0,
        totalSupply: md?.total_supply || null,
        maxSupply: md?.max_supply || null,
        ath: md?.ath?.usd || 0,
        athDate: md?.ath_date?.usd || '',
        atl: md?.atl?.usd || 0,
        atlDate: md?.atl_date?.usd || '',
        updatedAt: new Date().toISOString(),
      },
      priceHistory7d: data.market_data?.sparkline_7d?.price,
    };
  } catch (error) {
    console.error('Error fetching coin details:', error);
    return null;
  }
}

/**
 * 10. SIMPLE PRICE - Quick price lookup for multiple coins
 */
export async function fetchSimplePrices(geckoIds: string[]): Promise<Record<string, {
  usd: number;
  usd_24h_change?: number;
  usd_market_cap?: number;
}>> {
  try {
    const ids = geckoIds.join(',');
    const response = await fetch(
      `${COINGECKO_BASE}/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true`,
      {
        headers: { 'Accept': 'application/json' },
        next: { revalidate: 60 }
      }
    );

    if (!response.ok) {
      console.error(`CoinGecko simple price failed: ${response.status}`);
      return {};
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching simple prices:', error);
    return {};
  }
}
