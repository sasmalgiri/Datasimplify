'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { RefreshCw, Key, LogOut, Clock, Shield, Timer, Sparkles, Bell, Folder, FlaskConical } from 'lucide-react';
import { useLiveDashboardStore } from '@/lib/live-dashboard/store';
import type { LiveDashboardDefinition } from '@/lib/live-dashboard/definitions';
import { DashboardGrid } from './DashboardGrid';
import { ExportButton } from './ExportButton';
import { ShareButton } from './ShareButton';
import { CustomizeButton, CustomizeBar } from './CustomizePanel';
import { ApiUsagePill } from './ApiUsagePill';
import AIChatPanel from './AIChatPanel';
import DashboardAlertPanel, { useAlertCount } from './DashboardAlertPanel';
import { ExperimentPanel } from './ExperimentPanel';
import { WorkspaceContextBar } from './WorkspaceContextBar';
import { CreditBalancePill } from './CreditBalance';
import { useInitCredits } from '@/lib/live-dashboard/credits';
import { getSiteThemeClasses } from '@/lib/live-dashboard/theme';
import { FEATURES } from '@/lib/featureFlags';
import { useWorkspaceStore, useActiveWorkspace } from '@/lib/workspaces/workspaceStore';
import { WorkspacePanel } from '@/components/workspaces/WorkspacePanel';
import { WorkspaceCreateModal } from '@/components/workspaces/WorkspaceCreateModal';
import { useExperimentStore } from '@/lib/live-dashboard/experimentStore';
import type { PositionSnapshot } from '@/lib/workspaces/types';

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
  const { apiKey, keyType, clearApiKey, fetchData, isLoading, lastFetched, error, autoRefreshInterval, setAutoRefreshInterval, siteTheme, isUsingServerKey } = useLiveDashboardStore(
    useShallow((s) => ({
      apiKey: s.apiKey,
      keyType: s.keyType,
      clearApiKey: s.clearApiKey,
      fetchData: s.fetchData,
      isLoading: s.isLoading,
      lastFetched: s.lastFetched,
      error: s.error,
      autoRefreshInterval: s.autoRefreshInterval,
      setAutoRefreshInterval: s.setAutoRefreshInterval,
      siteTheme: s.siteTheme,
      isUsingServerKey: s.isUsingServerKey,
    })),
  );
  const st = getSiteThemeClasses(siteTheme);
  useInitCredits();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [alertPanelOpen, setAlertPanelOpen] = useState(false);
  const [workspacePanelOpen, setWorkspacePanelOpen] = useState(false);
  const [workspaceCreateOpen, setWorkspaceCreateOpen] = useState(false);
  const alertCount = useAlertCount();
  const experimentOpen = useExperimentStore((s) => s.isOpen);
  const toggleExperiment = useExperimentStore((s) => s.toggle);
  const closeExperiment = useExperimentStore((s) => s.close);

  // Workspace integration
  const activeWorkspace = useActiveWorkspace();
  const createSnapshot = useWorkspaceStore((s) => s.createSnapshot);
  const setCustomization = useLiveDashboardStore((s) => s.setCustomization);
  const [workspaceBarDismissed, setWorkspaceBarDismissed] = useState(false);

  // Reset workspace bar visibility when workspace changes
  useEffect(() => {
    setWorkspaceBarDismissed(false);
  }, [activeWorkspace?.id]);

  // Auto-create snapshot after data refresh when workspace is active
  const handleAutoSnapshot = useCallback(() => {
    if (!FEATURES.addinV2 || !activeWorkspace) return;
    const data = useLiveDashboardStore.getState().data;
    if (!data.markets) return;

    const workspaceCoins = activeWorkspace.config?.coins ?? [];
    const relevantMarkets = workspaceCoins.length > 0
      ? data.markets.filter((m) => workspaceCoins.includes(m.symbol.toUpperCase()) || workspaceCoins.includes(m.id))
      : data.markets;

    if (relevantMarkets.length === 0) return;

    const totalValue = relevantMarkets.reduce((sum, m) => sum + (m.market_cap || 0), 0);
    const totalWeight = relevantMarkets.reduce((sum, m) => sum + (m.market_cap || 0), 0);
    const weightedReturn7d = totalWeight > 0
      ? relevantMarkets.reduce(
          (sum, m) => sum + (m.price_change_percentage_7d_in_currency ?? 0) * (m.market_cap || 0),
          0,
        ) / totalWeight
      : null;

    // Find top mover
    let topMover = relevantMarkets[0];
    for (const m of relevantMarkets) {
      if (Math.abs(m.price_change_percentage_24h || 0) > Math.abs(topMover?.price_change_percentage_24h || 0)) {
        topMover = m;
      }
    }

    const positionsJson: PositionSnapshot[] = relevantMarkets.map((m) => ({
      symbol: m.symbol.toUpperCase(),
      coinId: m.id,
      price: m.current_price,
      change24h: m.price_change_percentage_24h || 0,
      marketCap: m.market_cap || 0,
    }));

    createSnapshot({
      workspace_id: activeWorkspace.id,
      kpi_value: totalValue,
      kpi_return_7d: weightedReturn7d != null ? Number(weightedReturn7d.toFixed(2)) : undefined,
      asset_count: relevantMarkets.length,
      top_mover_symbol: topMover?.symbol?.toUpperCase(),
      top_mover_change: topMover?.price_change_percentage_24h != null
        ? Number(topMover.price_change_percentage_24h.toFixed(2))
        : undefined,
      positions_json: positionsJson,
    });
  }, [activeWorkspace, createSnapshot]);

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
    fetchData(definition.requiredEndpoints, params).then(() => {
      handleAutoSnapshot();
    });
  }, [definition, fetchData, handleAutoSnapshot]);

  // Sync workspace coins into dashboard customization (coinId + coinIds)
  const handleSyncWorkspaceCoins = useCallback(() => {
    if (!activeWorkspace) return;
    const wsCoins = activeWorkspace.config?.coins ?? [];
    if (wsCoins.length === 0) return;
    const data = useLiveDashboardStore.getState().data;
    if (!data.markets) return;

    // Resolve workspace coin identifiers to CoinGecko IDs
    const coinSet = new Set(wsCoins.map((c) => c.toLowerCase()));
    const matched = data.markets.filter(
      (m) => coinSet.has(m.id.toLowerCase()) || coinSet.has(m.symbol.toLowerCase()),
    );
    if (matched.length === 0) return;

    const ids = matched.map((m) => m.id);
    setCustomization({
      coinId: ids[0],
      coinIds: ids.slice(0, 5), // multi-coin charts support up to 5
      vsCurrency: activeWorkspace.config?.vsCurrency ?? 'usd',
    });

    // Trigger a refresh with the new customization
    setTimeout(() => handleRefresh(), 100);
  }, [activeWorkspace, setCustomization, handleRefresh]);

  // Auto-refresh interval
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (autoRefreshInterval > 0) {
      intervalRef.current = setInterval(handleRefresh, autoRefreshInterval * 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoRefreshInterval, handleRefresh]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ignore when typing in inputs
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      switch (e.key.toLowerCase()) {
        case 'r':
          if (!e.metaKey && !e.ctrlKey && !isLoading) handleRefresh();
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
        case 'w':
          if (!e.metaKey && !e.ctrlKey && FEATURES.addinV2) setWorkspacePanelOpen((v) => !v);
          break;
        case 'e':
          if (!e.metaKey && !e.ctrlKey) toggleExperiment();
          break;
        case 'escape':
          setCustomizeOpen(false);
          setAiPanelOpen(false);
          setAlertPanelOpen(false);
          setWorkspacePanelOpen(false);
          closeExperiment();
          break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isLoading, handleRefresh, toggleExperiment, closeExperiment]);

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
            {!customizeOpen && activeWorkspace && (
              <p className={`text-xs text-emerald-400/80 mt-0.5`}>
                {activeWorkspace.name} &middot; {activeWorkspace.config?.coins?.length ?? 0} coins
              </p>
            )}
            {!customizeOpen && !activeWorkspace && (
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
                className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-blue-400/10 border border-blue-400/20 text-blue-300 text-[10px] font-medium hover:bg-blue-400/20 transition"
                title="Add your own CoinGecko key for faster refreshes"
              >
                <Key className="w-3 h-3" />
                Shared Key
              </button>
            )
          )}

          {/* API Usage — hidden when customize open */}
          {!customizeOpen && <ApiUsagePill definition={definition} />}

          {/* Credits pill — hidden when customize open */}
          {!customizeOpen && <CreditBalancePill />}

          {/* Workspace */}
          {!customizeOpen && FEATURES.addinV2 && (
            <button
              onClick={() => setWorkspacePanelOpen((v) => !v)}
              className={`p-2 rounded-xl ${workspacePanelOpen ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : `${st.buttonSecondary}`} transition`}
              title="Workspaces (W)"
            >
              <Folder className="w-4 h-4" />
            </button>
          )}

          {/* Experiment Lab */}
          {!customizeOpen && (
            <button
              onClick={toggleExperiment}
              className={`p-2 rounded-xl ${experimentOpen ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : `${st.buttonSecondary}`} transition`}
              title="Experiment Lab (E)"
            >
              <FlaskConical className="w-4 h-4" />
            </button>
          )}

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
            disabled={isLoading}
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

      {/* Experiment Lab panel */}
      {experimentOpen && (
        <ExperimentPanel isOpen={experimentOpen} onClose={closeExperiment} />
      )}

      {/* Workspace context bar */}
      {FEATURES.addinV2 && activeWorkspace && !workspaceBarDismissed && (
        <WorkspaceContextBar
          onSyncCoins={handleSyncWorkspaceCoins}
          onDismiss={() => setWorkspaceBarDismissed(true)}
        />
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
            {apiKey
              ? '. All data via your personal API keys.'
              : '. Shared API key — add your own for higher limits.'}
            {' '}Exports for personal, non-commercial use.
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className={`${st.textFaint} hidden sm:inline`}>
            <kbd className={`px-1 py-0.5 ${st.kbdBg} rounded text-[9px] border`}>R</kbd> Refresh
            <span className="mx-1.5">&middot;</span>
            <kbd className={`px-1 py-0.5 ${st.kbdBg} rounded text-[9px] border`}>C</kbd> Customize
            <span className="mx-1.5">&middot;</span>
            <kbd className={`px-1 py-0.5 ${st.kbdBg} rounded text-[9px] border`}>E</kbd> Lab
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

      {/* Workspace Panel */}
      {FEATURES.addinV2 && (
        <>
          <WorkspacePanel
            isOpen={workspacePanelOpen}
            onClose={() => setWorkspacePanelOpen(false)}
            onCreateNew={() => {
              setWorkspacePanelOpen(false);
              setWorkspaceCreateOpen(true);
            }}
          />
          <WorkspaceCreateModal
            isOpen={workspaceCreateOpen}
            onClose={() => setWorkspaceCreateOpen(false)}
          />
        </>
      )}
    </div>
  );
}
