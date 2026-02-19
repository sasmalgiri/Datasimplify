'use client';

import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface FreshnessBadgeProps {
  /** ISO timestamp of when data was last fetched */
  lastUpdated: string | null;
  /** Whether data came from cache */
  fromCache?: boolean;
  /** Compact mode (icon only, tooltip on hover) */
  compact?: boolean;
}

function formatAge(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function getFreshnessColor(ms: number): string {
  if (ms < 60_000) return 'text-emerald-400'; // < 1 min: green
  if (ms < 300_000) return 'text-emerald-400/70'; // < 5 min: faded green
  if (ms < 900_000) return 'text-yellow-400'; // < 15 min: yellow
  if (ms < 3600_000) return 'text-orange-400'; // < 1 hr: orange
  return 'text-red-400'; // stale
}

/**
 * Shows when data was last refreshed with color-coded freshness.
 * Lightweight — updates every 10s via interval.
 */
export function FreshnessBadge({ lastUpdated, fromCache, compact }: FreshnessBadgeProps) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 10_000);
    return () => clearInterval(interval);
  }, []);

  if (!lastUpdated) return null;

  const age = now - new Date(lastUpdated).getTime();
  const color = getFreshnessColor(age);
  const label = formatAge(age);

  if (compact) {
    return (
      <span className={`inline-flex items-center gap-1 ${color}`} title={`Updated ${label}${fromCache ? ' (cached)' : ''}`}>
        <Clock className="w-3 h-3" />
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 text-[10px] ${color}`}>
      <Clock className="w-2.5 h-2.5" />
      {label}
      {fromCache && <span className="text-gray-600">(cached)</span>}
    </span>
  );
}
