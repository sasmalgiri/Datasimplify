// Binance API Client - FREE, no API key needed for public endpoints
// Rate limit: 6000 request weight per minute

const BINANCE_BASE_URL = 'https://api.binance.com';

// Symbol mapping: CoinGecko ID -> Binance symbol
const SYMBOL_MAP: Record<string, string> = {
  'bitcoin': 'BTCUSDT',
  'ethereum': 'ETHUSDT',
  'binancecoin': 'BNBUSDT',
  'solana': 'SOLUSDT',
  'ripple': 'XRPUSDT',
  'cardano': 'ADAUSDT',
  'dogecoin': 'DOGEUSDT',
  'polkadot': 'DOTUSDT',
  'polygon': 'MATICUSDT',
  'litecoin': 'LTCUSDT',
  'chainlink': 'LINKUSDT',
  'avalanche-2': 'AVAXUSDT',
  'uniswap': 'UNIUSDT',
  'stellar': 'XLMUSDT',
  'monero': 'XMRUSDT',
  'ethereum-classic': 'ETCUSDT',
  'tron': 'TRXUSDT',
  'cosmos': 'ATOMUSDT',
  'near': 'NEARUSDT',
  'algorand': 'ALGOUSDT',
  // Add more as needed
};

export function getCoinSymbol(coinId: string): string | null {
  return SYMBOL_MAP[coinId.toLowerCase()] || null;
}

export async function getBinancePrice(symbol: string): Promise<{
  price: number;
  priceChange24h: number;
  priceChangePercent24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  quoteVolume24h: number;
} | null> {
  try {
    const response = await fetch(
      `${BINANCE_BASE_URL}/api/v3/ticker/24hr?symbol=${symbol}`
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    
    return {
      price: parseFloat(data.lastPrice),
      priceChange24h: parseFloat(data.priceChange),
      priceChangePercent24h: parseFloat(data.priceChangePercent),
      high24h: parseFloat(data.highPrice),
      low24h: parseFloat(data.lowPrice),
      volume24h: parseFloat(data.volume),
      quoteVolume24h: parseFloat(data.quoteVolume),
    };
  } catch (error) {
    console.error('Binance API error:', error);
    return null;
  }
}

export async function getBinanceKlines(
  symbol: string,
  interval: '1m' | '5m' | '15m' | '1h' | '4h' | '1d' | '1w' = '1d',
  limit: number = 100
): Promise<Array<{
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}>> {
  try {
    const response = await fetch(
      `${BINANCE_BASE_URL}/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`
    );
    
    if (!response.ok) return [];
    
    const data = await response.json();
    
    return data.map((kline: (string | number)[]) => ({
      timestamp: kline[0] as number,
      open: parseFloat(kline[1] as string),
      high: parseFloat(kline[2] as string),
      low: parseFloat(kline[3] as string),
      close: parseFloat(kline[4] as string),
      volume: parseFloat(kline[5] as string),
    }));
  } catch (error) {
    console.error('Binance klines error:', error);
    return [];
  }
}

export async function getBinanceMultiplePrices(symbols: string[]): Promise<Map<string, number>> {
  const prices = new Map<string, number>();
  
  try {
    // Get all prices in one call (weight: 40)
    const response = await fetch(`${BINANCE_BASE_URL}/api/v3/ticker/price`);
    
    if (!response.ok) return prices;
    
    const data: Array<{ symbol: string; price: string }> = await response.json();
    
    for (const item of data) {
      if (symbols.includes(item.symbol)) {
        prices.set(item.symbol, parseFloat(item.price));
      }
    }
    
    return prices;
  } catch (error) {
    console.error('Binance multiple prices error:', error);
    return prices;
  }
}

// WebSocket for real-time prices (optional for V2)
export function createBinanceWebSocket(
  symbols: string[],
  onPrice: (symbol: string, price: number) => void
): WebSocket | null {
  if (typeof window === 'undefined') return null;
  
  const streams = symbols.map(s => `${s.toLowerCase()}@trade`).join('/');
  const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${streams}`);
  
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    onPrice(data.s, parseFloat(data.p));
  };
  
  return ws;
}
