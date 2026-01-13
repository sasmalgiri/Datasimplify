'use client';

import { useState } from 'react';
import {
  calculateConfidence,
  formatConfidenceScore,
  getConfidenceBadgeClass,
  getFreshnessLabel,
  getFreshnessColor,
  TrustData,
  ConfidenceResult,
} from '@/lib/trustSignals';

interface TrustBadgeProps {
  sourceId: string;
  fetchedAt: number;
  missingFields?: string[];
  anomalyFlags?: TrustData['anomalyFlags'];
  isStale?: boolean;
  showDetails?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * TrustBadge - Shows data confidence and freshness
 *
 * Displays a confidence score with expandable details about
 * data quality, freshness, and any anomalies detected.
 */
export function TrustBadge({
  sourceId,
  fetchedAt,
  missingFields,
  anomalyFlags,
  isStale,
  showDetails = false,
  size = 'md',
}: TrustBadgeProps) {
  const [expanded, setExpanded] = useState(showDetails);

  const trustData: TrustData = {
    sourceId,
    fetchedAt,
    missingFields,
    anomalyFlags,
    isStale,
  };

  const confidence = calculateConfidence(trustData);

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  return (
    <div className="inline-block">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className={`
          ${sizeClasses[size]}
          ${getConfidenceBadgeClass(confidence.score)}
          border rounded-lg font-medium cursor-pointer
          hover:opacity-90 transition-opacity
          flex items-center gap-1
        `}
        title={`Confidence: ${confidence.score}% - Click for details`}
      >
        <span>{confidence.score}%</span>
        {size !== 'sm' && (
          <span className="opacity-75">{formatConfidenceScore(confidence.score)}</span>
        )}
      </button>

      {expanded && (
        <div className="mt-2 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg text-sm max-w-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold">Data Confidence</span>
            <span className={confidence.color}>{confidence.score}%</span>
          </div>

          {/* Freshness */}
          <div className="flex items-center justify-between text-gray-600 dark:text-gray-400 mb-2">
            <span>Last updated:</span>
            <span className={getFreshnessColor(fetchedAt)}>{getFreshnessLabel(fetchedAt)}</span>
          </div>

          {/* Reasons */}
          {confidence.reasons.length > 0 && (
            <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                {confidence.level === 'high' ? 'Status' : 'Concerns'}:
              </span>
              <ul className="mt-1 text-xs text-gray-600 dark:text-gray-400 space-y-1">
                {confidence.reasons.slice(0, 3).map((reason, i) => (
                  <li key={i} className="flex items-start gap-1">
                    <span className={confidence.level === 'high' ? 'text-green-500' : 'text-yellow-500'}>
                      {confidence.level === 'high' ? '•' : '!'}
                    </span>
                    {reason}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Attribution */}
          {confidence.attribution && (
            <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500">
              {confidence.attributionUrl ? (
                <a
                  href={confidence.attributionUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  {confidence.attribution}
                </a>
              ) : (
                confidence.attribution
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Simplified freshness indicator
 */
interface FreshnessIndicatorProps {
  fetchedAt: number;
  size?: 'sm' | 'md';
}

export function FreshnessIndicator({ fetchedAt, size = 'sm' }: FreshnessIndicatorProps) {
  const label = getFreshnessLabel(fetchedAt);
  const colorClass = getFreshnessColor(fetchedAt);

  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
  };

  return (
    <span className={`${sizeClasses[size]} ${colorClass} flex items-center gap-1`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}

/**
 * Compact confidence dot indicator
 */
interface ConfidenceDotProps {
  score: number;
  title?: string;
}

export function ConfidenceDot({ score, title }: ConfidenceDotProps) {
  let colorClass: string;
  if (score >= 80) colorClass = 'bg-green-500';
  else if (score >= 60) colorClass = 'bg-yellow-500';
  else if (score >= 40) colorClass = 'bg-orange-500';
  else colorClass = 'bg-red-500';

  return (
    <span
      className={`inline-block w-2 h-2 rounded-full ${colorClass}`}
      title={title || `Confidence: ${score}%`}
    />
  );
}

/**
 * Full trust panel for detailed views
 */
interface TrustPanelProps {
  sourceId: string;
  fetchedAt: number;
  missingFields?: string[];
  anomalyFlags?: TrustData['anomalyFlags'];
  isStale?: boolean;
  className?: string;
}

export function TrustPanel({
  sourceId,
  fetchedAt,
  missingFields,
  anomalyFlags,
  isStale,
  className = '',
}: TrustPanelProps) {
  const trustData: TrustData = {
    sourceId,
    fetchedAt,
    missingFields,
    anomalyFlags,
    isStale,
  };

  const confidence = calculateConfidence(trustData);

  return (
    <div className={`bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-gray-900 dark:text-white">Data Trust Score</h4>
        <TrustBadge
          sourceId={sourceId}
          fetchedAt={fetchedAt}
          missingFields={missingFields}
          anomalyFlags={anomalyFlags}
          isStale={isStale}
          size="lg"
        />
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-3">
        <div
          className={`h-full transition-all duration-500 ${
            confidence.score >= 80
              ? 'bg-green-500'
              : confidence.score >= 60
              ? 'bg-yellow-500'
              : confidence.score >= 40
              ? 'bg-orange-500'
              : 'bg-red-500'
          }`}
          style={{ width: `${confidence.score}%` }}
        />
      </div>

      {/* Details */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <span className="text-gray-500 dark:text-gray-400">Freshness:</span>
          <div className={getFreshnessColor(fetchedAt)}>{getFreshnessLabel(fetchedAt)}</div>
        </div>
        <div>
          <span className="text-gray-500 dark:text-gray-400">Level:</span>
          <div className={confidence.color}>{formatConfidenceScore(confidence.score)}</div>
        </div>
      </div>

      {/* Reasons */}
      {confidence.reasons.length > 0 && confidence.level !== 'high' && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <span className="text-xs font-medium text-gray-500">Why this score:</span>
          <ul className="mt-1 text-xs text-gray-600 dark:text-gray-400 space-y-1">
            {confidence.reasons.map((reason, i) => (
              <li key={i}>• {reason}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Attribution */}
      {confidence.attribution && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500">
          Source:{' '}
          {confidence.attributionUrl ? (
            <a
              href={confidence.attributionUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              {confidence.attribution}
            </a>
          ) : (
            confidence.attribution
          )}
        </div>
      )}
    </div>
  );
}
