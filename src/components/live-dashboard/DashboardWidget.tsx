'use client';

import { Suspense, useState, type ComponentType } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { AlertCircle, Code, FlaskConical } from 'lucide-react';
import { getThemeColors, getSiteThemeClasses } from '@/lib/live-dashboard/theme';
import { useLiveDashboardStore } from '@/lib/live-dashboard/store';
import { useExperimentStore } from '@/lib/live-dashboard/experimentStore';
import { EmbedCodeModal } from './EmbedCodeModal';

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
// Phase 9 analytics widgets
import { TVLIndicatorWidget } from './widgets/TVLIndicatorWidget';
import { FundingRateWidget } from './widgets/FundingRateWidget';
import { LiquidationEstimateWidget } from './widgets/LiquidationEstimateWidget';
import { TechnicalScreenerWidget } from './widgets/TechnicalScreenerWidget';
import { TokenomicsWidget } from './widgets/TokenomicsWidget';
import { MarketCycleWidget } from './widgets/MarketCycleWidget';
import { DEXVolumeWidget } from './widgets/DEXVolumeWidget';
import { OpenInterestWidget } from './widgets/OpenInterestWidget';
// Phase 10 combined intelligence widgets
import { CryptoHealthScoreWidget } from './widgets/CryptoHealthScoreWidget';
import { SmartSignalWidget } from './widgets/SmartSignalWidget';
import { RiskRadarWidget } from './widgets/RiskRadarWidget';
import { AlphaFinderWidget } from './widgets/AlphaFinderWidget';
import { VolatilityForecastWidget } from './widgets/VolatilityForecastWidget';
import { MarketBriefWidget } from './widgets/MarketBriefWidget';
import { SectorRotationWidget } from './widgets/SectorRotationWidget';
import { MoneyFlowIndexWidget } from './widgets/MoneyFlowIndexWidget';
// Phase 11 new feature widgets
import { CycleComparisonWidget } from './widgets/CycleComparisonWidget';
import { TaxReportWidget } from './widgets/TaxReportWidget';
import { DCASimulatorWidget } from './widgets/DCASimulatorWidget';
import { DCATrackerWidget } from './widgets/DCATrackerWidget';
import { ScreenerWidget } from './widgets/ScreenerWidget';
import { PortfolioInputWidget } from './widgets/PortfolioInputWidget';
import { PLSummaryWidget } from './widgets/PLSummaryWidget';
import { PLChartWidget } from './widgets/PLChartWidget';
import { AllocationPieWidget } from './widgets/AllocationPieWidget';
import { ExchangeBalanceWidget } from './widgets/ExchangeBalanceWidget';
// Phase 12 DeFi Llama widgets
import { DefiTVLRankingWidget } from './widgets/DefiTVLRankingWidget';
import { DefiChainTVLWidget } from './widgets/DefiChainTVLWidget';
import { DefiYieldTableWidget } from './widgets/DefiYieldTableWidget';
import { StablecoinDominanceWidget } from './widgets/StablecoinDominanceWidget';
import { DefiTVLChartWidget } from './widgets/DefiTVLChartWidget';
import { ChainCompareWidget } from './widgets/ChainCompareWidget';
// Phase 12 Alchemy wallet widgets
import { WalletPortfolioWidget } from './widgets/WalletPortfolioWidget';
import { WalletActivityWidget } from './widgets/WalletActivityWidget';
import { WalletAllocationWidget } from './widgets/WalletAllocationWidget';
// Phase 13 Protocol DeFi Llama widgets
import { ProtocolTVLHistoryWidget } from './widgets/ProtocolTVLHistoryWidget';
import { ProtocolInfoWidget } from './widgets/ProtocolInfoWidget';
import { ProtocolChainBreakdownWidget } from './widgets/ProtocolChainBreakdownWidget';
import { DexVolumeOverviewWidget } from './widgets/DexVolumeOverviewWidget';
import { ProtocolFeesWidget } from './widgets/ProtocolFeesWidget';
import { TopProtocolsCompareWidget } from './widgets/TopProtocolsCompareWidget';

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
  TVLIndicatorWidget,
  FundingRateWidget,
  LiquidationEstimateWidget,
  TechnicalScreenerWidget,
  TokenomicsWidget,
  MarketCycleWidget,
  DEXVolumeWidget,
  OpenInterestWidget,
  CryptoHealthScoreWidget,
  SmartSignalWidget,
  RiskRadarWidget,
  AlphaFinderWidget,
  VolatilityForecastWidget,
  MarketBriefWidget,
  SectorRotationWidget,
  MoneyFlowIndexWidget,
  // Phase 11 new feature widgets
  CycleComparisonWidget,
  TaxReportWidget,
  DCASimulatorWidget,
  DCATrackerWidget,
  ScreenerWidget,
  PortfolioInputWidget,
  PLSummaryWidget,
  PLChartWidget,
  AllocationPieWidget,
  ExchangeBalanceWidget,
  // Phase 12 DeFi Llama
  DefiTVLRankingWidget,
  DefiChainTVLWidget,
  DefiYieldTableWidget,
  StablecoinDominanceWidget,
  DefiTVLChartWidget,
  ChainCompareWidget,
  // Phase 12 Alchemy
  WalletPortfolioWidget,
  WalletActivityWidget,
  WalletAllocationWidget,
  // Phase 13 Protocol DeFi Llama
  ProtocolTVLHistoryWidget,
  ProtocolInfoWidget,
  ProtocolChainBreakdownWidget,
  DexVolumeOverviewWidget,
  ProtocolFeesWidget,
  TopProtocolsCompareWidget,
};

/** Contextual descriptions for each widget — explains what it shows and how to read it */
export const WIDGET_DESCRIPTIONS: Record<string, string> = {
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

  // Phase 9 analytics
  TVLIndicatorWidget: 'DeFi fundamentals — total DeFi market cap, DeFi/ETH ratio, dominance, and 24h trading volume.',
  FundingRateWidget: 'Perpetual funding rates — green = longs pay shorts (bullish), red = shorts pay longs (bearish). Sorted by magnitude.',
  LiquidationEstimateWidget: 'Leverage risk gauge — estimates market leverage by comparing derivatives open interest to spot volume. Higher = riskier.',
  TechnicalScreenerWidget: 'Multi-coin screener — RSI(14), MA crossovers, and momentum signals. Red badge = overbought, green = oversold.',
  TokenomicsWidget: 'Supply analysis — bar shows % of max supply released. Nx = FDV/MCap ratio. Low float and high FDV tokens flagged.',
  MarketCycleWidget: 'Composite cycle indicator — combines ATH distance, Fear & Greed, BTC dominance, and momentum to estimate market phase.',
  DEXVolumeWidget: 'DEX vs CEX volume split — pie shows market share. Rankings show top decentralized exchanges by estimated volume.',
  OpenInterestWidget: 'Derivatives exchanges ranked by open interest (BTC). Longer bar = more open positions. Includes perp and futures pair counts.',

  // Phase 10 combined intelligence
  CryptoHealthScoreWidget: 'Market health grade (A-F) combining breadth, volume, sentiment, leverage, and sector balance into one score. A = strong market, F = critical.',
  SmartSignalWidget: 'Buy/Hold/Sell signal combining trend momentum, sentiment, and leverage risk. Traffic light format with confidence %. Green = buy, red = sell.',
  RiskRadarWidget: '5-axis risk radar — leverage, volatility, concentration, sentiment, and correlation risk. Larger area = more risk. Includes auto-generated warnings.',
  AlphaFinderWidget: 'Hidden momentum detector — finds coins with unusual volume surges, strong price slopes, and relative strength vs market. Excludes BTC/ETH/BNB.',
  VolatilityForecastWidget: 'Volatility storm warning — combines price compression, leverage build, sentiment extremes, and range tightening. Calm → Building → Storm.',
  MarketBriefWidget: 'Executive summary in 6 bullet points — market direction, top mover, risk status, sector leader, trending coins, and key numbers. Urgency-coded dots.',
  SectorRotationWidget: 'Where is money moving? Shows sectors outperforming (inflow) vs underperforming (outflow) relative to market average. Spot rotation early.',
  MoneyFlowIndexWidget: 'Buying vs selling pressure gauge (0-100) — analyzes price×volume flow direction across top 20 coins. Detects accumulation, distribution, and divergences.',

  // Phase 11 new feature widgets
  CycleComparisonWidget: 'BTC halving cycle overlay — compares 2012, 2016, 2020, and current 2024 cycles on a normalized scale. Spot where we are relative to past cycles.',
  TaxReportWidget: 'Tax calculator — input buy/sell trades, calculate FIFO/LIFO/AVG cost basis, view realized gains summary, and export IRS Form 8949 CSV.',
  DCASimulatorWidget: 'DCA simulator — "What if you invested $X/week into BTC?" Compares DCA vs lump sum strategy with interactive chart.',
  DCATrackerWidget: 'DCA purchase log — track actual dollar-cost-average purchases with running P&L against current market prices.',
  ScreenerWidget: 'Smart coin screener — filter by 24h%, 7d%, market cap, volume, price, rank with AND conditions. Save custom presets.',
  PortfolioInputWidget: 'Portfolio input — add holdings with buy price and date. See real-time P&L per position against current market prices.',
  PLSummaryWidget: 'P&L summary table — aggregated view of portfolio holdings with unrealized gains/losses grouped by coin.',
  PLChartWidget: 'P&L bar chart — visual comparison of gains and losses per holding. Green = profit, Red = loss.',
  AllocationPieWidget: 'Portfolio allocation pie — see how your holdings are distributed by current market value.',
  ExchangeBalanceWidget: 'Multi-exchange balances — connect Binance, Coinbase, Kraken, KuCoin, Bybit, OKX with read-only API keys. Unified balance view.',

  // Phase 12 DeFi Llama (free, no key needed)
  DefiTVLRankingWidget: 'Top DeFi protocols ranked by Total Value Locked (TVL). Green/red shows 24h and 7d TVL changes. Data from DeFi Llama (free).',
  DefiChainTVLWidget: 'Blockchain TVL comparison — see which chains hold the most DeFi capital. Longer bar = more TVL locked on that chain.',
  DefiYieldTableWidget: 'Best DeFi yield pools sorted by TVL. Shows APY breakdown (base + reward). Stablecoin pools marked for lower risk.',
  StablecoinDominanceWidget: 'Stablecoin market share — see which stablecoins dominate by circulating supply. Total market shown above chart.',
  DefiTVLChartWidget: 'DeFi protocol TVL treemap — block size = TVL share. Color shows 24h change direction (green = growing, red = declining).',
  ChainCompareWidget: 'Multi-chain TVL radar — compare top blockchains on a normalized scale. Larger area = more TVL relative to others.',

  // Phase 12 Alchemy wallet (BYOK)
  WalletPortfolioWidget: 'On-chain wallet balances — ETH balance + all ERC-20 tokens. Connect Alchemy key to view. Data from Alchemy (BYOK).',
  WalletActivityWidget: 'Recent wallet transactions — inbound (green) and outbound (red) transfers. Shows asset, value, and transaction hash.',
  WalletAllocationWidget: 'Wallet token allocation pie chart — see how your on-chain holdings are distributed across ETH and ERC-20 tokens.',

  // Phase 13 Protocol DeFi Llama
  ProtocolTVLHistoryWidget: 'Protocol TVL over time — 90-day history showing how total value locked has changed. Rising TVL = growing confidence.',
  ProtocolInfoWidget: 'Protocol overview card — name, category, chains, TVL, market cap, and description. Quick snapshot of any DeFi protocol.',
  ProtocolChainBreakdownWidget: 'TVL by chain — pie chart showing how a protocol distributes its TVL across different blockchains.',
  DexVolumeOverviewWidget: 'DEX volume rankings — top decentralized exchanges by 24h trading volume with 1d and 7d change indicators.',
  ProtocolFeesWidget: 'Protocol fees & revenue — ranking of DeFi protocols by fees generated (24h, 7d, 30d). Higher fees = more usage.',
  TopProtocolsCompareWidget: 'Multi-protocol TVL comparison — overlay top DeFi protocols on one chart to compare TVL growth trends.',
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
  const siteTheme = useLiveDashboardStore((s) => s.siteTheme);
  const themeColors = getThemeColors(colorTheme);
  const st = getSiteThemeClasses(siteTheme);
  const description = WIDGET_DESCRIPTIONS[component];
  const [embedOpen, setEmbedOpen] = useState(false);

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
      className={`group ${st.cardClasses} ${st.cardHover} p-5 flex flex-col`}
      style={{ gridColumn, gridRow }}
    >
      <div className="mb-4">
        <h3 className={`text-xs font-semibold ${st.textMuted} uppercase tracking-widest flex items-center gap-2`}>
          <div className="w-1 h-3.5 rounded-full" style={{ backgroundColor: themeColors.primary }} />
          {title}
          <button
            type="button"
            onClick={() => {
              useExperimentStore.getState().open();
              useExperimentStore.getState().setFocusWidget(component);
            }}
            className={`ml-auto p-1 rounded ${st.textDim} hover:text-emerald-400 transition opacity-0 group-hover:opacity-100`}
            title="Open in Experiment Lab"
          >
            <FlaskConical className="w-3 h-3" />
          </button>
          <button
            onClick={() => setEmbedOpen(true)}
            className={`p-1 rounded ${st.textDim} hover:${st.textMuted} transition opacity-0 group-hover:opacity-100`}
            title="Embed widget"
          >
            <Code className="w-3 h-3" />
          </button>
        </h3>
        {description && (
          <p className={`text-[10px] ${st.textDim} mt-1 ml-3 leading-relaxed`}>{description}</p>
        )}
      </div>
      <div className="flex-1 min-h-0">
        <Suspense fallback={<WidgetSkeleton />}>
          {Component ? <Component {...(props || {})} /> : <UnknownWidget name={component} />}
        </Suspense>
      </div>
      <EmbedCodeModal isOpen={embedOpen} onClose={() => setEmbedOpen(false)} widgetName={component} widgetTitle={title} />
    </div>
  );
}

function WidgetSkeleton() {
  const showAnimations = useLiveDashboardStore((s) => s.customization.showAnimations);
  return (
    <div className={`${showAnimations ? 'animate-pulse' : ''} space-y-3`}>
      <div className="h-4 bg-gray-800/50 rounded w-3/4" />
      <div className="h-4 bg-gray-800/50 rounded w-1/2" />
      <div className="h-24 bg-gray-800/50 rounded" />
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
