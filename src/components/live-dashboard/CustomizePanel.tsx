'use client';

import { useState } from 'react';
import { Settings, X, RotateCcw, ChevronDown, ChevronUp, LayoutGrid } from 'lucide-react';
import { useLiveDashboardStore, DEFAULT_VISIBLE_WIDGET_COUNT } from '@/lib/live-dashboard/store';
import type { DashboardCustomization } from '@/lib/live-dashboard/store';
import type { LiveDashboardDefinition } from '@/lib/live-dashboard/definitions';

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

const CURRENCY_OPTIONS = [
  { value: 'usd', label: 'USD ($)' },
  { value: 'eur', label: 'EUR (€)' },
  { value: 'gbp', label: 'GBP (£)' },
  { value: 'jpy', label: 'JPY (¥)' },
  { value: 'inr', label: 'INR (₹)' },
  { value: 'btc', label: 'BTC (₿)' },
  { value: 'eth', label: 'ETH (Ξ)' },
];

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

// ─── Trigger Button (renders in toolbar) ───
interface CustomizeButtonProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function CustomizeButton({ isOpen, onToggle }: CustomizeButtonProps) {
  const customization = useLiveDashboardStore((s) => s.customization);

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
          : 'bg-white/[0.04] hover:bg-white/[0.08] text-gray-400 hover:text-white border-white/[0.06]'
      }`}
      title="Customize dashboard"
    >
      <Settings className="w-4 h-4" />
      {isOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
    </button>
  );
}

// ─── Inline Bar (renders between toolbar and grid) ───
interface CustomizeBarProps {
  definition: LiveDashboardDefinition;
  onApply: () => void;
  onClose: () => void;
}

export function CustomizeBar({ definition, onApply, onClose }: CustomizeBarProps) {
  const { customization, setCustomization, resetCustomization, enabledWidgets, setEnabledWidgets } = useLiveDashboardStore();
  const [local, setLocal] = useState<DashboardCustomization>(customization);
  const [showMore, setShowMore] = useState(false);

  // Widget selection: default to first N widgets by mobileOrder
  const sortedWidgets = [...definition.widgets].sort((a, b) => (a.mobileOrder ?? 99) - (b.mobileOrder ?? 99));
  const defaultWidgetIds = sortedWidgets.slice(0, DEFAULT_VISIBLE_WIDGET_COUNT).map((w) => w.id);
  const currentEnabled = enabledWidgets[definition.slug] ?? defaultWidgetIds;

  const toggleWidget = (widgetId: string) => {
    const next = currentEnabled.includes(widgetId)
      ? currentEnabled.filter((id) => id !== widgetId)
      : [...currentEnabled, widgetId];
    // Must have at least 1 widget enabled
    if (next.length > 0) {
      setEnabledWidgets(definition.slug, next);
    }
  };

  const selectAllWidgets = () => {
    setEnabledWidgets(definition.slug, definition.widgets.map((w) => w.id));
  };

  const selectDefaultWidgets = () => {
    setEnabledWidgets(definition.slug, defaultWidgetIds);
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
    `px-2 py-1 rounded-lg text-[10px] font-medium transition cursor-pointer ${
      active
        ? 'bg-emerald-400/20 text-emerald-400 border border-emerald-400/30'
        : 'bg-white/[0.04] text-gray-400 border border-white/[0.06] hover:bg-white/[0.08]'
    }`;

  const selectClass = 'bg-white/[0.04] border border-white/[0.1] rounded-lg px-2 py-1 text-[11px] text-white focus:border-emerald-400/40 focus:outline-none';

  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
      {/* Row 1: Primary controls */}
      <div className="px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        {/* Currency */}
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] uppercase tracking-wider text-gray-600 font-semibold">Currency</span>
          <select
            value={local.vsCurrency}
            onChange={(e) => setLocal({ ...local, vsCurrency: e.target.value })}
            title="Currency"
            className={selectClass}
          >
            {CURRENCY_OPTIONS.map((c) => (
              <option key={c.value} value={c.value} className="bg-gray-900">{c.label}</option>
            ))}
          </select>
        </div>

        {/* Sort */}
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] uppercase tracking-wider text-gray-600 font-semibold">Sort</span>
          <select
            value={local.sortOrder}
            onChange={(e) => setLocal({ ...local, sortOrder: e.target.value })}
            title="Sort order"
            className={selectClass}
          >
            {SORT_OPTIONS.map((s) => (
              <option key={s.value} value={s.value} className="bg-gray-900">{s.label}</option>
            ))}
          </select>
        </div>

        {/* Primary Coin */}
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] uppercase tracking-wider text-gray-600 font-semibold">Coin</span>
          <select
            value={local.coinId}
            onChange={(e) => setLocal({ ...local, coinId: e.target.value })}
            title="Primary coin"
            className={selectClass}
          >
            {POPULAR_COINS.map((c) => (
              <option key={c.id} value={c.id} className="bg-gray-900">{c.label}</option>
            ))}
          </select>
        </div>

        {/* Timeframe chips */}
        <div className="flex items-center gap-1">
          <span className="text-[9px] uppercase tracking-wider text-gray-600 font-semibold mr-0.5">Time</span>
          {TIMEFRAME_OPTIONS.map((t) => (
            <button key={t.days} type="button" onClick={() => setLocal({ ...local, days: t.days })} className={chip(local.days === t.days)}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Color Theme */}
        <div className="flex items-center gap-1">
          <span className="text-[9px] uppercase tracking-wider text-gray-600 font-semibold mr-0.5">Theme</span>
          {COLOR_THEME_OPTIONS.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setLocal({ ...local, colorTheme: t.value })}
              title={t.label}
              className={`w-5 h-5 rounded-full border-2 transition ${
                local.colorTheme === t.value ? 'border-white scale-110' : 'border-transparent opacity-60 hover:opacity-100'
              }`}
              style={{ backgroundColor: t.color }}
            />
          ))}
        </div>

        {/* Spacer + actions */}
        <div className="flex items-center gap-1.5 ml-auto">
          <button
            type="button"
            onClick={() => setShowMore(!showMore)}
            className="text-[10px] text-gray-500 hover:text-white transition flex items-center gap-0.5"
          >
            {showMore ? 'Less' : 'More'}
            {showMore ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          <button type="button" onClick={handleReset} className="p-1 text-gray-500 hover:text-white transition" title="Reset all">
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="px-3 py-1 rounded-lg text-[10px] font-medium bg-emerald-500 hover:bg-emerald-600 text-white transition"
          >
            Apply
          </button>
          <button type="button" onClick={onClose} className="p-1 text-gray-500 hover:text-white transition" title="Close">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Row 2: Widget selector (always visible) */}
      <div className="px-4 py-3 border-t border-white/[0.04] flex flex-wrap items-center gap-x-2 gap-y-1.5">
        <div className="flex items-center gap-1.5 mr-1">
          <LayoutGrid className="w-3 h-3 text-gray-500" />
          <span className="text-[9px] uppercase tracking-wider text-gray-600 font-semibold">Charts ({currentEnabled.length}/{definition.widgets.length})</span>
        </div>
        <button
          type="button"
          onClick={selectAllWidgets}
          className="px-1.5 py-0.5 rounded text-[9px] font-medium text-gray-500 hover:text-white border border-white/[0.06] hover:bg-white/[0.06] transition"
        >
          All
        </button>
        <button
          type="button"
          onClick={selectDefaultWidgets}
          className="px-1.5 py-0.5 rounded text-[9px] font-medium text-gray-500 hover:text-white border border-white/[0.06] hover:bg-white/[0.06] transition"
        >
          Default
        </button>
        <span className="w-px h-4 bg-white/[0.06] mx-1" />
        {sortedWidgets.map((w) => (
          <button
            key={w.id}
            type="button"
            onClick={() => toggleWidget(w.id)}
            className={`px-2 py-0.5 rounded text-[9px] font-medium transition ${
              currentEnabled.includes(w.id)
                ? 'bg-emerald-400/20 text-emerald-400 border border-emerald-400/30'
                : 'bg-white/[0.03] text-gray-600 border border-white/[0.04] hover:text-gray-400'
            }`}
          >
            {w.title}
          </button>
        ))}
      </div>

      {/* Row 3: Extended controls (collapsible) */}
      {showMore && (
        <div className="px-4 py-3 border-t border-white/[0.04] flex flex-wrap items-center gap-x-4 gap-y-2">
          {/* Per Page */}
          <div className="flex items-center gap-1">
            <span className="text-[9px] uppercase tracking-wider text-gray-600 font-semibold">Per Page</span>
            {[25, 50, 100, 250].map((v) => (
              <button key={v} type="button" onClick={() => setLocal({ ...local, perPage: v })} className={chip(local.perPage === v)}>
                {v}
              </button>
            ))}
          </div>

          {/* Data Limit */}
          <div className="flex items-center gap-1">
            <span className="text-[9px] uppercase tracking-wider text-gray-600 font-semibold">Limit</span>
            {[0, 10, 15, 20, 25, 50].map((v) => (
              <button key={v} type="button" onClick={() => setLocal({ ...local, dataLimit: v })} className={chip(local.dataLimit === v)}>
                {v === 0 ? 'All' : v}
              </button>
            ))}
          </div>

          {/* Chart Height */}
          <div className="flex items-center gap-1">
            <span className="text-[9px] uppercase tracking-wider text-gray-600 font-semibold">Height</span>
            {(['compact', 'normal', 'tall'] as const).map((v) => (
              <button key={v} type="button" onClick={() => setLocal({ ...local, chartHeight: v })} className={chip(local.chartHeight === v)}>
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>

          {/* Chart Style */}
          <div className="flex items-center gap-1">
            <span className="text-[9px] uppercase tracking-wider text-gray-600 font-semibold">Style</span>
            {(['smooth', 'sharp'] as const).map((v) => (
              <button key={v} type="button" onClick={() => setLocal({ ...local, chartStyle: v })} className={chip(local.chartStyle === v)}>
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>

          {/* Table Density */}
          <div className="flex items-center gap-1">
            <span className="text-[9px] uppercase tracking-wider text-gray-600 font-semibold">Density</span>
            {(['compact', 'normal', 'comfortable'] as const).map((v) => (
              <button key={v} type="button" onClick={() => setLocal({ ...local, tableDensity: v })} className={chip(local.tableDensity === v)}>
                {v === 'comfortable' ? 'Spacious' : v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>

          {/* Animations */}
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] uppercase tracking-wider text-gray-600 font-semibold">Anim</span>
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
            <span className="text-[9px] uppercase tracking-wider text-gray-600 font-semibold">Compare ({local.coinIds.length}/5)</span>
            {POPULAR_COINS.filter((c) => c.id !== '').map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => toggleCoinId(c.id)}
                className={`px-1.5 py-0.5 rounded text-[9px] font-medium transition ${
                  local.coinIds.includes(c.id)
                    ? 'bg-emerald-400/20 text-emerald-400 border border-emerald-400/30'
                    : 'bg-white/[0.03] text-gray-600 border border-white/[0.04] hover:text-gray-400'
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
