'use client';

import { useState, useEffect } from 'react';
import { FreshnessIndicator, TrustBadge } from '@/components/TrustBadge';
import { Shield } from 'lucide-react';

interface DataFreshnessProps {
  source?: string;
  refreshInterval?: number;
  className?: string;
}

/**
 * DataFreshness - Shows data source and freshness on tool pages.
 * Tracks time since page loaded as proxy for data freshness.
 * Beginners see "where this data comes from" and "how fresh it is."
 */
export function DataFreshness({
  source = 'CoinGecko',
  refreshInterval = 300,
  className = '',
}: DataFreshnessProps) {
  const [mountedAt] = useState(() => Date.now());
  const [, setTick] = useState(0);

  // Re-render every 30s to update freshness
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`inline-flex items-center gap-2 text-xs text-gray-500 ${className}`}>
      <Shield className="w-3 h-3" />
      <span>Source: {source}</span>
      <span className="text-gray-700">|</span>
      <FreshnessIndicator fetchedAt={mountedAt} size="sm" />
      <span className="text-gray-700">|</span>
      <span>Refreshes every {refreshInterval < 60 ? `${refreshInterval}s` : `${Math.round(refreshInterval / 60)}min`}</span>
    </div>
  );
}

/**
 * DataTrustStrip - A horizontal strip showing trust info for a data page.
 * Shows source, freshness, and expandable confidence score.
 */
export function DataTrustStrip({
  source = 'CoinGecko',
  className = '',
}: {
  source?: string;
  className?: string;
}) {
  const [mountedAt] = useState(() => Date.now());
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`flex items-center gap-3 px-4 py-2 bg-gray-800/40 border border-gray-700/40 rounded-lg text-xs text-gray-500 mb-4 ${className}`}>
      <div className="flex items-center gap-1.5">
        <Shield className="w-3.5 h-3.5 text-emerald-500" />
        <span className="text-gray-400">Data source:</span>
        <span className="text-emerald-400 font-medium">{source}</span>
      </div>
      <span className="text-gray-700">|</span>
      <FreshnessIndicator fetchedAt={mountedAt} />
      <span className="text-gray-700">|</span>
      <TrustBadge
        sourceId="coingecko"
        fetchedAt={mountedAt}
        size="sm"
      />
    </div>
  );
}
