// ============================================
// COMPREHENSIVE DATA API - Fetches ALL data from Binance
// ============================================

import { SUPPORTED_COINS } from './dataTypes';
import { FEATURES } from './featureFlags';
import { discoverCoins, type DiscoveredCoin } from './coinDiscovery';

const BINANCE_BASE = 'https://api.binance.com/api/v3';
const DEFAULT_COIN_IMAGE = '/globe.svg';

// Cache for circulating supply estimates (from CoinGecko simple/price)
const supplyCache = new Map<string, { supply: number; timestamp: number }>();
const SUPPLY_CACHE_TTL = 30 * 60 * 1000; // 30 minutes

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface MarketData {
  symbol: string;
  name: string;
  image: string;
  category: string;
  price: number;
  priceChange24h: number;
  priceChangePercent24h: number;
  open24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  quoteVolume24h: number;
  tradesCount24h: number;
  marketCap: number;
  circulatingSupply: number;
  maxSupply: number | null;
  bidPrice: number;
  askPrice: number;
  spread: number;
  spreadPercent: number;
  vwap: number;
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
  quoteVolume: number;
  tradesCount: number;
  takerBuyBaseVolume: number;
  takerBuyQuoteVolume: number;
}

export interface OrderBookEntry {
  price: number;
  quantity: number;
  total: number;
}

export interface OrderBookData {
  symbol: string;
  lastUpdateId: number;
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
  totalBidVolume: number;
  totalAskVolume: number;
  spread: number;
  spreadPercent: number;
  midPrice: number;
  capturedAt: string;
}

export interface TradeData {
  symbol: string;
  tradeId: number;
  price: number;
  quantity: number;
  quoteQuantity: number;
  time: string;
  isBuyerMaker: boolean;
  tradeType: 'BUY' | 'SELL';
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
// API FUNCTIONS
// ============================================

// 1. MARKET OVERVIEW - All coins with full data (uses dynamic discovery for 600+ coins)
export async function fetchMarketOverview(options?: {
  symbols?: string[];
  category?: string;
  minMarketCap?: number;
  sortBy?: 'market_cap' | 'volume' | 'price_change' | 'price';
  sortOrder?: 'asc' | 'desc';
}): Promise<MarketData[]> {
  try {
    // Get all discovered coins (600+ from Binance)
    const discoveredCoins = await discoverCoins();

    // Create lookup map for supply data from SUPPORTED_COINS
    const supportedMap = new Map(SUPPORTED_COINS.map(c => [c.symbol, c]));

    // Fetch all 24h tickers from Binance
    const response = await fetch(`${BINANCE_BASE}/ticker/24hr`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const tickers = await response.json();

    // Create ticker map for fast lookup
    const tickerMap = new Map<string, Record<string, unknown>>();
    for (const t of tickers) {
      tickerMap.set(t.symbol, t);
    }

    // Map discovered coins to our format with metadata
    const coins: MarketData[] = [];

    for (const coin of discoveredCoins) {
      const ticker = tickerMap.get(coin.binanceSymbol);
      if (!ticker) continue;

      // Filter by selected symbols
      if (options?.symbols && options.symbols.length > 0) {
        if (!options.symbols.includes(coin.symbol)) continue;
      }

      // Filter by category
      if (options?.category && options.category !== 'all') {
        if (coin.category !== options.category) continue;
      }

      const price = parseFloat(ticker.lastPrice as string);
      const quoteVolume = parseFloat(ticker.quoteVolume as string);

      // Get circulating supply from SUPPORTED_COINS if available
      const supported = supportedMap.get(coin.symbol);
      const circulatingSupply = supported?.circulatingSupply || 0;
      // Use volume as proxy for market cap if no supply data
      const marketCap = circulatingSupply > 0 ? price * circulatingSupply : quoteVolume;

      // Filter by min market cap
      if (options?.minMarketCap && marketCap < options.minMarketCap) continue;

      const bidPrice = parseFloat(ticker.bidPrice as string);
      const askPrice = parseFloat(ticker.askPrice as string);

      coins.push({
        symbol: coin.symbol,
        name: coin.name,
        image: FEATURES.coingecko ? coin.image : DEFAULT_COIN_IMAGE,
        category: coin.category,
        price,
        priceChange24h: parseFloat(ticker.priceChange as string),
        priceChangePercent24h: parseFloat(ticker.priceChangePercent as string),
        open24h: parseFloat(ticker.openPrice as string),
        high24h: parseFloat(ticker.highPrice as string),
        low24h: parseFloat(ticker.lowPrice as string),
        volume24h: parseFloat(ticker.volume as string),
        quoteVolume24h: quoteVolume,
        tradesCount24h: ticker.count as number,
        marketCap,
        circulatingSupply,
        maxSupply: supported?.maxSupply || null,
        bidPrice,
        askPrice,
        spread: askPrice - bidPrice,
        spreadPercent: price > 0 ? ((askPrice - bidPrice) / price) * 100 : 0,
        vwap: parseFloat(ticker.weightedAvgPrice as string),
        updatedAt: new Date().toISOString(),
      });
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

// 1b. FETCH ALL BINANCE COINS (Dynamic Discovery)
// Returns ALL available Binance USDT pairs (600+ coins)
export async function fetchAllCoins(options?: {
  limit?: number;
  sortBy?: 'volume' | 'price_change' | 'price';
  sortOrder?: 'asc' | 'desc';
  category?: string;
}): Promise<MarketData[]> {
  try {
    // Get all discovered coins
    const discoveredCoins = await discoverCoins();

    // Fetch all 24h tickers from Binance
    const response = await fetch(`${BINANCE_BASE}/ticker/24hr`, {
      next: { revalidate: 60 }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const tickers = await response.json();

    // Create a map for fast lookup
    const tickerMap = new Map<string, Record<string, unknown>>();
    for (const t of tickers) {
      tickerMap.set(t.symbol, t);
    }

    // Also check for coins in SUPPORTED_COINS for accurate supply data
    const supportedMap = new Map(SUPPORTED_COINS.map(c => [c.symbol, c]));

    // Map discovered coins to market data
    const coins: MarketData[] = [];

    for (const coin of discoveredCoins) {
      const ticker = tickerMap.get(coin.binanceSymbol);
      if (!ticker) continue;

      // Filter by category if specified
      if (options?.category && options.category !== 'all') {
        if (coin.category !== options.category) continue;
      }

      const price = parseFloat(ticker.lastPrice as string);
      const quoteVolume = parseFloat(ticker.quoteVolume as string);
      const bidPrice = parseFloat(ticker.bidPrice as string);
      const askPrice = parseFloat(ticker.askPrice as string);

      // Get circulating supply from SUPPORTED_COINS if available
      const supported = supportedMap.get(coin.symbol);
      const circulatingSupply = supported?.circulatingSupply || 0;
      const marketCap = circulatingSupply > 0 ? price * circulatingSupply : quoteVolume; // Use volume as proxy if no supply

      coins.push({
        symbol: coin.symbol,
        name: coin.name,
        image: FEATURES.coingecko ? coin.image : DEFAULT_COIN_IMAGE,
        category: coin.category,
        price,
        priceChange24h: parseFloat(ticker.priceChange as string),
        priceChangePercent24h: parseFloat(ticker.priceChangePercent as string),
        open24h: parseFloat(ticker.openPrice as string),
        high24h: parseFloat(ticker.highPrice as string),
        low24h: parseFloat(ticker.lowPrice as string),
        volume24h: parseFloat(ticker.volume as string),
        quoteVolume24h: quoteVolume,
        tradesCount24h: ticker.count as number,
        marketCap,
        circulatingSupply,
        maxSupply: supported?.maxSupply || null,
        bidPrice,
        askPrice,
        spread: askPrice - bidPrice,
        spreadPercent: price > 0 ? ((askPrice - bidPrice) / price) * 100 : 0,
        vwap: parseFloat(ticker.weightedAvgPrice as string),
        updatedAt: new Date().toISOString(),
      });
    }

    // Sort
    const sortBy = options?.sortBy || 'volume';
    const sortOrder = options?.sortOrder || 'desc';

    coins.sort((a, b) => {
      let aVal: number, bVal: number;
      switch (sortBy) {
        case 'volume': aVal = a.quoteVolume24h; bVal = b.quoteVolume24h; break;
        case 'price_change': aVal = a.priceChangePercent24h; bVal = b.priceChangePercent24h; break;
        case 'price': aVal = a.price; bVal = b.price; break;
        default: aVal = a.quoteVolume24h; bVal = b.quoteVolume24h;
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

// Get count of all available coins
export async function getAvailableCoinCount(): Promise<number> {
  const coins = await discoverCoins();
  return coins.length;
}

// 2. HISTORICAL OHLCV DATA
export async function fetchHistoricalPrices(options: {
  symbol: string;
  interval: '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d' | '1w' | '1M';
  limit?: number;
}): Promise<OHLCVData[]> {
  try {
    const coinInfo = SUPPORTED_COINS.find(c => c.symbol === options.symbol);
    if (!coinInfo) throw new Error(`Symbol ${options.symbol} not found`);
    
    const limit = options.limit || 500;
    const response = await fetch(
      `${BINANCE_BASE}/klines?symbol=${coinInfo.binanceSymbol}&interval=${options.interval}&limit=${limit}`
    );
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const klines = await response.json();
    
    return klines.map((k: (string | number)[]) => ({
      symbol: options.symbol,
      interval: options.interval,
      openTime: new Date(k[0] as number).toISOString(),
      open: parseFloat(k[1] as string),
      high: parseFloat(k[2] as string),
      low: parseFloat(k[3] as string),
      close: parseFloat(k[4] as string),
      volume: parseFloat(k[5] as string),
      closeTime: new Date(k[6] as number).toISOString(),
      quoteVolume: parseFloat(k[7] as string),
      tradesCount: k[8] as number,
      takerBuyBaseVolume: parseFloat(k[9] as string),
      takerBuyQuoteVolume: parseFloat(k[10] as string),
    }));
  } catch (error) {
    console.error('Error fetching historical prices:', error);
    return [];
  }
}

// 3. ORDER BOOK DEPTH
export async function fetchOrderBook(options: {
  symbol: string;
  limit?: 5 | 10 | 20 | 50 | 100 | 500 | 1000;
}): Promise<OrderBookData | null> {
  try {
    const coinInfo = SUPPORTED_COINS.find(c => c.symbol === options.symbol);
    if (!coinInfo) throw new Error(`Symbol ${options.symbol} not found`);
    
    const limit = options.limit || 20;
    const response = await fetch(
      `${BINANCE_BASE}/depth?symbol=${coinInfo.binanceSymbol}&limit=${limit}`
    );
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const data = await response.json();
    
    const bids: OrderBookEntry[] = data.bids.map((b: [string, string]) => {
      const price = parseFloat(b[0]);
      const quantity = parseFloat(b[1]);
      return { price, quantity, total: price * quantity };
    });
    
    const asks: OrderBookEntry[] = data.asks.map((a: [string, string]) => {
      const price = parseFloat(a[0]);
      const quantity = parseFloat(a[1]);
      return { price, quantity, total: price * quantity };
    });
    
    const totalBidVolume = bids.reduce((sum, b) => sum + b.total, 0);
    const totalAskVolume = asks.reduce((sum, a) => sum + a.total, 0);
    const bestBid = bids[0]?.price || 0;
    const bestAsk = asks[0]?.price || 0;
    const midPrice = (bestBid + bestAsk) / 2;
    
    return {
      symbol: options.symbol,
      lastUpdateId: data.lastUpdateId,
      bids,
      asks,
      totalBidVolume,
      totalAskVolume,
      spread: bestAsk - bestBid,
      spreadPercent: ((bestAsk - bestBid) / midPrice) * 100,
      midPrice,
      capturedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error fetching order book:', error);
    return null;
  }
}

// 4. RECENT TRADES
export async function fetchRecentTrades(options: {
  symbol: string;
  limit?: number;
}): Promise<TradeData[]> {
  try {
    const coinInfo = SUPPORTED_COINS.find(c => c.symbol === options.symbol);
    if (!coinInfo) throw new Error(`Symbol ${options.symbol} not found`);
    
    const limit = Math.min(options.limit || 100, 1000);
    const response = await fetch(
      `${BINANCE_BASE}/trades?symbol=${coinInfo.binanceSymbol}&limit=${limit}`
    );
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const trades = await response.json();
    
    return trades.map((t: Record<string, unknown>) => ({
      symbol: options.symbol,
      tradeId: t.id as number,
      price: parseFloat(t.price as string),
      quantity: parseFloat(t.qty as string),
      quoteQuantity: parseFloat(t.quoteQty as string),
      time: new Date(t.time as number).toISOString(),
      isBuyerMaker: t.isBuyerMaker as boolean,
      tradeType: t.isBuyerMaker ? 'SELL' : 'BUY',
    }));
  } catch (error) {
    console.error('Error fetching recent trades:', error);
    return [];
  }
}

// 5. GLOBAL MARKET STATS
export async function fetchGlobalStats(): Promise<GlobalStats | null> {
  try {
    // Redistributable-only mode: derive stats from Binance tickers for our SUPPORTED_COINS universe.
    // Note: This is NOT "global crypto market"; it's "tracked universe".
    const response = await fetch(`${BINANCE_BASE}/ticker/24hr`, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 60 },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const tickers: Array<{
      symbol: string;
      lastPrice: string;
      openPrice: string;
      quoteVolume: string;
    }> = await response.json();

    let totalMarketCap = 0;
    let totalMarketCapPrev = 0;
    let totalVolume24h = 0;

    let btcMarketCap = 0;
    let ethMarketCap = 0;

    for (const coin of SUPPORTED_COINS) {
      const ticker = tickers.find(t => t.symbol === coin.binanceSymbol);
      if (!ticker) continue;

      const price = Number.parseFloat(ticker.lastPrice);
      const open = Number.parseFloat(ticker.openPrice);
      const quoteVolume = Number.parseFloat(ticker.quoteVolume);

      if (!Number.isFinite(price) || !Number.isFinite(open)) continue;

      const marketCap = price * coin.circulatingSupply;
      const prevMarketCap = open * coin.circulatingSupply;

      totalMarketCap += marketCap;
      totalMarketCapPrev += prevMarketCap;
      if (Number.isFinite(quoteVolume)) totalVolume24h += quoteVolume;

      if (coin.symbol === 'BTC') btcMarketCap += marketCap;
      if (coin.symbol === 'ETH') ethMarketCap += marketCap;
    }

    if (!Number.isFinite(totalMarketCap) || totalMarketCap <= 0) return null;

    const btcDominance = (btcMarketCap / totalMarketCap) * 100;
    const ethDominance = (ethMarketCap / totalMarketCap) * 100;
    const marketCapChange24h =
      totalMarketCapPrev > 0 ? ((totalMarketCap - totalMarketCapPrev) / totalMarketCapPrev) * 100 : 0;

    return {
      totalMarketCap,
      totalVolume24h,
      btcDominance: Number.isFinite(btcDominance) ? btcDominance : 0,
      ethDominance: Number.isFinite(ethDominance) ? ethDominance : 0,
      marketCapChange24h: Number.isFinite(marketCapChange24h) ? marketCapChange24h : 0,
      activeCryptocurrencies: SUPPORTED_COINS.length,
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error fetching global stats:', error);
    return null;
  }
}

// 6. TOP GAINERS & LOSERS
export async function fetchGainersLosers(options?: {
  type?: 'both' | 'gainers' | 'losers';
  limit?: number;
}): Promise<GainerLoser[]> {
  try {
    const marketData = await fetchMarketOverview({ sortBy: 'price_change', sortOrder: 'desc' });
    
    const type = options?.type || 'both';
    const limit = options?.limit || 20;
    
    const results: GainerLoser[] = [];
    
    if (type === 'both' || type === 'gainers') {
      const gainers = marketData
        .filter(c => c.priceChangePercent24h > 0)
        .slice(0, limit)
        .map(c => ({
          symbol: c.symbol,
          name: c.name,
          image: c.image,
          price: c.price,
          priceChangePercent24h: c.priceChangePercent24h,
          volume24h: c.quoteVolume24h,
          marketCap: c.marketCap,
          type: 'gainer' as const,
        }));
      results.push(...gainers);
    }
    
    if (type === 'both' || type === 'losers') {
      const losers = marketData
        .filter(c => c.priceChangePercent24h < 0)
        .sort((a, b) => a.priceChangePercent24h - b.priceChangePercent24h)
        .slice(0, limit)
        .map(c => ({
          symbol: c.symbol,
          name: c.name,
          image: c.image,
          price: c.price,
          priceChangePercent24h: c.priceChangePercent24h,
          volume24h: c.quoteVolume24h,
          marketCap: c.marketCap,
          type: 'loser' as const,
        }));
      results.push(...losers);
    }
    
    return results;
  } catch (error) {
    console.error('Error fetching gainers/losers:', error);
    return [];
  }
}

// 7. CATEGORY STATS
export async function fetchCategoryStats(): Promise<CategoryStats[]> {
  try {
    const marketData = await fetchMarketOverview();
    
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

// 8. EXCHANGE INFO
export async function fetchExchangeInfo(): Promise<{
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  status: string;
  minPrice: number;
  maxPrice: number;
  tickSize: number;
  minQty: number;
  maxQty: number;
  stepSize: number;
  minNotional: number;
}[]> {
  try {
    const response = await fetch(`${BINANCE_BASE}/exchangeInfo`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const data = await response.json();
    
    const symbolsToInclude = SUPPORTED_COINS.map(c => c.binanceSymbol);
    
    return data.symbols
      .filter((s: { symbol: string }) => symbolsToInclude.includes(s.symbol))
      .map((s: Record<string, unknown>) => {
        const filters = s.filters as Record<string, string>[];
        const priceFilter = filters.find((f: Record<string, string>) => f.filterType === 'PRICE_FILTER') || {};
        const lotSize = filters.find((f: Record<string, string>) => f.filterType === 'LOT_SIZE') || {};
        const minNotional = filters.find((f: Record<string, string>) => f.filterType === 'NOTIONAL') || {};
        
        return {
          symbol: (s.symbol as string).replace('USDT', ''),
          baseAsset: s.baseAsset as string,
          quoteAsset: s.quoteAsset as string,
          status: s.status as string,
          minPrice: parseFloat(priceFilter.minPrice || '0'),
          maxPrice: parseFloat(priceFilter.maxPrice || '0'),
          tickSize: parseFloat(priceFilter.tickSize || '0'),
          minQty: parseFloat(lotSize.minQty || '0'),
          maxQty: parseFloat(lotSize.maxQty || '0'),
          stepSize: parseFloat(lotSize.stepSize || '0'),
          minNotional: parseFloat(minNotional.minNotional || '0'),
        };
      });
  } catch (error) {
    console.error('Error fetching exchange info:', error);
    return [];
  }
}
