// DataLab calculation functions
// Extracted from StrategyBacktester + CorrelationHeatmap + new functions

/** Simple Moving Average */
export function computeSMA(values: number[], window: number): (number | null)[] {
  const out: (number | null)[] = new Array(values.length).fill(null);
  if (window <= 0 || values.length < window) return out;
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= window) sum -= values[i - window];
    if (i >= window - 1) out[i] = sum / window;
  }
  return out;
}

/** Exponential Moving Average */
export function computeEMA(values: number[], window: number): (number | null)[] {
  const out: (number | null)[] = new Array(values.length).fill(null);
  if (window <= 0 || values.length < window) return out;
  const k = 2 / (window + 1);
  // Seed with SMA of first `window` values
  let sum = 0;
  for (let i = 0; i < window; i++) sum += values[i];
  let ema = sum / window;
  out[window - 1] = ema;
  for (let i = window; i < values.length; i++) {
    ema = values[i] * k + ema * (1 - k);
    out[i] = ema;
  }
  return out;
}

/** Relative Strength Index (Wilder's smoothing) */
export function computeRSI(values: number[], period: number = 14): (number | null)[] {
  const out: (number | null)[] = new Array(values.length).fill(null);
  if (values.length < period + 1) return out;

  let gains = 0;
  let losses = 0;
  for (let i = 1; i <= period; i++) {
    const change = values[i] - values[i - 1];
    if (change >= 0) gains += change;
    else losses += -change;
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;
  const rs0 = avgLoss === 0 ? Infinity : avgGain / avgLoss;
  out[period] = 100 - 100 / (1 + rs0);

  for (let i = period + 1; i < values.length; i++) {
    const change = values[i] - values[i - 1];
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? -change : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    const rs = avgLoss === 0 ? Infinity : avgGain / avgLoss;
    out[i] = 100 - 100 / (1 + rs);
  }
  return out;
}

/** Rebase all values so the first non-null value = 100 */
export function normalizeToBase100(values: (number | null)[]): (number | null)[] {
  const first = values.find((v) => v != null && v !== 0);
  if (first == null) return values;
  return values.map((v) => (v != null ? (v / first) * 100 : null));
}

/** Pearson correlation coefficient between two arrays */
export function pearsonCorrelation(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  if (n < 3) return 0;
  let sumA = 0, sumB = 0, sumAB = 0, sumA2 = 0, sumB2 = 0;
  for (let i = 0; i < n; i++) {
    sumA += a[i];
    sumB += b[i];
    sumAB += a[i] * b[i];
    sumA2 += a[i] * a[i];
    sumB2 += b[i] * b[i];
  }
  const denom = Math.sqrt((n * sumA2 - sumA * sumA) * (n * sumB2 - sumB * sumB));
  if (denom === 0) return 0;
  return (n * sumAB - sumA * sumB) / denom;
}

/** Element-wise ratio: a[i] / b[i] */
export function computeRatio(a: (number | null)[], b: (number | null)[]): (number | null)[] {
  const len = Math.min(a.length, b.length);
  const out: (number | null)[] = [];
  for (let i = 0; i < len; i++) {
    if (a[i] != null && b[i] != null && b[i] !== 0) {
      out.push(a[i]! / b[i]!);
    } else {
      out.push(null);
    }
  }
  return out;
}

/** MACD (Moving Average Convergence Divergence) */
export function computeMACD(
  values: number[],
  fast: number = 12,
  slow: number = 26,
  signalPeriod: number = 9,
): { macd: (number | null)[]; signal: (number | null)[]; histogram: (number | null)[] } {
  const len = values.length;
  const macd: (number | null)[] = new Array(len).fill(null);
  const signal: (number | null)[] = new Array(len).fill(null);
  const histogram: (number | null)[] = new Array(len).fill(null);

  if (len < slow) return { macd, signal, histogram };

  const emaFast = computeEMA(values, fast);
  const emaSlow = computeEMA(values, slow);

  // MACD line = EMA(fast) - EMA(slow)
  const macdValues: number[] = [];
  for (let i = 0; i < len; i++) {
    if (emaFast[i] != null && emaSlow[i] != null) {
      macd[i] = emaFast[i]! - emaSlow[i]!;
      macdValues.push(macd[i]!);
    }
  }

  // Signal line = EMA(signalPeriod) of MACD values
  if (macdValues.length >= signalPeriod) {
    const signalEma = computeEMA(macdValues, signalPeriod);
    let si = 0;
    for (let i = 0; i < len; i++) {
      if (macd[i] != null) {
        if (signalEma[si] != null) {
          signal[i] = signalEma[si]!;
          histogram[i] = macd[i]! - signalEma[si]!;
        }
        si++;
      }
    }
  }

  return { macd, signal, histogram };
}

/** Bollinger Bands */
export function computeBollingerBands(
  values: number[],
  period: number = 20,
  multiplier: number = 2,
): { upper: (number | null)[]; lower: (number | null)[] } {
  const len = values.length;
  const upper: (number | null)[] = new Array(len).fill(null);
  const lower: (number | null)[] = new Array(len).fill(null);

  if (period <= 0 || len < period) return { upper, lower };

  const sma = computeSMA(values, period);

  for (let i = period - 1; i < len; i++) {
    // Rolling standard deviation
    let sumSq = 0;
    const mean = sma[i]!;
    for (let j = i - period + 1; j <= i; j++) {
      const diff = values[j] - mean;
      sumSq += diff * diff;
    }
    const stdDev = Math.sqrt(sumSq / period);
    upper[i] = mean + multiplier * stdDev;
    lower[i] = mean - multiplier * stdDev;
  }

  return { upper, lower };
}

/** Stochastic Oscillator (Slow) */
export function computeStochastic(
  highs: number[],
  lows: number[],
  closes: number[],
  kPeriod: number = 14,
  dPeriod: number = 3,
  smooth: number = 3,
): { k: (number | null)[]; d: (number | null)[] } {
  const len = closes.length;
  const k: (number | null)[] = new Array(len).fill(null);
  const d: (number | null)[] = new Array(len).fill(null);

  if (len < kPeriod || highs.length < len || lows.length < len) return { k, d };

  // Raw %K
  const rawK: number[] = [];
  for (let i = kPeriod - 1; i < len; i++) {
    let highestHigh = -Infinity;
    let lowestLow = Infinity;
    for (let j = i - kPeriod + 1; j <= i; j++) {
      if (highs[j] > highestHigh) highestHigh = highs[j];
      if (lows[j] < lowestLow) lowestLow = lows[j];
    }
    const range = highestHigh - lowestLow;
    rawK.push(range === 0 ? 50 : ((closes[i] - lowestLow) / range) * 100);
  }

  // Slow %K = SMA(smooth) of Raw %K
  const slowK = computeSMA(rawK, smooth);

  // %D = SMA(dPeriod) of slow %K
  const nonNullSlowK = slowK.filter((v) => v != null) as number[];
  const dLine = computeSMA(nonNullSlowK, dPeriod);

  // Map back to original indices
  const startK = kPeriod - 1;
  let ski = 0;
  let di = 0;
  for (let i = 0; i < slowK.length; i++) {
    if (slowK[i] != null) {
      k[startK + i] = slowK[i];
      if (dLine[di] != null) {
        d[startK + i] = dLine[di];
      }
      di++;
    }
  }

  return { k, d };
}

/** Average True Range (Wilder's smoothing) */
export function computeATR(
  highs: number[],
  lows: number[],
  closes: number[],
  period: number = 14,
): (number | null)[] {
  const len = closes.length;
  const out: (number | null)[] = new Array(len).fill(null);

  if (len < period + 1 || highs.length < len || lows.length < len) return out;

  // True Range for each bar (starting from index 1)
  const tr: number[] = [];
  for (let i = 1; i < len; i++) {
    const hl = highs[i] - lows[i];
    const hc = Math.abs(highs[i] - closes[i - 1]);
    const lc = Math.abs(lows[i] - closes[i - 1]);
    tr.push(Math.max(hl, hc, lc));
  }

  // Initial ATR = simple average of first `period` TRs
  let sum = 0;
  for (let i = 0; i < period; i++) sum += tr[i];
  let atr = sum / period;
  out[period] = atr; // TR starts at index 1, so ATR at period (0-based)

  // Wilder's smoothing
  for (let i = period; i < tr.length; i++) {
    atr = (atr * (period - 1) + tr[i]) / period;
    out[i + 1] = atr; // offset by 1 because TR starts at index 1
  }

  return out;
}

/** Bollinger Band Width: (upper − lower) / SMA as percentage */
export function computeBBWidth(
  values: number[],
  period: number = 20,
  multiplier: number = 2,
): (number | null)[] {
  const bb = computeBollingerBands(values, period, multiplier);
  const sma = computeSMA(values, period);
  const out: (number | null)[] = new Array(values.length).fill(null);
  for (let i = 0; i < values.length; i++) {
    if (bb.upper[i] != null && bb.lower[i] != null && sma[i] != null && sma[i]! !== 0) {
      out[i] = ((bb.upper[i]! - bb.lower[i]!) / sma[i]!) * 100;
    }
  }
  return out;
}

/** Daily return as percentage: (close[i] − close[i−1]) / close[i−1] × 100 */
export function computeDailyReturn(values: number[]): (number | null)[] {
  const out: (number | null)[] = [null];
  for (let i = 1; i < values.length; i++) {
    if (values[i - 1] !== 0) {
      out.push(((values[i] - values[i - 1]) / values[i - 1]) * 100);
    } else {
      out.push(null);
    }
  }
  return out;
}

/** Drawdown from rolling all-time high (always ≤ 0) */
export function computeDrawdown(values: number[]): (number | null)[] {
  const out: (number | null)[] = [];
  let peak = -Infinity;
  for (let i = 0; i < values.length; i++) {
    if (values[i] > peak) peak = values[i];
    out.push(peak > 0 ? ((values[i] - peak) / peak) * 100 : 0);
  }
  return out;
}

/** Rolling annualized volatility: std(daily returns) × √365 */
export function computeRollingVolatility(
  values: number[],
  window: number = 30,
): (number | null)[] {
  const returns = computeDailyReturn(values);
  const out: (number | null)[] = new Array(values.length).fill(null);
  if (values.length < window + 1) return out;
  for (let i = window; i < returns.length; i++) {
    let sum = 0;
    let count = 0;
    for (let j = i - window + 1; j <= i; j++) {
      if (returns[j] != null) { sum += returns[j]!; count++; }
    }
    if (count < window * 0.8) continue;
    const mean = sum / count;
    let sumSq = 0;
    for (let j = i - window + 1; j <= i; j++) {
      if (returns[j] != null) {
        const diff = returns[j]! - mean;
        sumSq += diff * diff;
      }
    }
    out[i] = Math.sqrt(sumSq / count) * Math.sqrt(365);
  }
  return out;
}

/** Apply user edits on top of raw data (sparse override) */
export function applyEdits(
  data: (number | null)[],
  edits: Record<number, number>,
): (number | null)[] {
  if (Object.keys(edits).length === 0) return data;
  return data.map((v, i) => (i in edits ? edits[i] : v));
}
