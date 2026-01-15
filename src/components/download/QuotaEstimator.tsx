'use client';

import { useMemo } from 'react';
import {
  estimateApiCalls,
  getCryptoSheetsPlanRecommendation,
  REFRESH_FREQUENCY_OPTIONS,
  type RefreshFrequency,
} from '@/lib/templates/templateModes';

interface QuotaEstimatorProps {
  assetCount: number;
  refreshFrequency: RefreshFrequency;
  timeframe: string;
  includeCharts: boolean;
  className?: string;
}

/**
 * QuotaEstimator Component
 *
 * Shows users their estimated CryptoSheets API usage based on their
 * template configuration. Helps them understand quota implications
 * before downloading.
 */
export function QuotaEstimator({
  assetCount,
  refreshFrequency,
  timeframe,
  includeCharts,
  className = '',
}: QuotaEstimatorProps) {
  const estimate = useMemo(
    () => estimateApiCalls({ assetCount, refreshFrequency, timeframe, includeCharts }),
    [assetCount, refreshFrequency, timeframe, includeCharts]
  );

  const recommendation = useMemo(
    () => getCryptoSheetsPlanRecommendation(estimate.perDay),
    [estimate.perDay]
  );

  const refreshOption = REFRESH_FREQUENCY_OPTIONS.find((o) => o.id === refreshFrequency);

  // Determine status color
  const getStatusColor = () => {
    if (estimate.withinFreeLimit) return 'emerald';
    if (estimate.withinProLimit) return 'yellow';
    return 'red';
  };

  const statusColor = getStatusColor();

  const colorClasses = {
    emerald: {
      bg: 'bg-emerald-900/20',
      border: 'border-emerald-500/50',
      text: 'text-emerald-400',
      badge: 'bg-emerald-500/20 text-emerald-400',
    },
    yellow: {
      bg: 'bg-yellow-900/20',
      border: 'border-yellow-500/50',
      text: 'text-yellow-400',
      badge: 'bg-yellow-500/20 text-yellow-400',
    },
    red: {
      bg: 'bg-red-900/20',
      border: 'border-red-500/50',
      text: 'text-red-400',
      badge: 'bg-red-500/20 text-red-400',
    },
  };

  const colors = colorClasses[statusColor];

  return (
    <div className={`${colors.bg} rounded-xl border ${colors.border} p-5 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Estimated API Usage
        </h3>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${colors.badge}`}>
          {estimate.withinFreeLimit ? 'Free Tier OK' : estimate.withinProLimit ? 'Pro Tier Required' : 'Premium Required'}
        </span>
      </div>

      {/* Usage Stats */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <div className={`text-2xl font-bold ${colors.text}`}>{estimate.perRefresh}</div>
          <div className="text-xs text-gray-400">Per Refresh</div>
        </div>
        <div className="text-center">
          <div className={`text-2xl font-bold ${colors.text}`}>{estimate.perDay}</div>
          <div className="text-xs text-gray-400">Est. Daily</div>
        </div>
        <div className="text-center">
          <div className={`text-2xl font-bold ${colors.text}`}>{estimate.perMonth.toLocaleString()}</div>
          <div className="text-xs text-gray-400">Est. Monthly</div>
        </div>
      </div>

      {/* Configuration Summary */}
      <div className="bg-gray-800/50 rounded-lg p-3 mb-4 text-sm">
        <div className="grid grid-cols-2 gap-2 text-gray-300">
          <div>Assets: <span className="text-white font-medium">{assetCount}</span></div>
          <div>Timeframe: <span className="text-white font-medium">{timeframe.toUpperCase()}</span></div>
          <div>Refresh: <span className="text-white font-medium">{refreshOption?.label || refreshFrequency}</span></div>
          <div>Charts: <span className="text-white font-medium">{includeCharts ? 'Yes' : 'No'}</span></div>
        </div>
      </div>

      {/* Plan Recommendation */}
      <div className={`rounded-lg p-3 ${colors.bg} border ${colors.border}`}>
        <div className="flex items-start gap-3">
          <div className={`w-8 h-8 rounded-full ${colors.badge} flex items-center justify-center flex-shrink-0`}>
            {estimate.withinFreeLimit ? (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            )}
          </div>
          <div>
            <div className={`font-medium ${colors.text}`}>{recommendation.plan}</div>
            <div className="text-xs text-gray-400 mt-0.5">{recommendation.reason}</div>
          </div>
        </div>
      </div>

      {/* Tips for reducing usage */}
      {!estimate.withinFreeLimit && (
        <div className="mt-4 text-xs text-gray-400">
          <div className="font-medium text-gray-300 mb-1">Tips to reduce usage:</div>
          <ul className="list-disc list-inside space-y-0.5">
            {assetCount > 10 && <li>Reduce assets to 10 or fewer</li>}
            {refreshFrequency !== 'manual' && <li>Switch to manual refresh</li>}
            {timeframe !== '1d' && <li>Use daily timeframe instead of {timeframe}</li>}
            {includeCharts && <li>Disable charts to save ~2 calls per asset</li>}
          </ul>
        </div>
      )}
    </div>
  );
}
