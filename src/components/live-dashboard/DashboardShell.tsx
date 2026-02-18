'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { RefreshCw, Key, LogOut, Clock, Shield, Timer, Sparkles, Bell } from 'lucide-react';
import { useLiveDashboardStore } from '@/lib/live-dashboard/store';
import type { LiveDashboardDefinition } from '@/lib/live-dashboard/definitions';
import { DashboardGrid } from './DashboardGrid';
import { ExportButton } from './ExportButton';
import { ShareButton } from './ShareButton';
import { CustomizeButton, CustomizeBar } from './CustomizePanel';
import { ApiUsagePill } from './ApiUsagePill';
import AIChatPanel from './AIChatPanel';
import DashboardAlertPanel, { useAlertCount } from './DashboardAlertPanel';
import { CreditBalancePill } from './CreditBalance';
import { useInitCredits } from '@/lib/live-dashboard/credits';
import { getSiteThemeClasses } from '@/lib/live-dashboard/theme';

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
  const { apiKey, keyType, clearApiKey, fetchData, isLoading, lastFetched, error, autoRefreshInterval, setAutoRefreshInterval, siteTheme } = useLiveDashboardStore();
  const st = getSiteThemeClasses(siteTheme);
  useInitCredits();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [alertPanelOpen, setAlertPanelOpen] = useState(false);
  const alertCount = useAlertCount();

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
    const needsProtocol = definition.requiredEndpoints.includes('defillama_protocol_tvl');
    if (needsProtocol) {
      const protocolWidget = definition.widgets.find((w) => w.props?.protocolSlug);
      params.protocolSlug = protocolWidget?.props?.protocolSlug || definition.slug.replace('protocol-', '');
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
        case 'a':
          if (!e.metaKey && !e.ctrlKey) setAiPanelOpen((v) => !v);
          break;
        case 'l':
          if (!e.metaKey && !e.ctrlKey) setAlertPanelOpen((v) => !v);
          break;
        case 'escape':
          setCustomizeOpen(false);
          setAiPanelOpen(false);
          setAlertPanelOpen(false);
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
      {/* Header toolbar — collapses when customize is open */}
      <div className={`${st.cardClasses} p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all duration-200`}>
        <div className="flex items-center gap-3">
          <span className={customizeOpen ? 'text-2xl' : 'text-3xl'}>{definition.icon}</span>
          <div>
            <h1 className={`font-bold ${st.textPrimary} ${customizeOpen ? 'text-lg' : 'text-2xl'}`}>
              {definition.name}
            </h1>
            {!customizeOpen && (
              <p className={`${st.textDim} text-sm mt-1`}>{definition.description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Last updated — hidden when customize open */}
          {!customizeOpen && timeAgo && (
            <span className={`text-[10px] ${st.textFaint} flex items-center gap-1`}>
              <Clock className="w-3 h-3" />
              {timeAgo}
            </span>
          )}

          {/* API Key status pill — hidden when customize open */}
          {!customizeOpen && (
            apiKey ? (
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
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${st.buttonPrimary} text-xs font-medium transition`}
              >
                <Key className="w-3 h-3" />
                Connect API Key
              </button>
            )
          )}

          {/* API Usage — hidden when customize open */}
          {!customizeOpen && apiKey && <ApiUsagePill definition={definition} />}

          {/* Credits pill — hidden when customize open */}
          {!customizeOpen && <CreditBalancePill />}

          {/* AI Chat */}
          {!customizeOpen && (
            <button
              onClick={() => setAiPanelOpen((v) => !v)}
              className={`p-2 rounded-xl ${aiPanelOpen ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : `${st.buttonSecondary}`} transition`}
              title="AI Chat (A)"
            >
              <Sparkles className="w-4 h-4" />
            </button>
          )}

          {/* Alerts */}
          {!customizeOpen && (
            <button
              onClick={() => setAlertPanelOpen((v) => !v)}
              className={`relative p-2 rounded-xl ${alertPanelOpen ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : `${st.buttonSecondary}`} transition`}
              title="Alerts (L)"
            >
              <Bell className="w-4 h-4" />
              {alertCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-[9px] font-bold text-black flex items-center justify-center">
                  {alertCount}
                </span>
              )}
            </button>
          )}

          {/* Customize */}
          <CustomizeButton isOpen={customizeOpen} onToggle={() => setCustomizeOpen((v) => !v)} />

          {/* Export — hidden when customize open */}
          {!customizeOpen && <ExportButton dashboardName={definition.name} />}

          {/* Share — hidden when customize open */}
          {!customizeOpen && <ShareButton slug={definition.slug} />}

          {/* Auto-refresh selector — hidden when customize open */}
          {!customizeOpen && (
            <div className="flex items-center gap-1">
              <div className={`relative flex items-center gap-1 px-2 py-1.5 rounded-xl border text-[10px] font-medium transition ${
                autoRefreshInterval > 0
                  ? 'bg-emerald-400/10 border-emerald-400/20 text-emerald-400'
                  : `${st.subtleBg} ${st.subtleBorder} ${st.textDim}`
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
                    <option key={opt.value} value={opt.value} className={st.selectOptionBg}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Refresh button */}
          <button
            onClick={handleRefresh}
            disabled={isLoading || !apiKey}
            className={`p-2 rounded-xl ${st.buttonSecondary} transition disabled:opacity-30 disabled:cursor-not-allowed`}
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
        <div className={`${st.errorBg} rounded-xl px-4 py-3 text-sm`}>
          {error}
        </div>
      )}

      {/* Dashboard grid */}
      <div id="dashboard-content">
        <DashboardGrid definition={definition} />
      </div>

      {/* Footer with attribution + disclaimer + keyboard hints */}
      <div className={`flex flex-col sm:flex-row items-center justify-between text-[10px] ${st.textFaint} pt-4 ${st.footerBorder} gap-2`}>
        <div className="flex items-center gap-1.5">
          <Shield className="w-3 h-3 text-emerald-600" />
          <span>
            Data provided by{' '}
            <a href="https://www.coingecko.com/en/api" target="_blank" rel="noopener noreferrer" className="hover:underline">CoinGecko</a>
            {' · '}
            <a href="https://defillama.com" target="_blank" rel="noopener noreferrer" className="hover:underline">DeFi Llama</a>
            {' · Powered by '}
            <a href="https://etherscan.io" target="_blank" rel="noopener noreferrer" className="hover:underline">Etherscan.io APIs</a>
            . All data via your personal API keys. Exports for personal, non-commercial use.
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className={`${st.textFaint} hidden sm:inline`}>
            <kbd className={`px-1 py-0.5 ${st.kbdBg} rounded text-[9px] border`}>R</kbd> Refresh
            <span className="mx-1.5">&middot;</span>
            <kbd className={`px-1 py-0.5 ${st.kbdBg} rounded text-[9px] border`}>C</kbd> Customize
            <span className="mx-1.5">&middot;</span>
            <kbd className={`px-1 py-0.5 ${st.kbdBg} rounded text-[9px] border`}>A</kbd> AI Chat
            <span className="mx-1.5">&middot;</span>
            <kbd className={`px-1 py-0.5 ${st.kbdBg} rounded text-[9px] border`}>L</kbd> Alerts
            <span className="mx-1.5">&middot;</span>
            <kbd className={`px-1 py-0.5 ${st.kbdBg} rounded text-[9px] border`}>Esc</kbd> Close
          </span>
          <span className={st.textFaint}>
            {lastFetched && new Date(lastFetched).toLocaleString()} &bull; cryptoreportkit.com
          </span>
        </div>
      </div>

      {/* AI Chat Panel */}
      <AIChatPanel isOpen={aiPanelOpen} onClose={() => setAiPanelOpen(false)} dashboardName={definition.name} />

      {/* Alert Panel */}
      <DashboardAlertPanel isOpen={alertPanelOpen} onClose={() => setAlertPanelOpen(false)} />
    </div>
  );
}
