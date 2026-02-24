'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { FreeNavbar } from '@/components/FreeNavbar';
import { Breadcrumb } from '@/components/Breadcrumb';
import { DashboardShell } from '@/components/live-dashboard/DashboardShell';
import { ApiKeyModal } from '@/components/live-dashboard/ApiKeyModal';
import type { LiveDashboardDefinition } from '@/lib/live-dashboard/definitions';
import { useLiveDashboardStore } from '@/lib/live-dashboard/store';
import { getSiteThemeClasses } from '@/lib/live-dashboard/theme';
import { ArrowLeft, Lock, Shield, Pencil } from 'lucide-react';

// ─── Data Model ───
interface CustomDashboardWidget {
  id: string;
  component: string;
  title: string;
  gridColumn: string;
  props?: Record<string, any>;
}

interface CustomDashboardDef {
  id: string;
  name: string;
  icon: string;
  gridColumns: number;
  widgets: CustomDashboardWidget[];
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = 'crk-custom-dashboards';

function loadDashboardById(id: string): CustomDashboardDef | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const all: CustomDashboardDef[] = JSON.parse(raw);
    return all.find((d) => d.id === id) ?? null;
  } catch {
    return null;
  }
}

function toDefinition(dashboard: CustomDashboardDef): LiveDashboardDefinition {
  return {
    slug: `custom-${dashboard.id}`,
    name: dashboard.name,
    description: 'Custom dashboard',
    icon: dashboard.icon,
    tier: 'pro' as const,
    gridColumns: dashboard.gridColumns,
    requiredEndpoints: ['markets', 'global', 'fear_greed', 'trending', 'categories'],
    widgets: dashboard.widgets.map((w, i) => ({
      ...w,
      dataEndpoints: ['markets', 'global'],
      mobileOrder: i + 1,
    })),
  };
}

export default function CustomDashboardPage() {
  const params = useParams();
  const id = params.id as string;

  const { apiKey, fetchData, siteTheme } = useLiveDashboardStore();
  const st = getSiteThemeClasses(siteTheme);

  const [dashboard, setDashboard] = useState<CustomDashboardDef | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);

  // Load dashboard from localStorage
  useEffect(() => {
    const loaded = loadDashboardById(id);
    if (loaded) {
      setDashboard(loaded);
    } else {
      setNotFound(true);
    }
  }, [id]);

  const definition = dashboard ? toDefinition(dashboard) : null;

  const loadData = useCallback(() => {
    if (!definition) return;
    const c = useLiveDashboardStore.getState().customization;
    const fetchParams: Record<string, any> = {};

    if (c.vsCurrency && c.vsCurrency !== 'usd') fetchParams.vsCurrency = c.vsCurrency;
    if (c.perPage && c.perPage !== 100) fetchParams.perPage = c.perPage;
    if (c.sortOrder && c.sortOrder !== 'market_cap_desc') fetchParams.sortOrder = c.sortOrder;

    // OHLC
    const needsOhlc = definition.widgets.some((w) => w.dataEndpoints.includes('ohlc'));
    if (needsOhlc) {
      const ohlcWidget = definition.widgets.find((w) => w.props?.coinId);
      fetchParams.coinId = c.coinId || ohlcWidget?.props?.coinId || 'bitcoin';
      fetchParams.days = c.days || ohlcWidget?.props?.days || 30;
    }
    // Multi OHLC
    const needsMultiOhlc = definition.widgets.some((w) => w.dataEndpoints.includes('ohlc_multi'));
    if (needsMultiOhlc) {
      const multiWidget = definition.widgets.find((w) => w.props?.coinIds);
      fetchParams.coinIds = c.coinIds.length > 0 ? c.coinIds : multiWidget?.props?.coinIds;
      fetchParams.days = c.days || multiWidget?.props?.days || 30;
    }
    // Coin history
    const needsHistory = definition.widgets.some((w) => w.dataEndpoints.includes('coin_history'));
    if (needsHistory) {
      const histWidget = definition.widgets.find((w) => w.props?.coinId && w.dataEndpoints.includes('coin_history'));
      fetchParams.historyCoinId = c.coinId || histWidget?.props?.coinId || 'bitcoin';
      fetchParams.historyDays = c.days || histWidget?.props?.days || 90;
    }
    // Coin detail
    const needsDetail = definition.widgets.some((w) => w.dataEndpoints.includes('coin_detail'));
    if (needsDetail) {
      const detailWidget = definition.widgets.find((w) => w.props?.coinId);
      fetchParams.detailCoinId = c.coinId || detailWidget?.props?.coinId || 'bitcoin';
    }

    fetchData(definition.requiredEndpoints, fetchParams);
    setInitialLoaded(true);
  }, [definition, fetchData]);

  // Auto-fetch on mount
  useEffect(() => {
    if (!initialLoaded && definition) {
      loadData();
    }
  }, [initialLoaded, definition, loadData]);

  // 404 state
  if (notFound) {
    return (
      <div className={`min-h-screen ${st.pageBg}`} data-dashboard-theme={siteTheme}>
        <FreeNavbar />
        <Breadcrumb customTitle="Not Found" />
        <main className="max-w-7xl mx-auto px-4 py-6">
          <Link
            href="/live-dashboards"
            className={`inline-flex items-center gap-1.5 ${st.linkText} text-sm mb-6 transition`}
          >
            <ArrowLeft className="w-4 h-4" />
            All Dashboards
          </Link>
          <div className="text-center py-24">
            <div className="text-6xl mb-6">🔍</div>
            <h2 className={`text-3xl font-bold ${st.textPrimary} mb-3 tracking-tight`}>
              Dashboard Not Found
            </h2>
            <p className={`${st.textDim} mb-8 max-w-md mx-auto leading-relaxed`}>
              This custom dashboard could not be found. It may have been deleted or the link is invalid.
            </p>
            <Link
              href="/live-dashboards"
              className={`${st.buttonPrimary} font-medium px-8 py-3 rounded-xl transition inline-flex items-center gap-2`}
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboards
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // Loading state (localStorage is async-ish on first render)
  if (!dashboard || !definition) {
    return (
      <div className={`min-h-screen ${st.pageBg}`} data-dashboard-theme={siteTheme}>
        <FreeNavbar />
        <main className="max-w-7xl mx-auto px-4 py-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-white/[0.04] rounded w-64" />
            <div className="h-4 bg-white/[0.04] rounded w-96" />
            <div className="h-64 bg-white/[0.04] rounded-2xl" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${st.pageBg}`} data-dashboard-theme={siteTheme}>
      <FreeNavbar />
      <Breadcrumb customTitle={dashboard.name} />

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Back link + Edit button */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/live-dashboards"
            className={`inline-flex items-center gap-1.5 ${st.linkText} text-sm transition`}
          >
            <ArrowLeft className="w-4 h-4" />
            All Dashboards
          </Link>
          <Link
            href={`/live-dashboards/custom/builder?edit=${dashboard.id}`}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl ${st.buttonSecondary} text-sm font-medium transition`}
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit Dashboard
          </Link>
        </div>

        {/* Shared key notice — browsing without personal key */}
        {!apiKey && (
          <div className="mb-4 flex items-center justify-between px-3 py-2 rounded-lg bg-blue-400/10 border border-blue-400/20 text-blue-300 text-xs">
            <div className="flex items-center gap-2">
              <Shield className="w-3.5 h-3.5" />
              <span>Browsing with shared API — add your own key for faster refreshes and higher limits.</span>
            </div>
            <button
              type="button"
              onClick={() => setShowKeyModal(true)}
              className="ml-3 px-3 py-1 rounded-md bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 text-xs font-medium transition whitespace-nowrap"
            >
              Add Key
            </button>
          </div>
        )}

        <DashboardShell
          definition={definition}
          onOpenKeyModal={() => setShowKeyModal(true)}
        />
      </main>

      {/* API Key Modal */}
      <ApiKeyModal
        isOpen={showKeyModal}
        onClose={() => setShowKeyModal(false)}
        onSuccess={loadData}
      />
    </div>
  );
}
