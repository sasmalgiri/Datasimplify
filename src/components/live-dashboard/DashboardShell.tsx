'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { RefreshCw, Key, LogOut, Clock, Shield, Timer } from 'lucide-react';
import { useLiveDashboardStore } from '@/lib/live-dashboard/store';
import type { LiveDashboardDefinition } from '@/lib/live-dashboard/definitions';
import { DashboardGrid } from './DashboardGrid';
import { ExportButton } from './ExportButton';
import { ShareButton } from './ShareButton';
import { CustomizeButton, CustomizeBar } from './CustomizePanel';
import { ApiUsagePill } from './ApiUsagePill';
import { CARD_CLASSES_STATIC } from '@/lib/live-dashboard/theme';

const AUTO_REFRESH_OPTIONS = [
  { value: 0, label: 'Off' },
  { value: 60, label: '1m' },
  { value: 120, label: '2m' },
  { value: 300, label: '5m' },
];

interface DashboardShellProps {
  definition: LiveDashboardDefinition;
  onOpenKeyModal: () => void;
}

export function DashboardShell({ definition, onOpenKeyModal }: DashboardShellProps) {
  const { apiKey, keyType, clearApiKey, fetchData, isLoading, lastFetched, error, autoRefreshInterval, setAutoRefreshInterval } = useLiveDashboardStore();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [customizeOpen, setCustomizeOpen] = useState(false);

  const handleRefresh = useCallback(() => {
    // Read customization fresh from store to avoid stale closure
    const c = useLiveDashboardStore.getState().customization;
    const params: Record<string, any> = {};

    // Pass global customization params
    if (c.vsCurrency && c.vsCurrency !== 'usd') params.vsCurrency = c.vsCurrency;
    if (c.perPage && c.perPage !== 100) params.perPage = c.perPage;
    if (c.sortOrder && c.sortOrder !== 'market_cap_desc') params.sortOrder = c.sortOrder;

    const needsOhlc = definition.widgets.some((w) => w.dataEndpoints.includes('ohlc'));
    if (needsOhlc) {
      const ohlcWidget = definition.widgets.find((w) => w.props?.coinId);
      params.coinId = c.coinId || ohlcWidget?.props?.coinId || 'bitcoin';
      params.days = c.days || ohlcWidget?.props?.days || 30;
    }
    const needsMultiOhlc = definition.widgets.some((w) => w.dataEndpoints.includes('ohlc_multi'));
    if (needsMultiOhlc) {
      const multiWidget = definition.widgets.find((w) => w.props?.coinIds);
      params.coinIds = c.coinIds.length > 0 ? c.coinIds : multiWidget?.props?.coinIds;
      params.days = c.days || multiWidget?.props?.days || 30;
    }
    const needsHistory = definition.widgets.some((w) => w.dataEndpoints.includes('coin_history'));
    if (needsHistory) {
      const histWidget = definition.widgets.find((w) => w.props?.coinId && w.dataEndpoints.includes('coin_history'));
      params.historyCoinId = c.coinId || histWidget?.props?.coinId || 'bitcoin';
      params.historyDays = c.days || histWidget?.props?.days || 90;
    }
    const needsDetail = definition.widgets.some((w) => w.dataEndpoints.includes('coin_detail'));
    if (needsDetail) {
      const detailWidget = definition.widgets.find((w) => w.props?.coinId);
      params.detailCoinId = c.coinId || detailWidget?.props?.coinId || 'bitcoin';
    }
    fetchData(definition.requiredEndpoints, params);
  }, [definition, fetchData]);

  // Auto-refresh interval
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (autoRefreshInterval > 0 && apiKey) {
      intervalRef.current = setInterval(handleRefresh, autoRefreshInterval * 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoRefreshInterval, apiKey, handleRefresh]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ignore when typing in inputs
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      switch (e.key.toLowerCase()) {
        case 'r':
          if (!e.metaKey && !e.ctrlKey && apiKey && !isLoading) handleRefresh();
          break;
        case 'c':
          if (!e.metaKey && !e.ctrlKey) setCustomizeOpen((v) => !v);
          break;
        case 'escape':
          setCustomizeOpen(false);
          break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [apiKey, isLoading, handleRefresh]);

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

          {/* API Usage */}
          {apiKey && <ApiUsagePill definition={definition} />}

          {/* Customize */}
          <CustomizeButton isOpen={customizeOpen} onToggle={() => setCustomizeOpen((v) => !v)} />

          {/* Export */}
          <ExportButton dashboardName={definition.name} />

          {/* Share */}
          <ShareButton slug={definition.slug} />

          {/* Auto-refresh selector */}
          <div className="flex items-center gap-1">
            <div className={`relative flex items-center gap-1 px-2 py-1.5 rounded-xl border text-[10px] font-medium transition ${
              autoRefreshInterval > 0
                ? 'bg-emerald-400/10 border-emerald-400/20 text-emerald-400'
                : 'bg-white/[0.04] border-white/[0.06] text-gray-500'
            }`}>
              <Timer className="w-3 h-3" />
              {autoRefreshInterval > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              )}
              <select
                value={autoRefreshInterval}
                onChange={(e) => setAutoRefreshInterval(Number(e.target.value))}
                className="bg-transparent outline-none cursor-pointer text-[10px] appearance-none pr-1"
                title="Auto-refresh interval"
              >
                {AUTO_REFRESH_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-gray-900 text-white">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Refresh button */}
          <button
            onClick={handleRefresh}
            disabled={isLoading || !apiKey}
            className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-gray-400 hover:text-white transition disabled:opacity-30 disabled:cursor-not-allowed border border-white/[0.06]"
            title="Refresh data (R)"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Inline customize bar */}
      {customizeOpen && (
        <CustomizeBar definition={definition} onApply={handleRefresh} onClose={() => setCustomizeOpen(false)} />
      )}

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

      {/* Footer with disclaimer + keyboard hints */}
      <div className="flex flex-col sm:flex-row items-center justify-between text-[10px] text-gray-600 pt-4 border-t border-white/[0.06] gap-2">
        <div className="flex items-center gap-1.5">
          <Shield className="w-3 h-3 text-emerald-600" />
          <span>Data sourced from CoinGecko via your personal API key. All exports are strictly for your personal, non-commercial use.</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-gray-700 hidden sm:inline">
            <kbd className="px-1 py-0.5 bg-white/[0.04] rounded text-[9px] border border-white/[0.08]">R</kbd> Refresh
            <span className="mx-1.5">&middot;</span>
            <kbd className="px-1 py-0.5 bg-white/[0.04] rounded text-[9px] border border-white/[0.08]">C</kbd> Customize
            <span className="mx-1.5">&middot;</span>
            <kbd className="px-1 py-0.5 bg-white/[0.04] rounded text-[9px] border border-white/[0.08]">Esc</kbd> Close
          </span>
          <span className="text-gray-700">
            {lastFetched && new Date(lastFetched).toLocaleString()} &bull; cryptoreportkit.com
          </span>
        </div>
      </div>
    </div>
  );
}
