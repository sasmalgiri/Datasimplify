// Premium design tokens for Live Dashboards
// Inspired by otherlevel.com — glassmorphism, deep dark, neon emerald accent

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

// Shared chart color palette (used by all ECharts widgets)
export const CHART_COLORS = [
  '#34d399', '#60a5fa', '#f59e0b', '#ef4444', '#a78bfa',
  '#f472b6', '#2dd4bf', '#fb923c', '#818cf8', '#4ade80',
];

// Format utilities
export function formatCompact(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
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
