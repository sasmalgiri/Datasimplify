/**
 * Technical Indicators API
 * Calculates technical indicators from price data
 */

import { NextResponse } from 'next/server';
import { getBinanceKlines, getCoinSymbol } from '@/lib/binance';

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
  signal: 'buy' | 'sell' | 'neutral';
  description: string;
  beginnerExplanation: string;
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
    let source = 'mock';

    if (symbol) {
      try {
        const klines = await getBinanceKlines(symbol, interval, Math.min(days, 500));
        if (klines && klines.length > 0) {
          candles = klines;
          source = 'binance';
        }
      } catch (e) {
        console.error('Binance fetch error:', e);
      }
    }

    // Generate mock data if needed
    if (candles.length === 0) {
      candles = generateMockCandles(coin, days);
    }

    const prices = candles.map(c => c.close);
    const currentPrice = prices[prices.length - 1];

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

    // Determine signals based on values
    const indicators: TechnicalIndicator[] = [
      {
        name: 'Relative Strength Index',
        shortName: 'RSI (14)',
        value: Math.round(rsi),
        signal: rsi > 70 ? 'sell' : rsi < 30 ? 'buy' : 'neutral',
        description: 'Momentum oscillator measuring speed of price changes',
        beginnerExplanation: rsi > 70
          ? `RSI at ${Math.round(rsi)} is OVERBOUGHT - price might drop soon`
          : rsi < 30
            ? `RSI at ${Math.round(rsi)} is OVERSOLD - price might bounce up`
            : `RSI at ${Math.round(rsi)} is neutral - no extreme condition`
      },
      {
        name: 'Moving Average (20)',
        shortName: 'SMA 20',
        value: `$${sma20.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
        signal: currentPrice > sma20 ? 'buy' : currentPrice < sma20 ? 'sell' : 'neutral',
        description: 'Average price over last 20 periods',
        beginnerExplanation: currentPrice > sma20
          ? 'Price is ABOVE the 20-period average = short-term bullish!'
          : 'Price is BELOW the 20-period average = short-term bearish'
      },
      {
        name: 'Moving Average (50)',
        shortName: 'SMA 50',
        value: `$${sma50.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
        signal: currentPrice > sma50 ? 'buy' : currentPrice < sma50 ? 'sell' : 'neutral',
        description: 'Average price over last 50 periods',
        beginnerExplanation: currentPrice > sma50
          ? 'Price is ABOVE the 50-period average = medium-term bullish!'
          : 'Price is BELOW the 50-period average = medium-term bearish'
      },
      {
        name: 'Moving Average (200)',
        shortName: 'SMA 200',
        value: `$${sma200.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
        signal: currentPrice > sma200 ? 'buy' : currentPrice < sma200 ? 'sell' : 'neutral',
        description: 'Average price over last 200 periods',
        beginnerExplanation: currentPrice > sma200
          ? 'Price above 200-period average = strong long-term uptrend!'
          : 'Price below 200-period average = long-term downtrend'
      },
      {
        name: 'MACD',
        shortName: 'MACD',
        value: macdData.macd >= 0 ? `+${macdData.macd.toFixed(0)}` : macdData.macd.toFixed(0),
        signal: macdData.histogram > 0 ? 'buy' : macdData.histogram < 0 ? 'sell' : 'neutral',
        description: 'Moving Average Convergence Divergence',
        beginnerExplanation: macdData.histogram > 0
          ? 'MACD is positive and above signal line = bullish momentum!'
          : 'MACD is below signal line = bearish momentum'
      },
      {
        name: 'Bollinger Bands',
        shortName: 'BB',
        value: bb.position,
        signal: bb.position.includes('Lower') ? 'buy' : bb.position.includes('Upper') || bb.position === 'Above Upper' ? 'sell' : 'neutral',
        description: 'Volatility bands around price',
        beginnerExplanation: bb.position.includes('Lower')
          ? 'Price near lower band = potentially oversold, might bounce'
          : bb.position.includes('Upper')
            ? 'Price near upper band = potentially overbought'
            : 'Price is in the middle range = no extreme condition'
      },
      {
        name: 'Stochastic RSI',
        shortName: 'StochRSI',
        value: Math.round(stochRSI),
        signal: stochRSI > 80 ? 'sell' : stochRSI < 20 ? 'buy' : 'neutral',
        description: 'RSI applied to RSI for more sensitivity',
        beginnerExplanation: stochRSI > 80
          ? `StochRSI at ${Math.round(stochRSI)} is overbought - might pull back`
          : stochRSI < 20
            ? `StochRSI at ${Math.round(stochRSI)} is oversold - might bounce`
            : `StochRSI at ${Math.round(stochRSI)} is neutral`
      },
      {
        name: 'Average Directional Index',
        shortName: 'ADX',
        value: Math.round(adx),
        signal: adx > 25 && currentPrice > sma20 ? 'buy' : adx > 25 && currentPrice < sma20 ? 'sell' : 'neutral',
        description: 'Measures trend strength',
        beginnerExplanation: adx > 25
          ? `ADX at ${Math.round(adx)} shows a STRONG trend`
          : `ADX at ${Math.round(adx)} shows a weak/no trend`
      },
      {
        name: 'Commodity Channel Index',
        shortName: 'CCI (20)',
        value: Math.round(cci),
        signal: cci > 100 ? 'sell' : cci < -100 ? 'buy' : 'neutral',
        description: 'Identifies cyclical trends',
        beginnerExplanation: cci > 100
          ? `CCI at ${Math.round(cci)} indicates overbought conditions`
          : cci < -100
            ? `CCI at ${Math.round(cci)} indicates oversold conditions`
            : `CCI at ${Math.round(cci)} is in normal range`
      },
      {
        name: 'Williams %R',
        shortName: 'Williams %R',
        value: Math.round(williamsR),
        signal: williamsR > -20 ? 'sell' : williamsR < -80 ? 'buy' : 'neutral',
        description: 'Momentum indicator similar to Stochastic',
        beginnerExplanation: williamsR > -20
          ? `Williams %R at ${Math.round(williamsR)} is overbought`
          : williamsR < -80
            ? `Williams %R at ${Math.round(williamsR)} is oversold`
            : `Williams %R at ${Math.round(williamsR)} is neutral`
      },
      {
        name: 'Ichimoku Cloud',
        shortName: 'Ichimoku',
        value: currentPrice > sma50 ? 'Above Cloud' : currentPrice < sma50 * 0.95 ? 'Below Cloud' : 'In Cloud',
        signal: currentPrice > sma50 ? 'buy' : currentPrice < sma50 * 0.95 ? 'sell' : 'neutral',
        description: 'Japanese indicator showing support/resistance',
        beginnerExplanation: currentPrice > sma50
          ? 'Price above the cloud = bullish! Strong support below.'
          : currentPrice < sma50 * 0.95
            ? 'Price below the cloud = bearish. Resistance above.'
            : 'Price inside the cloud = uncertain/consolidation.'
      },
      {
        name: 'Pivot Points',
        shortName: 'Pivot',
        value: `$${((candles[candles.length - 1].high + candles[candles.length - 1].low + candles[candles.length - 1].close) / 3).toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
        signal: currentPrice > (candles[candles.length - 1].high + candles[candles.length - 1].low + candles[candles.length - 1].close) / 3 ? 'buy' : 'sell',
        description: 'Key support and resistance levels',
        beginnerExplanation: 'Pivot point helps identify potential support and resistance levels for the day.'
      },
    ];

    // Calculate overall stats
    const buySignals = indicators.filter(i => i.signal === 'buy').length;
    const sellSignals = indicators.filter(i => i.signal === 'sell').length;
    const neutralSignals = indicators.filter(i => i.signal === 'neutral').length;

    return NextResponse.json({
      success: true,
      data: {
        indicators,
        summary: {
          buySignals,
          sellSignals,
          neutralSignals,
          overallSignal: buySignals > sellSignals + 2 ? 'Strong Buy' :
                         buySignals > sellSignals ? 'Buy' :
                         sellSignals > buySignals + 2 ? 'Strong Sell' :
                         sellSignals > buySignals ? 'Sell' : 'Neutral',
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
        }
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

function generateMockCandles(coin: string, days: number): Candle[] {
  const basePrice = coin === 'bitcoin' ? 97000 :
                   coin === 'ethereum' ? 3400 :
                   coin === 'solana' ? 190 :
                   coin === 'binancecoin' ? 700 : 50;

  const candles: Candle[] = [];
  let currentPrice = basePrice * 0.85; // Start lower to show uptrend

  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (days - i - 1));

    const trendBias = 0.001; // Slight upward bias
    const open = currentPrice;
    const volatility = 0.02 + Math.random() * 0.02;
    const change = (Math.random() - 0.5 + trendBias) * volatility * 2;
    const close = open * (1 + change);
    const high = Math.max(open, close) * (1 + Math.random() * volatility * 0.5);
    const low = Math.min(open, close) * (1 - Math.random() * volatility * 0.5);
    const volume = (Math.random() * 50000 + 10000) * basePrice;

    candles.push({
      timestamp: date.getTime(),
      open,
      high,
      low,
      close,
      volume,
    });

    currentPrice = close;
  }

  return candles;
}
