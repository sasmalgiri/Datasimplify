'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
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
import { Loader2, History, LayoutDashboard } from 'lucide-react';

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
  } = useWorkspaceStore();
  const activeWorkspace = useActiveWorkspace();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  // Auth gate
  useEffect(() => {
    if (!authLoading && !user && !redirectedRef.current) {
      redirectedRef.current = true;
      router.push('/login');
    }
  }, [authLoading, user, router]);

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
  if (!user) return null;

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
          <WorkspaceStrip onCreateNew={() => setCreateModalOpen(true)} />
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

        {data.markets && !dataLoading && (
          <div className={`${st.cardClasses} p-6 mb-6`}>
            <h3 className={`text-sm font-medium mb-4 ${st.textSecondary}`}>
              {activeWorkspace?.name} — {data.markets.length} coins loaded
            </h3>
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
                  {data.markets.slice(0, 30).map((m, i) => {
                    const ch24 = m.price_change_percentage_24h ?? 0;
                    const ch7d = m.price_change_percentage_7d_in_currency ?? 0;
                    return (
                      <tr key={m.id} className={`border-b ${st.divider} hover:${st.subtleBg}`}>
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
              {data.markets.length > 30 && (
                <p className={`text-center text-xs py-2 ${st.textDim}`}>
                  ... and {data.markets.length - 30} more
                </p>
              )}
            </div>
          </div>
        )}

        {/* Action Bar */}
        <ActionBar onRefresh={handleRefresh} isRefreshing={dataLoading} />
      </div>

      {/* Modals */}
      <WorkspaceCreateModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreated={handleWorkspaceCreated}
      />
      <SnapshotHistory
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
      />
    </div>
  );
}
