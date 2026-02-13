'use client';

import { useCallback } from 'react';
import { RefreshCw, Key, LogOut, Clock } from 'lucide-react';
import { useLiveDashboardStore } from '@/lib/live-dashboard/store';
import type { LiveDashboardDefinition } from '@/lib/live-dashboard/definitions';
import { DashboardGrid } from './DashboardGrid';

interface DashboardShellProps {
  definition: LiveDashboardDefinition;
  onOpenKeyModal: () => void;
}

export function DashboardShell({ definition, onOpenKeyModal }: DashboardShellProps) {
  const { apiKey, keyType, clearApiKey, fetchData, isLoading, lastFetched, error } = useLiveDashboardStore();

  const handleRefresh = useCallback(() => {
    const params: Record<string, any> = {};
    // Check if any widget needs OHLC data
    const needsOhlc = definition.widgets.some((w) => w.dataEndpoints.includes('ohlc'));
    if (needsOhlc) {
      const ohlcWidget = definition.widgets.find((w) => w.props?.coinId);
      if (ohlcWidget) {
        params.coinId = ohlcWidget.props?.coinId || 'bitcoin';
        params.days = ohlcWidget.props?.days || 30;
      }
    }
    fetchData(definition.requiredEndpoints, params);
  }, [definition, fetchData]);

  const timeAgo = lastFetched
    ? `${Math.round((Date.now() - lastFetched) / 1000)}s ago`
    : null;

  return (
    <div className="space-y-6">
      {/* Header toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <span className="text-3xl">{definition.icon}</span>
            {definition.name}
          </h1>
          <p className="text-gray-400 text-sm mt-1">{definition.description}</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Last updated */}
          {timeAgo && (
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Updated {timeAgo}
            </span>
          )}

          {/* API Key status pill */}
          {apiKey ? (
            <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
              <Key className="w-3 h-3" />
              {keyType === 'pro' ? 'Pro' : 'Demo'} Key
              <button onClick={clearApiKey} className="ml-1 hover:text-red-400 transition" title="Disconnect key">
                <LogOut className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenKeyModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-xs font-medium hover:bg-emerald-600 transition"
            >
              <Key className="w-3 h-3" />
              Connect API Key
            </button>
          )}

          {/* Refresh button */}
          <button
            onClick={handleRefresh}
            disabled={isLoading || !apiKey}
            className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
            title="Refresh data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Dashboard grid */}
      <DashboardGrid definition={definition} />

      {/* Footer attribution */}
      <div className="flex items-center justify-between text-xs text-gray-600 pt-4 border-t border-gray-800">
        <span>Data provided by CoinGecko &bull; cryptoreportkit.com</span>
        <span>
          {lastFetched && new Date(lastFetched).toLocaleString()}
        </span>
      </div>
    </div>
  );
}
