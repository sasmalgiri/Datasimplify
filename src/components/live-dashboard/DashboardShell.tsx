'use client';

import { useCallback } from 'react';
import { RefreshCw, Key, LogOut, Clock, Shield } from 'lucide-react';
import { useLiveDashboardStore } from '@/lib/live-dashboard/store';
import type { LiveDashboardDefinition } from '@/lib/live-dashboard/definitions';
import { DashboardGrid } from './DashboardGrid';
import { ExportButton } from './ExportButton';
import { ShareButton } from './ShareButton';
import { CustomizePanel } from './CustomizePanel';
import { CARD_CLASSES_STATIC } from '@/lib/live-dashboard/theme';

interface DashboardShellProps {
  definition: LiveDashboardDefinition;
  onOpenKeyModal: () => void;
}

export function DashboardShell({ definition, onOpenKeyModal }: DashboardShellProps) {
  const { apiKey, keyType, clearApiKey, fetchData, isLoading, lastFetched, error, customization } = useLiveDashboardStore();

  const handleRefresh = useCallback(() => {
    const params: Record<string, any> = {};
    const c = customization;

    const needsOhlc = definition.widgets.some((w) => w.dataEndpoints.includes('ohlc'));
    if (needsOhlc) {
      const ohlcWidget = definition.widgets.find((w) => w.props?.coinId);
      params.coinId = c.coinId || ohlcWidget?.props?.coinId || 'bitcoin';
      params.days = c.days || ohlcWidget?.props?.days || 30;
    }
    // Check for multi-coin OHLC
    const needsMultiOhlc = definition.widgets.some((w) => w.dataEndpoints.includes('ohlc_multi'));
    if (needsMultiOhlc) {
      const multiWidget = definition.widgets.find((w) => w.props?.coinIds);
      params.coinIds = c.coinIds.length > 0 ? c.coinIds : multiWidget?.props?.coinIds;
      params.days = c.days || multiWidget?.props?.days || 30;
    }
    // Check for coin history
    const needsHistory = definition.widgets.some((w) => w.dataEndpoints.includes('coin_history'));
    if (needsHistory) {
      const histWidget = definition.widgets.find((w) => w.props?.coinId && w.dataEndpoints.includes('coin_history'));
      params.historyCoinId = c.coinId || histWidget?.props?.coinId || 'bitcoin';
      params.historyDays = c.days || histWidget?.props?.days || 90;
    }
    fetchData(definition.requiredEndpoints, params);
  }, [definition, fetchData, customization]);

  const timeAgo = lastFetched
    ? `${Math.round((Date.now() - lastFetched) / 1000)}s ago`
    : null;

  return (
    <div className="space-y-6">
      {/* Header toolbar */}
      <div className={`${CARD_CLASSES_STATIC} p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4`}>
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <span className="text-3xl">{definition.icon}</span>
            {definition.name}
          </h1>
          <p className="text-gray-500 text-sm mt-1">{definition.description}</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Last updated */}
          {timeAgo && (
            <span className="text-[10px] text-gray-600 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {timeAgo}
            </span>
          )}

          {/* API Key status pill */}
          {apiKey ? (
            <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-400/10 border border-emerald-400/20 text-emerald-400 text-[10px] font-medium">
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

          {/* Customize */}
          <CustomizePanel onApply={handleRefresh} />

          {/* Export */}
          <ExportButton dashboardName={definition.name} />

          {/* Share */}
          <ShareButton slug={definition.slug} />

          {/* Refresh button */}
          <button
            onClick={handleRefresh}
            disabled={isLoading || !apiKey}
            className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-gray-400 hover:text-white transition disabled:opacity-30 disabled:cursor-not-allowed border border-white/[0.06]"
            title="Refresh data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Dashboard grid */}
      <div id="dashboard-content">
        <DashboardGrid definition={definition} />
      </div>

      {/* Footer with disclaimer */}
      <div className="flex flex-col sm:flex-row items-center justify-between text-[10px] text-gray-600 pt-4 border-t border-white/[0.06] gap-2">
        <div className="flex items-center gap-1.5">
          <Shield className="w-3 h-3 text-emerald-600" />
          <span>Data sourced from CoinGecko via your personal API key. All exports are strictly for your personal, non-commercial use.</span>
        </div>
        <span className="text-gray-700">
          {lastFetched && new Date(lastFetched).toLocaleString()} &bull; cryptoreportkit.com
        </span>
      </div>
    </div>
  );
}
