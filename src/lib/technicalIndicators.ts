// ============================================
// TECHNICAL INDICATORS CALCULATOR
// RSI, MACD, MA, Bollinger Bands, Support/Resistance
// ============================================

import { fetchHistoricalPrices } from './dataApi';

// ============================================
// TYPES
// ============================================

export interface TechnicalIndicatorsResult {
  symbol: string;
  timestamp: string;
  price: number;
  rsi: number | null;
  rsiSignal: 'overbought' | 'oversold' | 'neutral';
  macd: number | null;
  macdSignal: number | null;
  macdHistogram: number | null;
  macdTrend: 'bullish' | 'bearish' | 'neutral';
  sma20: number | null;
  sma50: number | null;
  sma200: number | null;
  ema12: number | null;
  ema26: number | null;
  bollingerUpper: number | null;
  bollingerMiddle: number | null;
  bollingerLower: number | null;
  bollingerWidth: number | null;
  atr: number | null;
  stochK: number | null;
  stochD: number | null;
  overallTrend: 'strongly_bullish' | 'bullish' | 'neutral' | 'bearish' | 'strongly_bearish';
}

export interface SupportResistanceLevel {
  symbol: string;
  price: number;
  type: 'support' | 'resistance';
  strength: 'strong' | 'moderate' | 'weak';
  touches: number;
  lastTested: string;
}

export interface CorrelationResult {
  symbol1: string;
  symbol2: string;
  correlation: number;
  period: string;
  relationship: 'strong_positive' | 'positive' | 'neutral' | 'negative' | 'strong_negative';
}

// ============================================
// CORE INDICATOR CALCULATIONS
// ============================================

/**
 * Calculate Simple Moving Average
 */
export function calculateSMA(data: number[], period: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(NaN);
    } else {
      const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      result.push(sum / period);
    }
  }
  return result;
}

/**
 * Calculate Exponential Moving Average
 */
export function calculateEMA(data: number[], period: number): number[] {
  const result: number[] = [];
  const multiplier = 2 / (period + 1);

  // First EMA value is SMA
  let ema = data.slice(0, period).reduce((a, b) => a + b, 0) / period;

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(NaN);
    } else if (i === period - 1) {
      result.push(ema);
    } else {
      ema = (data[i] - ema) * multiplier + ema;
      result.push(ema);
    }
  }
  return result;
}

/**
 * Calculate RSI (Relative Strength Index)
 */
export function calculateRSI(closes: number[], period: number = 14): number[] {
  const result: number[] = [];
  const changes: number[] = [];

  // Calculate price changes
  for (let i = 1; i < closes.length; i++) {
    changes.push(closes[i] - closes[i - 1]);
  }

  // Calculate RSI
  for (let i = 0; i < closes.length; i++) {
    if (i < period) {
      result.push(NaN);
    } else {
      const recentChanges = changes.slice(i - period, i);
      const gains = recentChanges.filter(c => c > 0);
      const losses = recentChanges.filter(c => c < 0).map(c => Math.abs(c));

      const avgGain = gains.length > 0 ? gains.reduce((a, b) => a + b, 0) / period : 0;
      const avgLoss = losses.length > 0 ? losses.reduce((a, b) => a + b, 0) / period : 0;

      if (avgLoss === 0) {
        result.push(100);
      } else {
        const rs = avgGain / avgLoss;
        result.push(100 - (100 / (1 + rs)));
      }
    }
  }
  return result;
}

/**
 * Calculate MACD (Moving Average Convergence Divergence)
 */
export function calculateMACD(closes: number[], fastPeriod: number = 12, slowPeriod: number = 26, signalPeriod: number = 9): {
  macd: number[];
  signal: number[];
  histogram: number[];
} {
  const emaFast = calculateEMA(closes, fastPeriod);
  const emaSlow = calculateEMA(closes, slowPeriod);

  const macdLine: number[] = [];
  for (let i = 0; i < closes.length; i++) {
    if (isNaN(emaFast[i]) || isNaN(emaSlow[i])) {
      macdLine.push(NaN);
    } else {
      macdLine.push(emaFast[i] - emaSlow[i]);
    }
  }

  const signalLine = calculateEMA(macdLine.filter(v => !isNaN(v)), signalPeriod);

  // Pad signal line to match length
  const paddedSignal: number[] = [];
  let signalIndex = 0;
  for (let i = 0; i < closes.length; i++) {
    if (isNaN(macdLine[i])) {
      paddedSignal.push(NaN);
    } else {
      paddedSignal.push(signalLine[signalIndex] || NaN);
      signalIndex++;
    }
  }

  const histogram: number[] = [];
  for (let i = 0; i < closes.length; i++) {
    if (isNaN(macdLine[i]) || isNaN(paddedSignal[i])) {
      histogram.push(NaN);
    } else {
      histogram.push(macdLine[i] - paddedSignal[i]);
    }
  }

  return { macd: macdLine, signal: paddedSignal, histogram };
}

/**
 * Calculate Bollinger Bands
 */
export function calculateBollingerBands(closes: number[], period: number = 20, stdDev: number = 2): {
  upper: number[];
  middle: number[];
  lower: number[];
  width: number[];
} {
  const sma = calculateSMA(closes, period);
  const upper: number[] = [];
  const lower: number[] = [];
  const width: number[] = [];

  for (let i = 0; i < closes.length; i++) {
    if (i < period - 1) {
      upper.push(NaN);
      lower.push(NaN);
      width.push(NaN);
    } else {
      const slice = closes.slice(i - period + 1, i + 1);
      const mean = sma[i];
      const variance = slice.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / period;
      const sd = Math.sqrt(variance);

      upper.push(mean + stdDev * sd);
      lower.push(mean - stdDev * sd);
      width.push((stdDev * sd * 2) / mean * 100); // Width as percentage
    }
  }

  return { upper, middle: sma, lower, width };
}

/**
 * Calculate Average True Range (ATR)
 */
export function calculateATR(highs: number[], lows: number[], closes: number[], period: number = 14): number[] {
  const trueRanges: number[] = [];

  for (let i = 0; i < closes.length; i++) {
    if (i === 0) {
      trueRanges.push(highs[i] - lows[i]);
    } else {
      const tr = Math.max(
        highs[i] - lows[i],
        Math.abs(highs[i] - closes[i - 1]),
        Math.abs(lows[i] - closes[i - 1])
      );
      trueRanges.push(tr);
    }
  }

  return calculateSMA(trueRanges, period);
}

/**
 * Calculate Stochastic Oscillator
 */
export function calculateStochastic(highs: number[], lows: number[], closes: number[], kPeriod: number = 14, dPeriod: number = 3): {
  k: number[];
  d: number[];
} {
  const k: number[] = [];

  for (let i = 0; i < closes.length; i++) {
    if (i < kPeriod - 1) {
      k.push(NaN);
    } else {
      const highSlice = highs.slice(i - kPeriod + 1, i + 1);
      const lowSlice = lows.slice(i - kPeriod + 1, i + 1);
      const highest = Math.max(...highSlice);
      const lowest = Math.min(...lowSlice);

      if (highest === lowest) {
        k.push(50);
      } else {
        k.push(((closes[i] - lowest) / (highest - lowest)) * 100);
      }
    }
  }

  const d = calculateSMA(k.filter(v => !isNaN(v)), dPeriod);

  // Pad D line
  const paddedD: number[] = [];
  let dIndex = 0;
  for (let i = 0; i < closes.length; i++) {
    if (isNaN(k[i])) {
      paddedD.push(NaN);
    } else {
      paddedD.push(d[dIndex] || NaN);
      dIndex++;
    }
  }

  return { k, d: paddedD };
}

// ============================================
// HIGH-LEVEL ANALYSIS FUNCTIONS
// ============================================

/**
 * Calculate all technical indicators for a symbol
 */
export async function calculateTechnicalIndicators(
  symbol: string,
  interval: '1h' | '4h' | '1d' = '1d',
  limit: number = 200
): Promise<TechnicalIndicatorsResult> {
  // Fetch OHLCV data
  const ohlcv = await fetchHistoricalPrices({ symbol, interval, limit });

  if (!ohlcv || ohlcv.length < 50) {
    throw new Error('Insufficient data for technical analysis');
  }

  const closes = ohlcv.map(c => c.close);
  const highs = ohlcv.map(c => c.high);
  const lows = ohlcv.map(c => c.low);
  const lastIndex = closes.length - 1;
  const currentPrice = closes[lastIndex];

  // Calculate indicators
  const rsiValues = calculateRSI(closes);
  const rsi = rsiValues[lastIndex];

  const macdResult = calculateMACD(closes);
  const macd = macdResult.macd[lastIndex];
  const macdSignal = macdResult.signal[lastIndex];
  const macdHistogram = macdResult.histogram[lastIndex];

  const sma20 = calculateSMA(closes, 20)[lastIndex];
  const sma50 = calculateSMA(closes, 50)[lastIndex];
  const sma200 = closes.length >= 200 ? calculateSMA(closes, 200)[lastIndex] : null;

  const ema12 = calculateEMA(closes, 12)[lastIndex];
  const ema26 = calculateEMA(closes, 26)[lastIndex];

  const bb = calculateBollingerBands(closes);
  const atr = calculateATR(highs, lows, closes)[lastIndex];
  const stoch = calculateStochastic(highs, lows, closes);

  // Determine signals
  let rsiSignal: 'overbought' | 'oversold' | 'neutral' = 'neutral';
  if (!isNaN(rsi)) {
    if (rsi > 70) rsiSignal = 'overbought';
    else if (rsi < 30) rsiSignal = 'oversold';
  }

  let macdTrend: 'bullish' | 'bearish' | 'neutral' = 'neutral';
  if (!isNaN(macdHistogram)) {
    if (macdHistogram > 0) macdTrend = 'bullish';
    else if (macdHistogram < 0) macdTrend = 'bearish';
  }

  // Calculate overall trend (educational indicator, not trading advice)
  let score = 0;
  if (!isNaN(rsi)) {
    if (rsi < 30) score += 2;
    else if (rsi < 40) score += 1;
    else if (rsi > 70) score -= 2;
    else if (rsi > 60) score -= 1;
  }
  if (macdTrend === 'bullish') score += 1;
  else if (macdTrend === 'bearish') score -= 1;
  if (!isNaN(sma20) && currentPrice > sma20) score += 1;
  else if (!isNaN(sma20)) score -= 1;
  if (!isNaN(sma50) && currentPrice > sma50) score += 1;
  else if (!isNaN(sma50)) score -= 1;

  let overallTrend: 'strongly_bullish' | 'bullish' | 'neutral' | 'bearish' | 'strongly_bearish' = 'neutral';
  if (score >= 4) overallTrend = 'strongly_bullish';
  else if (score >= 2) overallTrend = 'bullish';
  else if (score <= -4) overallTrend = 'strongly_bearish';
  else if (score <= -2) overallTrend = 'bearish';

  return {
    symbol,
    timestamp: new Date().toISOString(),
    price: currentPrice,
    rsi: isNaN(rsi) ? null : rsi,
    rsiSignal,
    macd: isNaN(macd) ? null : macd,
    macdSignal: isNaN(macdSignal) ? null : macdSignal,
    macdHistogram: isNaN(macdHistogram) ? null : macdHistogram,
    macdTrend,
    sma20: isNaN(sma20) ? null : sma20,
    sma50: isNaN(sma50) ? null : sma50,
    sma200,
    ema12: isNaN(ema12) ? null : ema12,
    ema26: isNaN(ema26) ? null : ema26,
    bollingerUpper: isNaN(bb.upper[lastIndex]) ? null : bb.upper[lastIndex],
    bollingerMiddle: isNaN(bb.middle[lastIndex]) ? null : bb.middle[lastIndex],
    bollingerLower: isNaN(bb.lower[lastIndex]) ? null : bb.lower[lastIndex],
    bollingerWidth: isNaN(bb.width[lastIndex]) ? null : bb.width[lastIndex],
    atr: isNaN(atr) ? null : atr,
    stochK: isNaN(stoch.k[lastIndex]) ? null : stoch.k[lastIndex],
    stochD: isNaN(stoch.d[lastIndex]) ? null : stoch.d[lastIndex],
    overallTrend,
  };
}

/**
 * Calculate support and resistance levels
 */
export async function calculateSupportResistance(
  symbol: string,
  interval: '1d' = '1d',
  limit: number = 100
): Promise<SupportResistanceLevel[]> {
  const ohlcv = await fetchHistoricalPrices({ symbol, interval, limit });

  if (!ohlcv || ohlcv.length < 20) {
    return [];
  }

  const levels: SupportResistanceLevel[] = [];
  const tolerance = 0.02; // 2% tolerance for level detection
  const pricePoints: { price: number; type: 'high' | 'low'; date: string }[] = [];

  // Find swing highs and lows
  for (let i = 2; i < ohlcv.length - 2; i++) {
    const current = ohlcv[i];
    const prev1 = ohlcv[i - 1];
    const prev2 = ohlcv[i - 2];
    const next1 = ohlcv[i + 1];
    const next2 = ohlcv[i + 2];

    // Swing high
    if (current.high > prev1.high && current.high > prev2.high &&
        current.high > next1.high && current.high > next2.high) {
      pricePoints.push({ price: current.high, type: 'high', date: current.openTime });
    }

    // Swing low
    if (current.low < prev1.low && current.low < prev2.low &&
        current.low < next1.low && current.low < next2.low) {
      pricePoints.push({ price: current.low, type: 'low', date: current.openTime });
    }
  }

  // Cluster similar price levels
  const clusters: { price: number; touches: number; lastDate: string; type: 'support' | 'resistance' }[] = [];

  for (const point of pricePoints) {
    let added = false;
    for (const cluster of clusters) {
      if (Math.abs(point.price - cluster.price) / cluster.price < tolerance) {
        cluster.touches++;
        cluster.price = (cluster.price * (cluster.touches - 1) + point.price) / cluster.touches;
        cluster.lastDate = point.date;
        added = true;
        break;
      }
    }
    if (!added) {
      clusters.push({
        price: point.price,
        touches: 1,
        lastDate: point.date,
        type: point.type === 'high' ? 'resistance' : 'support'
      });
    }
  }

  // Convert to output format
  const currentPrice = ohlcv[ohlcv.length - 1].close;

  for (const cluster of clusters) {
    if (cluster.touches >= 2) {
      let strength: 'strong' | 'moderate' | 'weak' = 'weak';
      if (cluster.touches >= 4) strength = 'strong';
      else if (cluster.touches >= 3) strength = 'moderate';

      // Re-classify based on current price
      const type = cluster.price > currentPrice ? 'resistance' : 'support';

      levels.push({
        symbol,
        price: cluster.price,
        type,
        strength,
        touches: cluster.touches,
        lastTested: cluster.lastDate,
      });
    }
  }

  // Sort by distance from current price
  return levels.sort((a, b) => Math.abs(a.price - currentPrice) - Math.abs(b.price - currentPrice)).slice(0, 10);
}

/**
 * Calculate correlation between two coins
 */
export async function calculateCorrelation(
  symbol1: string,
  symbol2: string,
  interval: '1d' = '1d',
  limit: number = 30
): Promise<CorrelationResult> {
  const [data1, data2] = await Promise.all([
    fetchHistoricalPrices({ symbol: symbol1, interval, limit }),
    fetchHistoricalPrices({ symbol: symbol2, interval, limit })
  ]);

  if (!data1 || !data2 || data1.length < limit || data2.length < limit) {
    throw new Error('Insufficient data for correlation calculation');
  }

  // Calculate daily returns
  const returns1: number[] = [];
  const returns2: number[] = [];

  for (let i = 1; i < Math.min(data1.length, data2.length); i++) {
    returns1.push((data1[i].close - data1[i - 1].close) / data1[i - 1].close);
    returns2.push((data2[i].close - data2[i - 1].close) / data2[i - 1].close);
  }

  // Calculate Pearson correlation
  const n = returns1.length;
  const mean1 = returns1.reduce((a, b) => a + b, 0) / n;
  const mean2 = returns2.reduce((a, b) => a + b, 0) / n;

  let numerator = 0;
  let denom1 = 0;
  let denom2 = 0;

  for (let i = 0; i < n; i++) {
    const diff1 = returns1[i] - mean1;
    const diff2 = returns2[i] - mean2;
    numerator += diff1 * diff2;
    denom1 += diff1 * diff1;
    denom2 += diff2 * diff2;
  }

  const correlation = numerator / (Math.sqrt(denom1) * Math.sqrt(denom2));

  let relationship: 'strong_positive' | 'positive' | 'neutral' | 'negative' | 'strong_negative' = 'neutral';
  if (correlation > 0.7) relationship = 'strong_positive';
  else if (correlation > 0.3) relationship = 'positive';
  else if (correlation < -0.7) relationship = 'strong_negative';
  else if (correlation < -0.3) relationship = 'negative';

  return {
    symbol1,
    symbol2,
    correlation,
    period: `${limit} days`,
    relationship,
  };
}

/**
 * Calculate correlation matrix for multiple coins
 */
export async function calculateCorrelationMatrix(
  symbols: string[],
  interval: '1d' = '1d',
  limit: number = 30
): Promise<{ matrix: Record<string, Record<string, number>>; pairs: CorrelationResult[] }> {
  const matrix: Record<string, Record<string, number>> = {};
  const pairs: CorrelationResult[] = [];

  // Initialize matrix
  for (const s1 of symbols) {
    matrix[s1] = {};
    for (const s2 of symbols) {
      matrix[s1][s2] = s1 === s2 ? 1 : 0;
    }
  }

  // Calculate pairwise correlations
  for (let i = 0; i < symbols.length; i++) {
    for (let j = i + 1; j < symbols.length; j++) {
      try {
        const result = await calculateCorrelation(symbols[i], symbols[j], interval, limit);
        matrix[symbols[i]][symbols[j]] = result.correlation;
        matrix[symbols[j]][symbols[i]] = result.correlation;
        pairs.push(result);
      } catch (error) {
        console.error(`Error calculating correlation for ${symbols[i]}-${symbols[j]}:`, error);
      }
    }
  }

  return { matrix, pairs };
}

// ============================================
// DOWNLOAD CENTER EXPORTS
// ============================================

/**
 * Get technical indicators for multiple symbols (for download)
 */
export async function fetchTechnicalIndicatorsForDownload(
  symbols: string[] = ['BTC', 'ETH', 'SOL', 'XRP', 'ADA', 'AVAX', 'DOT', 'LINK', 'MATIC', 'DOGE']
): Promise<TechnicalIndicatorsResult[]> {
  const results: TechnicalIndicatorsResult[] = [];

  for (const symbol of symbols) {
    try {
      const indicators = await calculateTechnicalIndicators(symbol);
      results.push(indicators);
    } catch (error) {
      console.error(`Error calculating indicators for ${symbol}:`, error);
    }
  }

  return results;
}

/**
 * Get support/resistance levels for download
 */
export async function fetchSupportResistanceForDownload(
  symbols: string[] = ['BTC', 'ETH', 'SOL', 'XRP', 'ADA']
): Promise<SupportResistanceLevel[]> {
  const results: SupportResistanceLevel[] = [];

  for (const symbol of symbols) {
    try {
      const levels = await calculateSupportResistance(symbol);
      results.push(...levels);
    } catch (error) {
      console.error(`Error calculating S/R for ${symbol}:`, error);
    }
  }

  return results;
}

/**
 * Get correlation matrix for download
 */
export async function fetchCorrelationMatrixForDownload(
  symbols: string[] = ['BTC', 'ETH', 'SOL', 'XRP', 'ADA', 'AVAX', 'DOT', 'LINK']
): Promise<{ symbol1: string; symbol2: string; correlation: number; relationship: string }[]> {
  try {
    const { pairs } = await calculateCorrelationMatrix(symbols);
    return pairs.map(p => ({
      symbol1: p.symbol1,
      symbol2: p.symbol2,
      correlation: p.correlation,
      relationship: p.relationship,
    }));
  } catch (error) {
    console.error('Error calculating correlation matrix:', error);
    return [];
  }
}
