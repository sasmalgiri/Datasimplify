'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Settings, X, RotateCcw, ChevronDown, ChevronUp, LayoutGrid, Lock, Crown,
  Brain, BarChart3, LineChart, Droplets, Layers, Grid3X3, GitCompare,
  Activity, TrendingUp, Wrench, CandlestickChart, PieChart,
  Moon, Sun, Wallet,
} from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useLiveDashboardStore, DEFAULT_VISIBLE_WIDGET_COUNT } from '@/lib/live-dashboard/store';
import type { DashboardCustomization, SiteTheme } from '@/lib/live-dashboard/store';
import type { LiveDashboardDefinition } from '@/lib/live-dashboard/definitions';
import { WIDGET_DESCRIPTIONS } from './DashboardWidget';
import { getSiteThemeClasses } from '@/lib/live-dashboard/theme';
import { ALL_CURRENCIES } from '@/lib/live-dashboard/currency';
import { useAuth } from '@/lib/auth';
import { PLAN_LIMITS } from '@/lib/entitlements';

// ─── Widget → Category mapping ───
const WIDGET_TO_CATEGORY: Record<string, string> = {
  // Intelligence
  CryptoHealthScoreWidget: 'Intelligence',
  SmartSignalWidget: 'Intelligence',
  RiskRadarWidget: 'Intelligence',
  AlphaFinderWidget: 'Intelligence',
  VolatilityForecastWidget: 'Intelligence',
  MarketBriefWidget: 'Intelligence',
  SectorRotationWidget: 'Intelligence',
  MoneyFlowIndexWidget: 'Intelligence',

  // Market Overview
  KPICards: 'Market Overview',
  TopCoinsTable: 'Market Overview',
  GainersLosersWidget: 'Market Overview',
  FearGreedWidget: 'Market Overview',
  TrendingWidget: 'Market Overview',
  DominanceWidget: 'Market Overview',
  MarketPulseWidget: 'Market Overview',

  // Price Charts
  PriceChartWidget: 'Price Charts',
  CandlestickChartWidget: 'Price Charts',
  HeikinAshiWidget: 'Price Charts',
  HistoricalPriceWidget: 'Price Charts',

  // Volume & Liquidity
  VolumeChartWidget: 'Volume & Liquidity',
  ExchangeVolumeWidget: 'Volume & Liquidity',
  DEXVolumeWidget: 'Volume & Liquidity',

  // Market Structure
  TreemapWidget: 'Market Structure',
  PieChartWidget: 'Market Structure',
  MarketCapTimelineWidget: 'Market Structure',
  SupplyWidget: 'Market Structure',

  // Sectors
  HeatmapWidget: 'Sectors',
  CategoryBarWidget: 'Sectors',
  CategoryBadgesWidget: 'Sectors',

  // Comparison
  MultiLineChartWidget: 'Comparison',
  CoinCompareWidget: 'Comparison',
  CorrelationWidget: 'Comparison',
  RadarChartWidget: 'Comparison',
  BoxPlotWidget: 'Comparison',
  ReturnsBarWidget: 'Comparison',
  BubbleChartWidget: 'Comparison',

  // Advanced Charts
  AreaChartWidget: 'Advanced Charts',
  WaterfallChartWidget: 'Advanced Charts',
  DrawdownChartWidget: 'Advanced Charts',
  ReturnHistogramWidget: 'Advanced Charts',
  SankeyFlowWidget: 'Advanced Charts',
  WhaleDistributionWidget: 'Advanced Charts',
  SunburstWidget: 'Advanced Charts',
  FunnelWidget: 'Advanced Charts',
  GaugeClusterWidget: 'Advanced Charts',
  Scatter3DWidget: 'Advanced Charts',
  RadialBarWidget: 'Advanced Charts',
  ComposedChartWidget: 'Advanced Charts',
  DominanceAreaWidget: 'Advanced Charts',

  // Analytics
  TVLIndicatorWidget: 'Analytics',
  FundingRateWidget: 'Analytics',
  LiquidationEstimateWidget: 'Analytics',
  TechnicalScreenerWidget: 'Analytics',
  TokenomicsWidget: 'Analytics',
  MarketCycleWidget: 'Analytics',
  OpenInterestWidget: 'Analytics',

  // Sentiment
  AltseasonWidget: 'Sentiment',
  PerformanceHeatmapWidget: 'Sentiment',
  MiniSparklineGrid: 'Sentiment',

  // Utilities
  PriceConverterWidget: 'Utilities',
  WatchlistWidget: 'Utilities',
  PriceAlertWidget: 'Utilities',

  // Derivatives
  DerivativesTableWidget: 'Derivatives',

  // Portfolio & Tax
  TaxReportWidget: 'Portfolio & Tax',
  DCASimulatorWidget: 'Portfolio & Tax',
  DCATrackerWidget: 'Portfolio & Tax',
  PortfolioInputWidget: 'Portfolio & Tax',
  PLSummaryWidget: 'Portfolio & Tax',
  PLChartWidget: 'Portfolio & Tax',
  AllocationPieWidget: 'Portfolio & Tax',
  ScreenerWidget: 'Portfolio & Tax',
  ExchangeBalanceWidget: 'Portfolio & Tax',
  CycleComparisonWidget: 'Price Charts',
};

const CATEGORY_ORDER = [
  'Intelligence', 'Market Overview', 'Price Charts', 'Volume & Liquidity',
  'Market Structure', 'Sectors', 'Comparison', 'Advanced Charts',
  'Analytics', 'Sentiment', 'Portfolio & Tax', 'Utilities', 'Derivatives',
];

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  'Intelligence': Brain,
  'Market Overview': BarChart3,
  'Price Charts': LineChart,
  'Volume & Liquidity': Droplets,
  'Market Structure': Layers,
  'Sectors': Grid3X3,
  'Comparison': GitCompare,
  'Advanced Charts': CandlestickChart,
  'Analytics': Activity,
  'Sentiment': TrendingUp,
  'Portfolio & Tax': Wallet,
  'Utilities': Wrench,
  'Derivatives': PieChart,
};

// ─── Constants ───
const POPULAR_COINS = [
  { id: '', label: 'Default' },
  { id: 'bitcoin', label: 'BTC' },
  { id: 'ethereum', label: 'ETH' },
  { id: 'solana', label: 'SOL' },
  { id: 'binancecoin', label: 'BNB' },
  { id: 'ripple', label: 'XRP' },
  { id: 'cardano', label: 'ADA' },
  { id: 'dogecoin', label: 'DOGE' },
  { id: 'avalanche-2', label: 'AVAX' },
  { id: 'polkadot', label: 'DOT' },
  { id: 'chainlink', label: 'LINK' },
  { id: 'tron', label: 'TRX' },
  { id: 'polygon-ecosystem-token', label: 'POL' },
  { id: 'litecoin', label: 'LTC' },
  { id: 'uniswap', label: 'UNI' },
  { id: 'near', label: 'NEAR' },
  { id: 'aptos', label: 'APT' },
  { id: 'sui', label: 'SUI' },
  { id: 'arbitrum', label: 'ARB' },
  { id: 'optimism', label: 'OP' },
];

const TIMEFRAME_OPTIONS = [
  { days: 0, label: 'Default' },
  { days: 7, label: '7d' },
  { days: 14, label: '14d' },
  { days: 30, label: '30d' },
  { days: 90, label: '90d' },
  { days: 180, label: '180d' },
  { days: 365, label: '1y' },
];

const CURRENCY_OPTIONS = ALL_CURRENCIES.map((c) => ({
  value: c.value,
  label: `${c.value.toUpperCase()} (${c.symbol.trim()})`,
}));

const SORT_OPTIONS = [
  { value: 'market_cap_desc', label: 'MCap ↓' },
  { value: 'market_cap_asc', label: 'MCap ↑' },
  { value: 'volume_desc', label: 'Vol ↓' },
  { value: 'volume_asc', label: 'Vol ↑' },
  { value: 'id_asc', label: 'A→Z' },
  { value: 'id_desc', label: 'Z→A' },
];

const COLOR_THEME_OPTIONS = [
  { value: 'emerald' as const, label: 'Emerald', color: '#34d399' },
  { value: 'blue' as const, label: 'Blue', color: '#60a5fa' },
  { value: 'purple' as const, label: 'Purple', color: '#a78bfa' },
  { value: 'amber' as const, label: 'Amber', color: '#f59e0b' },
  { value: 'rose' as const, label: 'Rose', color: '#f43f5e' },
];

const DEFAULT_CUSTOMIZATION: DashboardCustomization = {
  coinId: '', coinIds: [], days: 0, vsCurrency: 'usd', perPage: 100,
  sortOrder: 'market_cap_desc', chartHeight: 'normal', dataLimit: 0,
  colorTheme: 'emerald', showAnimations: true, tableDensity: 'normal',
  chartStyle: 'smooth',
};

// ─── Widget Card (with hover expansion) ───
function WidgetCard({
  widget,
  isEnabled,
  atLimit,
  onToggle,
  st,
}: {
  widget: { id: string; title: string; component: string };
  isEnabled: boolean;
  atLimit: boolean;
  onToggle: () => void;
  st: ReturnType<typeof getSiteThemeClasses>;
}) {
  const [expanded, setExpanded] = useState(false);
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const description = WIDGET_DESCRIPTIONS[widget.component] || '';
  const snippet = description.length > 70 ? description.slice(0, 67) + '...' : description;

  const onMouseEnter = () => {
    hoverTimeout.current = setTimeout(() => setExpanded(true), 250);
  };
  const onMouseLeave = () => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    setExpanded(false);
  };

  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={() => !atLimit && onToggle()}
      className={`relative rounded-xl border p-3 cursor-pointer transition-all duration-200 ${
        isEnabled
          ? `${st.chipActive} bg-opacity-60`
          : atLimit
            ? `${st.subtleBg} ${st.subtleBorder} cursor-not-allowed opacity-50`
            : `${st.chipInactive}`
      }`}
    >
      {/* Header row */}
      <div className="flex items-center justify-between gap-2">
        <span className={`text-sm font-medium truncate ${isEnabled ? 'text-emerald-400' : st.textSecondary}`}>
          {widget.title}
        </span>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {atLimit && <Lock className={`w-3 h-3 ${st.textFaint}`} />}
          {/* Toggle dot */}
          <span className={`w-2.5 h-2.5 rounded-full border transition ${
            isEnabled
              ? 'bg-emerald-400 border-emerald-400'
              : `bg-transparent ${st.subtleBorder}`
          }`} />
        </div>
      </div>

      {/* Snippet (always visible) */}
      {snippet && (
        <p className={`text-xs ${st.textDim} mt-1 leading-relaxed line-clamp-1`}>
          {snippet}
        </p>
      )}

      {/* Expanded description on hover */}
      <div className={`overflow-hidden transition-all duration-200 ${expanded ? 'max-h-24 mt-2' : 'max-h-0'}`}>
        {description && (
          <p className={`text-[11px] ${st.textMuted} leading-relaxed`}>
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Trigger Button (renders in toolbar) ───
interface CustomizeButtonProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function CustomizeButton({ isOpen, onToggle }: CustomizeButtonProps) {
  const { customization, siteTheme } = useLiveDashboardStore(useShallow((s) => ({ customization: s.customization, siteTheme: s.siteTheme })));
  const st = getSiteThemeClasses(siteTheme);

  const hasCustomization =
    customization.coinId !== '' || customization.coinIds.length > 0 || customization.days !== 0 ||
    customization.vsCurrency !== 'usd' || customization.perPage !== 100 || customization.sortOrder !== 'market_cap_desc' ||
    customization.chartHeight !== 'normal' || customization.dataLimit !== 0 || customization.colorTheme !== 'emerald' ||
    !customization.showAnimations || customization.tableDensity !== 'normal' || customization.chartStyle !== 'smooth';

  return (
    <button
      type="button"
      onClick={onToggle}
      className={`flex items-center gap-1 p-2 rounded-xl transition border ${
        isOpen || hasCustomization
          ? 'bg-emerald-400/10 border-emerald-400/20 text-emerald-400'
          : `${st.buttonSecondary}`
      }`}
      title="Customize dashboard (C)"
    >
      <Settings className="w-4 h-4" />
      {isOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
    </button>
  );
}

// ─── Inline Customize Panel ───
interface CustomizeBarProps {
  definition: LiveDashboardDefinition;
  onApply: () => void;
  onClose: () => void;
}

export function CustomizeBar({ definition, onApply, onClose }: CustomizeBarProps) {
  const { customization, setCustomization, resetCustomization, enabledWidgets, setEnabledWidgets, siteTheme, setSiteTheme } = useLiveDashboardStore(
    useShallow((s) => ({
      customization: s.customization,
      setCustomization: s.setCustomization,
      resetCustomization: s.resetCustomization,
      enabledWidgets: s.enabledWidgets,
      setEnabledWidgets: s.setEnabledWidgets,
      siteTheme: s.siteTheme,
      setSiteTheme: s.setSiteTheme,
    })),
  );
  const st = getSiteThemeClasses(siteTheme);
  const [local, setLocal] = useState<DashboardCustomization>(customization);
  const [showMore, setShowMore] = useState(false);
  const { profile } = useAuth();
  const tabsRef = useRef<HTMLDivElement>(null);

  const tier = profile?.subscription_tier ?? 'free';
  const maxWidgets = PLAN_LIMITS[tier].maxDashboardWidgets;
  const maxDays = PLAN_LIMITS[tier].maxOhlcvDays;
  const isFree = tier === 'free';

  // Widget selection
  const sortedWidgets = [...definition.widgets].sort((a, b) => (a.mobileOrder ?? 99) - (b.mobileOrder ?? 99));
  const defaultWidgetIds = sortedWidgets.slice(0, DEFAULT_VISIBLE_WIDGET_COUNT).map((w) => w.id);
  const currentEnabled = enabledWidgets[definition.slug] ?? defaultWidgetIds;

  // Group widgets by category
  const categorizedWidgets = CATEGORY_ORDER
    .map((cat) => {
      const widgets = sortedWidgets.filter((w) => WIDGET_TO_CATEGORY[w.component] === cat);
      const enabledCount = widgets.filter((w) => currentEnabled.includes(w.id)).length;
      return { category: cat, widgets, enabledCount };
    })
    .filter((g) => g.widgets.length > 0);

  // Active category state — default to first category with widgets
  const [activeCategory, setActiveCategory] = useState(
    categorizedWidgets.length > 0 ? categorizedWidgets[0].category : ''
  );

  // Scroll active tab into view
  useEffect(() => {
    if (tabsRef.current) {
      const activeTab = tabsRef.current.querySelector('[data-active="true"]');
      if (activeTab) {
        activeTab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [activeCategory]);

  const activeGroup = categorizedWidgets.find((g) => g.category === activeCategory);

  const toggleWidget = (widgetId: string) => {
    if (currentEnabled.includes(widgetId)) {
      const next = currentEnabled.filter((id) => id !== widgetId);
      if (next.length > 0) {
        setEnabledWidgets(definition.slug, next);
      }
    } else if (currentEnabled.length < maxWidgets) {
      setEnabledWidgets(definition.slug, [...currentEnabled, widgetId]);
    }
  };

  const selectAllWidgets = () => {
    const all = definition.widgets.map((w) => w.id);
    setEnabledWidgets(definition.slug, all.slice(0, maxWidgets));
  };

  const selectDefaultWidgets = () => {
    setEnabledWidgets(definition.slug, defaultWidgetIds);
  };

  const selectAllInCategory = () => {
    if (!activeGroup) return;
    const catIds = activeGroup.widgets.map((w) => w.id);
    const otherEnabled = currentEnabled.filter((id) => !catIds.includes(id));
    const combined = [...otherEnabled, ...catIds].slice(0, maxWidgets);
    setEnabledWidgets(definition.slug, combined);
  };

  const handleApply = () => {
    setCustomization(local);
    onApply();
  };

  const handleReset = () => {
    resetCustomization();
    setLocal(DEFAULT_CUSTOMIZATION);
    setEnabledWidgets(definition.slug, defaultWidgetIds);
    onApply();
  };

  const toggleCoinId = (id: string) => {
    setLocal((prev) => {
      const next = prev.coinIds.includes(id)
        ? prev.coinIds.filter((c) => c !== id)
        : prev.coinIds.length < 5
          ? [...prev.coinIds, id]
          : prev.coinIds;
      return { ...prev, coinIds: next };
    });
  };

  const chip = (active: boolean) =>
    `px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
      active ? st.chipActive : st.chipInactive
    }`;

  const selectClass = `${st.inputBg} rounded-lg px-2.5 py-1.5 text-xs focus:border-emerald-400/40 focus:outline-none`;

  return (
    <div className={`${st.panelBg} rounded-2xl overflow-hidden`}>
      {/* Row 1: Primary controls */}
      <div className="px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        {/* Currency */}
        <div className="flex items-center gap-1.5">
          <span className={`text-[11px] uppercase tracking-wider ${st.textDim} font-semibold`}>Currency</span>
          <select
            value={local.vsCurrency}
            onChange={(e) => setLocal({ ...local, vsCurrency: e.target.value })}
            title="Currency"
            className={selectClass}
          >
            {CURRENCY_OPTIONS.map((c) => (
              <option key={c.value} value={c.value} className={st.selectOptionBg}>{c.label}</option>
            ))}
          </select>
        </div>

        {/* Sort */}
        <div className="flex items-center gap-1.5">
          <span className={`text-[11px] uppercase tracking-wider ${st.textDim} font-semibold`}>Sort</span>
          <select
            value={local.sortOrder}
            onChange={(e) => setLocal({ ...local, sortOrder: e.target.value })}
            title="Sort order"
            className={selectClass}
          >
            {SORT_OPTIONS.map((s) => (
              <option key={s.value} value={s.value} className={st.selectOptionBg}>{s.label}</option>
            ))}
          </select>
        </div>

        {/* Primary Coin */}
        <div className="flex items-center gap-1.5">
          <span className={`text-[11px] uppercase tracking-wider ${st.textDim} font-semibold`}>Coin</span>
          <select
            value={local.coinId}
            onChange={(e) => setLocal({ ...local, coinId: e.target.value })}
            title="Primary coin"
            className={selectClass}
          >
            {POPULAR_COINS.map((c) => (
              <option key={c.id} value={c.id} className={st.selectOptionBg}>{c.label}</option>
            ))}
          </select>
        </div>

        {/* Timeframe chips */}
        <div className="flex items-center gap-1">
          <span className={`text-[11px] uppercase tracking-wider ${st.textDim} font-semibold mr-0.5`}>Time</span>
          {TIMEFRAME_OPTIONS.map((t) => {
            const locked = t.days > 0 && t.days > maxDays;
            return (
              <button
                key={t.days}
                type="button"
                onClick={() => !locked && setLocal({ ...local, days: t.days })}
                className={locked
                  ? `px-2.5 py-1 rounded-lg text-xs font-medium ${st.subtleBg} ${st.textFaint} border ${st.subtleBorder} cursor-not-allowed flex items-center gap-0.5`
                  : chip(local.days === t.days)
                }
                title={locked ? 'Pro required' : undefined}
              >
                {locked && <Lock className="w-2.5 h-2.5" />}
                {t.label}
              </button>
            );
          })}
          {isFree && <span className="text-[10px] text-amber-500/70 ml-0.5">30d max</span>}
        </div>

        {/* Color Theme */}
        <div className="flex items-center gap-1">
          <span className={`text-[11px] uppercase tracking-wider ${st.textDim} font-semibold mr-0.5`}>Accent</span>
          {COLOR_THEME_OPTIONS.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setLocal({ ...local, colorTheme: t.value })}
              title={t.label}
              className={`w-5 h-5 rounded-full border-2 transition ${
                local.colorTheme === t.value
                  ? (siteTheme === 'dark' ? 'border-white' : 'border-slate-800') + ' scale-110'
                  : 'border-transparent opacity-60 hover:opacity-100'
              }`}
              style={{ backgroundColor: t.color }}
            />
          ))}
        </div>

        {/* Site Theme Toggle */}
        <div className="flex items-center gap-1">
          <span className={`text-[11px] uppercase tracking-wider ${st.textDim} font-semibold mr-0.5`}>Mode</span>
          <div className={`flex rounded-lg border ${st.subtleBorder} overflow-hidden`}>
            <button
              type="button"
              onClick={() => setSiteTheme('dark')}
              title="Dark theme"
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium transition ${
                siteTheme === 'dark'
                  ? 'bg-emerald-400/20 text-emerald-400'
                  : `${st.subtleBg} ${st.textDim} hover:${st.textMuted}`
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
              Dark
            </button>
            <button
              type="button"
              onClick={() => setSiteTheme('light-blue')}
              title="Light Blue theme"
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium transition ${
                siteTheme === 'light-blue'
                  ? 'bg-blue-500/15 text-blue-500'
                  : `${st.subtleBg} ${st.textDim} hover:${st.textMuted}`
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              Light
            </button>
          </div>
        </div>

        {/* Spacer + actions */}
        <div className="flex items-center gap-2 ml-auto">
          <button
            type="button"
            onClick={() => setShowMore(!showMore)}
            className={`text-xs ${st.textDim} hover:${st.textPrimary} transition flex items-center gap-0.5`}
          >
            {showMore ? 'Less' : 'More'}
            {showMore ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          <button type="button" onClick={handleReset} className={`p-1.5 ${st.textDim} hover:${st.textPrimary} transition`} title="Reset all">
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleApply}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium ${st.buttonPrimary} transition`}
          >
            Apply
          </button>
          <button type="button" onClick={onClose} className={`p-1.5 ${st.textDim} hover:${st.textPrimary} transition`} title="Close">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Row 2: Category Tabs + Widget Cards */}
      <div className={`border-t ${st.divider}`}>
        {/* Category tabs */}
        <div className="px-4 pt-3 pb-2 flex items-center gap-2">
          <div className="flex items-center gap-1.5 mr-2">
            <LayoutGrid className={`w-4 h-4 ${st.textDim}`} />
            <span className={`text-xs font-semibold ${st.textMuted}`}>
              Widgets ({currentEnabled.length}/{isFree ? maxWidgets : definition.widgets.length})
            </span>
            {isFree && <span className="text-[10px] text-amber-500/70">Free: {maxWidgets} max</span>}
          </div>
          <button
            type="button"
            onClick={selectAllWidgets}
            className={`px-2 py-1 rounded-lg text-xs font-medium ${st.textDim} border ${st.subtleBorder} ${st.subtleBg} hover:opacity-80 transition`}
          >
            {isFree ? `Top ${maxWidgets}` : 'All'}
          </button>
          <button
            type="button"
            onClick={selectDefaultWidgets}
            className={`px-2 py-1 rounded-lg text-xs font-medium ${st.textDim} border ${st.subtleBorder} ${st.subtleBg} hover:opacity-80 transition`}
          >
            Default
          </button>
        </div>

        {/* Scrollable category tabs */}
        <div ref={tabsRef} className="px-4 pb-2 flex gap-1.5 overflow-x-auto scrollbar-none">
          {categorizedWidgets.map((group) => {
            const Icon = CATEGORY_ICONS[group.category] || LayoutGrid;
            const isActive = activeCategory === group.category;
            return (
              <button
                key={group.category}
                type="button"
                data-active={isActive}
                onClick={() => setActiveCategory(group.category)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition border ${
                  isActive
                    ? 'bg-emerald-400/15 text-emerald-400 border-emerald-400/25'
                    : `${st.chipInactive}`
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {group.category}
                <span className={`text-[10px] ${isActive ? 'text-emerald-400/70' : st.textFaint}`}>
                  {group.enabledCount}/{group.widgets.length}
                </span>
              </button>
            );
          })}
        </div>

        {/* Widget cards grid */}
        {activeGroup && (
          <div className="px-4 pb-3">
            <div className="flex items-center justify-between mb-2">
              <p className={`text-[11px] ${st.textFaint}`}>
                {activeGroup.enabledCount} of {activeGroup.widgets.length} enabled
              </p>
              <button
                type="button"
                onClick={selectAllInCategory}
                className={`text-[11px] ${st.textDim} hover:text-emerald-400 transition`}
              >
                Enable all in {activeGroup.category}
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {activeGroup.widgets.map((w) => {
                const isEnabled = currentEnabled.includes(w.id);
                const atLimit = !isEnabled && currentEnabled.length >= maxWidgets;
                return (
                  <WidgetCard
                    key={w.id}
                    widget={w}
                    isEnabled={isEnabled}
                    atLimit={atLimit}
                    onToggle={() => toggleWidget(w.id)}
                    st={st}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Row 3: Extended controls (collapsible) */}
      {showMore && (
        <div className={`px-4 py-3 border-t ${st.divider} flex flex-wrap items-center gap-x-4 gap-y-2`}>
          {/* Per Page */}
          <div className="flex items-center gap-1">
            <span className={`text-[11px] uppercase tracking-wider ${st.textDim} font-semibold`}>Per Page</span>
            {[25, 50, 100, 250].map((v) => (
              <button key={v} type="button" onClick={() => setLocal({ ...local, perPage: v })} className={chip(local.perPage === v)}>
                {v}
              </button>
            ))}
          </div>

          {/* Data Limit */}
          <div className="flex items-center gap-1">
            <span className={`text-[11px] uppercase tracking-wider ${st.textDim} font-semibold`}>Limit</span>
            {[0, 10, 15, 20, 25, 50].map((v) => (
              <button key={v} type="button" onClick={() => setLocal({ ...local, dataLimit: v })} className={chip(local.dataLimit === v)}>
                {v === 0 ? 'All' : v}
              </button>
            ))}
          </div>

          {/* Chart Height */}
          <div className="flex items-center gap-1">
            <span className={`text-[11px] uppercase tracking-wider ${st.textDim} font-semibold`}>Height</span>
            {(['compact', 'normal', 'tall'] as const).map((v) => (
              <button key={v} type="button" onClick={() => setLocal({ ...local, chartHeight: v })} className={chip(local.chartHeight === v)}>
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>

          {/* Chart Style */}
          <div className="flex items-center gap-1">
            <span className={`text-[11px] uppercase tracking-wider ${st.textDim} font-semibold`}>Style</span>
            {(['smooth', 'sharp'] as const).map((v) => (
              <button key={v} type="button" onClick={() => setLocal({ ...local, chartStyle: v })} className={chip(local.chartStyle === v)}>
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>

          {/* Table Density */}
          <div className="flex items-center gap-1">
            <span className={`text-[11px] uppercase tracking-wider ${st.textDim} font-semibold`}>Density</span>
            {(['compact', 'normal', 'comfortable'] as const).map((v) => (
              <button key={v} type="button" onClick={() => setLocal({ ...local, tableDensity: v })} className={chip(local.tableDensity === v)}>
                {v === 'comfortable' ? 'Spacious' : v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>

          {/* Animations */}
          <div className="flex items-center gap-1.5">
            <span className={`text-[11px] uppercase tracking-wider ${st.textDim} font-semibold`}>Anim</span>
            <button
              type="button"
              onClick={() => setLocal({ ...local, showAnimations: !local.showAnimations })}
              title={local.showAnimations ? 'Disable animations' : 'Enable animations'}
              className={`relative w-8 h-4 rounded-full transition ${local.showAnimations ? 'bg-emerald-500' : 'bg-gray-700'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${local.showAnimations ? 'translate-x-4' : 'translate-x-0'}`} />
            </button>
          </div>

          {/* Comparison Coins */}
          <div className="flex items-center gap-1 flex-wrap">
            <span className={`text-[11px] uppercase tracking-wider ${st.textDim} font-semibold`}>Compare ({local.coinIds.length}/5)</span>
            {POPULAR_COINS.filter((c) => c.id !== '').map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => toggleCoinId(c.id)}
                className={`px-2 py-0.5 rounded text-xs font-medium transition ${
                  local.coinIds.includes(c.id)
                    ? st.chipActive
                    : st.chipInactive
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
