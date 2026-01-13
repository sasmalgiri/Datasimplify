/**
 * Trust Signals and Confidence Scoring
 *
 * Provides transparency about data quality and freshness.
 * Users should understand "why" a number might be unreliable.
 */

import { getDataSource, DataSource } from './dataSources';

// Confidence score thresholds
export const CONFIDENCE_THRESHOLDS = {
  HIGH: 80, // Green - trustworthy
  MEDIUM: 60, // Yellow - use with caution
  LOW: 40, // Orange - significant concerns
  CRITICAL: 0, // Red - do not rely on this
};

// Freshness thresholds (in seconds)
export const FRESHNESS_THRESHOLDS = {
  FRESH: 60, // Less than 1 minute old
  RECENT: 300, // Less than 5 minutes old
  STALE: 900, // Less than 15 minutes old
  OLD: 3600, // Less than 1 hour old
  VERY_OLD: Infinity, // More than 1 hour old
};

export type AnomalyType =
  | 'price_spike'
  | 'volume_spike'
  | 'missing_data'
  | 'stale_data'
  | 'source_error'
  | 'divergence';

export interface AnomalyFlag {
  type: AnomalyType;
  severity: 'low' | 'medium' | 'high';
  message: string;
  detectedAt: number;
}

export interface TrustData {
  sourceId: string;
  fetchedAt: number;
  missingFields?: string[];
  anomalyFlags?: AnomalyFlag[];
  isStale?: boolean;
  previousValue?: number;
  currentValue?: number;
}

export interface ConfidenceResult {
  score: number; // 0-100
  level: 'high' | 'medium' | 'low' | 'critical';
  color: string; // CSS color class
  reasons: string[];
  freshness: 'fresh' | 'recent' | 'stale' | 'old' | 'very_old';
  attribution?: string;
  attributionUrl?: string;
}

/**
 * Calculate confidence score for data
 */
export function calculateConfidence(data: TrustData): ConfidenceResult {
  let score = 100;
  const reasons: string[] = [];

  // === Freshness penalty (up to -30) ===
  const ageSeconds = (Date.now() - data.fetchedAt) / 1000;
  let freshness: ConfidenceResult['freshness'] = 'fresh';

  if (ageSeconds > FRESHNESS_THRESHOLDS.OLD) {
    score -= 30;
    reasons.push(`Data is ${Math.floor(ageSeconds / 3600)} hours old`);
    freshness = 'very_old';
  } else if (ageSeconds > FRESHNESS_THRESHOLDS.STALE) {
    score -= 20;
    reasons.push(`Data is ${Math.floor(ageSeconds / 60)} minutes old`);
    freshness = 'old';
  } else if (ageSeconds > FRESHNESS_THRESHOLDS.RECENT) {
    score -= 10;
    reasons.push(`Data is ${Math.floor(ageSeconds / 60)} minutes old`);
    freshness = 'stale';
  } else if (ageSeconds > FRESHNESS_THRESHOLDS.FRESH) {
    score -= 5;
    freshness = 'recent';
  }

  // === Missing data penalty (up to -20) ===
  const missingCount = data.missingFields?.length || 0;
  if (missingCount > 0) {
    const penalty = Math.min(20, missingCount * 5);
    score -= penalty;
    reasons.push(`${missingCount} fields missing`);
  }

  // === Anomaly penalty (up to -30) ===
  const anomalies = data.anomalyFlags || [];
  for (const anomaly of anomalies) {
    const severityPenalty = { low: 5, medium: 10, high: 15 }[anomaly.severity];
    score -= severityPenalty;
    reasons.push(anomaly.message);
  }

  // === Stale warning (up to -20) ===
  if (data.isStale) {
    score -= 20;
    reasons.push('Data source reported stale');
  }

  // === Price divergence detection ===
  if (data.previousValue && data.currentValue) {
    const changePercent = Math.abs(
      ((data.currentValue - data.previousValue) / data.previousValue) * 100
    );
    if (changePercent > 20) {
      score -= 15;
      reasons.push(`Sudden ${changePercent.toFixed(1)}% change detected`);
    } else if (changePercent > 10) {
      score -= 10;
      reasons.push(`Significant ${changePercent.toFixed(1)}% change detected`);
    }
  }

  // Clamp score
  score = Math.max(0, Math.min(100, score));

  // Determine level and color
  let level: ConfidenceResult['level'];
  let color: string;

  if (score >= CONFIDENCE_THRESHOLDS.HIGH) {
    level = 'high';
    color = 'text-green-500';
  } else if (score >= CONFIDENCE_THRESHOLDS.MEDIUM) {
    level = 'medium';
    color = 'text-yellow-500';
  } else if (score >= CONFIDENCE_THRESHOLDS.LOW) {
    level = 'low';
    color = 'text-orange-500';
  } else {
    level = 'critical';
    color = 'text-red-500';
  }

  // Get attribution from source
  const source = getDataSource(data.sourceId);

  return {
    score,
    level,
    color,
    reasons: reasons.length > 0 ? reasons : ['Data appears reliable'],
    freshness,
    attribution: source?.attribution,
    attributionUrl: source?.attributionUrl,
  };
}

/**
 * Detect anomalies in price data
 */
export function detectPriceAnomalies(
  currentPrice: number,
  prices24h: number[],
  volume24h?: number,
  avgVolume?: number
): AnomalyFlag[] {
  const anomalies: AnomalyFlag[] = [];

  if (prices24h.length < 2) return anomalies;

  // Calculate rolling statistics
  const mean = prices24h.reduce((a, b) => a + b, 0) / prices24h.length;
  const variance =
    prices24h.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / prices24h.length;
  const stdDev = Math.sqrt(variance);

  // Price spike detection (>3 standard deviations)
  const zScore = stdDev > 0 ? (currentPrice - mean) / stdDev : 0;
  if (Math.abs(zScore) > 3) {
    anomalies.push({
      type: 'price_spike',
      severity: Math.abs(zScore) > 5 ? 'high' : 'medium',
      message: `Price is ${zScore.toFixed(1)} std devs from mean`,
      detectedAt: Date.now(),
    });
  }

  // Volume spike detection
  if (volume24h && avgVolume && avgVolume > 0) {
    const volumeRatio = volume24h / avgVolume;
    if (volumeRatio > 5) {
      anomalies.push({
        type: 'volume_spike',
        severity: volumeRatio > 10 ? 'high' : 'medium',
        message: `Volume ${volumeRatio.toFixed(1)}x higher than average`,
        detectedAt: Date.now(),
      });
    }
  }

  return anomalies;
}

/**
 * Get human-readable freshness label
 */
export function getFreshnessLabel(fetchedAt: number): string {
  const ageSeconds = (Date.now() - fetchedAt) / 1000;

  if (ageSeconds < 60) return 'Just now';
  if (ageSeconds < 300) return `${Math.floor(ageSeconds / 60)}m ago`;
  if (ageSeconds < 3600) return `${Math.floor(ageSeconds / 60)}m ago`;
  if (ageSeconds < 86400) return `${Math.floor(ageSeconds / 3600)}h ago`;
  return `${Math.floor(ageSeconds / 86400)}d ago`;
}

/**
 * Get freshness color class
 */
export function getFreshnessColor(fetchedAt: number): string {
  const ageSeconds = (Date.now() - fetchedAt) / 1000;

  if (ageSeconds <= FRESHNESS_THRESHOLDS.FRESH) return 'text-green-500';
  if (ageSeconds <= FRESHNESS_THRESHOLDS.RECENT) return 'text-green-400';
  if (ageSeconds <= FRESHNESS_THRESHOLDS.STALE) return 'text-yellow-500';
  if (ageSeconds <= FRESHNESS_THRESHOLDS.OLD) return 'text-orange-500';
  return 'text-red-500';
}

/**
 * Format confidence score for display
 */
export function formatConfidenceScore(score: number): string {
  if (score >= 90) return 'Very High';
  if (score >= 80) return 'High';
  if (score >= 60) return 'Medium';
  if (score >= 40) return 'Low';
  return 'Very Low';
}

/**
 * Get confidence badge color class
 */
export function getConfidenceBadgeClass(score: number): string {
  if (score >= CONFIDENCE_THRESHOLDS.HIGH) return 'bg-green-100 text-green-800 border-green-200';
  if (score >= CONFIDENCE_THRESHOLDS.MEDIUM) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
  if (score >= CONFIDENCE_THRESHOLDS.LOW) return 'bg-orange-100 text-orange-800 border-orange-200';
  return 'bg-red-100 text-red-800 border-red-200';
}
