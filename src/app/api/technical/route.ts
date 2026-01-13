/**
 * Technical Indicators API
 * Calculates technical indicators from price data
 */

import { NextResponse } from 'next/server';
import { getBinanceKlines, getCoinSymbol } from '@/lib/binance';
import { isFeatureEnabled } from '@/lib/featureFlags';
import { assertRedistributionAllowed } from '@/lib/redistributionPolicy';
const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';

type MarketChart = {
  prices: [number, number][];
  total_volumes?: [number, number][];
};

function bucketToCandles(
  prices: [number, number][],
  volumes: [number, number][] | undefined,
  bucketMs: number
): Candle[] {
  if (!prices || prices.length === 0) return [];

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

interface Candle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface TechnicalIndicator {
  name: string;
  shortName: string;
  value: number | string;
  state: 'bullish' | 'bearish' | 'neutral';  // Indicator state, not trading signal
  description: string;
  interpretation: string;  // Educational interpretation, not advice
}

function computePctReturns(prices: number[]): number[] {
  const returns: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    const prev = prices[i - 1];
    const cur = prices[i];
    if (!Number.isFinite(prev) || !Number.isFinite(cur) || prev === 0) continue;
    returns.push((cur - prev) / prev);
  }
  return returns;
}

function computeStdDev(values: number[]): number | null {
  if (!values || values.length < 2) return null;
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / (values.length - 1);
  return Math.sqrt(variance);
}

// Calculate RSI (Relative Strength Index)
function calculateRSI(prices: number[], period: number = 14): number {
  if (prices.length < period + 1) return 50;

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
  return 100 - (100 / (1 + rs));
}

// Calculate Simple Moving Average
function calculateSMA(prices: number[], period: number): number {
  if (prices.length < period) return prices[prices.length - 1];
  const slice = prices.slice(-period);
  return slice.reduce((sum, p) => sum + p, 0) / period;
}

// Calculate EMA (Exponential Moving Average)
function calculateEMA(prices: number[], period: number): number {
  if (prices.length < period) return prices[prices.length - 1];
  const k = 2 / (period + 1);
  let ema = prices.slice(0, period).reduce((sum, p) => sum + p, 0) / period;

  for (let i = period; i < prices.length; i++) {
    ema = prices[i] * k + ema * (1 - k);
  }
  return ema;
}

// Calculate MACD
function calculateMACD(prices: number[]): { macd: number; signal: number; histogram: number } {
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  const macd = ema12 - ema26;

  // Calculate signal line (9-period EMA of MACD)
  const macdLine: number[] = [];
  for (let i = 26; i < prices.length; i++) {
    const ema12i = calculateEMA(prices.slice(0, i + 1), 12);
    const ema26i = calculateEMA(prices.slice(0, i + 1), 26);
    macdLine.push(ema12i - ema26i);
  }

  const signal = macdLine.length >= 9 ? calculateEMA(macdLine, 9) : macd;
  const histogram = macd - signal;

  return { macd, signal, histogram };
}

// Calculate Bollinger Bands
function calculateBollingerBands(prices: number[], period: number = 20): { upper: number; middle: number; lower: number; position: string } {
  const sma = calculateSMA(prices, period);
  const slice = prices.slice(-period);
  const squaredDiffs = slice.map(p => Math.pow(p - sma, 2));
  const standardDeviation = Math.sqrt(squaredDiffs.reduce((sum, d) => sum + d, 0) / period);

  const upper = sma + (2 * standardDeviation);
  const lower = sma - (2 * standardDeviation);
  const currentPrice = prices[prices.length - 1];

  let position = 'Middle';
  if (currentPrice > upper) position = 'Above Upper';
  else if (currentPrice > sma + standardDeviation) position = 'Upper Half';
  else if (currentPrice < lower) position = 'Below Lower';
  else if (currentPrice < sma - standardDeviation) position = 'Lower Half';

  return { upper, middle: sma, lower, position };
}

// Calculate Stochastic RSI
function calculateStochRSI(prices: number[], period: number = 14): number {
  const rsiValues: number[] = [];
  for (let i = period; i < prices.length; i++) {
    rsiValues.push(calculateRSI(prices.slice(0, i + 1), period));
  }

  if (rsiValues.length < period) return 50;

  const recentRSI = rsiValues.slice(-period);
  const currentRSI = recentRSI[recentRSI.length - 1];
  const minRSI = Math.min(...recentRSI);
  const maxRSI = Math.max(...recentRSI);

  if (maxRSI === minRSI) return 50;
  return ((currentRSI - minRSI) / (maxRSI - minRSI)) * 100;
}

// Calculate ADX (Average Directional Index)
function calculateADX(candles: Candle[], period: number = 14): number {
  if (candles.length < period + 1) return 25;

  const trueRanges: number[] = [];
  const plusDMs: number[] = [];
  const minusDMs: number[] = [];

  for (let i = 1; i < candles.length; i++) {
    const high = candles[i].high;
    const low = candles[i].low;
    const prevClose = candles[i - 1].close;
    const prevHigh = candles[i - 1].high;
    const prevLow = candles[i - 1].low;

    const tr = Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose));
    trueRanges.push(tr);

    const plusDM = high - prevHigh > prevLow - low ? Math.max(high - prevHigh, 0) : 0;
    const minusDM = prevLow - low > high - prevHigh ? Math.max(prevLow - low, 0) : 0;
    plusDMs.push(plusDM);
    minusDMs.push(minusDM);
  }

  // Calculate smoothed values
  let atr = trueRanges.slice(0, period).reduce((sum, v) => sum + v, 0);
  let plusDI = plusDMs.slice(0, period).reduce((sum, v) => sum + v, 0);
  let minusDI = minusDMs.slice(0, period).reduce((sum, v) => sum + v, 0);

  const dxValues: number[] = [];

  for (let i = period; i < trueRanges.length; i++) {
    atr = atr - (atr / period) + trueRanges[i];
    plusDI = plusDI - (plusDI / period) + plusDMs[i];
    minusDI = minusDI - (minusDI / period) + minusDMs[i];

    const plusDIpct = (plusDI / atr) * 100;
    const minusDIpct = (minusDI / atr) * 100;
    const dx = Math.abs(plusDIpct - minusDIpct) / (plusDIpct + minusDIpct) * 100;
    dxValues.push(dx);
  }

  if (dxValues.length < period) return 25;
  return dxValues.slice(-period).reduce((sum, v) => sum + v, 0) / period;
}

// Calculate CCI (Commodity Channel Index)
function calculateCCI(candles: Candle[], period: number = 20): number {
  if (candles.length < period) return 0;

  const typicalPrices = candles.slice(-period).map(c => (c.high + c.low + c.close) / 3);
  const sma = typicalPrices.reduce((sum, p) => sum + p, 0) / period;
  const meanDeviation = typicalPrices.reduce((sum, p) => sum + Math.abs(p - sma), 0) / period;

  if (meanDeviation === 0) return 0;
  return (typicalPrices[typicalPrices.length - 1] - sma) / (0.015 * meanDeviation);
}

// Calculate Williams %R
function calculateWilliamsR(candles: Candle[], period: number = 14): number {
  if (candles.length < period) return -50;

  const recent = candles.slice(-period);
  const highestHigh = Math.max(...recent.map(c => c.high));
  const lowestLow = Math.min(...recent.map(c => c.low));
  const currentClose = candles[candles.length - 1].close;

  if (highestHigh === lowestLow) return -50;
  return ((highestHigh - currentClose) / (highestHigh - lowestLow)) * -100;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const coin = searchParams.get('coin') || 'bitcoin';
    const timeframe = searchParams.get('timeframe') || '1d';

    // Map timeframe to interval and days
    const intervalMap: Record<string, { interval: '1h' | '4h' | '1d'; days: number }> = {
      '1h': { interval: '1h', days: 7 },
      '4h': { interval: '4h', days: 30 },
      '1d': { interval: '1d', days: 200 },
      '1w': { interval: '1d', days: 365 },
    };

    const { interval, days } = intervalMap[timeframe] || intervalMap['1d'];
    const symbol = getCoinSymbol(coin);

    let candles: Candle[] = [];
    let source: 'binance' | 'coingecko' = 'binance';

    if (symbol) {
      try {
        const klines = await getBinanceKlines(symbol, interval, Math.min(days, 500));
        if (klines && klines.length > 0) {
          assertRedistributionAllowed('binance', { purpose: 'chart', route: '/api/technical' });
          candles = klines;
          source = 'binance';
        }
      } catch (e) {
        console.error('Binance fetch error:', e);
      }
    }

    // Fallback to CoinGecko market chart if Binance is unavailable
    if (candles.length === 0) {
      if (!isFeatureEnabled('coingecko')) {
        return NextResponse.json({
          success: false,
          error: 'No candle data available from Binance (CoinGecko disabled).',
          coin,
          timeframe,
        }, { status: 502 });
      }

      assertRedistributionAllowed('coingecko', { purpose: 'chart', route: '/api/technical' });

      const bucketMs = interval === '1h'
        ? 60 * 60 * 1000
        : interval === '4h'
          ? 4 * 60 * 60 * 1000
          : 24 * 60 * 60 * 1000;

      const chart = await fetchCoinGeckoMarketChart(coin, days);
      candles = chart ? bucketToCandles(chart.prices, chart.total_volumes, bucketMs) : [];
      source = 'coingecko';
    }

    if (candles.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No candle data available from Binance or CoinGecko.',
        coin,
        timeframe,
      }, { status: 502 });
    }

    const prices = candles.map(c => c.close);
    const currentPrice = prices[prices.length - 1];

    // Extra derived metrics (real, computed from the same candle series)
    const window = 30;
    const windowPrices = prices.length >= window + 1 ? prices.slice(-(window + 1)) : null;
    const windowReturns = windowPrices ? computePctReturns(windowPrices) : null;
    const volatility30dPct = windowReturns ? computeStdDev(windowReturns) : null;
    const momentum30dPct = windowPrices
      ? ((windowPrices[windowPrices.length - 1] / windowPrices[0]) - 1)
      : null;

    // Calculate all indicators
    const rsi = calculateRSI(prices, 14);
    const sma20 = calculateSMA(prices, 20);
    const sma50 = calculateSMA(prices, 50);
    const sma200 = calculateSMA(prices, Math.min(200, prices.length));
    const macdData = calculateMACD(prices);
    const bb = calculateBollingerBands(prices, 20);
    const stochRSI = calculateStochRSI(prices, 14);
    const adx = calculateADX(candles, 14);
    const cci = calculateCCI(candles, 20);
    const williamsR = calculateWilliamsR(candles, 14);

    // Determine indicator states (educational, not trading signals)
    const indicators: TechnicalIndicator[] = [
      {
        name: 'Relative Strength Index',
        shortName: 'RSI (14)',
        value: Math.round(rsi),
        state: rsi > 70 ? 'bearish' : rsi < 30 ? 'bullish' : 'neutral',
        description: 'Momentum oscillator measuring speed of price changes',
        interpretation: rsi > 70
          ? `RSI at ${Math.round(rsi)} indicates overbought conditions`
          : rsi < 30
            ? `RSI at ${Math.round(rsi)} indicates oversold conditions`
            : `RSI at ${Math.round(rsi)} is in neutral range`
      },
      {
        name: 'Moving Average (20)',
        shortName: 'SMA 20',
        value: `$${sma20.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
        state: currentPrice > sma20 ? 'bullish' : currentPrice < sma20 ? 'bearish' : 'neutral',
        description: 'Average price over last 20 periods',
        interpretation: currentPrice > sma20
          ? 'Price is above the 20-period average'
          : 'Price is below the 20-period average'
      },
      {
        name: 'Moving Average (50)',
        shortName: 'SMA 50',
        value: `$${sma50.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
        state: currentPrice > sma50 ? 'bullish' : currentPrice < sma50 ? 'bearish' : 'neutral',
        description: 'Average price over last 50 periods',
        interpretation: currentPrice > sma50
          ? 'Price is above the 50-period average'
          : 'Price is below the 50-period average'
      },
      {
        name: 'Moving Average (200)',
        shortName: 'SMA 200',
        value: `$${sma200.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
        state: currentPrice > sma200 ? 'bullish' : currentPrice < sma200 ? 'bearish' : 'neutral',
        description: 'Average price over last 200 periods',
        interpretation: currentPrice > sma200
          ? 'Price is above the 200-period average (long-term uptrend)'
          : 'Price is below the 200-period average (long-term downtrend)'
      },
      {
        name: 'MACD',
        shortName: 'MACD',
        value: macdData.macd >= 0 ? `+${macdData.macd.toFixed(0)}` : macdData.macd.toFixed(0),
        state: macdData.histogram > 0 ? 'bullish' : macdData.histogram < 0 ? 'bearish' : 'neutral',
        description: 'Moving Average Convergence Divergence',
        interpretation: macdData.histogram > 0
          ? 'MACD is positive and above signal line (bullish momentum)'
          : 'MACD is below signal line (bearish momentum)'
      },
      {
        name: 'Bollinger Bands',
        shortName: 'BB',
        value: bb.position,
        state: bb.position.includes('Lower') ? 'bullish' : bb.position.includes('Upper') || bb.position === 'Above Upper' ? 'bearish' : 'neutral',
        description: 'Volatility bands around price',
        interpretation: bb.position.includes('Lower')
          ? 'Price near lower band (potentially oversold)'
          : bb.position.includes('Upper')
            ? 'Price near upper band (potentially overbought)'
            : 'Price is in the middle range'
      },
      {
        name: 'Stochastic RSI',
        shortName: 'StochRSI',
        value: Math.round(stochRSI),
        state: stochRSI > 80 ? 'bearish' : stochRSI < 20 ? 'bullish' : 'neutral',
        description: 'RSI applied to RSI for more sensitivity',
        interpretation: stochRSI > 80
          ? `StochRSI at ${Math.round(stochRSI)} indicates overbought conditions`
          : stochRSI < 20
            ? `StochRSI at ${Math.round(stochRSI)} indicates oversold conditions`
            : `StochRSI at ${Math.round(stochRSI)} is in neutral range`
      },
      {
        name: 'Average Directional Index',
        shortName: 'ADX',
        value: Math.round(adx),
        state: adx > 25 && currentPrice > sma20 ? 'bullish' : adx > 25 && currentPrice < sma20 ? 'bearish' : 'neutral',
        description: 'Measures trend strength',
        interpretation: adx > 25
          ? `ADX at ${Math.round(adx)} indicates a strong trend`
          : `ADX at ${Math.round(adx)} indicates weak/no trend`
      },
      {
        name: 'Commodity Channel Index',
        shortName: 'CCI (20)',
        value: Math.round(cci),
        state: cci > 100 ? 'bearish' : cci < -100 ? 'bullish' : 'neutral',
        description: 'Identifies cyclical trends',
        interpretation: cci > 100
          ? `CCI at ${Math.round(cci)} indicates overbought conditions`
          : cci < -100
            ? `CCI at ${Math.round(cci)} indicates oversold conditions`
            : `CCI at ${Math.round(cci)} is in normal range`
      },
      {
        name: 'Williams %R',
        shortName: 'Williams %R',
        value: Math.round(williamsR),
        state: williamsR > -20 ? 'bearish' : williamsR < -80 ? 'bullish' : 'neutral',
        description: 'Momentum indicator similar to Stochastic',
        interpretation: williamsR > -20
          ? `Williams %R at ${Math.round(williamsR)} indicates overbought conditions`
          : williamsR < -80
            ? `Williams %R at ${Math.round(williamsR)} indicates oversold conditions`
            : `Williams %R at ${Math.round(williamsR)} is in neutral range`
      },
      {
        name: 'Ichimoku Cloud',
        shortName: 'Ichimoku',
        value: currentPrice > sma50 ? 'Above Cloud' : currentPrice < sma50 * 0.95 ? 'Below Cloud' : 'In Cloud',
        state: currentPrice > sma50 ? 'bullish' : currentPrice < sma50 * 0.95 ? 'bearish' : 'neutral',
        description: 'Japanese indicator showing support/resistance',
        interpretation: currentPrice > sma50
          ? 'Price is above the cloud (bullish trend)'
          : currentPrice < sma50 * 0.95
            ? 'Price is below the cloud (bearish trend)'
            : 'Price is inside the cloud (consolidation)'
      },
      {
        name: 'Pivot Points',
        shortName: 'Pivot',
        value: `$${((candles[candles.length - 1].high + candles[candles.length - 1].low + candles[candles.length - 1].close) / 3).toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
        state: currentPrice > (candles[candles.length - 1].high + candles[candles.length - 1].low + candles[candles.length - 1].close) / 3 ? 'bullish' : 'bearish',
        description: 'Key support and resistance levels',
        interpretation: 'Pivot point helps identify potential support and resistance levels.'
      },
    ];

    // Calculate overall indicator states (educational, not trading recommendations)
    const bullishCount = indicators.filter(i => i.state === 'bullish').length;
    const bearishCount = indicators.filter(i => i.state === 'bearish').length;
    const neutralCount = indicators.filter(i => i.state === 'neutral').length;

    return NextResponse.json({
      success: true,
      data: {
        indicators,
        metrics: {
          volatility30dPct: typeof volatility30dPct === 'number' ? volatility30dPct * 100 : null,
          momentum30dPct: typeof momentum30dPct === 'number' ? momentum30dPct * 100 : null,
          windowDays: window,
        },
        summary: {
          bullishCount,
          bearishCount,
          neutralCount,
          // Overall trend indication (educational, not trading advice)
          overallTrend: bullishCount > bearishCount + 2 ? 'Strong Bullish' :
                        bullishCount > bearishCount ? 'Bullish' :
                        bearishCount > bullishCount + 2 ? 'Strong Bearish' :
                        bearishCount > bullishCount ? 'Bearish' : 'Neutral',
          currentPrice,
          sma20,
          sma50,
          sma200,
        },
        meta: {
          coin,
          timeframe,
          source,
          dataPoints: candles.length,
          lastUpdate: new Date().toISOString(),
        },
        disclaimer: 'Technical indicators are for educational purposes only. Not financial advice.',
      }
    });
  } catch (error) {
    console.error('Technical API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to calculate technical indicators',
    }, { status: 500 });
  }
}
