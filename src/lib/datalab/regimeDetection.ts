/**
 * Regime Detection Engine
 * Auto-labels market regimes using BB width, rolling volatility, and drawdown.
 *
 * Regimes:
 *   - "trend"    : Clear directional move (low vol, price trending above/below MA)
 *   - "chop"     : No clear direction, range-bound (moderate vol, price near MA)
 *   - "high-vol" : Explosive volatility (BB expanding, high ATR)
 *   - "risk-off" : Severe drawdown + elevated volatility = defensive mode
 */

export type MarketRegime = 'trend' | 'chop' | 'high-vol' | 'risk-off';

export interface RegimeSegment {
  regime: MarketRegime;
  startIdx: number;
  endIdx: number;
}

export const REGIME_COLORS: Record<MarketRegime, string> = {
  'trend': '#34d399',    // emerald
  'chop': '#fbbf24',     // amber
  'high-vol': '#f97316', // orange
  'risk-off': '#ef4444', // red
};

export const REGIME_LABELS: Record<MarketRegime, string> = {
  'trend': 'Trend',
  'chop': 'Chop',
  'high-vol': 'High Vol',
  'risk-off': 'Risk-Off',
};

interface RegimeInput {
  closes: number[];
  sma50: (number | null)[];
  bbWidth: (number | null)[];
  rollingVol: (number | null)[];
  drawdown: (number | null)[];
}

/**
 * Classify each data point into a market regime.
 * Uses a priority-based rule set:
 *   1. risk-off: drawdown < -15% AND vol elevated
 *   2. high-vol: BB width > 90th percentile OR rolling vol > 90th percentile
 *   3. chop: BB width < 30th percentile AND price oscillating around MA
 *   4. trend: everything else (clear directional movement)
 */
export function detectRegimes(input: RegimeInput): MarketRegime[] {
  const len = input.closes.length;
  const regimes: MarketRegime[] = new Array(len).fill('trend');

  // Compute percentiles for BB width and rolling vol
  const validBBW = input.bbWidth.filter((v) => v != null) as number[];
  const validVol = input.rollingVol.filter((v) => v != null) as number[];

  if (validBBW.length < 5 || validVol.length < 5) return regimes;

  const sortedBBW = [...validBBW].sort((a, b) => a - b);
  const sortedVol = [...validVol].sort((a, b) => a - b);

  const bbw30 = sortedBBW[Math.floor(sortedBBW.length * 0.30)] ?? 5;
  const bbw90 = sortedBBW[Math.floor(sortedBBW.length * 0.90)] ?? 20;
  const vol90 = sortedVol[Math.floor(sortedVol.length * 0.90)] ?? 50;

  for (let i = 0; i < len; i++) {
    const dd = input.drawdown[i];
    const bbw = input.bbWidth[i];
    const vol = input.rollingVol[i];
    const close = input.closes[i];
    const ma = input.sma50[i];

    // 1. Risk-off: deep drawdown + elevated volatility
    if (dd != null && dd < -15 && vol != null && vol > vol90 * 0.5) {
      regimes[i] = 'risk-off';
      continue;
    }

    // 2. High-vol: extreme band expansion or volatility spike
    if ((bbw != null && bbw > bbw90) || (vol != null && vol > vol90)) {
      regimes[i] = 'high-vol';
      continue;
    }

    // 3. Chop: tight bands + price near MA (within 3%)
    if (bbw != null && bbw < bbw30 && ma != null && close != null) {
      const pctFromMA = Math.abs(close - ma) / ma * 100;
      if (pctFromMA < 3) {
        regimes[i] = 'chop';
        continue;
      }
    }

    // 4. Default: trend
    regimes[i] = 'trend';
  }

  return regimes;
}

/**
 * Convert per-point regimes into contiguous segments for markArea rendering.
 */
export function segmentRegimes(regimes: MarketRegime[]): RegimeSegment[] {
  if (regimes.length === 0) return [];

  const segments: RegimeSegment[] = [];
  let current: RegimeSegment = { regime: regimes[0], startIdx: 0, endIdx: 0 };

  for (let i = 1; i < regimes.length; i++) {
    if (regimes[i] === current.regime) {
      current.endIdx = i;
    } else {
      segments.push({ ...current });
      current = { regime: regimes[i], startIdx: i, endIdx: i };
    }
  }
  segments.push(current);

  return segments;
}
