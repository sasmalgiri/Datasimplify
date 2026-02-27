export type DrawingType = 'hline' | 'trendline' | 'fibonacci';

export interface DrawingPoint {
  x: number; // timestamp or data index
  y: number; // data value
}

export interface Drawing {
  id: string;
  type: DrawingType;
  points: DrawingPoint[];
  color: string;
  label?: string;
}

/** Fibonacci retracement levels */
export const FIB_LEVELS = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1.0];

/**
 * Compute fibonacci retracement lines from two anchor points.
 * Returns array of { level, value } for each fib level.
 */
export function computeFibLevels(
  high: number,
  low: number,
): { level: number; value: number }[] {
  const range = high - low;
  return FIB_LEVELS.map((level) => ({
    level,
    value: high - range * level,
  }));
}
