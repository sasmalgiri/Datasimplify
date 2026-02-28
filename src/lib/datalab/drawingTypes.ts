export type DrawingType = 'hline' | 'trendline' | 'fibonacci' | 'text'
  | 'pitchfork' | 'regression_channel' | 'measurement';

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

/** Number of clicks required per drawing type */
export const DRAWING_CLICK_COUNT: Record<DrawingType, number> = {
  hline: 1,
  trendline: 2,
  fibonacci: 2,
  text: 1,
  pitchfork: 3,
  regression_channel: 2,
  measurement: 2,
};

/** Compute Andrew's Pitchfork from 3 points: pivot, anchor1, anchor2 */
export function computePitchfork(
  pivot: DrawingPoint,
  p1: DrawingPoint,
  p2: DrawingPoint,
): { median: [DrawingPoint, DrawingPoint]; upper: [DrawingPoint, DrawingPoint]; lower: [DrawingPoint, DrawingPoint] } {
  const midX = (p1.x + p2.x) / 2;
  const midY = (p1.y + p2.y) / 2;
  const median: [DrawingPoint, DrawingPoint] = [pivot, { x: midX, y: midY }];

  // Upper and lower parallel lines through p1 and p2
  const dx = midX - pivot.x;
  const dy = midY - pivot.y;
  const upper: [DrawingPoint, DrawingPoint] = [p1, { x: p1.x + dx, y: p1.y + dy }];
  const lower: [DrawingPoint, DrawingPoint] = [p2, { x: p2.x + dx, y: p2.y + dy }];

  return { median, upper, lower };
}

/** Compute measurement between two points */
export function computeMeasurement(
  p1: DrawingPoint,
  p2: DrawingPoint,
): { priceChange: number; percentChange: number; bars: number } {
  const priceChange = p2.y - p1.y;
  const percentChange = p1.y !== 0 ? (priceChange / p1.y) * 100 : 0;
  const bars = Math.abs(p2.x - p1.x);
  return { priceChange, percentChange, bars };
}
