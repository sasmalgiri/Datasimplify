'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { AuthGate } from '@/components/AuthGate';
import { FEATURES } from '@/lib/featureFlags';
import { useLiveDashboardStore } from '@/lib/live-dashboard/store';
import { SITE_THEMES } from '@/lib/live-dashboard/theme';
import { useWorkspaceStore, useActiveWorkspace } from '@/lib/workspaces/workspaceStore';
import { FreeNavbar } from '@/components/FreeNavbar';
import { Breadcrumb } from '@/components/Breadcrumb';
import { WorkspaceStrip } from '@/components/command-center/WorkspaceStrip';
import { ActionBar } from '@/components/command-center/ActionBar';
import { DeltaView } from '@/components/workspaces/DeltaView';
import { SnapshotHistory } from '@/components/workspaces/SnapshotHistory';
import { WorkspaceCreateModal } from '@/components/workspaces/WorkspaceCreateModal';
import { QuickStartWizard } from '@/components/workspaces/QuickStartWizard';
import { Loader2, History, LayoutDashboard, Pencil } from 'lucide-react';
import { IS_BETA_MODE } from '@/lib/betaMode';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import type { HoldingEntry } from '@/lib/workspaces/types';

const PIE_COLORS = [
  '#34d399', '#60a5fa', '#f59e0b', '#ef4444', '#a78bfa',
  '#f472b6', '#2dd4bf', '#fb923c', '#818cf8', '#4ade80',
];

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
  } = useWorkspaceStore();
  const activeWorkspace = useActiveWorkspace();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editWorkspaceId, setEditWorkspaceId] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

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
        // Debounced persist to backend
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

  // Auth gate handled by AuthGate component below

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
      // Fetch market data for the workspace's coins
      const coins = activeWorkspace.config?.coins ?? [];
      const vsCurrency = activeWorkspace.config?.vsCurrency ?? 'usd';
      fetchData(['markets', 'global'], {
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

    // Fetch market data for the workspace's coins
    fetchData(['markets', 'global'], {
      vsCurrency,
      perPage: Math.max(coins.length, 100),
    });
  }, [activeWorkspace, fetchData]);

  // After workspace creation, auto-refresh
  const handleWorkspaceCreated = useCallback(
    (workspaceId: string) => {
      setCreateModalOpen(false);
      // Small delay to let store update
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

  // --- P&L computation (holdings mode) ---
  const holdingsPnL = useMemo(() => {
    if (!activeWorkspace || activeWorkspace.mode !== 'holdings' || !data.markets) return null;

    const wsCoins = activeWorkspace.config?.coins ?? [];
    const coinSet = new Set(wsCoins.map((c) => c.toLowerCase()));
    const filtered = data.markets.filter(
      (m: any) => coinSet.has(m.id.toLowerCase()) || coinSet.has(m.symbol.toLowerCase()),
    );

    let totalValue = 0;
    let totalCost = 0;
    const rows: {
      symbol: string;
      name: string;
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
    }[] = [];
    const pieData: { name: string; value: number }[] = [];

    filtered.forEach((m: any) => {
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
      });

      if (marketValue > 0) {
        pieData.push({ name: key, value: marketValue });
      }
    });

    const totalPnL = totalValue - totalCost;
    const totalPnLPct = totalCost > 0 ? ((totalPnL / totalCost) * 100) : 0;

    return { rows, pieData, totalValue, totalCost, totalPnL, totalPnLPct };
  }, [activeWorkspace, data.markets, editingHoldings]);

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

  // No user — show sign-in required message
  if (!user) {
    return <AuthGate redirectPath="/command-center" featureName="Command Center"><></></AuthGate>;
  }

  // Quick Start Wizard for first-time users
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

  return (
    <div className={`min-h-screen ${st.pageBg}`}>
      <FreeNavbar />
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <Breadcrumb customTitle="Command Center" />

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
          <div
            className={`${st.cardClasses} p-12 text-center mb-6`}
          >
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

        {/* === Watchlist Mode Table === */}
        {data.markets && !dataLoading && activeWorkspace && activeWorkspace.mode !== 'holdings' && (() => {
          const wsCoins = activeWorkspace.config?.coins ?? [];
          const coinSet = new Set(wsCoins.map((c) => c.toLowerCase()));
          const filtered = data.markets!.filter(
            (m: any) => coinSet.has(m.id.toLowerCase()) || coinSet.has(m.symbol.toLowerCase()),
          );

          return (
            <div className={`${st.cardClasses} p-6 mb-6`}>
              <h3 className={`text-sm font-medium mb-4 ${st.textSecondary}`}>
                {activeWorkspace.name} — {filtered.length} coin{filtered.length !== 1 ? 's' : ''}
              </h3>
              {filtered.length === 0 ? (
                <p className={`text-sm ${st.textMuted} py-4 text-center`}>
                  No matching coins found. Try editing the workspace to update coin selections.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className={`border-b ${st.divider}`}>
                        <th className={`text-left py-2 px-3 text-xs font-medium ${st.textDim}`}>#</th>
                        <th className={`text-left py-2 px-3 text-xs font-medium ${st.textDim}`}>Coin</th>
                        <th className={`text-right py-2 px-3 text-xs font-medium ${st.textDim}`}>Price</th>
                        <th className={`text-right py-2 px-3 text-xs font-medium ${st.textDim}`}>24h</th>
                        <th className={`text-right py-2 px-3 text-xs font-medium ${st.textDim}`}>7d</th>
                        <th className={`text-right py-2 px-3 text-xs font-medium ${st.textDim}`}>Market Cap</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((m: any, i: number) => {
                        const ch24 = m.price_change_percentage_24h ?? 0;
                        const ch7d = m.price_change_percentage_7d_in_currency ?? 0;
                        return (
                          <tr key={m.id} className={`border-b ${st.divider}`}>
                            <td className={`py-2 px-3 ${st.textDim}`}>{m.market_cap_rank || i + 1}</td>
                            <td className={`py-2 px-3 font-medium ${st.textPrimary}`}>
                              {m.name}
                              <span className={`ml-1 text-xs ${st.textDim}`}>{m.symbol.toUpperCase()}</span>
                            </td>
                            <td className={`py-2 px-3 text-right ${st.textPrimary}`}>
                              ${m.current_price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className={`py-2 px-3 text-right ${ch24 >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {ch24 >= 0 ? '+' : ''}{ch24.toFixed(2)}%
                            </td>
                            <td className={`py-2 px-3 text-right ${ch7d >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {ch7d >= 0 ? '+' : ''}{ch7d.toFixed(2)}%
                            </td>
                            <td className={`py-2 px-3 text-right ${st.textSecondary}`}>
                              ${(m.market_cap / 1e9).toFixed(1)}B
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })()}

        {/* === Holdings Mode: P&L Summary + Table + Allocation === */}
        {data.markets && !dataLoading && activeWorkspace && activeWorkspace.mode === 'holdings' && holdingsPnL && (
          <>
            {/* P&L Summary Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Portfolio Value', value: `$${holdingsPnL.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: st.textPrimary },
                { label: 'Cost Basis', value: `$${holdingsPnL.totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: st.textSecondary },
                { label: 'Unrealized P&L', value: `${holdingsPnL.totalPnL >= 0 ? '+' : ''}$${holdingsPnL.totalPnL.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: holdingsPnL.totalPnL >= 0 ? 'text-emerald-400' : 'text-red-400' },
                { label: 'P&L %', value: `${holdingsPnL.totalPnLPct >= 0 ? '+' : ''}${holdingsPnL.totalPnLPct.toFixed(2)}%`, color: holdingsPnL.totalPnLPct >= 0 ? 'text-emerald-400' : 'text-red-400' },
              ].map((kpi) => (
                <div key={kpi.label} className={`${st.cardClasses} p-4`}>
                  <p className={`text-xs font-medium mb-1 ${st.textDim}`}>{kpi.label}</p>
                  <p className={`text-lg font-bold ${kpi.color}`}>{kpi.value}</p>
                </div>
              ))}
            </div>

            {/* Holdings Table */}
            <div className={`${st.cardClasses} p-6 mb-6`}>
              <h3 className={`text-sm font-medium mb-4 ${st.textSecondary}`}>
                {activeWorkspace.name} — {holdingsPnL.rows.length} holding{holdingsPnL.rows.length !== 1 ? 's' : ''}
              </h3>
              {holdingsPnL.rows.length === 0 ? (
                <p className={`text-sm ${st.textMuted} py-4 text-center`}>
                  No matching coins found. Try editing the workspace to update coin selections.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className={`border-b ${st.divider}`}>
                        <th className={`text-left py-2 px-2 text-xs font-medium ${st.textDim}`}>Coin</th>
                        <th className={`text-right py-2 px-2 text-xs font-medium ${st.textDim}`}>Price</th>
                        <th className={`text-right py-2 px-2 text-xs font-medium ${st.textDim}`}>24h</th>
                        <th className={`text-right py-2 px-2 text-xs font-medium ${st.textDim}`}>Qty</th>
                        <th className={`text-right py-2 px-2 text-xs font-medium ${st.textDim}`}>Avg Buy ($)</th>
                        <th className={`text-right py-2 px-2 text-xs font-medium ${st.textDim}`}>Value</th>
                        <th className={`text-right py-2 px-2 text-xs font-medium ${st.textDim}`}>P&L</th>
                      </tr>
                    </thead>
                    <tbody>
                      {holdingsPnL.rows.map((row) => (
                        <tr key={row.symbol} className={`border-b ${st.divider}`}>
                          <td className={`py-2 px-2 font-medium ${st.textPrimary}`}>
                            {row.name}
                            <span className={`ml-1 text-xs ${st.textDim}`}>{row.symbol}</span>
                          </td>
                          <td className={`py-2 px-2 text-right ${st.textPrimary}`}>
                            ${row.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className={`py-2 px-2 text-right ${row.ch24 >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {row.ch24 >= 0 ? '+' : ''}{row.ch24.toFixed(2)}%
                          </td>
                          <td className="py-2 px-2">
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
                          <td className="py-2 px-2">
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
                          <td className={`py-2 px-2 text-right ${st.textPrimary}`}>
                            ${row.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className={`py-2 px-2 text-right`}>
                            <span className={row.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                              {row.pnl >= 0 ? '+' : ''}${row.pnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                            <span className={`text-xs ml-1 ${row.pnlPct >= 0 ? 'text-emerald-400/70' : 'text-red-400/70'}`}>
                              ({row.pnlPct >= 0 ? '+' : ''}{row.pnlPct.toFixed(1)}%)
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Allocation Pie Chart */}
            {holdingsPnL.pieData.length > 0 && (
              <div className={`${st.cardClasses} p-6 mb-6`}>
                <h3 className={`text-sm font-medium mb-4 ${st.textSecondary}`}>
                  Portfolio Allocation
                </h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={holdingsPnL.pieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
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

        {/* Action Bar */}
        <ActionBar onRefresh={handleRefresh} isRefreshing={dataLoading} getData={getFilteredData} />
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
