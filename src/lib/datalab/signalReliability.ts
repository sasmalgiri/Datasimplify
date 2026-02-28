/**
 * Signal Reliability Heatmap
 * Computes historical hit-rate for common technical analysis signals.
 */

export interface SignalResult {
  name: string;
  description: string;
  occurrences: number;
  hitRates: Record<number, number>; // lookforward days → hit rate (0-1)
}

export const LOOKFORWARD_DAYS = [1, 3, 7, 14] as const;

export const LOOKFORWARD_LABELS: Record<number, string> = {
  1: '1d',
  3: '3d',
  7: '7d',
  14: '14d',
};

/**
 * Compute signal reliability for common signals based on current data.
 * Returns array of signal results with hit rates per lookforward period.
 */
export function computeSignalReliability(opts: {
  closes: number[];
  rsi?: (number | null)[];
  macdLine?: (number | null)[];
  macdSignal?: (number | null)[];
  bbUpper?: (number | null)[];
  bbLower?: (number | null)[];
  sma50?: (number | null)[];
  sma200?: (number | null)[];
  volume?: (number | null)[];
  volumeSma?: (number | null)[];
}): SignalResult[] {
  const { closes, rsi, macdLine, macdSignal, bbUpper, bbLower, sma50, sma200, volume, volumeSma } = opts;
  const results: SignalResult[] = [];
  const n = closes.length;

  function priceWentUp(fromIdx: number, lookDays: number): boolean {
    const targetIdx = Math.min(fromIdx + lookDays, n - 1);
    if (targetIdx <= fromIdx) return false;
    return closes[targetIdx] > closes[fromIdx];
  }

  function computeHitRate(indices: number[]): Record<number, number> {
    const rates: Record<number, number> = {};
    for (const days of LOOKFORWARD_DAYS) {
      if (indices.length === 0) { rates[days] = 0; continue; }
      const hits = indices.filter((i) => priceWentUp(i, days)).length;
      rates[days] = hits / indices.length;
    }
    return rates;
  }

  function computeBearHitRate(indices: number[]): Record<number, number> {
    const rates: Record<number, number> = {};
    for (const days of LOOKFORWARD_DAYS) {
      if (indices.length === 0) { rates[days] = 0; continue; }
      const hits = indices.filter((i) => !priceWentUp(i, days)).length;
      rates[days] = hits / indices.length;
    }
    return rates;
  }

  // RSI < 30 (oversold → expecting bounce up)
  if (rsi) {
    const indices: number[] = [];
    for (let i = 0; i < n; i++) {
      if (rsi[i] != null && rsi[i]! < 30) indices.push(i);
    }
    results.push({
      name: 'RSI < 30',
      description: 'RSI enters oversold territory',
      occurrences: indices.length,
      hitRates: computeHitRate(indices),
    });
  }

  // RSI > 70 (overbought → expecting reversal down)
  if (rsi) {
    const indices: number[] = [];
    for (let i = 0; i < n; i++) {
      if (rsi[i] != null && rsi[i]! > 70) indices.push(i);
    }
    results.push({
      name: 'RSI > 70',
      description: 'RSI overbought (expecting reversal)',
      occurrences: indices.length,
      hitRates: computeBearHitRate(indices),
    });
  }

  // MACD Bullish Cross
  if (macdLine && macdSignal) {
    const indices: number[] = [];
    for (let i = 1; i < n; i++) {
      const pM = macdLine[i - 1], pS = macdSignal[i - 1];
      const cM = macdLine[i], cS = macdSignal[i];
      if (pM != null && pS != null && cM != null && cS != null && pM <= pS && cM > cS) {
        indices.push(i);
      }
    }
    results.push({
      name: 'MACD Bull Cross',
      description: 'MACD crosses above signal line',
      occurrences: indices.length,
      hitRates: computeHitRate(indices),
    });
  }

  // MACD Bearish Cross
  if (macdLine && macdSignal) {
    const indices: number[] = [];
    for (let i = 1; i < n; i++) {
      const pM = macdLine[i - 1], pS = macdSignal[i - 1];
      const cM = macdLine[i], cS = macdSignal[i];
      if (pM != null && pS != null && cM != null && cS != null && pM >= pS && cM < cS) {
        indices.push(i);
      }
    }
    results.push({
      name: 'MACD Bear Cross',
      description: 'MACD crosses below signal (expecting down)',
      occurrences: indices.length,
      hitRates: computeBearHitRate(indices),
    });
  }

  // Price touches Bollinger Lower Band (expecting bounce)
  if (bbLower) {
    const indices: number[] = [];
    for (let i = 0; i < n; i++) {
      if (bbLower[i] != null && closes[i] <= bbLower[i]!) indices.push(i);
    }
    results.push({
      name: 'BB Lower Touch',
      description: 'Price at/below lower Bollinger Band',
      occurrences: indices.length,
      hitRates: computeHitRate(indices),
    });
  }

  // Price touches Bollinger Upper Band (expecting pullback)
  if (bbUpper) {
    const indices: number[] = [];
    for (let i = 0; i < n; i++) {
      if (bbUpper[i] != null && closes[i] >= bbUpper[i]!) indices.push(i);
    }
    results.push({
      name: 'BB Upper Touch',
      description: 'Price at/above upper Bollinger Band',
      occurrences: indices.length,
      hitRates: computeBearHitRate(indices),
    });
  }

  // Golden Cross (SMA 50 crosses above SMA 200)
  if (sma50 && sma200) {
    const indices: number[] = [];
    for (let i = 1; i < n; i++) {
      const p50 = sma50[i - 1], p200 = sma200[i - 1];
      const c50 = sma50[i], c200 = sma200[i];
      if (p50 != null && p200 != null && c50 != null && c200 != null && p50 <= p200 && c50 > c200) {
        indices.push(i);
      }
    }
    results.push({
      name: 'Golden Cross',
      description: 'SMA 50 crosses above SMA 200',
      occurrences: indices.length,
      hitRates: computeHitRate(indices),
    });
  }

  // Volume Spike (> 2x SMA)
  if (volume && volumeSma) {
    const indices: number[] = [];
    for (let i = 0; i < n; i++) {
      if (volume[i] != null && volumeSma[i] != null && volume[i]! > 2 * volumeSma[i]!) {
        indices.push(i);
      }
    }
    results.push({
      name: 'Vol Spike (2x)',
      description: 'Volume exceeds 2x its moving average',
      occurrences: indices.length,
      hitRates: computeHitRate(indices),
    });
  }

  return results;
}
