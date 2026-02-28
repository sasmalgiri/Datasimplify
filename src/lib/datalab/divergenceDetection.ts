// Auto-Divergence Detection for DataLab
// Detects bullish/bearish divergences between price and RSI/MACD

import type { DivergenceSignal } from './types';

interface Peak {
  idx: number;
  value: number;
}

/**
 * Find local peaks (maxima) in a series.
 * A peak at index i exists when values within +-lookback are all <= value[i].
 */
function findPeaks(data: (number | null)[], lookback: number = 5): Peak[] {
  const peaks: Peak[] = [];
  for (let i = lookback; i < data.length - lookback; i++) {
    const val = data[i];
    if (val === null || val === undefined) continue;
    let isPeak = true;
    for (let j = i - lookback; j <= i + lookback; j++) {
      if (j === i) continue;
      const cmp = data[j];
      if (cmp !== null && cmp !== undefined && cmp > val) {
        isPeak = false;
        break;
      }
    }
    if (isPeak) peaks.push({ idx: i, value: val });
  }
  return peaks;
}

/**
 * Find local troughs (minima) in a series.
 */
function findTroughs(data: (number | null)[], lookback: number = 5): Peak[] {
  const troughs: Peak[] = [];
  for (let i = lookback; i < data.length - lookback; i++) {
    const val = data[i];
    if (val === null || val === undefined) continue;
    let isTrough = true;
    for (let j = i - lookback; j <= i + lookback; j++) {
      if (j === i) continue;
      const cmp = data[j];
      if (cmp !== null && cmp !== undefined && cmp < val) {
        isTrough = false;
        break;
      }
    }
    if (isTrough) troughs.push({ idx: i, value: val });
  }
  return troughs;
}

/**
 * Compute the strength of a divergence based on the magnitude of price vs indicator divergence.
 */
function classifyStrength(
  priceChangePercent: number,
  indicatorChangePercent: number,
): 'strong' | 'moderate' | 'weak' {
  const divergenceSize = Math.abs(priceChangePercent - indicatorChangePercent);
  if (divergenceSize > 15) return 'strong';
  if (divergenceSize > 7) return 'moderate';
  return 'weak';
}

/**
 * Detect bullish and bearish divergences between price and an indicator.
 *
 * Bullish divergence: price makes lower lows, but indicator makes higher lows
 * Bearish divergence: price makes higher highs, but indicator makes lower highs
 */
function detectDivergencesForIndicator(
  closes: number[],
  indicator: (number | null)[],
  indicatorName: 'rsi' | 'macd',
  lookback: number = 5,
): DivergenceSignal[] {
  const signals: DivergenceSignal[] = [];

  // Bullish: compare troughs
  const priceTroughs = findTroughs(closes.map((v) => v as number | null), lookback);
  const indTroughs = findTroughs(indicator, lookback);

  for (let i = 1; i < priceTroughs.length; i++) {
    const prevPrice = priceTroughs[i - 1];
    const currPrice = priceTroughs[i];

    // Price makes lower low
    if (currPrice.value >= prevPrice.value) continue;

    // Find corresponding indicator trough near the same index range
    const prevInd = indTroughs.find(
      (t) => Math.abs(t.idx - prevPrice.idx) <= lookback * 2,
    );
    const currInd = indTroughs.find(
      (t) => Math.abs(t.idx - currPrice.idx) <= lookback * 2,
    );
    if (!prevInd || !currInd) continue;

    // Indicator makes higher low (bullish)
    if (currInd.value > prevInd.value) {
      const priceChange = ((currPrice.value - prevPrice.value) / prevPrice.value) * 100;
      const indChange = ((currInd.value - prevInd.value) / Math.abs(prevInd.value || 1)) * 100;

      signals.push({
        type: 'bullish',
        indicator: indicatorName,
        startIdx: prevPrice.idx,
        endIdx: currPrice.idx,
        priceStart: prevPrice.value,
        priceEnd: currPrice.value,
        indicatorStart: prevInd.value,
        indicatorEnd: currInd.value,
        strength: classifyStrength(priceChange, indChange),
      });
    }
  }

  // Bearish: compare peaks
  const pricePeaks = findPeaks(closes.map((v) => v as number | null), lookback);
  const indPeaks = findPeaks(indicator, lookback);

  for (let i = 1; i < pricePeaks.length; i++) {
    const prevPrice = pricePeaks[i - 1];
    const currPrice = pricePeaks[i];

    // Price makes higher high
    if (currPrice.value <= prevPrice.value) continue;

    // Find corresponding indicator peak
    const prevInd = indPeaks.find(
      (t) => Math.abs(t.idx - prevPrice.idx) <= lookback * 2,
    );
    const currInd = indPeaks.find(
      (t) => Math.abs(t.idx - currPrice.idx) <= lookback * 2,
    );
    if (!prevInd || !currInd) continue;

    // Indicator makes lower high (bearish)
    if (currInd.value < prevInd.value) {
      const priceChange = ((currPrice.value - prevPrice.value) / prevPrice.value) * 100;
      const indChange = ((currInd.value - prevInd.value) / Math.abs(prevInd.value || 1)) * 100;

      signals.push({
        type: 'bearish',
        indicator: indicatorName,
        startIdx: prevPrice.idx,
        endIdx: currPrice.idx,
        priceStart: prevPrice.value,
        priceEnd: currPrice.value,
        indicatorStart: prevInd.value,
        indicatorEnd: currInd.value,
        strength: classifyStrength(priceChange, indChange),
      });
    }
  }

  return signals;
}

/**
 * Main divergence detection entry point.
 * Scans for divergences between price and RSI / MACD.
 */
export function detectDivergences(
  closes: number[],
  rsi: (number | null)[],
  macdLine: (number | null)[],
): DivergenceSignal[] {
  if (closes.length < 20) return [];

  const rsiSignals = detectDivergencesForIndicator(closes, rsi, 'rsi');
  const macdSignals = detectDivergencesForIndicator(closes, macdLine, 'macd');

  // Sort by endIdx (most recent first)
  return [...rsiSignals, ...macdSignals].sort((a, b) => b.endIdx - a.endIdx);
}
