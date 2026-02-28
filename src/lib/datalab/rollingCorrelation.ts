// Rolling Correlation computation for DataLab

/**
 * Compute Pearson correlation coefficient between two arrays.
 */
function pearsonCorrelation(x: number[], y: number[]): number {
  const n = x.length;
  if (n === 0) return 0;

  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
  for (let i = 0; i < n; i++) {
    sumX += x[i];
    sumY += y[i];
    sumXY += x[i] * y[i];
    sumX2 += x[i] * x[i];
    sumY2 += y[i] * y[i];
  }

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

  if (denominator === 0) return 0;
  return numerator / denominator;
}

/**
 * Compute rolling (sliding-window) Pearson correlation between two series.
 * Returns array of same length as inputs, with nulls where window isn't full.
 *
 * @param seriesA - First data series (e.g., BTC prices)
 * @param seriesB - Second data series (e.g., ETH prices)
 * @param window  - Rolling window size (default 30)
 */
export function computeRollingCorrelation(
  seriesA: (number | null)[],
  seriesB: (number | null)[],
  window: number = 30,
): (number | null)[] {
  const len = Math.min(seriesA.length, seriesB.length);
  const result: (number | null)[] = new Array(len).fill(null);

  for (let i = window - 1; i < len; i++) {
    const xSlice: number[] = [];
    const ySlice: number[] = [];

    for (let j = i - window + 1; j <= i; j++) {
      const a = seriesA[j];
      const b = seriesB[j];
      if (a !== null && a !== undefined && b !== null && b !== undefined) {
        xSlice.push(a);
        ySlice.push(b);
      }
    }

    // Need at least 80% of window to compute meaningful correlation
    if (xSlice.length >= window * 0.8) {
      result[i] = pearsonCorrelation(xSlice, ySlice);
    }
  }

  return result;
}
