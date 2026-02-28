'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { AuthGate } from '@/components/AuthGate';
import { FEATURES } from '@/lib/featureFlags';
import { useLiveDashboardStore } from '@/lib/live-dashboard/store';
import { SITE_THEMES } from '@/lib/live-dashboard/theme';
import { useWorkspaceStore, useActiveWorkspace } from '@/lib/workspaces/workspaceStore';
import { useUserPrefsStore } from '@/lib/live-dashboard/user-prefs-store';
import { FreeNavbar } from '@/components/FreeNavbar';
import { Breadcrumb } from '@/components/Breadcrumb';
import { WorkspaceStrip } from '@/components/command-center/WorkspaceStrip';
import { MarketPulseBar } from '@/components/command-center/MarketPulseBar';
import { PortfolioOverview } from '@/components/command-center/PortfolioOverview';
import { InsightsPanel } from '@/components/command-center/InsightsPanel';
import { QuickActionsBar } from '@/components/command-center/QuickActionsBar';
import { ActivityFeed } from '@/components/command-center/ActivityFeed';
import { DeltaView } from '@/components/workspaces/DeltaView';
import { SnapshotHistory } from '@/components/workspaces/SnapshotHistory';
import { WorkspaceCreateModal } from '@/components/workspaces/WorkspaceCreateModal';
import { QuickStartWizard } from '@/components/workspaces/QuickStartWizard';
import {
  Loader2, History, LayoutDashboard, Pencil, Star,
  ChevronUp, ChevronDown, ChevronRight,
} from 'lucide-react';
import { IS_BETA_MODE } from '@/lib/betaMode';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import type { HoldingEntry, PositionSnapshot } from '@/lib/workspaces/types';

const PIE_COLORS = [
  '#34d399', '#60a5fa', '#f59e0b', '#ef4444', '#a78bfa',
  '#f472b6', '#2dd4bf', '#fb923c', '#818cf8', '#4ade80',
];

// Sparkline SVG builder
function buildSparklinePath(prices: number[], width: number, height: number): string {
  if (prices.length < 2) return '';
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;
  const step = width / (prices.length - 1);
  return prices
    .map((p, i) => {
      const x = i * step;
      const y = height - ((p - min) / range) * height;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

type SortKey = 'rank' | 'name' | 'price' | '24h' | '7d' | 'market_cap' | 'value' | 'pnl';

export default function CommandCenterPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const redirectedRef = useRef(false);

  const siteTheme = useLiveDashboardStore((s) => s.siteTheme);
  const st = SITE_THEMES[siteTheme];
  const { fetchData, isLoading: dataLoading, data } = useLiveDashboardStore();

  const {
    workspaces,
    isLoadingWorkspaces,
    fetchWorkspaces,
    fetchSnapshots,
    updateWorkspace,
    createSnapshot,
  } = useWorkspaceStore();
  const activeWorkspace = useActiveWorkspace();

  const { watchlist, toggleWatchlist, isInWatchlist } = useUserPrefsStore();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editWorkspaceId, setEditWorkspaceId] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  // Sort state
  const [sortKey, setSortKey] = useState<SortKey>('rank');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  // Expanded row state
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // --- Holdings inline editing ---
  const [editingHoldings, setEditingHoldings] = useState<Record<string, HoldingEntry>>({});
  const holdingSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync local holdings when workspace changes
  useEffect(() => {
    setEditingHoldings(activeWorkspace?.config?.holdings ?? {});
  }, [activeWorkspace?.id, activeWorkspace?.config?.holdings]);

  const saveHolding = useCallback(
    (symbol: string, field: 'quantity' | 'avgBuyPrice', value: number) => {
      setEditingHoldings((prev) => {
        const updated = {
          ...prev,
          [symbol]: {
            ...(prev[symbol] || { quantity: 0, avgBuyPrice: 0 }),
            [field]: value,
          },
        };
        if (holdingSaveTimer.current) clearTimeout(holdingSaveTimer.current);
        holdingSaveTimer.current = setTimeout(() => {
          if (activeWorkspace) {
            updateWorkspace(activeWorkspace.id, {
              config: { ...activeWorkspace.config, holdings: updated },
            });
          }
        }, 800);
        return updated;
      });
    },
    [activeWorkspace, updateWorkspace],
  );

  // Fetch workspaces on mount
  useEffect(() => {
    if (user && FEATURES.addinV2) {
      fetchWorkspaces();
    }
  }, [user, fetchWorkspaces]);

  // Fetch snapshots when active workspace changes
  useEffect(() => {
    if (activeWorkspace) {
      fetchSnapshots(activeWorkspace.id);
    }
  }, [activeWorkspace, fetchSnapshots]);

  // Auto-refresh data when active workspace changes
  const prevWorkspaceRef = useRef<string | null>(null);
  useEffect(() => {
    if (activeWorkspace && activeWorkspace.id !== prevWorkspaceRef.current) {
      prevWorkspaceRef.current = activeWorkspace.id;
      const coins = activeWorkspace.config?.coins ?? [];
      const vsCurrency = activeWorkspace.config?.vsCurrency ?? 'usd';
      fetchData(['markets', 'global', 'trending', 'fear_greed'], {
        vsCurrency,
        perPage: Math.max(coins.length, 100),
      });
    }
  }, [activeWorkspace, fetchData]);

  // Refresh data for active workspace
  const handleRefresh = useCallback(() => {
    if (!activeWorkspace) return;
    const coins = activeWorkspace.config?.coins ?? [];
    const vsCurrency = activeWorkspace.config?.vsCurrency ?? 'usd';
    fetchData(['markets', 'global', 'trending', 'fear_greed'], {
      vsCurrency,
      perPage: Math.max(coins.length, 100),
    });
  }, [activeWorkspace, fetchData]);

  // After workspace creation, auto-refresh
  const handleWorkspaceCreated = useCallback(
    (workspaceId: string) => {
      setCreateModalOpen(false);
      setTimeout(() => handleRefresh(), 300);
    },
    [handleRefresh],
  );

  // --- Filtered data for export ---
  const getFilteredData = useCallback(() => {
    if (!activeWorkspace || !data.markets) return data;
    const wsCoins = activeWorkspace.config?.coins ?? [];
    const coinSet = new Set(wsCoins.map((c) => c.toLowerCase()));
    const filtered = data.markets.filter(
      (m: any) => coinSet.has(m.id.toLowerCase()) || coinSet.has(m.symbol.toLowerCase()),
    );
    return { ...data, markets: filtered };
  }, [activeWorkspace, data]);

  // --- Shared filtered markets ---
  const filteredMarkets = useMemo(() => {
    if (!activeWorkspace || !data.markets) return [];
    const wsCoins = activeWorkspace.config?.coins ?? [];
    const coinSet = new Set(wsCoins.map((c) => c.toLowerCase()));
    return data.markets.filter(
      (m: any) => coinSet.has(m.id.toLowerCase()) || coinSet.has(m.symbol.toLowerCase()),
    );
  }, [activeWorkspace, data.markets]);

  // --- P&L computation (holdings mode) ---
  const holdingsPnL = useMemo(() => {
    if (!activeWorkspace || activeWorkspace.mode !== 'holdings' || filteredMarkets.length === 0) return null;

    let totalValue = 0;
    let totalCost = 0;
    const rows: {
      symbol: string;
      name: string;
      id: string;
      price: number;
      ch24: number;
      ch7d: number;
      marketCap: number;
      quantity: number;
      avgBuy: number;
      value: number;
      costBasis: number;
      pnl: number;
      pnlPct: number;
      marketCapRank: number;
      sparkline: number[] | null;
      image: string | null;
      ath: number | null;
      athDate: string | null;
      volume24h: number;
      circulatingSupply: number;
      totalSupply: number | null;
    }[] = [];
    const pieData: { name: string; value: number }[] = [];

    filteredMarkets.forEach((m: any) => {
      const key = m.symbol.toUpperCase();
      const holding = editingHoldings[key];
      const qty = holding?.quantity ?? 0;
      const avgBuy = holding?.avgBuyPrice ?? 0;
      const marketValue = m.current_price * qty;
      const costBasis = avgBuy * qty;
      const pnl = marketValue - costBasis;
      const pnlPct = costBasis > 0 ? ((pnl / costBasis) * 100) : 0;

      totalValue += marketValue;
      totalCost += costBasis;

      rows.push({
        symbol: key,
        name: m.name,
        id: m.id,
        price: m.current_price,
        ch24: m.price_change_percentage_24h ?? 0,
        ch7d: m.price_change_percentage_7d_in_currency ?? 0,
        marketCap: m.market_cap,
        quantity: qty,
        avgBuy,
        value: marketValue,
        costBasis,
        pnl,
        pnlPct,
        marketCapRank: m.market_cap_rank ?? 999,
        sparkline: m.sparkline_in_7d?.price ?? null,
        image: m.image ?? null,
        ath: m.ath ?? null,
        athDate: m.ath_date ?? null,
        volume24h: m.total_volume ?? 0,
        circulatingSupply: m.circulating_supply ?? 0,
        totalSupply: m.total_supply ?? null,
      });

      if (marketValue > 0) {
        pieData.push({ name: key, value: marketValue });
      }
    });

    const totalPnL = totalValue - totalCost;
    const totalPnLPct = totalCost > 0 ? ((totalPnL / totalCost) * 100) : 0;

    return { rows, pieData, totalValue, totalCost, totalPnL, totalPnLPct };
  }, [activeWorkspace, filteredMarkets, editingHoldings]);

  // --- Snapshot creation handler ---
  const handleSnapshot = useCallback(() => {
    if (!activeWorkspace || filteredMarkets.length === 0) return;

    const totalValue = filteredMarkets.reduce((sum: number, m: any) => sum + (m.market_cap || 0), 0);
    const totalWeight = totalValue;
    const weightedReturn7d = totalWeight > 0
      ? filteredMarkets.reduce(
          (sum: number, m: any) => sum + (m.price_change_percentage_7d_in_currency ?? 0) * (m.market_cap || 0),
          0,
        ) / totalWeight
      : null;

    let topMover = filteredMarkets[0] as any;
    for (const m of filteredMarkets) {
      if (Math.abs((m as any).price_change_percentage_24h || 0) > Math.abs(topMover?.price_change_percentage_24h || 0)) {
        topMover = m;
      }
    }

    const positionsJson: PositionSnapshot[] = filteredMarkets.map((m: any) => ({
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
      asset_count: filteredMarkets.length,
      top_mover_symbol: topMover?.symbol?.toUpperCase(),
      top_mover_change: topMover?.price_change_percentage_24h != null
        ? Number(topMover.price_change_percentage_24h.toFixed(2))
        : undefined,
      positions_json: positionsJson,
    });
  }, [activeWorkspace, filteredMarkets, createSnapshot]);

  // --- Sorting logic ---
  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'rank' ? 'asc' : 'desc');
    }
  };

  const SortIndicator = ({ column }: { column: SortKey }) => {
    if (sortKey !== column) return <span className="text-gray-700 ml-0.5">&#8597;</span>;
    return sortDir === 'asc'
      ? <ChevronUp className="w-3 h-3 inline ml-0.5 text-emerald-400" />
      : <ChevronDown className="w-3 h-3 inline ml-0.5 text-emerald-400" />;
  };

  // Sort filtered markets for watchlist mode
  const sortedWatchlistMarkets = useMemo(() => {
    const pinned = new Set(watchlist.map((w) => w.toLowerCase()));
    const arr = [...filteredMarkets];

    arr.sort((a: any, b: any) => {
      // Pinned coins always first
      const aPinned = pinned.has(a.id.toLowerCase()) ? 1 : 0;
      const bPinned = pinned.has(b.id.toLowerCase()) ? 1 : 0;
      if (aPinned !== bPinned) return bPinned - aPinned;

      let aVal: number, bVal: number;
      switch (sortKey) {
        case 'rank':
          aVal = a.market_cap_rank ?? 999;
          bVal = b.market_cap_rank ?? 999;
          break;
        case 'name':
          return sortDir === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
        case 'price':
          aVal = a.current_price ?? 0;
          bVal = b.current_price ?? 0;
          break;
        case '24h':
          aVal = a.price_change_percentage_24h ?? 0;
          bVal = b.price_change_percentage_24h ?? 0;
          break;
        case '7d':
          aVal = a.price_change_percentage_7d_in_currency ?? 0;
          bVal = b.price_change_percentage_7d_in_currency ?? 0;
          break;
        case 'market_cap':
          aVal = a.market_cap ?? 0;
          bVal = b.market_cap ?? 0;
          break;
        default:
          aVal = a.market_cap_rank ?? 999;
          bVal = b.market_cap_rank ?? 999;
      }
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    });
    return arr;
  }, [filteredMarkets, sortKey, sortDir, watchlist]);

  // Sort holdings rows
  const sortedHoldingsRows = useMemo(() => {
    if (!holdingsPnL) return [];
    const pinned = new Set(watchlist.map((w) => w.toLowerCase()));
    const arr = [...holdingsPnL.rows];

    arr.sort((a, b) => {
      const aPinned = pinned.has(a.id.toLowerCase()) ? 1 : 0;
      const bPinned = pinned.has(b.id.toLowerCase()) ? 1 : 0;
      if (aPinned !== bPinned) return bPinned - aPinned;

      let aVal: number, bVal: number;
      switch (sortKey) {
        case 'rank':
          aVal = a.marketCapRank;
          bVal = b.marketCapRank;
          break;
        case 'name':
          return sortDir === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
        case 'price':
          aVal = a.price;
          bVal = b.price;
          break;
        case '24h':
          aVal = a.ch24;
          bVal = b.ch24;
          break;
        case 'value':
          aVal = a.value;
          bVal = b.value;
          break;
        case 'pnl':
          aVal = a.pnl;
          bVal = b.pnl;
          break;
        default:
          aVal = a.marketCapRank;
          bVal = b.marketCapRank;
      }
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    });
    return arr;
  }, [holdingsPnL, sortKey, sortDir, watchlist]);

  // Feature flag guard
  if (!FEATURES.addinV2) {
    return (
      <div className={`min-h-screen ${st.pageBg}`}>
        <FreeNavbar />
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <p className={`text-lg ${st.textMuted}`}>
            Command Center is not enabled. Please enable the addinV2 feature flag.
          </p>
        </div>
      </div>
    );
  }

  // Loading state
  if (authLoading || isLoadingWorkspaces) {
    return (
      <div className={`min-h-screen ${st.pageBg} flex items-center justify-center`}>
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
      </div>
    );
  }

  // No user
  if (!user) {
    return <AuthGate redirectPath="/command-center" featureName="Command Center"><></></AuthGate>;
  }

  // Quick Start Wizard
  if (workspaces.length === 0) {
    return (
      <div className={`min-h-screen ${st.pageBg}`}>
        <FreeNavbar />
        <QuickStartWizard
          onComplete={handleWorkspaceCreated}
          onSkip={() => router.push('/live-dashboards')}
        />
      </div>
    );
  }

  const isHoldings = activeWorkspace?.mode === 'holdings';

  const thClass = `text-left py-2 px-3 text-xs font-medium ${st.textDim} cursor-pointer select-none hover:text-emerald-400 transition-colors whitespace-nowrap`;
  const thRightClass = `text-right py-2 px-3 text-xs font-medium ${st.textDim} cursor-pointer select-none hover:text-emerald-400 transition-colors whitespace-nowrap`;

  return (
    <div className={`min-h-screen ${st.pageBg} pb-20`}>
      <FreeNavbar />
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <Breadcrumb customTitle="Command Center" />

        {/* Market Pulse Bar — always visible */}
        <div className="mt-4">
          <MarketPulseBar />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mt-4 mb-6">
          <div className="flex items-center gap-3">
            <LayoutDashboard className="w-6 h-6 text-emerald-400" />
            <h1 className={`text-2xl font-bold ${st.textPrimary}`}>Command Center</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => activeWorkspace && setEditWorkspaceId(activeWorkspace.id)}
              disabled={!activeWorkspace}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium ${st.buttonSecondary} disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              <Pencil className="w-4 h-4" />
              Edit
            </button>
            <button
              onClick={() => setHistoryOpen(true)}
              disabled={!activeWorkspace}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium ${st.buttonSecondary} disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              <History className="w-4 h-4" />
              History
            </button>
          </div>
        </div>

        {/* Workspace Strip */}
        <div className="mb-6">
          <WorkspaceStrip
            onCreateNew={() => setCreateModalOpen(true)}
            onEdit={(id) => setEditWorkspaceId(id)}
          />
        </div>

        {/* Delta View */}
        <div className="mb-6">
          <DeltaView />
        </div>

        {/* Dashboard Area */}
        {activeWorkspace && !data.markets && !dataLoading && (
          <div className={`${st.cardClasses} p-12 text-center mb-6`}>
            <p className={`text-lg font-medium mb-2 ${st.textPrimary}`}>
              Ready to refresh
            </p>
            <p className={`text-sm mb-4 ${st.textMuted}`}>
              Hit "Refresh Data" below to pull the latest data for{' '}
              <span className="text-emerald-400">{activeWorkspace.name}</span>
            </p>
            <button
              onClick={handleRefresh}
              className={`px-6 py-2.5 rounded-xl text-sm font-medium ${st.buttonPrimary}`}
            >
              Refresh Data
            </button>
          </div>
        )}

        {dataLoading && (
          <div className={`${st.cardClasses} p-12 text-center mb-6`}>
            <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mx-auto mb-3" />
            <p className={`text-sm ${st.textMuted}`}>Loading data...</p>
          </div>
        )}

        {/* === MAIN CONTENT WHEN DATA IS LOADED === */}
        {data.markets && !dataLoading && activeWorkspace && (
          <>
            {/* Portfolio Overview */}
            <PortfolioOverview
              filteredMarkets={filteredMarkets}
              isHoldings={isHoldings}
              holdingsPnL={holdingsPnL}
              workspaceName={activeWorkspace.name}
            />

            {/* Insights Panel */}
            <InsightsPanel
              filteredMarkets={filteredMarkets}
              isHoldings={isHoldings}
              holdingsPnL={holdingsPnL ? { totalPnL: holdingsPnL.totalPnL, totalPnLPct: holdingsPnL.totalPnLPct, rows: holdingsPnL.rows } : null}
            />

            {/* === UNIFIED TABLE === */}
            <div className={`${st.cardClasses} p-6 mb-6`}>
              <h3 className={`text-sm font-medium mb-4 ${st.textSecondary}`}>
                {activeWorkspace.name} — {filteredMarkets.length} {isHoldings ? 'holding' : 'coin'}{filteredMarkets.length !== 1 ? 's' : ''}
              </h3>

              {filteredMarkets.length === 0 ? (
                <p className={`text-sm ${st.textMuted} py-4 text-center`}>
                  No matching coins found. Try editing the workspace to update coin selections.
                </p>
              ) : !isHoldings ? (
                /* ========= WATCHLIST TABLE ========= */
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className={`border-b ${st.divider}`}>
                        <th className={`${thClass} w-8`} />
                        <th className={thClass} onClick={() => handleSort('rank')}>
                          # <SortIndicator column="rank" />
                        </th>
                        <th className={thClass} onClick={() => handleSort('name')}>
                          Coin <SortIndicator column="name" />
                        </th>
                        <th className={thRightClass} onClick={() => handleSort('price')}>
                          Price <SortIndicator column="price" />
                        </th>
                        <th className={thRightClass} onClick={() => handleSort('24h')}>
                          24h <SortIndicator column="24h" />
                        </th>
                        <th className={thRightClass} onClick={() => handleSort('7d')}>
                          7d <SortIndicator column="7d" />
                        </th>
                        <th className={`text-center py-2 px-3 text-xs font-medium ${st.textDim}`}>
                          7d Chart
                        </th>
                        <th className={thRightClass} onClick={() => handleSort('market_cap')}>
                          Market Cap <SortIndicator column="market_cap" />
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedWatchlistMarkets.map((m: any) => {
                        const ch24 = m.price_change_percentage_24h ?? 0;
                        const ch7d = m.price_change_percentage_7d_in_currency ?? 0;
                        const sparkPrices = m.sparkline_in_7d?.price as number[] | undefined;
                        const pinned = isInWatchlist(m.id);
                        const isExpanded = expandedRow === m.id;

                        return (
                          <WatchlistRow
                            key={m.id}
                            m={m}
                            ch24={ch24}
                            ch7d={ch7d}
                            sparkPrices={sparkPrices}
                            pinned={pinned}
                            isExpanded={isExpanded}
                            onTogglePin={() => toggleWatchlist(m.id)}
                            onToggleExpand={() => setExpandedRow(isExpanded ? null : m.id)}
                            st={st}
                          />
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                /* ========= HOLDINGS TABLE ========= */
                <>
                  {/* P&L Summary Bar */}
                  {holdingsPnL && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                      {[
                        { label: 'Portfolio Value', value: `$${holdingsPnL.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: st.textPrimary },
                        { label: 'Cost Basis', value: `$${holdingsPnL.totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: st.textSecondary },
                        { label: 'Unrealized P&L', value: `${holdingsPnL.totalPnL >= 0 ? '+' : ''}$${holdingsPnL.totalPnL.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: holdingsPnL.totalPnL >= 0 ? 'text-emerald-400' : 'text-red-400' },
                        { label: 'P&L %', value: `${holdingsPnL.totalPnLPct >= 0 ? '+' : ''}${holdingsPnL.totalPnLPct.toFixed(2)}%`, color: holdingsPnL.totalPnLPct >= 0 ? 'text-emerald-400' : 'text-red-400' },
                      ].map((kpi) => (
                        <div key={kpi.label} className={`${st.cardClasses} p-3`}>
                          <p className={`text-[10px] font-medium mb-1 ${st.textDim}`}>{kpi.label}</p>
                          <p className={`text-base font-bold ${kpi.color}`}>{kpi.value}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className={`border-b ${st.divider}`}>
                          <th className={`${thClass} w-8`} />
                          <th className={thClass} onClick={() => handleSort('name')}>
                            Coin <SortIndicator column="name" />
                          </th>
                          <th className={thRightClass} onClick={() => handleSort('price')}>
                            Price <SortIndicator column="price" />
                          </th>
                          <th className={thRightClass} onClick={() => handleSort('24h')}>
                            24h <SortIndicator column="24h" />
                          </th>
                          <th className={`text-center py-2 px-3 text-xs font-medium ${st.textDim}`}>
                            7d Chart
                          </th>
                          <th className={`text-right py-2 px-2 text-xs font-medium ${st.textDim}`}>Qty</th>
                          <th className={`text-right py-2 px-2 text-xs font-medium ${st.textDim}`}>Avg Buy ($)</th>
                          <th className={thRightClass} onClick={() => handleSort('value')}>
                            Value <SortIndicator column="value" />
                          </th>
                          <th className={thRightClass} onClick={() => handleSort('pnl')}>
                            P&L <SortIndicator column="pnl" />
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedHoldingsRows.map((row) => {
                          const pinned = isInWatchlist(row.id);
                          const isExpanded = expandedRow === row.id;

                          return (
                            <HoldingsRow
                              key={row.symbol}
                              row={row}
                              pinned={pinned}
                              isExpanded={isExpanded}
                              onTogglePin={() => toggleWatchlist(row.id)}
                              onToggleExpand={() => setExpandedRow(isExpanded ? null : row.id)}
                              editingHoldings={editingHoldings}
                              saveHolding={saveHolding}
                              st={st}
                            />
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Allocation Pie Chart */}
                  {holdingsPnL && holdingsPnL.pieData.length > 0 && (
                    <div className="mt-6">
                      <h4 className={`text-xs font-medium mb-3 ${st.textSecondary}`}>Portfolio Allocation</h4>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={holdingsPnL.pieData}
                              dataKey="value"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              innerRadius={50}
                              outerRadius={90}
                              paddingAngle={2}
                              stroke="none"
                            >
                              {holdingsPnL.pieData.map((_, idx) => (
                                <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip
                              formatter={(value) => `$${Number(value ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                              contentStyle={{ background: '#1f2937', border: 'none', borderRadius: '8px', color: '#e5e7eb', fontSize: '13px' }}
                            />
                            <Legend
                              formatter={(value: string) => <span className="text-gray-300 text-xs">{value}</span>}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Activity Feed */}
            <ActivityFeed />
          </>
        )}

        {/* Quick Actions Bar */}
        <QuickActionsBar
          onRefresh={handleRefresh}
          isRefreshing={dataLoading}
          getData={getFilteredData}
          onSnapshot={handleSnapshot}
        />
      </div>

      {/* Modals */}
      <WorkspaceCreateModal
        isOpen={createModalOpen || !!editWorkspaceId}
        onClose={() => { setCreateModalOpen(false); setEditWorkspaceId(null); }}
        onCreated={handleWorkspaceCreated}
        editWorkspaceId={editWorkspaceId}
      />
      <SnapshotHistory
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
      />
    </div>
  );
}

// ===== WATCHLIST ROW COMPONENT =====
function WatchlistRow({
  m,
  ch24,
  ch7d,
  sparkPrices,
  pinned,
  isExpanded,
  onTogglePin,
  onToggleExpand,
  st,
}: {
  m: any;
  ch24: number;
  ch7d: number;
  sparkPrices: number[] | undefined;
  pinned: boolean;
  isExpanded: boolean;
  onTogglePin: () => void;
  onToggleExpand: () => void;
  st: any;
}) {
  const sparkPath = sparkPrices ? buildSparklinePath(sparkPrices, 80, 28) : '';
  const sparkColor = ch7d >= 0 ? '#34d399' : '#ef4444';

  return (
    <>
      <tr
        className={`border-b ${st.divider} hover:bg-white/[0.02] transition-colors cursor-pointer`}
        onClick={onToggleExpand}
      >
        <td className="py-2 px-3">
          <button
            type="button"
            title={pinned ? 'Unpin' : 'Pin'}
            onClick={(e) => { e.stopPropagation(); onTogglePin(); }}
            className="transition-colors"
          >
            <Star className={`w-3.5 h-3.5 ${pinned ? 'text-amber-400 fill-amber-400' : 'text-gray-700 hover:text-amber-400'}`} />
          </button>
        </td>
        <td className={`py-2 px-3 ${st.textDim}`}>{m.market_cap_rank || '--'}</td>
        <td className={`py-2 px-3 font-medium ${st.textPrimary}`}>
          <div className="flex items-center gap-2">
            {m.image && <img src={m.image} alt="" className="w-5 h-5 rounded-full" />}
            <span>{m.name}</span>
            <span className={`text-xs ${st.textDim}`}>{m.symbol.toUpperCase()}</span>
            {isExpanded ? <ChevronDown className="w-3 h-3 text-gray-500 ml-auto" /> : <ChevronRight className="w-3 h-3 text-gray-700 ml-auto" />}
          </div>
        </td>
        <td className={`py-2 px-3 text-right font-mono ${st.textPrimary}`}>
          ${m.current_price >= 1
            ? m.current_price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            : m.current_price.toFixed(6)}
        </td>
        <td className={`py-2 px-3 text-right font-mono ${ch24 >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {ch24 >= 0 ? '+' : ''}{ch24.toFixed(2)}%
        </td>
        <td className={`py-2 px-3 text-right font-mono ${ch7d >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {ch7d >= 0 ? '+' : ''}{ch7d.toFixed(2)}%
        </td>
        <td className="py-2 px-3 text-center">
          {sparkPath ? (
            <svg width="80" height="28" viewBox="0 0 80 28" className="inline-block">
              <path d={sparkPath} fill="none" stroke={sparkColor} strokeWidth="1.5" />
            </svg>
          ) : (
            <span className="text-gray-700 text-[10px]">--</span>
          )}
        </td>
        <td className={`py-2 px-3 text-right ${st.textSecondary}`}>
          ${(m.market_cap / 1e9).toFixed(1)}B
        </td>
      </tr>
      {isExpanded && (
        <tr className={`border-b ${st.divider}`}>
          <td colSpan={8} className="px-6 py-3 bg-white/[0.01]">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-[11px]">
              <div>
                <span className={`${st.textDim} block mb-0.5`}>ATH</span>
                <span className={st.textPrimary}>{m.ath ? `$${m.ath.toLocaleString()}` : '--'}</span>
                {m.ath_date && <span className="text-gray-600 block">{new Date(m.ath_date).toLocaleDateString()}</span>}
              </div>
              <div>
                <span className={`${st.textDim} block mb-0.5`}>24h Volume</span>
                <span className={st.textPrimary}>${((m.total_volume ?? 0) / 1e9).toFixed(2)}B</span>
              </div>
              <div>
                <span className={`${st.textDim} block mb-0.5`}>Circulating Supply</span>
                <span className={st.textPrimary}>{(m.circulating_supply ?? 0).toLocaleString()}</span>
              </div>
              <div>
                <span className={`${st.textDim} block mb-0.5`}>Total Supply</span>
                <span className={st.textPrimary}>{m.total_supply ? m.total_supply.toLocaleString() : 'Unlimited'}</span>
              </div>
              <div>
                <span className={`${st.textDim} block mb-0.5`}>From ATH</span>
                <span className={m.ath_change_percentage < 0 ? 'text-red-400' : 'text-emerald-400'}>
                  {m.ath_change_percentage != null ? `${m.ath_change_percentage.toFixed(1)}%` : '--'}
                </span>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ===== HOLDINGS ROW COMPONENT =====
function HoldingsRow({
  row,
  pinned,
  isExpanded,
  onTogglePin,
  onToggleExpand,
  editingHoldings,
  saveHolding,
  st,
}: {
  row: any;
  pinned: boolean;
  isExpanded: boolean;
  onTogglePin: () => void;
  onToggleExpand: () => void;
  editingHoldings: Record<string, HoldingEntry>;
  saveHolding: (symbol: string, field: 'quantity' | 'avgBuyPrice', value: number) => void;
  st: any;
}) {
  const sparkPath = row.sparkline ? buildSparklinePath(row.sparkline, 80, 28) : '';
  const sparkColor = row.ch7d >= 0 ? '#34d399' : '#ef4444';

  return (
    <>
      <tr
        className={`border-b ${st.divider} hover:bg-white/[0.02] transition-colors cursor-pointer`}
        onClick={onToggleExpand}
      >
        <td className="py-2 px-3">
          <button
            type="button"
            title={pinned ? 'Unpin' : 'Pin'}
            onClick={(e) => { e.stopPropagation(); onTogglePin(); }}
            className="transition-colors"
          >
            <Star className={`w-3.5 h-3.5 ${pinned ? 'text-amber-400 fill-amber-400' : 'text-gray-700 hover:text-amber-400'}`} />
          </button>
        </td>
        <td className={`py-2 px-2 font-medium ${st.textPrimary}`}>
          <div className="flex items-center gap-2">
            {row.image && <img src={row.image} alt="" className="w-5 h-5 rounded-full" />}
            <span>{row.name}</span>
            <span className={`text-xs ${st.textDim}`}>{row.symbol}</span>
            {isExpanded ? <ChevronDown className="w-3 h-3 text-gray-500 ml-auto" /> : <ChevronRight className="w-3 h-3 text-gray-700 ml-auto" />}
          </div>
        </td>
        <td className={`py-2 px-2 text-right font-mono ${st.textPrimary}`}>
          ${row.price >= 1
            ? row.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            : row.price.toFixed(6)}
        </td>
        <td className={`py-2 px-2 text-right font-mono ${row.ch24 >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {row.ch24 >= 0 ? '+' : ''}{row.ch24.toFixed(2)}%
        </td>
        <td className="py-2 px-2 text-center">
          {sparkPath ? (
            <svg width="80" height="28" viewBox="0 0 80 28" className="inline-block">
              <path d={sparkPath} fill="none" stroke={sparkColor} strokeWidth="1.5" />
            </svg>
          ) : (
            <span className="text-gray-700 text-[10px]">--</span>
          )}
        </td>
        <td className="py-2 px-2" onClick={(e) => e.stopPropagation()}>
          <input
            type="number"
            min={0}
            step="any"
            value={editingHoldings[row.symbol]?.quantity ?? ''}
            onChange={(e) => saveHolding(row.symbol, 'quantity', parseFloat(e.target.value) || 0)}
            placeholder="0"
            className={`w-20 text-right px-2 py-1 rounded text-sm ${st.inputBg}`}
          />
        </td>
        <td className="py-2 px-2" onClick={(e) => e.stopPropagation()}>
          <input
            type="number"
            min={0}
            step="any"
            value={editingHoldings[row.symbol]?.avgBuyPrice ?? ''}
            onChange={(e) => saveHolding(row.symbol, 'avgBuyPrice', parseFloat(e.target.value) || 0)}
            placeholder="0.00"
            className={`w-24 text-right px-2 py-1 rounded text-sm ${st.inputBg}`}
          />
        </td>
        <td className={`py-2 px-2 text-right font-mono ${st.textPrimary}`}>
          ${row.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </td>
        <td className="py-2 px-2 text-right">
          <span className={`font-mono ${row.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {row.pnl >= 0 ? '+' : ''}${row.pnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className={`text-xs ml-1 ${row.pnlPct >= 0 ? 'text-emerald-400/70' : 'text-red-400/70'}`}>
            ({row.pnlPct >= 0 ? '+' : ''}{row.pnlPct.toFixed(1)}%)
          </span>
        </td>
      </tr>
      {isExpanded && (
        <tr className={`border-b ${st.divider}`}>
          <td colSpan={9} className="px-6 py-3 bg-white/[0.01]">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-[11px]">
              <div>
                <span className={`${st.textDim} block mb-0.5`}>ATH</span>
                <span className={st.textPrimary}>{row.ath ? `$${row.ath.toLocaleString()}` : '--'}</span>
                {row.athDate && <span className="text-gray-600 block">{new Date(row.athDate).toLocaleDateString()}</span>}
              </div>
              <div>
                <span className={`${st.textDim} block mb-0.5`}>24h Volume</span>
                <span className={st.textPrimary}>${(row.volume24h / 1e9).toFixed(2)}B</span>
              </div>
              <div>
                <span className={`${st.textDim} block mb-0.5`}>Circulating Supply</span>
                <span className={st.textPrimary}>{row.circulatingSupply.toLocaleString()}</span>
              </div>
              <div>
                <span className={`${st.textDim} block mb-0.5`}>Total Supply</span>
                <span className={st.textPrimary}>{row.totalSupply ? row.totalSupply.toLocaleString() : 'Unlimited'}</span>
              </div>
              <div>
                <span className={`${st.textDim} block mb-0.5`}>Cost Basis</span>
                <span className={st.textPrimary}>${row.costBasis.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
