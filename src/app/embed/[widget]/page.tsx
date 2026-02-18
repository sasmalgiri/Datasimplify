'use client';

import { useEffect, useState, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useLiveDashboardStore, type SiteTheme } from '@/lib/live-dashboard/store';
import { DashboardWidget } from '@/components/live-dashboard/DashboardWidget';
import { getSiteThemeClasses } from '@/lib/live-dashboard/theme';

// ── Widget name to data endpoints mapping ──
const WIDGET_ENDPOINTS: Record<string, string[]> = {
  // DeFi Llama widgets (free, no API key needed)
  DefiTVLRankingWidget: ['defillama_protocols'],
  DefiChainTVLWidget: ['defillama_chains'],
  DefiYieldTableWidget: ['defillama_yields'],
  StablecoinDominanceWidget: ['defillama_stablecoins'],
  DefiTVLChartWidget: ['defillama_protocols'],
  ChainCompareWidget: ['defillama_chains'],
  ProtocolTVLHistoryWidget: ['defillama_protocol_tvl'],
  ProtocolInfoWidget: ['defillama_protocol_tvl'],
  ProtocolChainBreakdownWidget: ['defillama_protocol_tvl'],
  ProtocolFeesWidget: ['defillama_fees_overview'],
  DexVolumeOverviewWidget: ['defillama_dex_overview'],
  TopProtocolsCompareWidget: ['defillama_protocols'],

  // CoinGecko widgets (require API key)
  KPICards: ['markets', 'global'],
  TopCoinsTable: ['markets'],
  PriceChartWidget: ['ohlc'],
  GainersLosersWidget: ['markets'],
  FearGreedWidget: ['fear_greed'],
  TrendingWidget: ['trending'],
  DominanceWidget: ['global'],
  CandlestickChartWidget: ['ohlc'],
  VolumeChartWidget: ['markets'],
  HeatmapWidget: ['categories'],
  TreemapWidget: ['markets'],
  MultiLineChartWidget: ['ohlc_multi'],
  RadarChartWidget: ['markets'],
  PieChartWidget: ['global'],
  CorrelationWidget: ['markets'],
  CategoryBarWidget: ['categories'],
  CoinCompareWidget: ['markets'],
  ExchangeVolumeWidget: ['exchanges'],
  SupplyWidget: ['markets'],
  MarketCapTimelineWidget: ['ohlc'],
  BubbleChartWidget: ['markets'],
  AltseasonWidget: ['markets', 'global'],
  HistoricalPriceWidget: ['coin_history'],
  DerivativesTableWidget: ['derivatives'],
  PerformanceHeatmapWidget: ['markets'],
  MiniSparklineGrid: ['markets'],
  BoxPlotWidget: ['markets'],
  ReturnsBarWidget: ['markets'],
  AreaChartWidget: ['markets'],
  WaterfallChartWidget: ['markets'],
  MarketPulseWidget: ['markets', 'global', 'fear_greed'],
  CategoryBadgesWidget: ['categories'],
  DominanceAreaWidget: ['markets', 'global'],
  DrawdownChartWidget: ['markets'],
  ReturnHistogramWidget: ['markets'],
  ComposedChartWidget: ['markets'],
  RadialBarWidget: ['markets'],

  // Sentiment & analytics
  CryptoHealthScoreWidget: ['markets', 'global', 'fear_greed', 'derivatives'],
  SmartSignalWidget: ['markets', 'global', 'fear_greed', 'derivatives'],
  RiskRadarWidget: ['markets', 'global', 'fear_greed', 'derivatives'],
  AlphaFinderWidget: ['markets'],
  VolatilityForecastWidget: ['markets', 'global', 'fear_greed', 'derivatives'],
  MarketBriefWidget: ['markets', 'global', 'fear_greed', 'trending'],
  SectorRotationWidget: ['categories'],
  MoneyFlowIndexWidget: ['markets'],

  // Advanced charts
  SankeyFlowWidget: ['markets'],
  WhaleDistributionWidget: ['markets'],
  SunburstWidget: ['markets'],
  FunnelWidget: ['markets'],
  GaugeClusterWidget: ['markets', 'fear_greed'],
  Scatter3DWidget: ['markets'],

  // Analytics
  TVLIndicatorWidget: ['defi_global'],
  FundingRateWidget: ['derivatives'],
  LiquidationEstimateWidget: ['derivatives'],
  TechnicalScreenerWidget: ['markets'],
  TokenomicsWidget: ['markets'],
  MarketCycleWidget: ['markets', 'global', 'fear_greed'],
  DEXVolumeWidget: ['markets', 'exchanges'],
  OpenInterestWidget: ['derivatives_exchanges'],
  HeikinAshiWidget: ['ohlc'],
};

// ── Human-readable title from widget component name ──
const WIDGET_TITLES: Record<string, string> = {
  DefiTVLRankingWidget: 'DeFi TVL Rankings',
  DefiChainTVLWidget: 'Chain TVL Comparison',
  DefiYieldTableWidget: 'DeFi Yield Pools',
  StablecoinDominanceWidget: 'Stablecoin Dominance',
  DefiTVLChartWidget: 'DeFi TVL Treemap',
  ChainCompareWidget: 'Chain TVL Radar',
  ProtocolTVLHistoryWidget: 'Protocol TVL History',
  ProtocolInfoWidget: 'Protocol Overview',
  ProtocolChainBreakdownWidget: 'Protocol Chain Breakdown',
  ProtocolFeesWidget: 'Protocol Fees & Revenue',
  DexVolumeOverviewWidget: 'DEX Volume Rankings',
  TopProtocolsCompareWidget: 'Top Protocols Compare',
  KPICards: 'Market Stats',
  TopCoinsTable: 'Top Cryptocurrencies',
  PriceChartWidget: 'Price Chart',
  GainersLosersWidget: 'Top Movers (24h)',
  FearGreedWidget: 'Fear & Greed Index',
  TrendingWidget: 'Trending Now',
  DominanceWidget: 'Market Dominance',
  CandlestickChartWidget: 'Candlestick Chart',
  VolumeChartWidget: 'Volume Rankings',
  HeatmapWidget: 'Sector Heatmap',
  TreemapWidget: 'Market Cap Treemap',
  MultiLineChartWidget: 'Multi-Line Chart',
  RadarChartWidget: 'Metric Radar',
  PieChartWidget: 'Market Allocation',
  CorrelationWidget: 'Correlation Matrix',
  CategoryBarWidget: 'Category Performance',
  CoinCompareWidget: 'Coin Comparison',
  ExchangeVolumeWidget: 'Exchange Volume',
  SupplyWidget: 'Supply Analysis',
  MarketCapTimelineWidget: 'Market Cap Timeline',
  BubbleChartWidget: 'Cap vs Performance',
  AltseasonWidget: 'Altseason Gauge',
  HistoricalPriceWidget: 'Historical Price',
  DerivativesTableWidget: 'Derivatives Data',
  PerformanceHeatmapWidget: 'Performance Heatmap',
  MiniSparklineGrid: 'Sparkline Grid',
  BoxPlotWidget: 'Price Distribution',
  ReturnsBarWidget: 'Returns by Timeframe',
  AreaChartWidget: 'Stacked Area Chart',
  WaterfallChartWidget: 'Change Waterfall',
  MarketPulseWidget: 'Market Pulse',
  CategoryBadgesWidget: 'Sector Movers',
  DominanceAreaWidget: 'Dominance Over Time',
  DrawdownChartWidget: 'Drawdown Chart',
  ReturnHistogramWidget: 'Return Distribution',
  ComposedChartWidget: 'Volume & Change',
  RadialBarWidget: 'Radial Bar Chart',
  CryptoHealthScoreWidget: 'Market Health Score',
  SmartSignalWidget: 'Smart Signal',
  RiskRadarWidget: 'Risk Radar',
  AlphaFinderWidget: 'Alpha Finder',
  VolatilityForecastWidget: 'Volatility Forecast',
  MarketBriefWidget: 'Market Brief',
  SectorRotationWidget: 'Sector Rotation',
  MoneyFlowIndexWidget: 'Money Flow Index',
};

// ── Key-free endpoints (no CoinGecko key needed) ──
const KEY_FREE_PREFIXES = ['defillama_', 'fear_greed'];

function areEndpointsKeyFree(endpoints: string[]): boolean {
  return endpoints.every(
    (ep) => KEY_FREE_PREFIXES.some((prefix) => ep.startsWith(prefix))
  );
}

// ── Inner embed content (uses useSearchParams which needs Suspense) ──
function EmbedContent() {
  const params = useParams<{ widget: string }>();
  const searchParams = useSearchParams();

  const widgetName = params.widget || '';
  const theme = (searchParams.get('theme') as SiteTheme) || 'dark';
  const apiKey = searchParams.get('key') || '';

  // Widget-specific params from query string
  const protocolSlug = searchParams.get('protocolSlug') || searchParams.get('slug') || '';
  const coinId = searchParams.get('coinId') || searchParams.get('coin') || '';
  const days = parseInt(searchParams.get('days') || '30', 10);
  const limit = parseInt(searchParams.get('limit') || '20', 10);

  const {
    setApiKey,
    setSiteTheme,
    fetchData,
    data,
    isLoading,
    error,
    siteTheme,
  } = useLiveDashboardStore();

  const [initialized, setInitialized] = useState(false);

  // Initialize store with embed params
  useEffect(() => {
    // Set theme
    setSiteTheme(theme);

    // Set API key if provided
    if (apiKey) {
      const keyType = apiKey.startsWith('CG-') && apiKey.length > 30 ? 'pro' : 'demo';
      setApiKey(apiKey, keyType as 'pro' | 'demo');
    }

    // Determine endpoints for this widget
    const endpoints = WIDGET_ENDPOINTS[widgetName] || ['markets'];
    const keyFree = areEndpointsKeyFree(endpoints);

    // Only fetch if we have a key or the endpoints are key-free
    if (apiKey || keyFree) {
      // Build params for fetch
      const fetchParams: Record<string, any> = {};
      if (protocolSlug) fetchParams.protocolSlug = protocolSlug;
      if (coinId) {
        fetchParams.coinId = coinId;
        fetchParams.coinIds = [coinId];
      }
      fetchParams.days = days;
      fetchParams.limit = limit;

      fetchData(endpoints, fetchParams).then(() => {
        setInitialized(true);
      });
    } else {
      setInitialized(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [widgetName, theme, apiKey, protocolSlug, coinId, days, limit]);

  const st = getSiteThemeClasses(siteTheme);
  const endpoints = WIDGET_ENDPOINTS[widgetName] || ['markets'];
  const keyFree = areEndpointsKeyFree(endpoints);
  const needsKey = !keyFree && !apiKey;

  // Build widget props from query params
  const widgetProps: Record<string, any> = {};
  if (protocolSlug) widgetProps.protocolSlug = protocolSlug;
  if (coinId) {
    widgetProps.coinId = coinId;
    widgetProps.coinIds = [coinId];
  }
  if (days) widgetProps.days = days;
  if (limit) widgetProps.limit = limit;

  const widgetTitle = WIDGET_TITLES[widgetName] || widgetName.replace(/Widget$/, '').replace(/([A-Z])/g, ' $1').trim();

  // Determine grid column based on widget type
  const isFullWidth = ['KPICards', 'MarketPulseWidget', 'TopCoinsTable', 'PerformanceHeatmapWidget', 'MiniSparklineGrid'].includes(widgetName);
  const gridColumn = isFullWidth ? '1 / -1' : '1 / -1';

  return (
    <div
      className={`min-h-screen flex flex-col ${
        siteTheme === 'dark'
          ? 'bg-[#0a0a0f] text-white'
          : 'bg-[#f0f4ff] text-slate-800'
      }`}
    >
      {/* Widget content */}
      <div className="flex-1 p-3 sm:p-4">
        {/* Error: widget not found */}
        {!WIDGET_ENDPOINTS[widgetName] && (
          <div className="flex items-center justify-center h-full min-h-[200px]">
            <div className={`text-center p-6 rounded-2xl ${
              siteTheme === 'dark'
                ? 'bg-red-500/10 border border-red-500/20'
                : 'bg-red-50 border border-red-200'
            }`}>
              <p className={siteTheme === 'dark' ? 'text-red-400' : 'text-red-600'}>
                Widget &quot;{widgetName}&quot; not found.
              </p>
              <p className={`text-sm mt-2 ${siteTheme === 'dark' ? 'text-gray-500' : 'text-slate-500'}`}>
                Check the widget name in the URL path.
              </p>
            </div>
          </div>
        )}

        {/* Error: API key required */}
        {WIDGET_ENDPOINTS[widgetName] && needsKey && (
          <div className="flex items-center justify-center h-full min-h-[200px]">
            <div className={`text-center p-6 rounded-2xl max-w-md ${
              siteTheme === 'dark'
                ? 'bg-yellow-500/10 border border-yellow-500/20'
                : 'bg-yellow-50 border border-yellow-200'
            }`}>
              <p className={siteTheme === 'dark' ? 'text-yellow-400 font-medium' : 'text-yellow-700 font-medium'}>
                API Key Required
              </p>
              <p className={`text-sm mt-2 ${siteTheme === 'dark' ? 'text-gray-400' : 'text-slate-500'}`}>
                This widget requires a CoinGecko API key. Add <code className="px-1.5 py-0.5 rounded bg-black/20 text-xs">?key=YOUR_KEY</code> to the embed URL.
              </p>
            </div>
          </div>
        )}

        {/* Loading state */}
        {WIDGET_ENDPOINTS[widgetName] && !needsKey && isLoading && !initialized && (
          <div className="flex items-center justify-center h-full min-h-[200px]">
            <div className="flex flex-col items-center gap-3">
              <div className={`w-8 h-8 border-2 rounded-full animate-spin ${
                siteTheme === 'dark'
                  ? 'border-emerald-400/30 border-t-emerald-400'
                  : 'border-emerald-500/30 border-t-emerald-500'
              }`} />
              <p className={`text-sm ${siteTheme === 'dark' ? 'text-gray-500' : 'text-slate-400'}`}>
                Loading data...
              </p>
            </div>
          </div>
        )}

        {/* Fetch error */}
        {WIDGET_ENDPOINTS[widgetName] && !needsKey && error && initialized && (
          <div className="flex items-center justify-center h-full min-h-[200px]">
            <div className={`text-center p-6 rounded-2xl max-w-md ${
              siteTheme === 'dark'
                ? 'bg-red-500/10 border border-red-500/20'
                : 'bg-red-50 border border-red-200'
            }`}>
              <p className={siteTheme === 'dark' ? 'text-red-400' : 'text-red-600'}>
                Failed to load data
              </p>
              <p className={`text-sm mt-2 ${siteTheme === 'dark' ? 'text-gray-500' : 'text-slate-500'}`}>
                {error}
              </p>
            </div>
          </div>
        )}

        {/* Widget rendered */}
        {WIDGET_ENDPOINTS[widgetName] && !needsKey && initialized && (
          <DashboardWidget
            component={widgetName}
            title={widgetTitle}
            gridColumn={gridColumn}
            props={widgetProps}
          />
        )}
      </div>

      {/* Footer */}
      <div className={`px-4 py-2 flex items-center justify-center gap-1.5 text-[10px] ${
        siteTheme === 'dark'
          ? 'border-t border-white/[0.06] text-gray-600'
          : 'border-t border-blue-200/30 text-slate-400'
      }`}>
        <span>Powered by</span>
        <a
          href="https://cryptoreportkit.com"
          target="_blank"
          rel="noopener noreferrer"
          className={`font-medium hover:underline ${
            siteTheme === 'dark' ? 'text-emerald-500 hover:text-emerald-400' : 'text-emerald-600 hover:text-emerald-500'
          }`}
        >
          CryptoReportKit
        </a>
      </div>
    </div>
  );
}

// ── Page component with Suspense boundary for useSearchParams ──
export default function EmbedPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
            <p className="text-sm text-gray-500">Loading widget...</p>
          </div>
        </div>
      }
    >
      <EmbedContent />
    </Suspense>
  );
}
