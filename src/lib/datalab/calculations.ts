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

/** Apply user edits on top of raw data (sparse override) */
export function applyEdits(
  data: (number | null)[],
  edits: Record<number, number>,
): (number | null)[] {
  if (Object.keys(edits).length === 0) return data;
  return data.map((v, i) => (i in edits ? edits[i] : v));
}
