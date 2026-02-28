// Data Quality Analysis for DataLab
// Detects common data issues and warns the user.

import type { DataQualityWarning, OverlayLayer } from './types';

/**
 * Analyze data quality across all visible layers and timestamps.
 * Returns warnings sorted by severity (error > warning > info).
 */
export function analyzeDataQuality(
  timestamps: number[],
  layers: OverlayLayer[],
): DataQualityWarning[] {
  const warnings: DataQualityWarning[] = [];
  if (timestamps.length === 0) return warnings;

  // 1. Stale data: last timestamp is more than 48 hours old
  const lastTs = timestamps[timestamps.length - 1];
  const ageHours = (Date.now() - lastTs) / (1000 * 60 * 60);
  if (ageHours > 48) {
    warnings.push({
      type: 'stale_data',
      severity: ageHours > 168 ? 'error' : 'warning',
      message: `Data is ${Math.round(ageHours / 24)} days old. Consider refreshing.`,
    });
  }

  // Check each visible layer
  for (const layer of layers) {
    if (!layer.visible) continue;
    const data = layer.data;
    if (!data || data.length === 0) continue;

    // 2. Data gaps: 3+ consecutive nulls
    let maxConsecutiveNulls = 0;
    let currentNulls = 0;
    for (const val of data) {
      if (val === null || val === undefined) {
        currentNulls++;
        maxConsecutiveNulls = Math.max(maxConsecutiveNulls, currentNulls);
      } else {
        currentNulls = 0;
      }
    }
    if (maxConsecutiveNulls >= 3) {
      warnings.push({
        type: 'data_gaps',
        severity: maxConsecutiveNulls >= 10 ? 'warning' : 'info',
        message: `${layer.label}: ${maxConsecutiveNulls} consecutive missing data points detected.`,
        affectedLayer: layer.id,
      });
    }

    // 3. Insufficient candles for indicators
    const nonNullCount = data.filter((v) => v !== null && v !== undefined).length;
    const requiredBySource: Record<string, number> = {
      sma: (layer.params?.window ?? 20),
      ema: (layer.params?.window ?? 20),
      rsi: (layer.params?.period ?? 14) + 1,
      macd: 26 + 9,
      macd_signal: 26 + 9,
      macd_histogram: 26 + 9,
      bollinger_upper: (layer.params?.period ?? 20),
      bollinger_lower: (layer.params?.period ?? 20),
      stochastic_k: 14,
      stochastic_d: 14 + 3,
      atr: 14,
      rolling_volatility: 30,
      adx: 28,
    };
    const required = requiredBySource[layer.source];
    if (required && nonNullCount < required) {
      warnings.push({
        type: 'insufficient_candles',
        severity: 'warning',
        message: `${layer.label}: needs ${required} data points but only ${nonNullCount} available. Results may be inaccurate.`,
        affectedLayer: layer.id,
      });
    }

    // 4. Zero volume (only for volume-type layers)
    if (layer.source === 'volume' || layer.source === 'obv') {
      const zeroCount = data.filter((v) => v === 0).length;
      const totalValid = data.filter((v) => v !== null && v !== undefined).length;
      if (totalValid > 0 && zeroCount / totalValid > 0.3) {
        warnings.push({
          type: 'zero_volume',
          severity: 'warning',
          message: `${layer.label}: ${Math.round(zeroCount / totalValid * 100)}% of values are zero. Data may be unreliable.`,
          affectedLayer: layer.id,
        });
      }
    }

    // 5. Flat price (only for price-type layers)
    if (layer.source === 'price' || layer.source === 'ohlc') {
      const validValues = data.filter((v): v is number => v !== null && v !== undefined);
      if (validValues.length >= 10) {
        const last10 = validValues.slice(-10);
        const allSame = last10.every((v) => v === last10[0]);
        if (allSame) {
          warnings.push({
            type: 'flat_price',
            severity: 'warning',
            message: `${layer.label}: last 10 data points are identical (${last10[0]}). Data may be stale or incorrect.`,
            affectedLayer: layer.id,
          });
        }
      }
    }
  }

  // Sort by severity
  const severityOrder: Record<string, number> = { error: 0, warning: 1, info: 2 };
  warnings.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return warnings;
}
