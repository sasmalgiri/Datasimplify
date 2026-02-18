'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { FreeNavbar } from '@/components/FreeNavbar';
import { Breadcrumb } from '@/components/Breadcrumb';
import { useLiveDashboardStore } from '@/lib/live-dashboard/store';
import { DashboardShell } from '@/components/live-dashboard/DashboardShell';
import { ApiKeyModal } from '@/components/live-dashboard/ApiKeyModal';
import { ArrowLeft, Key, Shield } from 'lucide-react';
import { getSiteThemeClasses } from '@/lib/live-dashboard/theme';
import type { LiveDashboardDefinition } from '@/lib/live-dashboard/definitions';

/** Convert a CoinGecko slug to a pretty display name.
 *  e.g. 'solana' → 'Solana', 'bitcoin-cash' → 'Bitcoin Cash' */
function prettifyName(id: string): string {
  return id
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/** Build a LiveDashboardDefinition on-the-fly for any CoinGecko coin id. */
function buildDefinition(id: string): LiveDashboardDefinition {
  const name = prettifyName(id);

  return {
    slug: `coin-${id}`,
    name: `${name} Dashboard`,
    description: `Live ${name} analytics — candlestick, historical price, market cap, volume, sentiment, dominance, and full market context.`,
    icon: '\uD83E\uDE99',
    tier: 'free',
    gridColumns: 4,
    requiredEndpoints: ['markets', 'global', 'fear_greed', 'ohlc', 'coin_history'],
    widgets: [
      { id: 'kpis', component: 'KPICards', title: `${name} Stats`, gridColumn: '1 / -1', dataEndpoints: ['markets', 'global'], props: { mode: 'bitcoin' }, mobileOrder: 1 },
      { id: 'candlestick', component: 'CandlestickChartWidget', title: `${name} Candlestick (30d)`, gridColumn: 'span 2', dataEndpoints: ['ohlc'], props: { coinId: id, days: 30 }, mobileOrder: 2 },
      { id: 'historical', component: 'HistoricalPriceWidget', title: `${name} Historical (90d)`, gridColumn: 'span 2', dataEndpoints: ['coin_history'], props: { coinId: id, days: 90 }, mobileOrder: 3 },
      { id: 'price-chart', component: 'PriceChartWidget', title: `${name} Price Trend (30d)`, gridColumn: 'span 2', dataEndpoints: ['ohlc'], props: { coinId: id, days: 30 }, mobileOrder: 4 },
      { id: 'mcap-timeline', component: 'MarketCapTimelineWidget', title: `${name} Market Cap (30d)`, gridColumn: 'span 2', dataEndpoints: ['ohlc'], props: { coinId: id, days: 30 }, mobileOrder: 5 },
      { id: 'area-vol', component: 'AreaChartWidget', title: 'Stacked Volume (7d)', gridColumn: 'span 2', dataEndpoints: ['markets'], props: { limit: 6, mode: 'volume' }, mobileOrder: 6 },
      { id: 'waterfall', component: 'WaterfallChartWidget', title: '24h Change Waterfall', gridColumn: 'span 2', dataEndpoints: ['markets'], props: { limit: 10 }, mobileOrder: 7 },
      { id: 'fear-greed', component: 'FearGreedWidget', title: 'Market Sentiment', gridColumn: 'span 2', dataEndpoints: ['fear_greed'], mobileOrder: 8 },
      { id: 'dominance', component: 'DominanceWidget', title: 'Market Dominance', gridColumn: 'span 2', dataEndpoints: ['global'], mobileOrder: 9 },
      { id: 'radar', component: 'RadarChartWidget', title: 'Metric Radar', gridColumn: 'span 2', dataEndpoints: ['markets'], mobileOrder: 10 },
      { id: 'boxplot', component: 'BoxPlotWidget', title: '7d Distribution', gridColumn: 'span 2', dataEndpoints: ['markets'], props: { limit: 8 }, mobileOrder: 11 },
      { id: 'supply', component: 'SupplyWidget', title: 'Supply Analysis', gridColumn: 'span 2', dataEndpoints: ['markets'], props: { limit: 10 }, mobileOrder: 12 },
      { id: 'perf-heatmap', component: 'PerformanceHeatmapWidget', title: 'Performance Heatmap', gridColumn: '1 / -1', dataEndpoints: ['markets'], props: { limit: 15 }, mobileOrder: 13 },
      { id: 'top-coins', component: 'TopCoinsTable', title: 'Market Context', gridColumn: '1 / -1', dataEndpoints: ['markets'], props: { limit: 15 }, mobileOrder: 14 },
    ],
  };
}

export default function CoinDashboardPage() {
  const params = useParams();
  const id = params.id as string;

  const definition = useMemo(() => buildDefinition(id), [id]);
  const name = prettifyName(id);

  const { apiKey, fetchData, siteTheme } = useLiveDashboardStore();
  const st = getSiteThemeClasses(siteTheme);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);

  const loadData = useCallback(() => {
    if (!apiKey) return;
    fetchData(definition.requiredEndpoints, {
      coinId: id,
      historyCoinId: id,
      historyDays: 90,
      detailCoinId: id,
    });
    setInitialLoaded(true);
  }, [apiKey, fetchData, definition.requiredEndpoints, id]);

  // Auto-load when API key is available
  useEffect(() => {
    if (apiKey && !initialLoaded) {
      loadData();
    }
  }, [apiKey, initialLoaded, loadData]);

  // Auto-show key modal if no key stored
  useEffect(() => {
    if (!apiKey && !showKeyModal) {
      const timer = setTimeout(() => setShowKeyModal(true), 500);
      return () => clearTimeout(timer);
    }
  }, [apiKey, showKeyModal]);

  return (
    <div className={`min-h-screen ${st.pageBg}`} data-dashboard-theme={siteTheme}>
      <FreeNavbar />
      <Breadcrumb customTitle={`${name} Dashboard`} />

      <main className="max-w-7xl mx-auto px-4 py-6">
        <Link
          href="/live-dashboards/explore"
          className={`inline-flex items-center gap-1.5 ${st.linkText} text-sm mb-6 transition`}
        >
          <ArrowLeft className="w-4 h-4" />
          Explore Dashboards
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

      <ApiKeyModal
        isOpen={showKeyModal}
        onClose={() => setShowKeyModal(false)}
        onSuccess={loadData}
      />
    </div>
  );
}
