// Data Fetcher Service - Fetches ALL available data from Binance
// No API key needed - 100% FREE

import { FEATURES } from '@/lib/featureFlags';

const DEFAULT_COIN_IMAGE = '/globe.svg';

const BINANCE_BASE = 'https://api.binance.com/api/v3';

// Top trading pairs to fetch data for
export const TOP_SYMBOLS = [
  'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT',
  'ADAUSDT', 'DOGEUSDT', 'AVAXUSDT', 'LINKUSDT', 'DOTUSDT',
  'MATICUSDT', 'TRXUSDT', 'LTCUSDT', 'SHIBUSDT', 'UNIUSDT',
  'XLMUSDT', 'ATOMUSDT', 'NEARUSDT', 'ICPUSDT', 'APTUSDT',
  'FILUSDT', 'ETCUSDT', 'ARBUSDT', 'OPUSDT', 'SUIUSDT',
  'INJUSDT', 'AAVEUSDT', 'GRTUSDT', 'SANDUSDT', 'MANAUSDT',
  'AXSUSDT', 'FTMUSDT', 'ALGOUSDT', 'EGLDUSDT', 'XTZUSDT',
  'EOSUSDT', 'FLOWUSDT', 'CHZUSDT', 'APEUSDT', 'LRCUSDT',
  'CRVUSDT', 'LDOUSDT', 'RNDRUSDT', 'MKRUSDT', 'SNXUSDT',
  'COMPUSDT', 'ZECUSDT', 'ENJUSDT', 'BATUSDT', 'ONEUSDT',
];

// Coin metadata (for names, images, supply)
const COIN_INFO_RAW: Record<string, {
  id: string;
  name: string;
  image: string;
  circulatingSupply: number;
  maxSupply: number | null;
  category: string;
}> = {
  'BTCUSDT': { id: 'bitcoin', name: 'Bitcoin', image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png', circulatingSupply: 19800000, maxSupply: 21000000, category: 'Layer 1' },
  'ETHUSDT': { id: 'ethereum', name: 'Ethereum', image: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png', circulatingSupply: 120400000, maxSupply: null, category: 'Layer 1' },
  'BNBUSDT': { id: 'bnb', name: 'BNB', image: 'https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png', circulatingSupply: 145000000, maxSupply: 200000000, category: 'Exchange' },
  'SOLUSDT': { id: 'solana', name: 'Solana', image: 'https://assets.coingecko.com/coins/images/4128/large/solana.png', circulatingSupply: 477000000, maxSupply: null, category: 'Layer 1' },
  'XRPUSDT': { id: 'xrp', name: 'XRP', image: 'https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png', circulatingSupply: 57000000000, maxSupply: 100000000000, category: 'Payments' },
  'ADAUSDT': { id: 'cardano', name: 'Cardano', image: 'https://assets.coingecko.com/coins/images/975/large/cardano.png', circulatingSupply: 35000000000, maxSupply: 45000000000, category: 'Layer 1' },
  'DOGEUSDT': { id: 'dogecoin', name: 'Dogecoin', image: 'https://assets.coingecko.com/coins/images/5/large/dogecoin.png', circulatingSupply: 147000000000, maxSupply: null, category: 'Meme' },
  'AVAXUSDT': { id: 'avalanche', name: 'Avalanche', image: 'https://assets.coingecko.com/coins/images/12559/large/Avalanche_Circle_RedWhite_Trans.png', circulatingSupply: 410000000, maxSupply: 720000000, category: 'Layer 1' },
  'LINKUSDT': { id: 'chainlink', name: 'Chainlink', image: 'https://assets.coingecko.com/coins/images/877/large/chainlink-new-logo.png', circulatingSupply: 630000000, maxSupply: 1000000000, category: 'Oracle' },
  'DOTUSDT': { id: 'polkadot', name: 'Polkadot', image: 'https://assets.coingecko.com/coins/images/12171/large/polkadot.png', circulatingSupply: 1500000000, maxSupply: null, category: 'Layer 0' },
  'MATICUSDT': { id: 'polygon', name: 'Polygon', image: 'https://assets.coingecko.com/coins/images/4713/large/polygon.png', circulatingSupply: 10000000000, maxSupply: 10000000000, category: 'Layer 2' },
  'TRXUSDT': { id: 'tron', name: 'TRON', image: 'https://assets.coingecko.com/coins/images/1094/large/tron-logo.png', circulatingSupply: 86000000000, maxSupply: null, category: 'Layer 1' },
  'LTCUSDT': { id: 'litecoin', name: 'Litecoin', image: 'https://assets.coingecko.com/coins/images/2/large/litecoin.png', circulatingSupply: 75000000, maxSupply: 84000000, category: 'Payments' },
  'SHIBUSDT': { id: 'shiba-inu', name: 'Shiba Inu', image: 'https://assets.coingecko.com/coins/images/11939/large/shiba.png', circulatingSupply: 589000000000000, maxSupply: null, category: 'Meme' },
  'UNIUSDT': { id: 'uniswap', name: 'Uniswap', image: 'https://assets.coingecko.com/coins/images/12504/large/uni.jpg', circulatingSupply: 600000000, maxSupply: 1000000000, category: 'DeFi' },
  'XLMUSDT': { id: 'stellar', name: 'Stellar', image: 'https://assets.coingecko.com/coins/images/100/large/Stellar_symbol_black_RGB.png', circulatingSupply: 30000000000, maxSupply: 50000000000, category: 'Payments' },
  'ATOMUSDT': { id: 'cosmos', name: 'Cosmos', image: 'https://assets.coingecko.com/coins/images/1481/large/cosmos_hub.png', circulatingSupply: 390000000, maxSupply: null, category: 'Layer 0' },
  'NEARUSDT': { id: 'near', name: 'NEAR Protocol', image: 'https://assets.coingecko.com/coins/images/10365/large/near.jpg', circulatingSupply: 1200000000, maxSupply: 1000000000, category: 'Layer 1' },
  'ICPUSDT': { id: 'icp', name: 'Internet Computer', image: 'https://assets.coingecko.com/coins/images/14495/large/Internet_Computer_logo.png', circulatingSupply: 470000000, maxSupply: null, category: 'Layer 1' },
  'APTUSDT': { id: 'aptos', name: 'Aptos', image: 'https://assets.coingecko.com/coins/images/26455/large/aptos_round.png', circulatingSupply: 500000000, maxSupply: null, category: 'Layer 1' },
  'FILUSDT': { id: 'filecoin', name: 'Filecoin', image: 'https://assets.coingecko.com/coins/images/12817/large/filecoin.png', circulatingSupply: 600000000, maxSupply: null, category: 'Storage' },
  'ETCUSDT': { id: 'ethereum-classic', name: 'Ethereum Classic', image: 'https://assets.coingecko.com/coins/images/453/large/ethereum-classic-logo.png', circulatingSupply: 148000000, maxSupply: 210700000, category: 'Layer 1' },
  'ARBUSDT': { id: 'arbitrum', name: 'Arbitrum', image: 'https://assets.coingecko.com/coins/images/16547/large/photo_2023-03-29_21.47.00.jpeg', circulatingSupply: 4000000000, maxSupply: 10000000000, category: 'Layer 2' },
  'OPUSDT': { id: 'optimism', name: 'Optimism', image: 'https://assets.coingecko.com/coins/images/25244/large/Optimism.png', circulatingSupply: 1200000000, maxSupply: null, category: 'Layer 2' },
  'SUIUSDT': { id: 'sui', name: 'Sui', image: 'https://assets.coingecko.com/coins/images/26375/large/sui_asset.jpeg', circulatingSupply: 2800000000, maxSupply: 10000000000, category: 'Layer 1' },
  'INJUSDT': { id: 'injective', name: 'Injective', image: 'https://assets.coingecko.com/coins/images/12882/large/Secondary_Symbol.png', circulatingSupply: 97000000, maxSupply: 100000000, category: 'DeFi' },
  'AAVEUSDT': { id: 'aave', name: 'Aave', image: 'https://assets.coingecko.com/coins/images/12645/large/AAVE.png', circulatingSupply: 15000000, maxSupply: 16000000, category: 'DeFi' },
  'GRTUSDT': { id: 'the-graph', name: 'The Graph', image: 'https://assets.coingecko.com/coins/images/13397/large/Graph_Token.png', circulatingSupply: 9500000000, maxSupply: null, category: 'Infrastructure' },
  'SANDUSDT': { id: 'sandbox', name: 'The Sandbox', image: 'https://assets.coingecko.com/coins/images/12129/large/sandbox_logo.jpg', circulatingSupply: 2300000000, maxSupply: 3000000000, category: 'Gaming' },
  'MANAUSDT': { id: 'decentraland', name: 'Decentraland', image: 'https://assets.coingecko.com/coins/images/878/large/decentraland-mana.png', circulatingSupply: 1900000000, maxSupply: null, category: 'Gaming' },
};

export const COIN_INFO: Record<
  string,
  {
    id: string;
    name: string;
    image: string;
    circulatingSupply: number;
    maxSupply: number | null;
    category: string;
  }
> = Object.fromEntries(
  Object.entries(COIN_INFO_RAW).map(([symbol, meta]) => [
    symbol,
    {
      ...meta,
      image: FEATURES.coingecko ? meta.image : DEFAULT_COIN_IMAGE,
    },
  ])
);

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
  count: number; // Number of trades
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
  bids: [string, string][]; // [price, quantity][]
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
// DATA FETCHERS
// ============================================

// 1. Fetch 24h Ticker Data for ALL symbols (single API call)
export async function fetchAllTickers(): Promise<TickerData[]> {
  try {
    const response = await fetch(`${BINANCE_BASE}/ticker/24hr`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const data = await response.json();
    
    // Filter to only USDT pairs we care about
    return data
      .filter((t: { symbol: string }) => TOP_SYMBOLS.includes(t.symbol))
      .map((t: Record<string, string | number>) => ({
        symbol: t.symbol,
        priceChange: parseFloat(t.priceChange as string),
        priceChangePercent: parseFloat(t.priceChangePercent as string),
        weightedAvgPrice: parseFloat(t.weightedAvgPrice as string),
        prevClosePrice: parseFloat(t.prevClosePrice as string),
        lastPrice: parseFloat(t.lastPrice as string),
        bidPrice: parseFloat(t.bidPrice as string),
        askPrice: parseFloat(t.askPrice as string),
        openPrice: parseFloat(t.openPrice as string),
        highPrice: parseFloat(t.highPrice as string),
        lowPrice: parseFloat(t.lowPrice as string),
        volume: parseFloat(t.volume as string),
        quoteVolume: parseFloat(t.quoteVolume as string),
        openTime: t.openTime as number,
        closeTime: t.closeTime as number,
        count: t.count as number,
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
    const response = await fetch(
      `${BINANCE_BASE}/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`
    );
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const data = await response.json();
    
    return data.map((k: (string | number)[]) => ({
      symbol,
      interval,
      openTime: k[0] as number,
      open: parseFloat(k[1] as string),
      high: parseFloat(k[2] as string),
      low: parseFloat(k[3] as string),
      close: parseFloat(k[4] as string),
      volume: parseFloat(k[5] as string),
      closeTime: k[6] as number,
      quoteVolume: parseFloat(k[7] as string),
      trades: k[8] as number,
      takerBuyBaseVolume: parseFloat(k[9] as string),
      takerBuyQuoteVolume: parseFloat(k[10] as string),
    }));
  } catch (error) {
    console.error(`Error fetching klines for ${symbol}:`, error);
    return [];
  }
}

// 3. Fetch Order Book (Market Depth)
export async function fetchOrderBook(
  symbol: string,
  limit: 5 | 10 | 20 | 50 | 100 | 500 | 1000 = 20
): Promise<OrderBookData | null> {
  try {
    const response = await fetch(
      `${BINANCE_BASE}/depth?symbol=${symbol}&limit=${limit}`
    );
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const data = await response.json();
    
    return {
      symbol,
      lastUpdateId: data.lastUpdateId,
      bids: data.bids,
      asks: data.asks,
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error(`Error fetching order book for ${symbol}:`, error);
    return null;
  }
}

// 4. Fetch Recent Trades
export async function fetchRecentTrades(
  symbol: string,
  limit: number = 100
): Promise<TradeData[]> {
  try {
    const response = await fetch(
      `${BINANCE_BASE}/trades?symbol=${symbol}&limit=${limit}`
    );
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const data = await response.json();
    
    return data.map((t: Record<string, string | number | boolean>) => ({
      symbol,
      id: t.id as number,
      price: parseFloat(t.price as string),
      qty: parseFloat(t.qty as string),
      quoteQty: parseFloat(t.quoteQty as string),
      time: t.time as number,
      isBuyerMaker: t.isBuyerMaker as boolean,
    }));
  } catch (error) {
    console.error(`Error fetching trades for ${symbol}:`, error);
    return [];
  }
}

// 5. Fetch Exchange Info (Trading Rules)
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
    const response = await fetch(`${BINANCE_BASE}/exchangeInfo`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const data = await response.json();
    
    return {
      symbols: data.symbols
        .filter((s: { symbol: string }) => TOP_SYMBOLS.includes(s.symbol))
        .map((s: Record<string, unknown>) => ({
          symbol: s.symbol,
          status: s.status,
          baseAsset: s.baseAsset,
          quoteAsset: s.quoteAsset,
          filters: s.filters,
        })),
    };
  } catch (error) {
    console.error('Error fetching exchange info:', error);
    return null;
  }
}

// ============================================
// BATCH FETCHERS (For Supabase storage)
// ============================================

// Fetch ALL data for storage
export async function fetchAllData() {
  console.log('Fetching all market data...');
  
  // 1. Fetch all tickers (single API call)
  const tickers = await fetchAllTickers();
  console.log(`Fetched ${tickers.length} tickers`);
  
  // 2. Fetch klines for each symbol (multiple calls, but cached)
  const klines: Record<string, KlineData[]> = {};
  for (const symbol of TOP_SYMBOLS.slice(0, 20)) { // Top 20 only to save API calls
    klines[symbol] = await fetchKlines(symbol, '1d', 30); // Last 30 days
    await new Promise(r => setTimeout(r, 100)); // Rate limit protection
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

// Transform ticker data to our format with metadata
export function enrichTickerData(tickers: TickerData[]) {
  return tickers.map(ticker => {
    const info = COIN_INFO[ticker.symbol];
    const marketCap = info ? ticker.lastPrice * info.circulatingSupply : 0;
    
    return {
      // Basic Info
      symbol: ticker.symbol.replace('USDT', ''),
      name: info?.name || ticker.symbol.replace('USDT', ''),
      image: info?.image || '',
      category: info?.category || 'Unknown',
      
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
      
      // Market Cap (calculated)
      marketCap,
      circulatingSupply: info?.circulatingSupply || 0,
      maxSupply: info?.maxSupply,
      
      // Order Book
      bidPrice: ticker.bidPrice,
      askPrice: ticker.askPrice,
      spread: ticker.askPrice - ticker.bidPrice,
      spreadPercent: ((ticker.askPrice - ticker.bidPrice) / ticker.lastPrice) * 100,
      
      // Averages
      vwap: ticker.weightedAvgPrice, // Volume Weighted Average Price
      
      // Timestamps
      openTime: new Date(ticker.openTime).toISOString(),
      closeTime: new Date(ticker.closeTime).toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }).sort((a, b) => b.marketCap - a.marketCap);
}
