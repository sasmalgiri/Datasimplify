'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { FreeNavbar } from '@/components/FreeNavbar';
import { Breadcrumb } from '@/components/Breadcrumb';
import { getDashboardBySlug } from '@/lib/live-dashboard/definitions';
import { useLiveDashboardStore, isKeyFreeEndpoints } from '@/lib/live-dashboard/store';
import { DashboardShell } from '@/components/live-dashboard/DashboardShell';
import { ApiKeyModal } from '@/components/live-dashboard/ApiKeyModal';
import { ArrowLeft, Key, Shield, Zap } from 'lucide-react';
import { getSiteThemeClasses } from '@/lib/live-dashboard/theme';

export default function LiveDashboardPage() {
  const params = useParams();
  const slug = params.slug as string;
  const definition = getDashboardBySlug(slug);

  const { apiKey, fetchData, siteTheme } = useLiveDashboardStore();
  const st = getSiteThemeClasses(siteTheme);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);

  // Check if this dashboard can run without a CoinGecko key (DeFi Llama only)
  const isKeyFree = definition ? isKeyFreeEndpoints(definition.requiredEndpoints) : false;
  const canLoad = isKeyFree || !!apiKey;

  const loadData = useCallback(() => {
    if (!definition || !canLoad) return;
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
  }, [definition, canLoad, fetchData]);

  // Auto-load for key-free dashboards immediately, or when API key is available
  useEffect(() => {
    if (canLoad && !initialLoaded) {
      loadData();
    }
  }, [canLoad, initialLoaded, loadData]);

  // Auto-show key modal for dashboards that need a CoinGecko key
  useEffect(() => {
    if (!isKeyFree && !apiKey && !showKeyModal) {
      const timer = setTimeout(() => setShowKeyModal(true), 500);
      return () => clearTimeout(timer);
    }
  }, [isKeyFree, apiKey, showKeyModal]);

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

        {/* No API key state — only for dashboards that need CoinGecko key */}
        {!canLoad && (
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

        {/* Key-free badge for DeFi Llama dashboards */}
        {isKeyFree && !apiKey && (
          <div className="mb-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-400/10 border border-emerald-400/20 text-emerald-400 text-xs">
            <Zap className="w-3.5 h-3.5" />
            <span>This dashboard uses free DeFi Llama data — no API key required!</span>
          </div>
        )}

        {/* Dashboard with data */}
        {canLoad && (
          <DashboardShell
            definition={definition}
            onOpenKeyModal={() => setShowKeyModal(true)}
          />
        )}
      </main>

      <ApiKeyModal
        isOpen={showKeyModal}
        onClose={() => setShowKeyModal(false)}
        onSuccess={loadData}
      />
    </div>
  );
}
