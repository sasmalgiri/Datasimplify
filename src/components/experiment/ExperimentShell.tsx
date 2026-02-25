'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Search, Loader2, RefreshCw, Timer, Clock,
  Settings, X, ChevronDown, ChevronUp, FlaskConical,
  Moon, Sun, RotateCcw, Shield,
} from 'lucide-react';
import { useLiveDashboardStore } from '@/lib/live-dashboard/store';
import type { DashboardCustomization, ColorTheme, SiteTheme } from '@/lib/live-dashboard/store';
import { getSiteThemeClasses } from '@/lib/live-dashboard/theme';
import { UniversalExport } from '@/components/UniversalExport';
import { ExportButton } from '@/components/live-dashboard/ExportButton';
import { ExperimentPanel } from '@/components/live-dashboard/ExperimentPanel';
import { useExperimentStore } from '@/lib/live-dashboard/experimentStore';
import { ALL_CURRENCIES } from '@/lib/live-dashboard/currency';
import type { ExperimentLayoutType } from '@/lib/templates/experimentLayouts';
import { LAYOUT_ENDPOINTS, LAYOUT_META } from '@/lib/templates/experimentLayouts';
import { MarketTableLayout } from './layouts/MarketTableLayout';
import { TechnicalChartLayout } from './layouts/TechnicalChartLayout';
import { DefiProtocolLayout } from './layouts/DefiProtocolLayout';
import { SentimentGaugeLayout } from './layouts/SentimentGaugeLayout';
import { DerivativesLayout } from './layouts/DerivativesLayout';

const TIME_RANGES = [
  { label: '7d', value: 7 },
  { label: '30d', value: 30 },
  { label: '90d', value: 90 },
  { label: '1y', value: 365 },
  { label: '2y', value: 730 },
];

const AUTO_REFRESH_OPTIONS = [
  { value: 0, label: 'Off' },
  { value: 60, label: '1m' },
  { value: 120, label: '2m' },
  { value: 300, label: '5m' },
];

const SORT_OPTIONS = [
  { value: 'market_cap_desc', label: 'MCap ↓' },
  { value: 'market_cap_asc', label: 'MCap ↑' },
  { value: 'volume_desc', label: 'Vol ↓' },
  { value: 'volume_asc', label: 'Vol ↑' },
];

const COLOR_THEME_OPTIONS: { value: ColorTheme; label: string; color: string }[] = [
  { value: 'emerald', label: 'Emerald', color: '#34d399' },
  { value: 'blue', label: 'Blue', color: '#60a5fa' },
  { value: 'purple', label: 'Purple', color: '#a78bfa' },
  { value: 'amber', label: 'Amber', color: '#f59e0b' },
  { value: 'rose', label: 'Rose', color: '#f43f5e' },
];

const CURRENCY_OPTIONS = ALL_CURRENCIES.map((c) => ({
  value: c.value,
  label: `${c.value.toUpperCase()} (${c.symbol.trim()})`,
}));

interface ExperimentShellProps {
  templateId: string;
  templateName: string;
  templateIcon: string;
  layoutType: ExperimentLayoutType;
}

export function ExperimentShell({ templateName, templateIcon, layoutType }: ExperimentShellProps) {
  const [coin, setCoin] = useState('bitcoin');
  const [coinInput, setCoinInput] = useState('bitcoin');
  const [days, setDays] = useState(90);
  const [isLoading, setIsLoading] = useState(false);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const data = useLiveDashboardStore((s) => s.data);
  const fetchData = useLiveDashboardStore((s) => s.fetchData);
  const error = useLiveDashboardStore((s) => s.error);
  const lastFetched = useLiveDashboardStore((s) => s.lastFetched);
  const autoRefreshInterval = useLiveDashboardStore((s) => s.autoRefreshInterval);
  const setAutoRefreshInterval = useLiveDashboardStore((s) => s.setAutoRefreshInterval);
  const customization = useLiveDashboardStore((s) => s.customization);
  const setCustomization = useLiveDashboardStore((s) => s.setCustomization);
  const resetCustomization = useLiveDashboardStore((s) => s.resetCustomization);
  const siteTheme = useLiveDashboardStore((s) => s.siteTheme);
  const setSiteTheme = useLiveDashboardStore((s) => s.setSiteTheme);

  const experimentOpen = useExperimentStore((s) => s.isOpen);
  const toggleExperiment = useExperimentStore((s) => s.toggle);
  const closeExperiment = useExperimentStore((s) => s.close);

  const st = getSiteThemeClasses(siteTheme);
  const endpoints = LAYOUT_ENDPOINTS[layoutType];
  const meta = LAYOUT_META[layoutType];

  // Derived currency from customization
  const vsCurrency = customization.vsCurrency || 'usd';

  const handleRefresh = useCallback(() => {
    setIsLoading(true);
    fetchData(endpoints, {
      coinId: coin,
      coinIds: [coin],
      days,
      vsCurrency,
      historyCoinId: coin,
      historyDays: days,
      fgLimit: Math.min(days + 10, 365),
      sortOrder: customization.sortOrder || 'market_cap_desc',
    }).finally(() => setIsLoading(false));
  }, [coin, days, vsCurrency, customization.sortOrder, fetchData, endpoints]);

  // Fetch data on mount and when coin/days/currency changes
  useEffect(() => {
    handleRefresh();
  }, [handleRefresh]);

  // Auto-refresh interval
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (autoRefreshInterval > 0) {
      intervalRef.current = setInterval(handleRefresh, autoRefreshInterval * 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoRefreshInterval, handleRefresh]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      switch (e.key.toLowerCase()) {
        case 'r':
          if (!e.metaKey && !e.ctrlKey && !isLoading) handleRefresh();
          break;
        case 'c':
          if (!e.metaKey && !e.ctrlKey) setCustomizeOpen((v) => !v);
          break;
        case 'e':
          if (!e.metaKey && !e.ctrlKey) toggleExperiment();
          break;
        case 'escape':
          setCustomizeOpen(false);
          closeExperiment();
          break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isLoading, handleRefresh, toggleExperiment, closeExperiment]);

  const handleCoinSubmit = () => {
    const trimmed = coinInput.trim().toLowerCase();
    if (trimmed && trimmed !== coin) {
      setCoin(trimmed);
    }
  };

  const timeAgo = lastFetched
    ? `${Math.round((Date.now() - lastFetched) / 1000)}s ago`
    : null;

  const chipActive = 'bg-emerald-400/20 text-emerald-400 border border-emerald-400/30';
  const chipInactive = 'bg-white/[0.04] text-gray-400 border border-white/[0.06] hover:bg-white/[0.08] hover:text-white';

  const LayoutComponent = {
    'market-table': MarketTableLayout,
    'technical-chart': TechnicalChartLayout,
    'defi-protocol': DefiProtocolLayout,
    'sentiment-gauge': SentimentGaugeLayout,
    'derivatives-data': DerivativesLayout,
  }[layoutType];

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Toolbar */}
      <div className="sticky top-0 z-40 bg-[#0a0a0f]/95 backdrop-blur-sm border-b border-white/[0.06]">
        <div className="max-w-[1800px] mx-auto px-4 py-2 flex items-center gap-3 flex-wrap">
          {/* Back */}
          <Link
            href="/templates"
            className="flex items-center gap-1.5 text-gray-400 hover:text-white transition text-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </Link>

          <div className="w-px h-5 bg-white/[0.08]" />

          {/* Template name */}
          <div className="flex items-center gap-2">
            <span className="text-lg">{templateIcon}</span>
            <span className="text-sm font-bold text-white">{templateName}</span>
            <span className="text-[10px] text-gray-500 bg-white/[0.04] px-2 py-0.5 rounded">{meta.title}</span>
          </div>

          <div className="w-px h-5 bg-white/[0.08]" />

          {/* Coin input */}
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500 pointer-events-none" />
            <input
              type="text"
              value={coinInput}
              onChange={(e) => setCoinInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCoinSubmit()}
              onBlur={handleCoinSubmit}
              className="w-32 bg-white/[0.04] border border-white/[0.1] text-white text-xs pl-6 pr-2.5 py-1.5 rounded-lg focus:outline-none focus:border-emerald-400/40"
              placeholder="Coin ID..."
            />
          </div>

          {/* Time range */}
          <div className="flex gap-0.5">
            {TIME_RANGES.map((tr) => (
              <button
                key={tr.value}
                type="button"
                onClick={() => setDays(tr.value)}
                className={`px-2 py-1 text-[10px] font-medium rounded-md transition ${
                  days === tr.value ? chipActive : chipInactive
                }`}
              >
                {tr.label}
              </button>
            ))}
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Last updated */}
          {timeAgo && (
            <span className="text-[10px] text-gray-600 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {timeAgo}
            </span>
          )}

          {/* DataLab */}
          <button
            type="button"
            onClick={toggleExperiment}
            className={`p-2 rounded-xl transition border ${
              experimentOpen
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                : 'bg-white/[0.04] text-gray-400 border-white/[0.06] hover:bg-white/[0.08] hover:text-white'
            }`}
            title="DataLab (E)"
          >
            <FlaskConical className="w-4 h-4" />
          </button>

          {/* Customize */}
          <button
            type="button"
            onClick={() => setCustomizeOpen((v) => !v)}
            className={`flex items-center gap-1 p-2 rounded-xl transition border ${
              customizeOpen
                ? 'bg-emerald-400/10 border-emerald-400/20 text-emerald-400'
                : 'bg-white/[0.04] text-gray-400 border-white/[0.06] hover:bg-white/[0.08] hover:text-white'
            }`}
            title="Customize (C)"
          >
            <Settings className="w-4 h-4" />
            {customizeOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          {/* Auto-refresh selector */}
          <div className={`relative flex items-center gap-1 px-2 py-1.5 rounded-xl border text-[10px] font-medium transition ${
            autoRefreshInterval > 0
              ? 'bg-emerald-400/10 border-emerald-400/20 text-emerald-400'
              : 'bg-white/[0.04] border-white/[0.06] text-gray-400'
          }`}>
            <Timer className="w-3 h-3" />
            {autoRefreshInterval > 0 && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            )}
            <select
              value={autoRefreshInterval}
              onChange={(e) => setAutoRefreshInterval(Number(e.target.value))}
              className="bg-transparent outline-none cursor-pointer text-[10px] appearance-none pr-1"
              title="Auto-refresh interval"
            >
              {AUTO_REFRESH_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-gray-900">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Refresh button */}
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isLoading}
            className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-gray-400 hover:text-white transition border border-white/[0.06] disabled:opacity-30 disabled:cursor-not-allowed"
            title="Refresh data (R)"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          {/* Export buttons */}
          <UniversalExport
            name={`${templateName}-${coin}`}
            captureRef={contentRef}
            getData={() => data}
            compact
          />
          <ExportButton dashboardName={`${templateName}-${coin}`} />
        </div>
      </div>

      {/* Customize Panel */}
      {customizeOpen && (
        <ExperimentCustomizeBar
          vsCurrency={vsCurrency}
          sortOrder={customization.sortOrder || 'market_cap_desc'}
          colorTheme={customization.colorTheme || 'emerald'}
          chartHeight={customization.chartHeight || 'normal'}
          chartStyle={customization.chartStyle || 'smooth'}
          siteTheme={siteTheme}
          onApply={(changes) => {
            setCustomization(changes);
            // The useEffect on handleRefresh will trigger re-fetch
          }}
          onReset={() => {
            resetCustomization();
          }}
          onSiteThemeChange={setSiteTheme}
          onClose={() => setCustomizeOpen(false)}
        />
      )}

      {/* DataLab Panel */}
      {experimentOpen && (
        <div className="max-w-[1800px] mx-auto px-4">
          <ExperimentPanel isOpen={experimentOpen} onClose={closeExperiment} />
        </div>
      )}

      {/* Content */}
      <div ref={contentRef} id="dashboard-content" className="max-w-[1800px] mx-auto px-4 py-4">
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
            <span className="ml-3 text-sm text-gray-400">Loading data...</span>
          </div>
        )}

        {error && !isLoading && (
          <div className="bg-red-400/10 border border-red-400/20 rounded-lg p-4 text-sm text-red-400 mb-4">
            {error}
          </div>
        )}

        {!isLoading && !error && (
          <LayoutComponent coin={coin} days={days} />
        )}
      </div>

      {/* Footer */}
      <div className="max-w-[1800px] mx-auto px-4 pb-4">
        <div className="flex flex-col sm:flex-row items-center justify-between text-[10px] text-gray-600 pt-4 border-t border-white/[0.06] gap-2">
          <div className="flex items-center gap-1.5">
            <Shield className="w-3 h-3 text-emerald-600" />
            <span>
              Data provided by{' '}
              <a href="https://www.coingecko.com/en/api" target="_blank" rel="noopener noreferrer" className="hover:underline">CoinGecko</a>
              {' · '}
              <a href="https://defillama.com" target="_blank" rel="noopener noreferrer" className="hover:underline">DeFi Llama</a>
              {' · '}Exports for personal, non-commercial use.
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline">
              <kbd className="px-1 py-0.5 bg-white/[0.04] rounded text-[9px] border border-white/[0.06]">R</kbd> Refresh
              <span className="mx-1.5">&middot;</span>
              <kbd className="px-1 py-0.5 bg-white/[0.04] rounded text-[9px] border border-white/[0.06]">C</kbd> Customize
              <span className="mx-1.5">&middot;</span>
              <kbd className="px-1 py-0.5 bg-white/[0.04] rounded text-[9px] border border-white/[0.06]">E</kbd> Lab
              <span className="mx-1.5">&middot;</span>
              <kbd className="px-1 py-0.5 bg-white/[0.04] rounded text-[9px] border border-white/[0.06]">Esc</kbd> Close
            </span>
            <span>
              {lastFetched && new Date(lastFetched).toLocaleString()} &bull; cryptoreportkit.com
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Inline Customize Bar for Experiments ───

interface CustomizeBarProps {
  vsCurrency: string;
  sortOrder: string;
  colorTheme: ColorTheme;
  chartHeight: string;
  chartStyle: string;
  siteTheme: SiteTheme;
  onApply: (changes: Partial<DashboardCustomization>) => void;
  onReset: () => void;
  onSiteThemeChange: (theme: SiteTheme) => void;
  onClose: () => void;
}

function ExperimentCustomizeBar({
  vsCurrency, sortOrder, colorTheme, chartHeight, chartStyle, siteTheme,
  onApply, onReset, onSiteThemeChange, onClose,
}: CustomizeBarProps) {
  const [localCurrency, setLocalCurrency] = useState(vsCurrency);
  const [localSort, setLocalSort] = useState(sortOrder);
  const [localColorTheme, setLocalColorTheme] = useState(colorTheme);
  const [localChartHeight, setLocalChartHeight] = useState(chartHeight);
  const [localChartStyle, setLocalChartStyle] = useState(chartStyle);

  const chip = (active: boolean) =>
    `px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
      active
        ? 'bg-emerald-400/15 text-emerald-400 border border-emerald-400/25'
        : 'bg-white/[0.04] text-gray-400 border border-white/[0.06] hover:bg-white/[0.08] hover:text-white'
    }`;

  const handleApply = () => {
    onApply({
      vsCurrency: localCurrency,
      sortOrder: localSort,
      colorTheme: localColorTheme as ColorTheme,
      chartHeight: localChartHeight as 'compact' | 'normal' | 'tall',
      chartStyle: localChartStyle as 'smooth' | 'sharp',
    });
  };

  const handleReset = () => {
    setLocalCurrency('usd');
    setLocalSort('market_cap_desc');
    setLocalColorTheme('emerald');
    setLocalChartHeight('normal');
    setLocalChartStyle('smooth');
    onReset();
  };

  return (
    <div className="max-w-[1800px] mx-auto px-4 mt-2">
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        {/* Currency */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold">Currency</span>
          <select
            value={localCurrency}
            onChange={(e) => setLocalCurrency(e.target.value)}
            title="Currency"
            className="bg-white/[0.04] border border-white/[0.1] text-white rounded-lg px-2.5 py-1.5 text-xs focus:border-emerald-400/40 focus:outline-none"
          >
            {CURRENCY_OPTIONS.map((c) => (
              <option key={c.value} value={c.value} className="bg-gray-900">{c.label}</option>
            ))}
          </select>
        </div>

        {/* Sort */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold">Sort</span>
          <select
            value={localSort}
            onChange={(e) => setLocalSort(e.target.value)}
            title="Sort order"
            className="bg-white/[0.04] border border-white/[0.1] text-white rounded-lg px-2.5 py-1.5 text-xs focus:border-emerald-400/40 focus:outline-none"
          >
            {SORT_OPTIONS.map((s) => (
              <option key={s.value} value={s.value} className="bg-gray-900">{s.label}</option>
            ))}
          </select>
        </div>

        {/* Color Theme */}
        <div className="flex items-center gap-1">
          <span className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold mr-0.5">Accent</span>
          {COLOR_THEME_OPTIONS.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setLocalColorTheme(t.value)}
              title={t.label}
              className={`w-5 h-5 rounded-full border-2 transition ${
                localColorTheme === t.value
                  ? (siteTheme === 'dark' ? 'border-white' : 'border-slate-800') + ' scale-110'
                  : 'border-transparent opacity-60 hover:opacity-100'
              }`}
              style={{ backgroundColor: t.color }}
            />
          ))}
        </div>

        {/* Chart Height */}
        <div className="flex items-center gap-1">
          <span className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold">Height</span>
          {(['compact', 'normal', 'tall'] as const).map((v) => (
            <button key={v} type="button" onClick={() => setLocalChartHeight(v)} className={chip(localChartHeight === v)}>
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>

        {/* Chart Style */}
        <div className="flex items-center gap-1">
          <span className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold">Style</span>
          {(['smooth', 'sharp'] as const).map((v) => (
            <button key={v} type="button" onClick={() => setLocalChartStyle(v)} className={chip(localChartStyle === v)}>
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>

        {/* Site Theme Toggle */}
        <div className="flex items-center gap-1">
          <span className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold mr-0.5">Mode</span>
          <div className="flex rounded-lg border border-white/[0.06] overflow-hidden">
            <button
              type="button"
              onClick={() => onSiteThemeChange('dark')}
              title="Dark theme"
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium transition ${
                siteTheme === 'dark'
                  ? 'bg-emerald-400/20 text-emerald-400'
                  : 'bg-white/[0.04] text-gray-500 hover:text-gray-300'
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
              Dark
            </button>
            <button
              type="button"
              onClick={() => onSiteThemeChange('light-blue')}
              title="Light Blue theme"
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium transition ${
                siteTheme === 'light-blue'
                  ? 'bg-blue-500/15 text-blue-500'
                  : 'bg-white/[0.04] text-gray-500 hover:text-gray-300'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              Light
            </button>
          </div>
        </div>

        {/* Spacer + actions */}
        <div className="flex items-center gap-2 ml-auto">
          <button type="button" onClick={handleReset} className="p-1.5 text-gray-500 hover:text-white transition" title="Reset all">
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="px-4 py-1.5 rounded-lg text-sm font-medium bg-emerald-500 hover:bg-emerald-600 text-white transition"
          >
            Apply
          </button>
          <button type="button" onClick={onClose} className="p-1.5 text-gray-500 hover:text-white transition" title="Close">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
