import { getBinanceKlines, getCoinSymbol } from '@/lib/binance';
import type { TechnicalData } from '@/lib/predictionEngine';

const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';

type MarketChart = {
  prices: [number, number][];
  total_volumes?: [number, number][];
};

type Candle = {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

function bucketToCandles(
  prices: [number, number][],
  volumes: [number, number][] | undefined,
  bucketMs: number
): Candle[] {
  if (!Array.isArray(prices) || prices.length === 0) return [];

  const volumeByBucket = new Map<number, number>();
  if (Array.isArray(volumes)) {
    for (const [ts, vol] of volumes) {
      const key = Math.floor(ts / bucketMs) * bucketMs;
      volumeByBucket.set(key, vol);
    }
  }

  const buckets = new Map<number, Candle>();

  for (const [ts, price] of prices) {
    const key = Math.floor(ts / bucketMs) * bucketMs;
    const existing = buckets.get(key);
    const vol = volumeByBucket.get(key);

    if (!existing) {
      buckets.set(key, {
        timestamp: key,
        open: price,
        high: price,
        low: price,
        close: price,
        volume: typeof vol === 'number' ? vol : 0,
      });
    } else {
      existing.high = Math.max(existing.high, price);
      existing.low = Math.min(existing.low, price);
      existing.close = price;
      if (typeof vol === 'number') existing.volume = vol;
    }
  }

  return Array.from(buckets.values()).sort((a, b) => a.timestamp - b.timestamp);
}

async function fetchCoinGeckoMarketChart(coinId: string, days: number): Promise<MarketChart | null> {
  const url = `${COINGECKO_BASE}/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`;
  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
    next: { revalidate: 60 },
  });
  if (!response.ok) return null;
  const data = (await response.json()) as MarketChart;
  if (!data?.prices || !Array.isArray(data.prices)) return null;
  return data;
}

function calculateSMA(prices: number[], period: number): number | null {
  if (prices.length < period) return null;
  const slice = prices.slice(-period);
  const sum = slice.reduce((acc, p) => acc + p, 0);
  return sum / period;
}

function calculateRSI(prices: number[], period = 14): number | null {
  if (prices.length < period + 1) return null;

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const change = prices[i] - prices[i - 1];
    if (change > 0) gains += change;
    else losses -= change;
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  for (let i = period + 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    if (change > 0) {
      avgGain = (avgGain * (period - 1) + change) / period;
      avgLoss = (avgLoss * (period - 1)) / period;
    } else {
      avgGain = (avgGain * (period - 1)) / period;
      avgLoss = (avgLoss * (period - 1) - change) / period;
    }
  }

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

function calculateEMA(series: number[], period: number): number[] {
  if (series.length === 0) return [];
  const k = 2 / (period + 1);
  const ema: number[] = [];

  let prev = series[0];
  ema.push(prev);

  for (let i = 1; i < series.length; i++) {
    const next = series[i] * k + prev * (1 - k);
    ema.push(next);
    prev = next;
  }

  return ema;
}

function macdCross(prices: number[]): { signal: TechnicalData['macdSignal'] } {
  if (prices.length < 35) return { signal: undefined };

  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  const macdLine = prices.map((_, i) => ema12[i] - ema26[i]);
  const signalLine = calculateEMA(macdLine, 9);
  const histogram = macdLine.map((v, i) => v - signalLine[i]);

  const last = histogram[histogram.length - 1];
  const prev = histogram[histogram.length - 2];
  if (!Number.isFinite(last) || !Number.isFinite(prev)) return { signal: undefined };

  if (prev <= 0 && last > 0) return { signal: 'bullish_cross' };
  if (prev >= 0 && last < 0) return { signal: 'bearish_cross' };
  return { signal: 'neutral' };
}

function bollingerPosition(prices: number[], period = 20): TechnicalData['bollingerPosition'] {
  if (prices.length < period) return undefined;
  const slice = prices.slice(-period);
  const sma = slice.reduce((sum, p) => sum + p, 0) / period;
  const variance = slice.reduce((sum, p) => sum + (p - sma) ** 2, 0) / period;
  const std = Math.sqrt(variance);
  const upper = sma + 2 * std;
  const lower = sma - 2 * std;
  const current = prices[prices.length - 1];

  if (current >= upper) return 'upper';
  if (current <= lower) return 'lower';
  return 'middle';
}

function compareToMA(current: number, ma: number | null): 'above' | 'below' | 'near' | undefined {
  if (ma === null || !Number.isFinite(ma) || !Number.isFinite(current)) return undefined;
  const diffPct = ((current - ma) / ma) * 100;
  if (Math.abs(diffPct) <= 1) return 'near';
  return diffPct > 0 ? 'above' : 'below';
}

function volumeTrend(candles: Candle[]): TechnicalData['volumeTrend'] {
  if (candles.length < 12) return undefined;
  const vols = candles.map(c => c.volume).filter(v => Number.isFinite(v));
  if (vols.length < 12) return undefined;

  const last5 = vols.slice(-5);
  const prev5 = vols.slice(-10, -5);
  const avg = (arr: number[]) => arr.reduce((s, v) => s + v, 0) / arr.length;
  const a1 = avg(last5);
  const a0 = avg(prev5);
  if (!Number.isFinite(a1) || !Number.isFinite(a0) || a0 === 0) return undefined;

  if (a1 > a0 * 1.1) return 'increasing';
  if (a1 < a0 * 0.9) return 'decreasing';
  return 'stable';
}

async function fetchCandlesDaily(coinId: string, days: number): Promise<Candle[]> {
  const symbol = getCoinSymbol(coinId);

  if (symbol) {
    const klines = await getBinanceKlines(symbol, '1d', Math.min(days, 500));
    if (Array.isArray(klines) && klines.length > 0) {
      return klines;
    }
  }

  const chart = await fetchCoinGeckoMarketChart(coinId, days);
  if (!chart) return [];

  const bucketMs = 24 * 60 * 60 * 1000;
  return bucketToCandles(chart.prices, chart.total_volumes, bucketMs);
}

export async function fetchTechnicalDataForPrediction(coinId: string): Promise<TechnicalData | null> {
  // Need ~200 daily candles to do MA200 reliably.
  const candles = await fetchCandlesDaily(coinId, 220);
  if (!candles || candles.length < 35) return null;

  const prices = candles.map(c => c.close).filter(p => Number.isFinite(p));
  if (prices.length < 35) return null;

  const current = prices[prices.length - 1];

  const rsi14 = calculateRSI(prices, 14);
  const sma50 = calculateSMA(prices, 50);
  const sma200 = calculateSMA(prices, Math.min(200, prices.length));
  const macd = macdCross(prices);
  const bbPos = bollingerPosition(prices, 20);
  const volTrend = volumeTrend(candles);

  const tech: TechnicalData = {
    rsi14: typeof rsi14 === 'number' && Number.isFinite(rsi14) ? rsi14 : undefined,
    macdSignal: macd.signal,
    priceVs50MA: compareToMA(current, sma50),
    priceVs200MA: compareToMA(current, sma200),
    bollingerPosition: bbPos,
    volumeTrend: volTrend,
  };

  // If nothing could be computed, treat as unavailable.
  const hasAny = Object.values(tech).some(v => v !== undefined);
  return hasAny ? tech : null;
}
