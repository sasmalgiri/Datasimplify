// ============================================
// COMPREHENSIVE DATA API - Fetches ALL data from Binance
// ============================================

import { SUPPORTED_COINS, CoinInfo } from './dataTypes';

const BINANCE_BASE = 'https://api.binance.com/api/v3';

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

// 1. MARKET OVERVIEW - All coins with full data
export async function fetchMarketOverview(options?: {
  symbols?: string[];
  category?: string;
  minMarketCap?: number;
  sortBy?: 'market_cap' | 'volume' | 'price_change' | 'price';
  sortOrder?: 'asc' | 'desc';
}): Promise<MarketData[]> {
  try {
    // Fetch all 24h tickers from Binance
    const response = await fetch(`${BINANCE_BASE}/ticker/24hr`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const tickers = await response.json();
    
    // Map Binance data to our format with metadata
    let coins: MarketData[] = [];
    
    for (const coinInfo of SUPPORTED_COINS) {
      const ticker = tickers.find((t: { symbol: string }) => t.symbol === coinInfo.binanceSymbol);
      if (!ticker) continue;
      
      // Filter by selected symbols
      if (options?.symbols && options.symbols.length > 0) {
        if (!options.symbols.includes(coinInfo.symbol)) continue;
      }
      
      // Filter by category
      if (options?.category && options.category !== 'all') {
        if (coinInfo.category !== options.category) continue;
      }
      
      const price = parseFloat(ticker.lastPrice);
      const marketCap = price * coinInfo.circulatingSupply;
      
      // Filter by min market cap
      if (options?.minMarketCap && marketCap < options.minMarketCap) continue;
      
      const bidPrice = parseFloat(ticker.bidPrice);
      const askPrice = parseFloat(ticker.askPrice);
      
      coins.push({
        symbol: coinInfo.symbol,
        name: coinInfo.name,
        image: coinInfo.image,
        category: coinInfo.category,
        price,
        priceChange24h: parseFloat(ticker.priceChange),
        priceChangePercent24h: parseFloat(ticker.priceChangePercent),
        open24h: parseFloat(ticker.openPrice),
        high24h: parseFloat(ticker.highPrice),
        low24h: parseFloat(ticker.lowPrice),
        volume24h: parseFloat(ticker.volume),
        quoteVolume24h: parseFloat(ticker.quoteVolume),
        tradesCount24h: ticker.count,
        marketCap,
        circulatingSupply: coinInfo.circulatingSupply,
        maxSupply: coinInfo.maxSupply,
        bidPrice,
        askPrice,
        spread: askPrice - bidPrice,
        spreadPercent: ((askPrice - bidPrice) / price) * 100,
        vwap: parseFloat(ticker.weightedAvgPrice),
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
    const response = await fetch(`${BINANCE_BASE}/ticker/24hr`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const tickers = await response.json();
    
    let totalVolume = 0;
    let btcMarketCap = 0;
    let ethMarketCap = 0;
    let totalMarketCap = 0;
    
    for (const coinInfo of SUPPORTED_COINS) {
      const ticker = tickers.find((t: { symbol: string }) => t.symbol === coinInfo.binanceSymbol);
      if (!ticker) continue;
      
      const price = parseFloat(ticker.lastPrice);
      const volume = parseFloat(ticker.quoteVolume);
      const marketCap = price * coinInfo.circulatingSupply;
      
      totalVolume += volume;
      totalMarketCap += marketCap;
      
      if (coinInfo.symbol === 'BTC') btcMarketCap = marketCap;
      if (coinInfo.symbol === 'ETH') ethMarketCap = marketCap;
    }
    
    // Estimate full market cap (our coins ~75% of total)
    const estimatedTotalMarketCap = totalMarketCap / 0.75;
    
    return {
      totalMarketCap: estimatedTotalMarketCap,
      totalVolume24h: totalVolume,
      btcDominance: (btcMarketCap / estimatedTotalMarketCap) * 100,
      ethDominance: (ethMarketCap / estimatedTotalMarketCap) * 100,
      marketCapChange24h: 0, // Would need historical data
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
