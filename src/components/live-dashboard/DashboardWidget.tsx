'use client';

import { Suspense, type ComponentType } from 'react';
import { AlertCircle } from 'lucide-react';
import { CARD_CLASSES, getThemeColors } from '@/lib/live-dashboard/theme';
import { useLiveDashboardStore } from '@/lib/live-dashboard/store';

// Widget registry — maps component name strings to actual components
import { KPICards } from './widgets/KPICards';
import { TopCoinsTable } from './widgets/TopCoinsTable';
import { PriceChartWidget } from './widgets/PriceChartWidget';
import { GainersLosersWidget } from './widgets/GainersLosersWidget';
import { FearGreedWidget } from './widgets/FearGreedWidget';
import { TrendingWidget } from './widgets/TrendingWidget';
import { DominanceWidget } from './widgets/DominanceWidget';
// Phase 2 widgets (lazy-loaded via dynamic import is not needed — tree-shaking handles it)
import { CandlestickChartWidget } from './widgets/CandlestickChartWidget';
import { VolumeChartWidget } from './widgets/VolumeChartWidget';
import { HeatmapWidget } from './widgets/HeatmapWidget';
import { TreemapWidget } from './widgets/TreemapWidget';
import { MultiLineChartWidget } from './widgets/MultiLineChartWidget';
import { RadarChartWidget } from './widgets/RadarChartWidget';
import { PieChartWidget } from './widgets/PieChartWidget';
import { CorrelationWidget } from './widgets/CorrelationWidget';
import { CategoryBarWidget } from './widgets/CategoryBarWidget';
import { CoinCompareWidget } from './widgets/CoinCompareWidget';
import { ExchangeVolumeWidget } from './widgets/ExchangeVolumeWidget';
import { SupplyWidget } from './widgets/SupplyWidget';
import { MarketCapTimelineWidget } from './widgets/MarketCapTimelineWidget';
// Phase 3 widgets
import { BubbleChartWidget } from './widgets/BubbleChartWidget';
import { AltseasonWidget } from './widgets/AltseasonWidget';
import { HistoricalPriceWidget } from './widgets/HistoricalPriceWidget';
import { DerivativesTableWidget } from './widgets/DerivativesTableWidget';
import { PerformanceHeatmapWidget } from './widgets/PerformanceHeatmapWidget';
import { MiniSparklineGrid } from './widgets/MiniSparklineGrid';
// Phase 4 comparison widgets
import { BoxPlotWidget } from './widgets/BoxPlotWidget';
import { ReturnsBarWidget } from './widgets/ReturnsBarWidget';
// Phase 5 advanced charts
import { AreaChartWidget } from './widgets/AreaChartWidget';
import { WaterfallChartWidget } from './widgets/WaterfallChartWidget';
// Phase 6 value-add widgets
import { MarketPulseWidget } from './widgets/MarketPulseWidget';
import { CategoryBadgesWidget } from './widgets/CategoryBadgesWidget';
import { PriceConverterWidget } from './widgets/PriceConverterWidget';
import { WatchlistWidget } from './widgets/WatchlistWidget';
import { PriceAlertWidget } from './widgets/PriceAlertWidget';
// Phase 7 advanced charts
import { SankeyFlowWidget } from './widgets/SankeyFlowWidget';
import { WhaleDistributionWidget } from './widgets/WhaleDistributionWidget';
import { SunburstWidget } from './widgets/SunburstWidget';
import { FunnelWidget } from './widgets/FunnelWidget';
import { GaugeClusterWidget } from './widgets/GaugeClusterWidget';
import { Scatter3DWidget } from './widgets/Scatter3DWidget';
// Phase 8 pro charts
import { RadialBarWidget } from './widgets/RadialBarWidget';
import { ComposedChartWidget } from './widgets/ComposedChartWidget';
import { DominanceAreaWidget } from './widgets/DominanceAreaWidget';
import { DrawdownChartWidget } from './widgets/DrawdownChartWidget';
import { HeikinAshiWidget } from './widgets/HeikinAshiWidget';
import { ReturnHistogramWidget } from './widgets/ReturnHistogramWidget';

const WIDGET_REGISTRY: Record<string, ComponentType<any>> = {
  KPICards,
  TopCoinsTable,
  PriceChartWidget,
  GainersLosersWidget,
  FearGreedWidget,
  TrendingWidget,
  DominanceWidget,
  CandlestickChartWidget,
  VolumeChartWidget,
  HeatmapWidget,
  TreemapWidget,
  MultiLineChartWidget,
  RadarChartWidget,
  PieChartWidget,
  CorrelationWidget,
  CategoryBarWidget,
  CoinCompareWidget,
  ExchangeVolumeWidget,
  SupplyWidget,
  MarketCapTimelineWidget,
  BubbleChartWidget,
  AltseasonWidget,
  HistoricalPriceWidget,
  DerivativesTableWidget,
  PerformanceHeatmapWidget,
  MiniSparklineGrid,
  BoxPlotWidget,
  ReturnsBarWidget,
  AreaChartWidget,
  WaterfallChartWidget,
  MarketPulseWidget,
  CategoryBadgesWidget,
  PriceConverterWidget,
  WatchlistWidget,
  PriceAlertWidget,
  SankeyFlowWidget,
  WhaleDistributionWidget,
  SunburstWidget,
  FunnelWidget,
  GaugeClusterWidget,
  Scatter3DWidget,
  RadialBarWidget,
  ComposedChartWidget,
  DominanceAreaWidget,
  DrawdownChartWidget,
  HeikinAshiWidget,
  ReturnHistogramWidget,
};

/** Contextual descriptions for each widget — explains what it shows and how to read it */
const WIDGET_DESCRIPTIONS: Record<string, string> = {
  // Market Overview
  TopCoinsTable: 'Full rankings table — click column headers to sort. Green = gaining, Red = losing.',
  PriceChartWidget: 'Price trend over time — drag to zoom, hover for exact values. Uptrend = bullish momentum.',
  GainersLosersWidget: 'Biggest winners & losers in the last 24 hours — spot momentum shifts early.',
  FearGreedWidget: '0 = Extreme Fear (buy opportunity?), 100 = Extreme Greed (sell signal?). Based on volatility, volume & social data.',
  TrendingWidget: 'Most searched coins on CoinGecko right now — early signal for breakout interest.',
  DominanceWidget: 'BTC & ETH share of total crypto market cap — rising BTC dominance often means "risk-off" market.',

  // Price Charts
  CandlestickChartWidget: 'OHLC candles — green body = price closed higher, red = closed lower. Wicks show intra-period range.',
  HeikinAshiWidget: 'Smoothed candlesticks — removes noise. Consecutive green = strong uptrend, consecutive red = strong downtrend.',
  HistoricalPriceWidget: 'Long-term price history — zoom out to identify major support/resistance levels and macro trends.',

  // Volume & Liquidity
  VolumeChartWidget: 'Trading volume by coin — higher volume = stronger conviction behind price moves.',
  ExchangeVolumeWidget: 'Volume by exchange — see where most trading activity happens. Higher = more liquidity.',

  // Market Structure
  TreemapWidget: 'Block size = market cap. Bigger block = bigger coin. Color intensity = 24h price change magnitude.',
  PieChartWidget: 'Market share breakdown — quickly see which coins or sectors dominate the total market.',
  MarketCapTimelineWidget: 'Market cap over time — tracks how total valuation grows or shrinks.',
  SupplyWidget: 'Circulating vs max supply — coins closer to max supply have less inflation pressure.',

  // Sector & Category
  HeatmapWidget: 'Sector performance heatmap — dark green = sector booming, dark red = sector struggling.',
  CategoryBarWidget: 'Category returns side-by-side — compare which crypto sectors are leading or lagging.',
  CategoryBadgesWidget: 'Quick sector pulse — green badges = sectors gaining, red = losing. Spot sector rotation.',

  // Comparison & Analysis
  MultiLineChartWidget: 'Normalized price overlay (% change) — compare coins on equal footing regardless of price.',
  CoinCompareWidget: 'Side-by-side coin metrics table — compare fundamentals like MCap, volume, supply at a glance.',
  CorrelationWidget: 'How coins move together — 1.0 = perfect correlation, -1.0 = inverse. Helps diversify portfolios.',
  RadarChartWidget: 'Multi-metric radar — larger area = stronger across all metrics. Compare coin "shapes" visually.',
  BoxPlotWidget: '7-day price distribution — box = typical range, whiskers = extremes. Spot which coins are most volatile.',
  ReturnsBarWidget: 'Returns across timeframes — compare 24h, 7d, 30d performance. Spot trend acceleration or reversal.',
  BubbleChartWidget: 'X = market cap, Y = performance, bubble size = volume. Top-right = large & gaining. Bottom-left = small & losing.',

  // Stacked & Area
  AreaChartWidget: 'Stacked volume/mcap over 7 days — see how coins contribute to total. Growing area = gaining share.',
  DominanceAreaWidget: 'Market dominance over time — see BTC/ETH/alt shares shift. Rising alt share = "altseason" building.',

  // Advanced Analytics
  WaterfallChartWidget: 'Cumulative impact — see how each coin adds or subtracts from total 24h change. Identifies market movers.',
  DrawdownChartWidget: 'Drop from 7-day peak — deeper dip = more pain. Coins at 0% = currently at their 7d high.',
  ReturnHistogramWidget: 'Distribution of 24h returns — bell shape = normal market. Skewed right = more winners than losers.',

  // Sentiment
  AltseasonWidget: 'Altseason Index — above 75% = altcoins outperforming BTC (altseason). Below 25% = BTC dominates.',
  PerformanceHeatmapWidget: 'Multi-timeframe heatmap — green cells = gaining, red = losing. Spot which coins are consistently strong.',
  MiniSparklineGrid: 'Sparkline grid — mini 7-day charts at a glance. Spot trends without needing detailed charts.',

  // Advanced Charts
  SankeyFlowWidget: 'Capital flow from market cap tiers to performance. Thick bands = more capital moving in that direction.',
  WhaleDistributionWidget: 'Market cap treemap by holder tier — block size = share of total market. See where the money concentrates.',
  SunburstWidget: 'Hierarchical market structure — inner ring = cap tier, outer ring = individual coins. Green = gaining, red = losing.',
  FunnelWidget: 'Market cap funnel — top = largest coin, narrowing down. Shows the scale difference between top coins.',
  GaugeClusterWidget: 'Three health meters — Momentum (% green coins), Volatility (market swings), Volume (trading activity). Green zone = healthy.',
  Scatter3DWidget: '3D market explorer — X = market cap, Y = volume, Z = 24h change. Rotate to explore. Warm colors = gaining.',
  RadialBarWidget: 'Polar bar chart — bar length = relative size. Compare coins circularly. Longer bar = larger value.',
  ComposedChartWidget: 'Volume bars + 24h change line overlay — see if price moves are backed by volume. Volume + rise = strong signal.',

  // Utility widgets
  PriceConverterWidget: 'Quick crypto-to-fiat converter — enter an amount and see real-time conversion.',
  WatchlistWidget: 'Your personal watchlist — track the coins you care about most.',
  PriceAlertWidget: 'Set price alerts — get notified when coins hit your target levels.',

  // Derivatives
  DerivativesTableWidget: 'Futures & perpetuals data — funding rates, open interest, and volume across exchanges.',
};

interface DashboardWidgetProps {
  component: string;
  title: string;
  gridColumn: string;
  gridRow?: string;
  props?: Record<string, any>;
}

export function DashboardWidget({ component, title, gridColumn, gridRow, props }: DashboardWidgetProps) {
  const Component = WIDGET_REGISTRY[component];
  const colorTheme = useLiveDashboardStore((s) => s.customization.colorTheme);
  const themeColors = getThemeColors(colorTheme);
  const description = WIDGET_DESCRIPTIONS[component];

  // KPI cards and market pulse get no wrapper card (they are their own cards)
  if (component === 'KPICards' || component === 'MarketPulseWidget') {
    return (
      <div style={{ gridColumn, gridRow }}>
        {Component ? <Component {...(props || {})} /> : <UnknownWidget name={component} />}
      </div>
    );
  }

  return (
    <div
      className={`${CARD_CLASSES} p-5 flex flex-col`}
      style={{ gridColumn, gridRow }}
    >
      <div className="mb-4">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest flex items-center gap-2">
          <div className="w-1 h-3.5 rounded-full" style={{ backgroundColor: themeColors.primary }} />
          {title}
        </h3>
        {description && (
          <p className="text-[10px] text-gray-500 mt-1 ml-3 leading-relaxed">{description}</p>
        )}
      </div>
      <div className="flex-1 min-h-0">
        <Suspense fallback={<WidgetSkeleton />}>
          {Component ? <Component {...(props || {})} /> : <UnknownWidget name={component} />}
        </Suspense>
      </div>
    </div>
  );
}

function WidgetSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="h-4 bg-white/[0.04] rounded w-3/4" />
      <div className="h-4 bg-white/[0.04] rounded w-1/2" />
      <div className="h-24 bg-white/[0.04] rounded" />
    </div>
  );
}

function UnknownWidget({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-2 text-gray-500 text-sm p-4">
      <AlertCircle className="w-4 h-4" />
      Widget &quot;{name}&quot; not found
    </div>
  );
}
