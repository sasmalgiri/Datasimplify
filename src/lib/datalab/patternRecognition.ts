// Chart Pattern Recognition for DataLab
// Detects common technical analysis patterns using local extrema

import type { PatternType, DetectedPattern } from './types';

interface Extremum {
  idx: number;
  value: number;
  type: 'high' | 'low';
}

/**
 * Find local extrema (highs and lows) in price data.
 */
function findExtrema(closes: number[], lookback: number = 5): Extremum[] {
  const extrema: Extremum[] = [];

  for (let i = lookback; i < closes.length - lookback; i++) {
    let isHigh = true;
    let isLow = true;

    for (let j = i - lookback; j <= i + lookback; j++) {
      if (j === i) continue;
      if (closes[j] >= closes[i]) isHigh = false;
      if (closes[j] <= closes[i]) isLow = false;
    }

    if (isHigh) extrema.push({ idx: i, value: closes[i], type: 'high' });
    if (isLow) extrema.push({ idx: i, value: closes[i], type: 'low' });
  }

  return extrema;
}

/**
 * Check if two values are approximately equal (within tolerance %).
 */
function approxEqual(a: number, b: number, tolerancePct: number = 3): boolean {
  return Math.abs(a - b) / Math.max(Math.abs(a), Math.abs(b), 1) * 100 <= tolerancePct;
}

/**
 * Detect Double Top pattern.
 * Two consecutive highs at approximately the same level with a trough between.
 */
function detectDoubleTops(highs: Extremum[], lows: Extremum[]): DetectedPattern[] {
  const patterns: DetectedPattern[] = [];

  for (let i = 0; i < highs.length - 1; i++) {
    const h1 = highs[i];
    const h2 = highs[i + 1];

    // Highs should be approximately equal
    if (!approxEqual(h1.value, h2.value, 3)) continue;

    // Find a trough between the two highs
    const trough = lows.find((l) => l.idx > h1.idx && l.idx < h2.idx);
    if (!trough) continue;

    // Neckline (trough) should be meaningfully lower than the highs
    const dropPct = ((h1.value - trough.value) / h1.value) * 100;
    if (dropPct < 2) continue;

    const confidence = Math.min(0.9, 0.5 + (1 - Math.abs(h1.value - h2.value) / h1.value) * 0.3 + (dropPct / 10) * 0.1);

    patterns.push({
      type: 'double_top',
      startIdx: h1.idx,
      endIdx: h2.idx,
      keyPoints: [
        { idx: h1.idx, value: h1.value, label: 'Top 1' },
        { idx: trough.idx, value: trough.value, label: 'Neckline' },
        { idx: h2.idx, value: h2.value, label: 'Top 2' },
      ],
      confidence,
      implication: 'bearish',
      targetPrice: trough.value - (h1.value - trough.value),
    });
  }

  return patterns;
}

/**
 * Detect Double Bottom pattern.
 */
function detectDoubleBottoms(highs: Extremum[], lows: Extremum[]): DetectedPattern[] {
  const patterns: DetectedPattern[] = [];

  for (let i = 0; i < lows.length - 1; i++) {
    const l1 = lows[i];
    const l2 = lows[i + 1];

    if (!approxEqual(l1.value, l2.value, 3)) continue;

    const peak = highs.find((h) => h.idx > l1.idx && h.idx < l2.idx);
    if (!peak) continue;

    const risePct = ((peak.value - l1.value) / l1.value) * 100;
    if (risePct < 2) continue;

    const confidence = Math.min(0.9, 0.5 + (1 - Math.abs(l1.value - l2.value) / l1.value) * 0.3 + (risePct / 10) * 0.1);

    patterns.push({
      type: 'double_bottom',
      startIdx: l1.idx,
      endIdx: l2.idx,
      keyPoints: [
        { idx: l1.idx, value: l1.value, label: 'Bottom 1' },
        { idx: peak.idx, value: peak.value, label: 'Neckline' },
        { idx: l2.idx, value: l2.value, label: 'Bottom 2' },
      ],
      confidence,
      implication: 'bullish',
      targetPrice: peak.value + (peak.value - l1.value),
    });
  }

  return patterns;
}

/**
 * Detect Head and Shoulders pattern.
 * Three consecutive peaks: left shoulder, higher head, right shoulder at similar level.
 */
function detectHeadAndShoulders(highs: Extremum[], lows: Extremum[]): DetectedPattern[] {
  const patterns: DetectedPattern[] = [];

  for (let i = 0; i < highs.length - 2; i++) {
    const ls = highs[i];    // left shoulder
    const head = highs[i + 1]; // head
    const rs = highs[i + 2]; // right shoulder

    // Head must be higher than both shoulders
    if (head.value <= ls.value || head.value <= rs.value) continue;

    // Shoulders should be approximately equal
    if (!approxEqual(ls.value, rs.value, 5)) continue;

    // Head must be meaningfully higher (at least 2% above shoulders)
    const headAbovePct = ((head.value - ls.value) / ls.value) * 100;
    if (headAbovePct < 2) continue;

    // Find troughs between shoulders and head (neckline)
    const t1 = lows.find((l) => l.idx > ls.idx && l.idx < head.idx);
    const t2 = lows.find((l) => l.idx > head.idx && l.idx < rs.idx);
    if (!t1 || !t2) continue;

    const neckline = (t1.value + t2.value) / 2;
    const confidence = Math.min(0.85, 0.4 + (headAbovePct / 15) * 0.3 + (1 - Math.abs(ls.value - rs.value) / ls.value) * 0.15);

    patterns.push({
      type: 'head_and_shoulders',
      startIdx: ls.idx,
      endIdx: rs.idx,
      keyPoints: [
        { idx: ls.idx, value: ls.value, label: 'Left Shoulder' },
        { idx: t1.idx, value: t1.value, label: 'Neckline L' },
        { idx: head.idx, value: head.value, label: 'Head' },
        { idx: t2.idx, value: t2.value, label: 'Neckline R' },
        { idx: rs.idx, value: rs.value, label: 'Right Shoulder' },
      ],
      confidence,
      implication: 'bearish',
      targetPrice: neckline - (head.value - neckline),
    });
  }

  return patterns;
}

/**
 * Detect Inverse Head and Shoulders pattern.
 */
function detectInverseHeadAndShoulders(highs: Extremum[], lows: Extremum[]): DetectedPattern[] {
  const patterns: DetectedPattern[] = [];

  for (let i = 0; i < lows.length - 2; i++) {
    const ls = lows[i];
    const head = lows[i + 1];
    const rs = lows[i + 2];

    if (head.value >= ls.value || head.value >= rs.value) continue;
    if (!approxEqual(ls.value, rs.value, 5)) continue;

    const headBelowPct = ((ls.value - head.value) / ls.value) * 100;
    if (headBelowPct < 2) continue;

    const p1 = highs.find((h) => h.idx > ls.idx && h.idx < head.idx);
    const p2 = highs.find((h) => h.idx > head.idx && h.idx < rs.idx);
    if (!p1 || !p2) continue;

    const neckline = (p1.value + p2.value) / 2;
    const confidence = Math.min(0.85, 0.4 + (headBelowPct / 15) * 0.3);

    patterns.push({
      type: 'inverse_head_and_shoulders',
      startIdx: ls.idx,
      endIdx: rs.idx,
      keyPoints: [
        { idx: ls.idx, value: ls.value, label: 'Left Shoulder' },
        { idx: p1.idx, value: p1.value, label: 'Neckline L' },
        { idx: head.idx, value: head.value, label: 'Head' },
        { idx: p2.idx, value: p2.value, label: 'Neckline R' },
        { idx: rs.idx, value: rs.value, label: 'Right Shoulder' },
      ],
      confidence,
      implication: 'bullish',
      targetPrice: neckline + (neckline - head.value),
    });
  }

  return patterns;
}

/**
 * Detect ascending/descending wedge patterns using trendline convergence.
 */
function detectWedges(highs: Extremum[], lows: Extremum[]): DetectedPattern[] {
  const patterns: DetectedPattern[] = [];

  if (highs.length < 2 || lows.length < 2) return patterns;

  // Look at the last few extrema
  const recentHighs = highs.slice(-3);
  const recentLows = lows.slice(-3);

  if (recentHighs.length >= 2 && recentLows.length >= 2) {
    const highSlope = (recentHighs[recentHighs.length - 1].value - recentHighs[0].value) /
      (recentHighs[recentHighs.length - 1].idx - recentHighs[0].idx);
    const lowSlope = (recentLows[recentLows.length - 1].value - recentLows[0].value) /
      (recentLows[recentLows.length - 1].idx - recentLows[0].idx);

    // Ascending wedge: both slopes positive, but converging (low slope > high slope)
    if (highSlope > 0 && lowSlope > 0 && lowSlope > highSlope * 0.3) {
      patterns.push({
        type: 'ascending_wedge',
        startIdx: Math.min(recentHighs[0].idx, recentLows[0].idx),
        endIdx: Math.max(recentHighs[recentHighs.length - 1].idx, recentLows[recentLows.length - 1].idx),
        keyPoints: [
          ...recentHighs.map((h) => ({ idx: h.idx, value: h.value, label: 'Resistance' })),
          ...recentLows.map((l) => ({ idx: l.idx, value: l.value, label: 'Support' })),
        ],
        confidence: 0.55,
        implication: 'bearish',
      });
    }

    // Descending wedge: both slopes negative, converging
    if (highSlope < 0 && lowSlope < 0 && Math.abs(lowSlope) < Math.abs(highSlope) * 0.7) {
      patterns.push({
        type: 'descending_wedge',
        startIdx: Math.min(recentHighs[0].idx, recentLows[0].idx),
        endIdx: Math.max(recentHighs[recentHighs.length - 1].idx, recentLows[recentLows.length - 1].idx),
        keyPoints: [
          ...recentHighs.map((h) => ({ idx: h.idx, value: h.value, label: 'Resistance' })),
          ...recentLows.map((l) => ({ idx: l.idx, value: l.value, label: 'Support' })),
        ],
        confidence: 0.55,
        implication: 'bullish',
      });
    }
  }

  return patterns;
}

/**
 * Main pattern recognition entry point.
 * Scans closing prices for common chart patterns.
 */
export function recognizePatterns(closes: number[]): DetectedPattern[] {
  if (closes.length < 30) return [];

  const extrema = findExtrema(closes, 5);
  const highs = extrema.filter((e) => e.type === 'high');
  const lows = extrema.filter((e) => e.type === 'low');

  const patterns: DetectedPattern[] = [
    ...detectDoubleTops(highs, lows),
    ...detectDoubleBottoms(highs, lows),
    ...detectHeadAndShoulders(highs, lows),
    ...detectInverseHeadAndShoulders(highs, lows),
    ...detectWedges(highs, lows),
  ];

  // Sort by confidence
  return patterns.sort((a, b) => b.confidence - a.confidence);
}
