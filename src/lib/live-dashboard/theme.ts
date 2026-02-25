// Premium design tokens for Live Dashboards
// Inspired by otherlevel.com — glassmorphism, deep dark, neon emerald accent

import type { SiteTheme } from './store';

// ─── Site Theme System ───
export const SITE_THEMES = {
  dark: {
    pageBg: 'bg-[#0a0a0f]',
    cardClasses: 'bg-white/[0.03] backdrop-blur-md border border-white/[0.06] rounded-2xl',
    cardHover: 'hover:border-white/[0.12] transition-all duration-300',
    cardGlow: 'hover:border-emerald-400/20 hover:shadow-[0_0_30px_rgba(52,211,153,0.06)] transition-all duration-300',
    textPrimary: 'text-white',
    textSecondary: 'text-gray-300',
    textMuted: 'text-gray-400',
    textDim: 'text-gray-500',
    textFaint: 'text-gray-600',
    subtleBg: 'bg-white/[0.04]',
    subtleBorder: 'border-white/[0.06]',
    panelBg: 'bg-white/[0.02] border border-white/[0.06]',
    inputBg: 'bg-white/[0.04] border border-white/[0.1] text-white',
    selectOptionBg: 'bg-gray-900',
    chipActive: 'bg-emerald-400/20 text-emerald-400 border border-emerald-400/30',
    chipInactive: 'bg-white/[0.04] text-gray-400 border border-white/[0.06] hover:bg-white/[0.08]',
    buttonPrimary: 'bg-emerald-500 hover:bg-emerald-600 text-white',
    buttonSecondary: 'bg-white/[0.04] hover:bg-white/[0.08] text-gray-400 hover:text-white border border-white/[0.06]',
    errorBg: 'bg-red-500/10 border border-red-500/20 text-red-400',
    footerBorder: 'border-t border-white/[0.06]',
    kbdBg: 'bg-white/[0.04] border-white/[0.08]',
    divider: 'border-white/[0.04]',
    linkText: 'text-gray-600 hover:text-white',
  },
  // Light theme inspired by CoinMarketCap / TradingView / CoinGecko
  // Page: #F8FAFD, Cards: #FFFFFF, Text: #0D1421, Accent: #3861FB
  'light-blue': {
    pageBg: 'bg-[#F8FAFD]',
    cardClasses: 'bg-white border border-[#EFF2F5] rounded-2xl shadow-[0_1px_2px_rgba(88,102,126,0.12),0_4px_24px_rgba(88,102,126,0.08)]',
    cardHover: 'hover:border-[#CFD6E4] hover:shadow-[0_1px_2px_rgba(88,102,126,0.16),0_8px_32px_rgba(88,102,126,0.12)] transition-all duration-300',
    cardGlow: 'hover:border-[#3861FB]/20 hover:shadow-[0_0_20px_rgba(56,97,251,0.08)] transition-all duration-300',
    textPrimary: 'text-[#0D1421]',
    textSecondary: 'text-[#616E85]',
    textMuted: 'text-[#808A9D]',
    textDim: 'text-[#A6B0C3]',
    textFaint: 'text-[#CFD6E4]',
    subtleBg: 'bg-[#F8FAFD]',
    subtleBorder: 'border-[#EFF2F5]',
    panelBg: 'bg-white border border-[#EFF2F5]',
    inputBg: 'bg-[#EFF2F5] border border-[#CFD6E4] text-[#0D1421]',
    selectOptionBg: 'bg-white',
    chipActive: 'bg-[#DEFBF0] text-[#16C784] border border-[#16C784]/25',
    chipInactive: 'bg-[#F8FAFD] text-[#616E85] border border-[#EFF2F5] hover:bg-[#EFF2F5]',
    buttonPrimary: 'bg-[#3861FB] hover:bg-[#2952E0] text-white',
    buttonSecondary: 'bg-[#F8FAFD] hover:bg-[#EFF2F5] text-[#616E85] hover:text-[#0D1421] border border-[#EFF2F5]',
    errorBg: 'bg-[#FCE6E8] border border-[#EA3943]/20 text-[#EA3943]',
    footerBorder: 'border-t border-[#EFF2F5]',
    kbdBg: 'bg-[#EFF2F5] border-[#CFD6E4]',
    divider: 'border-[#EFF2F5]',
    linkText: 'text-[#A6B0C3] hover:text-[#0D1421]',
  },
} as const;

export type SiteThemeClasses = (typeof SITE_THEMES)[SiteTheme];

/** Get site theme class strings for a given theme */
export function getSiteThemeClasses(theme: SiteTheme = 'dark'): SiteThemeClasses {
  return SITE_THEMES[theme] ?? SITE_THEMES.dark;
}

export const THEME = {
  // Backgrounds
  pageBg: 'bg-[#0a0a0f]',
  cardBg: 'bg-white/[0.03]',
  cardBorder: 'border border-white/[0.06]',
  cardHover: 'hover:border-white/[0.12] hover:shadow-[0_0_30px_rgba(52,211,153,0.06)]',
  cardRounded: 'rounded-2xl',
  cardBlur: 'backdrop-blur-md',

  // Accent
  accent: 'text-emerald-400',
  accentBg: 'bg-emerald-400',
  accentGlow: 'shadow-[0_0_15px_rgba(52,211,153,0.15)]',
  accentBorder: 'border-emerald-400/20',

  // Typography
  kpiNumber: 'text-3xl font-bold text-white tracking-tight',
  kpiLabel: 'text-[11px] uppercase tracking-wider text-gray-500 font-medium',
  sectionTitle: 'text-sm font-semibold text-gray-300 uppercase tracking-wider',
  widgetTitle: 'text-xs font-semibold text-gray-400 uppercase tracking-widest',

  // Charts
  chartStroke: '#34d399',
  chartFill: 'rgba(52, 211, 153, 0.15)',
  chartGrid: 'rgba(255, 255, 255, 0.04)',
  chartText: 'rgba(255, 255, 255, 0.4)',
  chartRed: '#ef4444',
  chartGreen: '#34d399',

  // States
  loading: 'animate-pulse bg-white/[0.04] rounded-lg',
  error: 'bg-red-500/10 border border-red-500/20 rounded-lg text-red-400',
} as const;

// Composite class strings for common patterns
export const CARD_CLASSES =
  'bg-white/[0.03] backdrop-blur-md border border-white/[0.06] rounded-2xl hover:border-white/[0.12] transition-all duration-300';

export const CARD_CLASSES_STATIC =
  'bg-white/[0.03] backdrop-blur-md border border-white/[0.06] rounded-2xl';

export const GLOW_CARD_CLASSES =
  'bg-white/[0.03] backdrop-blur-md border border-white/[0.06] rounded-2xl hover:border-emerald-400/20 hover:shadow-[0_0_30px_rgba(52,211,153,0.06)] transition-all duration-300';

// ECharts theme options
export const ECHARTS_THEME = {
  backgroundColor: 'transparent',
  textStyle: { color: 'rgba(255,255,255,0.5)', fontFamily: 'inherit' },
  grid: {
    left: '3%',
    right: '3%',
    bottom: '3%',
    top: '10%',
    containLabel: true,
  },
  xAxis: {
    axisLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } },
    axisTick: { show: false },
    axisLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 10 },
    splitLine: { lineStyle: { color: 'rgba(255,255,255,0.04)' } },
  },
  yAxis: {
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 10 },
    splitLine: { lineStyle: { color: 'rgba(255,255,255,0.04)' } },
  },
  tooltip: {
    backgroundColor: 'rgba(10,10,15,0.95)',
    borderColor: 'rgba(255,255,255,0.1)',
    textStyle: { color: '#fff', fontSize: 12 },
  },
} as const;

// ECharts theme for light site theme (CMC/TradingView-inspired)
export const ECHARTS_THEME_LIGHT = {
  backgroundColor: 'transparent',
  textStyle: { color: '#808A9D', fontFamily: 'inherit' },
  grid: {
    left: '3%',
    right: '3%',
    bottom: '3%',
    top: '10%',
    containLabel: true,
  },
  xAxis: {
    axisLine: { lineStyle: { color: '#EFF2F5' } },
    axisTick: { show: false },
    axisLabel: { color: '#808A9D', fontSize: 10 },
    splitLine: { lineStyle: { color: '#EFF2F5' } },
  },
  yAxis: {
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: '#808A9D', fontSize: 10 },
    splitLine: { lineStyle: { color: '#EFF2F5' } },
  },
  tooltip: {
    backgroundColor: '#FFFFFF',
    borderColor: '#EFF2F5',
    textStyle: { color: '#0D1421', fontSize: 12 },
    extraCssText: 'box-shadow: 0px 1px 2px rgba(88,102,126,0.12), 0px 4px 24px rgba(88,102,126,0.08);',
  },
} as const;

/** Get ECharts theme options for a given site theme */
export function getEchartsTheme(siteTheme: SiteTheme = 'dark') {
  return siteTheme === 'light-blue' ? ECHARTS_THEME_LIGHT : ECHARTS_THEME;
}

// Shared chart color palette (used by all ECharts widgets)
export const CHART_COLORS = [
  '#34d399', '#60a5fa', '#f59e0b', '#ef4444', '#a78bfa',
  '#f472b6', '#2dd4bf', '#fb923c', '#818cf8', '#4ade80',
];

// Chart height presets
export const CHART_HEIGHT_MAP = {
  compact: 200,
  normal: 300,
  tall: 400,
} as const;

// Color theme palettes
export const COLOR_THEMES = {
  emerald: {
    primary: '#34d399',
    secondary: '#6ee7b7',
    fill: 'rgba(52, 211, 153, 0.15)',
    palette: ['#34d399', '#60a5fa', '#f59e0b', '#ef4444', '#a78bfa', '#f472b6', '#2dd4bf', '#fb923c', '#818cf8', '#4ade80'],
  },
  blue: {
    primary: '#60a5fa',
    secondary: '#93c5fd',
    fill: 'rgba(96, 165, 250, 0.15)',
    palette: ['#60a5fa', '#34d399', '#f59e0b', '#ef4444', '#a78bfa', '#f472b6', '#2dd4bf', '#fb923c', '#818cf8', '#4ade80'],
  },
  purple: {
    primary: '#a78bfa',
    secondary: '#c4b5fd',
    fill: 'rgba(167, 139, 250, 0.15)',
    palette: ['#a78bfa', '#818cf8', '#c084fc', '#e879f9', '#60a5fa', '#34d399', '#f472b6', '#f59e0b', '#2dd4bf', '#fb923c'],
  },
  amber: {
    primary: '#f59e0b',
    secondary: '#fbbf24',
    fill: 'rgba(245, 158, 11, 0.15)',
    palette: ['#f59e0b', '#fbbf24', '#fb923c', '#ef4444', '#34d399', '#60a5fa', '#a78bfa', '#f472b6', '#2dd4bf', '#818cf8'],
  },
  rose: {
    primary: '#f43f5e',
    secondary: '#fb7185',
    fill: 'rgba(244, 63, 94, 0.15)',
    palette: ['#f43f5e', '#fb7185', '#f472b6', '#e879f9', '#ef4444', '#f59e0b', '#60a5fa', '#34d399', '#a78bfa', '#2dd4bf'],
  },
} as const;

// Table density presets
export const TABLE_DENSITY_MAP = {
  compact: { py: 'py-1.5', px: 'px-3', text: 'text-xs' },
  normal: { py: 'py-2.5', px: 'px-4', text: 'text-sm' },
  comfortable: { py: 'py-3.5', px: 'px-5', text: 'text-sm' },
} as const;

export type ColorThemeKey = keyof typeof COLOR_THEMES;

/** Get theme colors for a given color theme */
export function getThemeColors(theme: ColorThemeKey = 'emerald') {
  return COLOR_THEMES[theme] ?? COLOR_THEMES.emerald;
}

// Format utilities
import { getCurrencySymbol, isCryptoCurrency } from './currency';

export function formatCompact(n: number, currency: string = 'usd'): string {
  const s = getCurrencySymbol(currency);
  if (isCryptoCurrency(currency)) {
    if (n >= 1e6) return `${s}${(n / 1e6).toFixed(2)}M`;
    if (n >= 1e3) return `${s}${(n / 1e3).toFixed(2)}K`;
    if (n >= 1) return `${s}${n.toFixed(4)}`;
    return `${s}${n.toFixed(8)}`;
  }
  if (n >= 1e12) return `${s}${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `${s}${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${s}${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${s}${(n / 1e3).toFixed(1)}K`;
  return `${s}${n.toFixed(2)}`;
}

export function formatPrice(n: number, currency: string = 'usd'): string {
  const s = getCurrencySymbol(currency);
  if (isCryptoCurrency(currency)) {
    return `${s}${n < 1 ? n.toFixed(8) : n.toFixed(4)}`;
  }
  if (n < 0.01) return `${s}${n.toFixed(6)}`;
  if (n < 1) return `${s}${n.toFixed(4)}`;
  return `${s}${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatPercent(n: number | null | undefined): string {
  if (n == null) return '—';
  const sign = n >= 0 ? '+' : '';
  return `${sign}${n.toFixed(2)}%`;
}

export function percentColor(n: number | null | undefined): string {
  if (n == null) return 'text-gray-500';
  return n >= 0 ? 'text-emerald-400' : 'text-red-400';
}
