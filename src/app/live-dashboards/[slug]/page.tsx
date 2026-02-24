'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { FreeNavbar } from '@/components/FreeNavbar';
import { Breadcrumb } from '@/components/Breadcrumb';
import { getDashboardBySlug } from '@/lib/live-dashboard/definitions';
import { useShallow } from 'zustand/react/shallow';
import { useLiveDashboardStore, isKeyFreeEndpoints } from '@/lib/live-dashboard/store';
import { DashboardShell } from '@/components/live-dashboard/DashboardShell';
import { ApiKeyModal } from '@/components/live-dashboard/ApiKeyModal';
import { ArrowLeft, Key, Shield, Zap } from 'lucide-react';
import { getSiteThemeClasses } from '@/lib/live-dashboard/theme';

export default function LiveDashboardPage() {
  const params = useParams();
  const slug = params.slug as string;
  const definition = getDashboardBySlug(slug);

  const { apiKey, fetchData, siteTheme } = useLiveDashboardStore(
    useShallow((s) => ({ apiKey: s.apiKey, fetchData: s.fetchData, siteTheme: s.siteTheme })),
  );
  const st = getSiteThemeClasses(siteTheme);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);

  // Check if this dashboard can run without a CoinGecko key (DeFi Llama only)
  const isKeyFree = definition ? isKeyFreeEndpoints(definition.requiredEndpoints) : false;

  const loadData = useCallback(() => {
    if (!definition) return;
    const c = useLiveDashboardStore.getState().customization;
    const params: Record<string, any> = {};

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
    setInitialLoaded(true);
  }, [definition, fetchData]);

  // Auto-load on mount
  useEffect(() => {
    if (!initialLoaded) {
      loadData();
    }
  }, [initialLoaded, loadData]);

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

        {/* Key-free badge for DeFi Llama dashboards */}
        {isKeyFree && !apiKey && (
          <div className="mb-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-400/10 border border-emerald-400/20 text-emerald-400 text-xs">
            <Zap className="w-3.5 h-3.5" />
            <span>This dashboard uses free DeFi Llama data — no API key required!</span>
          </div>
        )}

        {/* Shared key notice — browsing without personal key */}
        {!isKeyFree && !apiKey && (
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

      <ApiKeyModal
        isOpen={showKeyModal}
        onClose={() => setShowKeyModal(false)}
        onSuccess={loadData}
      />
    </div>
  );
}
