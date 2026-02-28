'use client';

import { useEffect, useRef, useState } from 'react';
import { RefreshCw, ChevronDown } from 'lucide-react';
import { useDataLabStore } from '@/lib/datalab/store';
import { isFeatureAvailable } from '@/lib/datalab/modeConfig';

const INTERVAL_OPTIONS = [
  { label: '5 min', value: 5 * 60 * 1000 },
  { label: '15 min', value: 15 * 60 * 1000 },
  { label: 'Off', value: 0 },
] as const;

export function AutoRefreshIndicator() {
  const dataLabMode = useDataLabStore((s) => s.dataLabMode);
  const autoRefreshEnabled = useDataLabStore((s) => s.autoRefreshEnabled);
  const autoRefreshInterval = useDataLabStore((s) => s.autoRefreshInterval);
  const toggleAutoRefresh = useDataLabStore((s) => s.toggleAutoRefresh);
  const setAutoRefreshInterval = useDataLabStore((s) => s.setAutoRefreshInterval);
  const loadData = useDataLabStore((s) => s.loadData);

  const [showDrop, setShowDrop] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  if (!isFeatureAvailable(dataLabMode, 'autoRefresh')) return null;

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setShowDrop(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Auto-refresh interval
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (autoRefreshEnabled && autoRefreshInterval > 0) {
      intervalRef.current = setInterval(async () => {
        setIsRefreshing(true);
        try {
          await loadData();
          setLastRefresh(Date.now());
        } finally {
          setIsRefreshing(false);
        }
      }, autoRefreshInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [autoRefreshEnabled, autoRefreshInterval, loadData]);

  const currentOption = INTERVAL_OPTIONS.find((o) => o.value === autoRefreshInterval) ?? INTERVAL_OPTIONS[2];

  return (
    <div className="relative" ref={dropRef}>
      <button
        type="button"
        onClick={() => setShowDrop(!showDrop)}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition border ${
          autoRefreshEnabled && autoRefreshInterval > 0
            ? 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20'
            : 'bg-white/[0.04] text-gray-400 border-white/[0.06] hover:bg-white/[0.08]'
        }`}
      >
        <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
        {autoRefreshEnabled && autoRefreshInterval > 0 && (
          <>
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
            </span>
            <span>{currentOption.label}</span>
          </>
        )}
        {(!autoRefreshEnabled || autoRefreshInterval === 0) && <span>Auto</span>}
        <ChevronDown className={`w-3 h-3 transition-transform ${showDrop ? 'rotate-180' : ''}`} />
      </button>

      {showDrop && (
        <div className="absolute top-full right-0 mt-1 z-50 bg-gray-900 border border-white/[0.1] rounded-lg p-1.5 shadow-xl min-w-[140px]">
          {INTERVAL_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                if (opt.value === 0) {
                  if (autoRefreshEnabled) toggleAutoRefresh();
                  setAutoRefreshInterval(0);
                } else {
                  if (!autoRefreshEnabled) toggleAutoRefresh();
                  setAutoRefreshInterval(opt.value);
                }
                setShowDrop(false);
              }}
              className={`w-full text-left px-2.5 py-1.5 rounded text-[11px] transition ${
                autoRefreshEnabled && autoRefreshInterval === opt.value
                  ? 'bg-emerald-400/15 text-emerald-400'
                  : 'text-gray-400 hover:bg-white/[0.06] hover:text-white'
              }`}
            >
              {opt.label}
            </button>
          ))}
          {lastRefresh && (
            <div className="border-t border-white/[0.06] mt-1 pt-1 px-2.5 text-[10px] text-gray-600">
              Last: {new Date(lastRefresh).toLocaleTimeString()}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
