'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { FreeNavbar } from '@/components/FreeNavbar';
import { Breadcrumb } from '@/components/Breadcrumb';
import { getDashboardBySlug } from '@/lib/live-dashboard/definitions';
import { useLiveDashboardStore } from '@/lib/live-dashboard/store';
import { DashboardShell } from '@/components/live-dashboard/DashboardShell';
import { ApiKeyModal } from '@/components/live-dashboard/ApiKeyModal';
import { ArrowLeft, Key, Lock, Shield, Crown } from 'lucide-react';
import { getSiteThemeClasses } from '@/lib/live-dashboard/theme';
import { useAuth } from '@/lib/auth';

export default function LiveDashboardPage() {
  const params = useParams();
  const slug = params.slug as string;
  const definition = getDashboardBySlug(slug);

  const { apiKey, fetchData, siteTheme } = useLiveDashboardStore();
  const st = getSiteThemeClasses(siteTheme);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const { profile } = useAuth();

  const userTier = profile?.subscription_tier ?? 'free';
  const isPro = definition?.tier === 'pro';
  const isLocked = isPro && userTier !== 'pro';

  const loadData = useCallback(() => {
    if (!definition || !apiKey) return;
    // Read customization fresh from store to avoid stale closure
    const c = useLiveDashboardStore.getState().customization;
    const params: Record<string, any> = {};

    // Global customization params
    if (c.vsCurrency && c.vsCurrency !== 'usd') params.vsCurrency = c.vsCurrency;
    if (c.perPage && c.perPage !== 100) params.perPage = c.perPage;
    if (c.sortOrder && c.sortOrder !== 'market_cap_desc') params.sortOrder = c.sortOrder;

    // OHLC
    const needsOhlc = definition.widgets.some((w) => w.dataEndpoints.includes('ohlc'));
    if (needsOhlc) {
      const ohlcWidget = definition.widgets.find((w) => w.props?.coinId);
      params.coinId = c.coinId || ohlcWidget?.props?.coinId || 'bitcoin';
      params.days = c.days || ohlcWidget?.props?.days || 30;
    }
    // Multi OHLC
    const needsMultiOhlc = definition.widgets.some((w) => w.dataEndpoints.includes('ohlc_multi'));
    if (needsMultiOhlc) {
      const multiWidget = definition.widgets.find((w) => w.props?.coinIds);
      params.coinIds = c.coinIds.length > 0 ? c.coinIds : multiWidget?.props?.coinIds;
      params.days = c.days || multiWidget?.props?.days || 30;
    }
    // Coin history
    const needsHistory = definition.widgets.some((w) => w.dataEndpoints.includes('coin_history'));
    if (needsHistory) {
      const histWidget = definition.widgets.find((w) => w.props?.coinId && w.dataEndpoints.includes('coin_history'));
      params.historyCoinId = c.coinId || histWidget?.props?.coinId || 'bitcoin';
      params.historyDays = c.days || histWidget?.props?.days || 90;
    }
    // Coin detail
    const needsDetail = definition.widgets.some((w) => w.dataEndpoints.includes('coin_detail'));
    if (needsDetail) {
      const detailWidget = definition.widgets.find((w) => w.props?.coinId);
      params.detailCoinId = c.coinId || detailWidget?.props?.coinId || 'bitcoin';
    }
    fetchData(definition.requiredEndpoints, params);
    setInitialLoaded(true);
  }, [definition, apiKey, fetchData]);

  // Auto-fetch on mount if key exists and dashboard is accessible
  useEffect(() => {
    if (apiKey && !initialLoaded && !isLocked) {
      loadData();
    }
  }, [apiKey, initialLoaded, loadData, isLocked]);

  // Show key modal if no key (only for unlocked dashboards)
  useEffect(() => {
    if (!apiKey && !showKeyModal && !isLocked) {
      const timer = setTimeout(() => setShowKeyModal(true), 500);
      return () => clearTimeout(timer);
    }
  }, [apiKey, showKeyModal, isLocked]);

  // Dashboard not found — client-friendly 404
  if (!definition) {
    return (
      <div className="min-h-screen bg-[#0a0a0f]">
        <FreeNavbar />
        <Breadcrumb />
        <div className="text-center py-24">
          <div className="text-6xl mb-4">404</div>
          <h1 className="text-2xl font-bold text-white mb-2">Dashboard Not Found</h1>
          <p className="text-gray-400 mb-8">The dashboard you&apos;re looking for doesn&apos;t exist.</p>
          <Link
            href="/live-dashboards"
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Browse Dashboards
          </Link>
        </div>
      </div>
    );
  }

  // Pro dashboard locked for free users — show upgrade prompt
  if (isLocked) {
    return (
      <div className={`min-h-screen ${st.pageBg}`} data-dashboard-theme={siteTheme}>
        <FreeNavbar />
        <Breadcrumb customTitle={definition.name} />

        <main className="max-w-7xl mx-auto px-4 py-6">
          <Link
            href="/live-dashboards"
            className={`inline-flex items-center gap-1.5 ${st.linkText} text-sm mb-6 transition`}
          >
            <ArrowLeft className="w-4 h-4" />
            All Dashboards
          </Link>

          <div className="text-center py-16">
            <div className="text-6xl mb-6">{definition.icon}</div>
            <h2 className="text-3xl font-bold text-white mb-3 tracking-tight">
              {definition.name}
            </h2>
            <p className="text-gray-400 mb-6 max-w-md mx-auto leading-relaxed">
              {definition.description}
            </p>

            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm mb-8">
              <Lock className="w-4 h-4" />
              Pro Dashboard
            </div>

            <div className="max-w-sm mx-auto bg-white/[0.03] border border-white/[0.08] rounded-2xl p-8">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-purple-500/10 rounded-full mb-4">
                <Crown className="w-7 h-7 text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Upgrade to Pro
              </h3>
              <p className="text-gray-400 text-sm mb-2">
                This dashboard includes {definition.widgets.length} advanced widgets
                with {definition.requiredEndpoints.length} data sources.
              </p>
              <p className="text-gray-500 text-xs mb-6">
                Pro unlocks all {definition.widgets.length} widgets, PDF export, auto-refresh, and more.
              </p>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition w-full justify-center"
              >
                View Pro Plans
              </Link>
            </div>

            <div className="mt-8 text-gray-600 text-xs">
              <p>Free plan includes 12 dashboards with up to 5 widgets each.</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${st.pageBg}`} data-dashboard-theme={siteTheme}>
      <FreeNavbar />
      <Breadcrumb customTitle={definition.name} />

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Back link */}
        <Link
          href="/live-dashboards"
          className={`inline-flex items-center gap-1.5 ${st.linkText} text-sm mb-6 transition`}
        >
          <ArrowLeft className="w-4 h-4" />
          All Dashboards
        </Link>

        {/* No API key state */}
        {!apiKey && (
          <div className="text-center py-24">
            <div className="text-6xl mb-6">{definition.icon}</div>
            <h2 className={`text-3xl font-bold ${st.textPrimary} mb-3 tracking-tight`}>{definition.name}</h2>
            <p className={`${st.textDim} mb-8 max-w-md mx-auto leading-relaxed`}>{definition.description}</p>

            <div>
              <button
                type="button"
                onClick={() => setShowKeyModal(true)}
                className={`${st.cardClasses} ${st.cardGlow} bg-emerald-500/10 border-emerald-400/20 hover:border-emerald-400/40 text-emerald-400 font-medium px-8 py-4 transition flex items-center gap-2 mx-auto text-lg`}
              >
                <Key className="w-5 h-5" />
                Connect API Key to Start
              </button>
            </div>

            <div className={`mt-6 flex items-center justify-center gap-1.5 text-[11px] ${st.textFaint}`}>
              <Shield className="w-3 h-3" />
              Your key stays in your browser. Data is for personal use only.
            </div>
          </div>
        )}

        {/* Dashboard with data */}
        {apiKey && (
          <DashboardShell
            definition={definition}
            onOpenKeyModal={() => setShowKeyModal(true)}
          />
        )}
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
