// AI Anomaly Detection for DataLab
// Client-side anomaly detection using statistical methods

import type { Anomaly } from './types';

/**
 * Compute z-scores for an array of numbers.
 */
function zScores(data: number[]): number[] {
  const n = data.length;
  if (n === 0) return [];

  const mean = data.reduce((s, v) => s + v, 0) / n;
  const stdDev = Math.sqrt(data.reduce((s, v) => s + (v - mean) ** 2, 0) / n);

  if (stdDev === 0) return data.map(() => 0);
  return data.map((v) => (v - mean) / stdDev);
}

/**
 * Detect anomalies in price and volume data.
 *
 * Types detected:
 * - volume_spike: Volume z-score > 2.5
 * - volatility_spike: Daily return z-score > 3.0
 * - price_gap: Gap between consecutive closes > 5%
 * - unusual_candle: Body:wick ratio is extreme (requires OHLC)
 */
export function detectAnomalies(
  closes: number[],
  volumes: (number | null)[],
  timestamps: number[],
  ohlcRaw?: number[][] | null,
): Anomaly[] {
  const anomalies: Anomaly[] = [];
  if (closes.length < 10) return anomalies;

  // 1. Volume spikes (z-score > 2.5)
  const validVolumes = volumes.map((v) => v ?? 0);
  if (validVolumes.some((v) => v > 0)) {
    const volZ = zScores(validVolumes);
    for (let i = 0; i < volZ.length; i++) {
      if (Math.abs(volZ[i]) > 2.5) {
        anomalies.push({
          index: i,
          timestamp: timestamps[i] || 0,
          type: 'volume_spike',
          severity: Math.abs(volZ[i]) > 4 ? 'high' : Math.abs(volZ[i]) > 3 ? 'medium' : 'low',
          description: `Volume is ${volZ[i].toFixed(1)} std devs from mean (${formatNumber(validVolumes[i])})`,
          zScore: volZ[i],
        });
      }
    }
  }

  // 2. Volatility spikes (daily return z-score > 3.0)
  const dailyReturns: number[] = [];
  for (let i = 1; i < closes.length; i++) {
    dailyReturns.push(((closes[i] - closes[i - 1]) / closes[i - 1]) * 100);
  }

  if (dailyReturns.length > 5) {
    const returnZ = zScores(dailyReturns);
    for (let i = 0; i < returnZ.length; i++) {
      if (Math.abs(returnZ[i]) > 3.0) {
        anomalies.push({
          index: i + 1, // offset by 1 since returns start at index 1
          timestamp: timestamps[i + 1] || 0,
          type: 'volatility_spike',
          severity: Math.abs(returnZ[i]) > 5 ? 'high' : Math.abs(returnZ[i]) > 4 ? 'medium' : 'low',
          description: `Daily return of ${dailyReturns[i].toFixed(2)}% is ${returnZ[i].toFixed(1)} std devs from mean`,
          zScore: returnZ[i],
        });
      }
    }
  }

  // 3. Price gaps (>5% gap between consecutive closes)
  for (let i = 1; i < closes.length; i++) {
    const gapPct = Math.abs((closes[i] - closes[i - 1]) / closes[i - 1]) * 100;
    if (gapPct > 5) {
      anomalies.push({
        index: i,
        timestamp: timestamps[i] || 0,
        type: 'price_gap',
        severity: gapPct > 15 ? 'high' : gapPct > 8 ? 'medium' : 'low',
        description: `${gapPct.toFixed(1)}% price gap from ${formatPrice(closes[i - 1])} to ${formatPrice(closes[i])}`,
        zScore: gapPct / 5,
      });
    }
  }

  // 4. Unusual candles (requires OHLC data)
  if (ohlcRaw && ohlcRaw.length > 0) {
    for (let i = 0; i < ohlcRaw.length; i++) {
      const [, open, high, low, close] = ohlcRaw[i];
      if (!open || !high || !low || !close) continue;

      const body = Math.abs(close - open);
      const totalRange = high - low;
      if (totalRange === 0) continue;

      const bodyRatio = body / totalRange;

      // Doji: very small body relative to range
      if (bodyRatio < 0.05 && totalRange > 0) {
        const rangePct = (totalRange / low) * 100;
        if (rangePct > 3) { // Only flag significant dojis
          anomalies.push({
            index: i,
            timestamp: timestamps[i] || 0,
            type: 'unusual_candle',
            severity: 'low',
            description: `Doji candle: body is ${(bodyRatio * 100).toFixed(1)}% of range (${rangePct.toFixed(1)}% range)`,
            zScore: (1 - bodyRatio) * 2,
          });
        }
      }

      // Hammer/shooting star: very long wick
      if (bodyRatio < 0.3 && totalRange > 0) {
        const upperWick = high - Math.max(open, close);
        const lowerWick = Math.min(open, close) - low;
        const wickRatio = Math.max(upperWick, lowerWick) / totalRange;

        if (wickRatio > 0.6) {
          const rangePct = (totalRange / low) * 100;
          if (rangePct > 3) {
            anomalies.push({
              index: i,
              timestamp: timestamps[i] || 0,
              type: 'unusual_candle',
              severity: 'medium',
              description: `${lowerWick > upperWick ? 'Hammer' : 'Shooting star'}: ${(wickRatio * 100).toFixed(0)}% wick`,
              zScore: wickRatio * 2,
            });
          }
        }
      }
    }
  }

  // Sort by severity and z-score
  const severityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
  anomalies.sort((a, b) => {
    const sevDiff = severityOrder[a.severity] - severityOrder[b.severity];
    if (sevDiff !== 0) return sevDiff;
    return Math.abs(b.zScore) - Math.abs(a.zScore);
  });

  return anomalies;
}

function formatNumber(n: number): string {
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return n.toFixed(0);
}

function formatPrice(n: number): string {
  return n >= 1 ? `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : `$${n.toFixed(6)}`;
}
