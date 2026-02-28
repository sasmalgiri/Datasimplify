// DataLab Mode Configuration
// Controls which features, presets, data sources, and drawing tools are available per mode.

import type { DataLabMode, ModeConfig, ModeFeatures, DataSource } from './types';
import { DATA_SOURCE_OPTIONS } from './types';
import type { DrawingType } from './drawingTypes';

// ── Simple mode: curated beginner presets ──────────────────────────────────

const SIMPLE_PRESET_IDS = [
  'simple-price-trends',
  'simple-market-mood',
  'simple-value-zones',
  'simple-volume-watch',
  'simple-risk-check',
  // Also allow a few existing presets that are beginner-friendly
  'confluence-zones',
  'sentiment-contrarian',
  'dca-accumulator',
];

const SIMPLE_DATA_SOURCES: DataSource[] = [
  'price', 'volume', 'ohlc',
  'sma', 'ema', 'rsi',
  'bollinger_upper', 'bollinger_lower',
  'fear_greed', 'btc_dominance',
  'drawdown', 'daily_return',
  'market_cap',
];

const SIMPLE_DRAWING_TOOLS: DrawingType[] = ['hline', 'trendline'];

// ── Feature flags per mode ─────────────────────────────────────────────────

const SIMPLE_FEATURES: ModeFeatures = {
  formulaEngine: false,
  powerCombos: false,
  regimeDetection: false,
  eventMarkers: false,
  whatIfSimulator: false,
  labNotebook: false,
  signalReliability: false,
  normalizeMode: false,
  logScale: false,
  dataTable: false,
  dataQualityWarnings: true,
  autoRefresh: true,
  keyboardShortcuts: false,
  commandPalette: false,
  autoDivergence: false,
  rollingCorrelation: false,
  advancedDrawings: false,
  annotationsTimeline: false,
  tableVirtualization: false,
  fullUndoRedo: false,
  pineScriptExport: false,
  multiChart: false,
  strategyBacktester: false,
  alertWebhooks: false,
  chartPatterns: false,
  persistentNotebooks: false,
  aiAnomalyDetection: false,
  naturalLanguageQuery: false,
  liquidationHeatmap: false,
  whaleWalletTracking: false,
};

const INTERMEDIATE_FEATURES: ModeFeatures = {
  formulaEngine: true,
  powerCombos: true,
  regimeDetection: true,
  eventMarkers: true,
  whatIfSimulator: true,
  labNotebook: true,
  signalReliability: true,
  normalizeMode: true,
  logScale: true,
  dataTable: true,
  dataQualityWarnings: true,
  autoRefresh: true,
  keyboardShortcuts: true,
  commandPalette: true,
  autoDivergence: true,
  rollingCorrelation: true,
  advancedDrawings: true,
  annotationsTimeline: true,
  tableVirtualization: true,
  fullUndoRedo: true,
  pineScriptExport: true,
  multiChart: false,
  strategyBacktester: false,
  alertWebhooks: false,
  chartPatterns: false,
  persistentNotebooks: false,
  aiAnomalyDetection: false,
  naturalLanguageQuery: false,
  liquidationHeatmap: false,
  whaleWalletTracking: false,
};

const ADVANCED_FEATURES: ModeFeatures = {
  formulaEngine: true,
  powerCombos: true,
  regimeDetection: true,
  eventMarkers: true,
  whatIfSimulator: true,
  labNotebook: true,
  signalReliability: true,
  normalizeMode: true,
  logScale: true,
  dataTable: true,
  dataQualityWarnings: true,
  autoRefresh: true,
  keyboardShortcuts: true,
  commandPalette: true,
  autoDivergence: true,
  rollingCorrelation: true,
  advancedDrawings: true,
  annotationsTimeline: true,
  tableVirtualization: true,
  fullUndoRedo: true,
  pineScriptExport: true,
  multiChart: true,
  strategyBacktester: true,
  alertWebhooks: true,
  chartPatterns: true,
  persistentNotebooks: true,
  aiAnomalyDetection: true,
  naturalLanguageQuery: true,
  liquidationHeatmap: true,
  whaleWalletTracking: true,
};

// ── Mode configurations ────────────────────────────────────────────────────

export const MODE_CONFIGS: Record<DataLabMode, ModeConfig> = {
  simple: {
    mode: 'simple',
    label: 'Simple',
    description: 'Clean beginner view with curated presets and essential indicators',
    allowedPresetIds: SIMPLE_PRESET_IDS,
    allowedDataSources: SIMPLE_DATA_SOURCES,
    allowedDrawingTools: SIMPLE_DRAWING_TOOLS,
    features: SIMPLE_FEATURES,
  },
  intermediate: {
    mode: 'intermediate',
    label: 'Intermediate',
    description: 'Full analytics with all indicators, shortcuts, divergence detection, and code export',
    allowedPresetIds: 'all',
    allowedDataSources: 'all',
    allowedDrawingTools: ['hline', 'trendline', 'fibonacci', 'text', 'pitchfork', 'regression_channel', 'measurement'],
    features: INTERMEDIATE_FEATURES,
  },
  advanced: {
    mode: 'advanced',
    label: 'Advanced',
    description: 'Pro suite with multi-chart, backtester, AI anomaly detection, pattern recognition, and more',
    allowedPresetIds: 'all',
    allowedDataSources: 'all',
    allowedDrawingTools: 'all',
    features: ADVANCED_FEATURES,
  },
};

// ── Helper functions ───────────────────────────────────────────────────────

export function getModeConfig(mode: DataLabMode): ModeConfig {
  return MODE_CONFIGS[mode];
}

export function isFeatureAvailable(mode: DataLabMode, feature: keyof ModeFeatures): boolean {
  return MODE_CONFIGS[mode].features[feature];
}

export function getFilteredDataSources(mode: DataLabMode) {
  const config = MODE_CONFIGS[mode];
  if (config.allowedDataSources === 'all') return DATA_SOURCE_OPTIONS;
  const allowed = new Set(config.allowedDataSources);
  return DATA_SOURCE_OPTIONS.filter((opt) => allowed.has(opt.source));
}

export function getFilteredDrawingTools(mode: DataLabMode): DrawingType[] {
  const config = MODE_CONFIGS[mode];
  if (config.allowedDrawingTools === 'all') {
    return ['hline', 'trendline', 'fibonacci', 'text', 'pitchfork', 'regression_channel', 'measurement'];
  }
  return config.allowedDrawingTools as DrawingType[];
}

export function isPresetAllowed(mode: DataLabMode, presetId: string): boolean {
  const config = MODE_CONFIGS[mode];
  if (config.allowedPresetIds === 'all') return true;
  return config.allowedPresetIds.includes(presetId);
}

/** Mode display metadata */
export const MODE_META: Record<DataLabMode, { icon: string; color: string; tip: string }> = {
  simple: {
    icon: 'Sparkles',
    color: '#34d399',
    tip: 'Beginner-friendly: curated presets, basic indicators, auto-refresh',
  },
  intermediate: {
    icon: 'BarChart3',
    color: '#60a5fa',
    tip: 'Full analytics: all indicators, keyboard shortcuts, divergence, correlation, code export',
  },
  advanced: {
    icon: 'Zap',
    color: '#f59e0b',
    tip: 'Pro suite: multi-chart, backtester, AI anomaly, pattern recognition, whale tracking',
  },
};
