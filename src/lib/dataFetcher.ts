// Data Fetcher Service - Fetches data from CoinGecko
// Free tier: 10-30 calls/minute, no API key needed

import { FEATURES } from '@/lib/featureFlags';
import {
  discoverCoins,
  getDiscoveredCoin,
  type DiscoveredCoin
} from './coinDiscovery';

const DEFAULT_COIN_IMAGE = '/globe.svg';
const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';

// Top coins to fetch data for (by symbol)
export const TOP_SYMBOLS = [
  'BTC', 'ETH', 'BNB', 'SOL', 'XRP',
  'ADA', 'DOGE', 'AVAX', 'LINK', 'DOT',
  'MATIC', 'TRX', 'LTC', 'SHIB', 'UNI',
  'XLM', 'ATOM', 'NEAR', 'ICP', 'APT',
  'FIL', 'ETC', 'ARB', 'OP', 'SUI',
  'INJ', 'AAVE', 'GRT', 'SAND', 'MANA',
  'AXS', 'FTM', 'ALGO', 'EGLD', 'XTZ',
  'EOS', 'FLOW', 'CHZ', 'APE', 'LRC',
  'CRV', 'LDO', 'RNDR', 'MKR', 'SNX',
  'COMP', 'ZEC', 'ENJ', 'BAT', 'ONE',
];

// Coin metadata is now fetched from CoinGecko via coinDiscovery
export const COIN_INFO: Record<string, {
  id: string;
  name: string;
  image: string;
  circulatingSupply: number;
  maxSupply: number | null;
  category: string;
}> = {};

// Types
export interface TickerData {
  symbol: string;
  priceChange: number;
  priceChangePercent: number;
  weightedAvgPrice: number;
  prevClosePrice: number;
  lastPrice: number;
  bidPrice: number;
  askPrice: number;
  openPrice: number;
  highPrice: number;
  lowPrice: number;
  volume: number;
  quoteVolume: number;
  openTime: number;
  closeTime: number;
  count: number;
}

export interface KlineData {
  symbol: string;
  interval: string;
  openTime: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  closeTime: number;
  quoteVolume: number;
  trades: number;
  takerBuyBaseVolume: number;
  takerBuyQuoteVolume: number;
}

export interface OrderBookData {
  symbol: string;
  lastUpdateId: number;
  bids: [string, string][];
  asks: [string, string][];
  timestamp: number;
}

export interface TradeData {
  symbol: string;
  id: number;
  price: number;
  qty: number;
  quoteQty: number;
  time: number;
  isBuyerMaker: boolean;
}

// ============================================
// DATA FETCHERS (CoinGecko)
// ============================================

// 1. Fetch ticker data for all top coins
export async function fetchAllTickers(): Promise<TickerData[]> {
  try {
    const coins = await discoverCoins();

    // Filter to top symbols
    const topCoins = coins.filter(c => TOP_SYMBOLS.includes(c.symbol));

    return topCoins.map(coin => ({
      symbol: coin.symbol,
      priceChange: coin.currentPrice * (coin.priceChangePercent24h / 100),
      priceChangePercent: coin.priceChangePercent24h,
      weightedAvgPrice: coin.currentPrice, // CoinGecko doesn't provide VWAP
      prevClosePrice: coin.currentPrice / (1 + coin.priceChangePercent24h / 100),
      lastPrice: coin.currentPrice,
      bidPrice: coin.currentPrice, // CoinGecko doesn't provide bid/ask
      askPrice: coin.currentPrice,
      openPrice: coin.currentPrice / (1 + coin.priceChangePercent24h / 100),
      highPrice: 0, // Not available in markets endpoint
      lowPrice: 0,
      volume: coin.volume24h / coin.currentPrice, // Estimate base volume
      quoteVolume: coin.volume24h,
      openTime: Date.now() - 24 * 60 * 60 * 1000,
      closeTime: Date.now(),
      count: 0, // Not available
    }));
  } catch (error) {
    console.error('Error fetching tickers:', error);
    return [];
  }
}

// 2. Fetch Historical Klines (OHLCV) for a symbol
export async function fetchKlines(
  symbol: string,
  interval: '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d' | '1w' | '1M' = '1d',
  limit: number = 500
): Promise<KlineData[]> {
  try {
    const coin = await getDiscoveredCoin(symbol.replace('USDT', ''));
    if (!coin) {
      console.warn(`Coin not found: ${symbol}`);
      return [];
    }

    // Map interval to CoinGecko days
    let days: number;
    switch (interval) {
      case '1m':
      case '5m':
      case '15m':
      case '30m':
        days = 1;
        break;
      case '1h':
        days = 7;
        break;
      case '4h':
        days = 30;
        break;
      case '1d':
        days = Math.min(limit, 90);
        break;
      case '1w':
        days = Math.min(limit * 7, 180);
        break;
      case '1M':
        days = 365;
        break;
      default:
        days = 30;
    }

    const response = await fetch(
      `${COINGECKO_BASE}/coins/${coin.geckoId}/ohlc?vs_currency=usd&days=${days}`,
      {
        headers: { 'Accept': 'application/json' },
        next: { revalidate: 300 }
      }
    );

    if (!response.ok) {
      console.error(`CoinGecko OHLC failed for ${symbol}: ${response.status}`);
      return [];
    }

    const data: [number, number, number, number, number][] = await response.json();

    return data.slice(-limit).map((k) => ({
      symbol,
      interval,
      openTime: k[0],
      open: k[1],
      high: k[2],
      low: k[3],
      close: k[4],
      volume: 0, // Not available in OHLC endpoint
      closeTime: k[0],
      quoteVolume: 0,
      trades: 0,
      takerBuyBaseVolume: 0,
      takerBuyQuoteVolume: 0,
    }));
  } catch (error) {
    console.error(`Error fetching klines for ${symbol}:`, error);
    return [];
  }
}

// 3. Fetch Order Book - Not available from CoinGecko
export async function fetchOrderBook(
  _symbol: string,
  _limit: 5 | 10 | 20 | 50 | 100 | 500 | 1000 = 20
): Promise<OrderBookData | null> {
  console.warn('Order book data requires exchange API access. CoinGecko does not provide order book data.');
  return null;
}

// 4. Fetch Recent Trades - Not available from CoinGecko
export async function fetchRecentTrades(
  _symbol: string,
  _limit: number = 100
): Promise<TradeData[]> {
  console.warn('Recent trades data requires exchange API access. CoinGecko does not provide trade data.');
  return [];
}

// 5. Fetch Exchange Info - Return basic info from CoinGecko
export async function fetchExchangeInfo(): Promise<{
  symbols: Array<{
    symbol: string;
    status: string;
    baseAsset: string;
    quoteAsset: string;
    filters: Record<string, unknown>[];
  }>;
} | null> {
  try {
    const coins = await discoverCoins();
    const topCoins = coins.filter(c => TOP_SYMBOLS.includes(c.symbol));

    return {
      symbols: topCoins.map(coin => ({
        symbol: coin.symbol,
        status: 'TRADING',
        baseAsset: coin.symbol,
        quoteAsset: 'USD',
        filters: [],
      })),
    };
  } catch (error) {
    console.error('Error fetching exchange info:', error);
    return null;
  }
}

// ============================================
// BATCH FETCHERS
// ============================================

// Fetch ALL data for storage
export async function fetchAllData() {
  console.log('Fetching all market data from CoinGecko...');

  // 1. Fetch all tickers
  const tickers = await fetchAllTickers();
  console.log(`Fetched ${tickers.length} tickers`);

  // 2. Fetch klines for top coins
  const klines: Record<string, KlineData[]> = {};
  for (const symbol of TOP_SYMBOLS.slice(0, 20)) {
    klines[symbol] = await fetchKlines(symbol, '1d', 30);
    await new Promise(r => setTimeout(r, 200)); // Rate limit protection
  }
  console.log(`Fetched klines for ${Object.keys(klines).length} symbols`);

  // 3. Fetch exchange info
  const exchangeInfo = await fetchExchangeInfo();

  return {
    tickers,
    klines,
    exchangeInfo,
    fetchedAt: new Date().toISOString(),
  };
}

// Transform discovered coin data to enriched format
export function enrichTickerData(tickers: TickerData[]) {
  return tickers.map(ticker => {
    // Get coin info from discovered coins
    const symbol = ticker.symbol.replace('USDT', '');

    return {
      // Basic Info
      symbol,
      name: symbol, // Will be enriched from discovered coins
      image: FEATURES.coingecko ? '' : DEFAULT_COIN_IMAGE,
      category: 'Unknown',

      // Price Data
      price: ticker.lastPrice,
      priceChange24h: ticker.priceChange,
      priceChangePercent24h: ticker.priceChangePercent,
      open24h: ticker.openPrice,
      high24h: ticker.highPrice,
      low24h: ticker.lowPrice,

      // Volume
      volume24h: ticker.volume,
      quoteVolume24h: ticker.quoteVolume,
      trades24h: ticker.count,

      // Market Cap (to be enriched)
      marketCap: 0,
      circulatingSupply: 0,
      maxSupply: null,

      // Order Book (not available)
      bidPrice: ticker.bidPrice,
      askPrice: ticker.askPrice,
      spread: 0,
      spreadPercent: 0,

      // Averages
      vwap: ticker.weightedAvgPrice,

      // Timestamps
      openTime: new Date(ticker.openTime).toISOString(),
      closeTime: new Date(ticker.closeTime).toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }).sort((a, b) => b.quoteVolume24h - a.quoteVolume24h);
}

// Get enriched market data directly from CoinGecko
export async function getEnrichedMarketData(): Promise<ReturnType<typeof enrichDiscoveredCoins>> {
  const coins = await discoverCoins();
  return enrichDiscoveredCoins(coins.filter(c => TOP_SYMBOLS.includes(c.symbol)));
}

// Enrich discovered coins to the expected format
function enrichDiscoveredCoins(coins: DiscoveredCoin[]) {
  return coins.map(coin => ({
    symbol: coin.symbol,
    name: coin.name,
    image: FEATURES.coingecko ? coin.image : DEFAULT_COIN_IMAGE,
    category: coin.category,

    price: coin.currentPrice,
    priceChange24h: coin.currentPrice * (coin.priceChangePercent24h / 100),
    priceChangePercent24h: coin.priceChangePercent24h,
    open24h: coin.currentPrice / (1 + coin.priceChangePercent24h / 100),
    high24h: 0,
    low24h: 0,

    volume24h: coin.volume24h / coin.currentPrice,
    quoteVolume24h: coin.volume24h,
    trades24h: 0,

    marketCap: coin.marketCap,
    circulatingSupply: coin.circulatingSupply,
    maxSupply: coin.maxSupply,

    bidPrice: coin.currentPrice,
    askPrice: coin.currentPrice,
    spread: 0,
    spreadPercent: 0,

    vwap: coin.currentPrice,

    openTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    closeTime: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })).sort((a, b) => b.marketCap - a.marketCap);
}
