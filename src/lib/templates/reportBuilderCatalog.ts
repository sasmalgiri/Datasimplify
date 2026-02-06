/**
 * Report Builder Template Catalog
 *
 * Deterministic template selection based on user requirements.
 * Each template has metadata for quota estimation and feature matching.
 */

// ============ TYPES ============

export type ReportType = 'market' | 'watchlist' | 'screener' | 'portfolio' | 'correlation' | 'risk';
export type AssetScope = 'top_coins' | 'my_list' | 'single_coin';
export type TimeframeOption = 'daily' | 'hourly' | '5min';
export type OutputFormat = 'dashboard' | 'table' | 'charts';
export type PlanTier = 'free' | 'paid' | 'unknown';
export type Difficulty = 'beginner' | 'intermediate' | 'advanced';
export type QuotaCost = 'low' | 'medium' | 'high';

export interface TemplateCatalogEntry {
  template_id: string;
  name: string;
  description: string;
  report_type: ReportType;
  difficulty: Difficulty;
  inputs: {
    min_coins: number;
    max_coins: number;
    supported_timeframes: TimeframeOption[];
    lookback_days: number;
  };
  quota_cost_estimate: QuotaCost;
  calls_per_refresh: number; // Base calls for typical config
  free_safe: boolean; // Can work within Free tier API limits
  features: {
    charts: boolean;
    screener: boolean;
    correlation: boolean;
    risk: boolean;
    portfolio: boolean;
    alerts: boolean;
  };
  fallback_templates: string[]; // Alternative templates if this doesn't fit
  best_for: string; // Short description of ideal use case
}

// ============ TEMPLATE CATALOG ============

export const TEMPLATE_CATALOG: TemplateCatalogEntry[] = [
  // ---- MARKET TEMPLATES ----
  {
    template_id: 'market-overview',
    name: 'Market Overview Dashboard',
    description: 'Top coins with price, volume, and market cap. Great starting point.',
    report_type: 'market',
    difficulty: 'beginner',
    inputs: {
      min_coins: 5,
      max_coins: 25,
      supported_timeframes: ['daily'],
      lookback_days: 7,
    },
    quota_cost_estimate: 'low',
    calls_per_refresh: 15,
    free_safe: true,
    features: {
      charts: true,
      screener: false,
      correlation: false,
      risk: false,
      portfolio: false,
      alerts: false,
    },
    fallback_templates: ['watchlist-simple'],
    best_for: 'Daily market check with top coins',
  },
  {
    template_id: 'market-advanced',
    name: 'Advanced Market Dashboard',
    description: 'Comprehensive market view with volume analysis and trends.',
    report_type: 'market',
    difficulty: 'intermediate',
    inputs: {
      min_coins: 10,
      max_coins: 50,
      supported_timeframes: ['daily', 'hourly'],
      lookback_days: 30,
    },
    quota_cost_estimate: 'medium',
    calls_per_refresh: 45,
    free_safe: false,
    features: {
      charts: true,
      screener: true,
      correlation: false,
      risk: false,
      portfolio: false,
      alerts: false,
    },
    fallback_templates: ['market-overview'],
    best_for: 'Active traders wanting deeper market analysis',
  },

  // ---- WATCHLIST TEMPLATES ----
  {
    template_id: 'watchlist-simple',
    name: 'Simple Watchlist',
    description: 'Track 5-10 coins with price and 24h change. Free tier friendly.',
    report_type: 'watchlist',
    difficulty: 'beginner',
    inputs: {
      min_coins: 1,
      max_coins: 10,
      supported_timeframes: ['daily'],
      lookback_days: 1,
    },
    quota_cost_estimate: 'low',
    calls_per_refresh: 10,
    free_safe: true,
    features: {
      charts: false,
      screener: false,
      correlation: false,
      risk: false,
      portfolio: false,
      alerts: false,
    },
    fallback_templates: [],
    best_for: 'Casual investors tracking a few coins',
  },
  {
    template_id: 'watchlist-pro',
    name: 'Pro Watchlist',
    description: 'Track up to 50 coins with charts and extended metrics.',
    report_type: 'watchlist',
    difficulty: 'intermediate',
    inputs: {
      min_coins: 5,
      max_coins: 50,
      supported_timeframes: ['daily', 'hourly'],
      lookback_days: 7,
    },
    quota_cost_estimate: 'medium',
    calls_per_refresh: 50,
    free_safe: false,
    features: {
      charts: true,
      screener: false,
      correlation: false,
      risk: false,
      portfolio: false,
      alerts: false,
    },
    fallback_templates: ['watchlist-simple'],
    best_for: 'Active traders with larger watchlists',
  },

  // ---- SCREENER TEMPLATES ----
  {
    template_id: 'screener-basic',
    name: 'Basic Coin Screener',
    description: 'Filter coins by market cap, volume, and price change.',
    report_type: 'screener',
    difficulty: 'intermediate',
    inputs: {
      min_coins: 20,
      max_coins: 100,
      supported_timeframes: ['daily'],
      lookback_days: 7,
    },
    quota_cost_estimate: 'medium',
    calls_per_refresh: 40,
    free_safe: false,
    features: {
      charts: false,
      screener: true,
      correlation: false,
      risk: false,
      portfolio: false,
      alerts: false,
    },
    fallback_templates: ['market-overview'],
    best_for: 'Finding opportunities in the market',
  },
  {
    template_id: 'screener-advanced',
    name: 'Advanced Screener',
    description: 'Multi-criteria screener with technical indicators.',
    report_type: 'screener',
    difficulty: 'advanced',
    inputs: {
      min_coins: 50,
      max_coins: 200,
      supported_timeframes: ['daily', 'hourly'],
      lookback_days: 30,
    },
    quota_cost_estimate: 'high',
    calls_per_refresh: 100,
    free_safe: false,
    features: {
      charts: true,
      screener: true,
      correlation: false,
      risk: true,
      portfolio: false,
      alerts: false,
    },
    fallback_templates: ['screener-basic'],
    best_for: 'Power users running complex screens',
  },

  // ---- PORTFOLIO TEMPLATES ----
  {
    template_id: 'portfolio-tracker',
    name: 'Portfolio Tracker',
    description: 'Track holdings, P&L, and allocation. Manual entry of quantities.',
    report_type: 'portfolio',
    difficulty: 'beginner',
    inputs: {
      min_coins: 1,
      max_coins: 20,
      supported_timeframes: ['daily'],
      lookback_days: 30,
    },
    quota_cost_estimate: 'low',
    calls_per_refresh: 20,
    free_safe: true,
    features: {
      charts: true,
      screener: false,
      correlation: false,
      risk: false,
      portfolio: true,
      alerts: false,
    },
    fallback_templates: ['watchlist-simple'],
    best_for: 'Tracking your crypto holdings',
  },
  {
    template_id: 'portfolio-advanced',
    name: 'Advanced Portfolio Analytics',
    description: 'Portfolio with risk metrics, correlation, and rebalancing suggestions.',
    report_type: 'portfolio',
    difficulty: 'advanced',
    inputs: {
      min_coins: 5,
      max_coins: 50,
      supported_timeframes: ['daily', 'hourly'],
      lookback_days: 90,
    },
    quota_cost_estimate: 'high',
    calls_per_refresh: 75,
    free_safe: false,
    features: {
      charts: true,
      screener: false,
      correlation: true,
      risk: true,
      portfolio: true,
      alerts: false,
    },
    fallback_templates: ['portfolio-tracker'],
    best_for: 'Serious investors managing risk',
  },

  // ---- CORRELATION TEMPLATES ----
  {
    template_id: 'correlation-matrix',
    name: 'Correlation Matrix',
    description: 'See how coins move together. Great for diversification.',
    report_type: 'correlation',
    difficulty: 'intermediate',
    inputs: {
      min_coins: 5,
      max_coins: 20,
      supported_timeframes: ['daily'],
      lookback_days: 30,
    },
    quota_cost_estimate: 'medium',
    calls_per_refresh: 30,
    free_safe: false,
    features: {
      charts: true,
      screener: false,
      correlation: true,
      risk: false,
      portfolio: false,
      alerts: false,
    },
    fallback_templates: ['market-overview'],
    best_for: 'Understanding coin relationships',
  },

  // ---- RISK TEMPLATES ----
  {
    template_id: 'risk-dashboard',
    name: 'Risk Dashboard',
    description: 'Volatility, drawdown, and risk metrics for your coins.',
    report_type: 'risk',
    difficulty: 'advanced',
    inputs: {
      min_coins: 5,
      max_coins: 30,
      supported_timeframes: ['daily'],
      lookback_days: 90,
    },
    quota_cost_estimate: 'medium',
    calls_per_refresh: 45,
    free_safe: false,
    features: {
      charts: true,
      screener: false,
      correlation: true,
      risk: true,
      portfolio: false,
      alerts: false,
    },
    fallback_templates: ['market-overview'],
    best_for: 'Risk-aware investors and traders',
  },
];

// ============ HELPER FUNCTIONS ============

/**
 * Get template by ID
 */
export function getTemplateById(templateId: string): TemplateCatalogEntry | undefined {
  return TEMPLATE_CATALOG.find((t) => t.template_id === templateId);
}

/**
 * Get templates by report type
 */
export function getTemplatesByReportType(reportType: ReportType): TemplateCatalogEntry[] {
  return TEMPLATE_CATALOG.filter((t) => t.report_type === reportType);
}

/**
 * Get free-safe templates only
 */
export function getFreeSafeTemplates(): TemplateCatalogEntry[] {
  return TEMPLATE_CATALOG.filter((t) => t.free_safe);
}

/**
 * Get templates that support a specific timeframe
 */
export function getTemplatesByTimeframe(timeframe: TimeframeOption): TemplateCatalogEntry[] {
  return TEMPLATE_CATALOG.filter((t) => t.inputs.supported_timeframes.includes(timeframe));
}

// ============ WIZARD STEP OPTIONS ============

export const REPORT_TYPE_OPTIONS = [
  { id: 'market', label: 'Market Overview', description: 'Track overall market trends and top coins', icon: '📊' },
  { id: 'watchlist', label: 'Watchlist', description: 'Monitor specific coins you care about', icon: '👀' },
  { id: 'screener', label: 'Screener', description: 'Filter and find coins matching criteria', icon: '🔍' },
  { id: 'portfolio', label: 'Portfolio', description: 'Track your holdings and P&L', icon: '💼' },
  { id: 'correlation', label: 'Correlation', description: 'See how coins move together', icon: '🔗' },
  { id: 'risk', label: 'Risk Analysis', description: 'Volatility and risk metrics', icon: '⚠️' },
] as const;

export const ASSET_SCOPE_OPTIONS = [
  { id: 'top_coins', label: 'Top Coins', description: 'Top 10-25 by market cap', icon: '🏆' },
  { id: 'my_list', label: 'My List', description: 'Choose specific coins', icon: '📝' },
  { id: 'single_coin', label: 'Single Coin', description: 'Deep dive into one coin', icon: '🎯' },
] as const;

export const TIMEFRAME_OPTIONS = [
  { id: 'daily', label: 'Daily', description: 'Daily candles and metrics', icon: '📅', free_safe: true },
  { id: 'hourly', label: 'Hourly', description: 'Hourly data (more API calls)', icon: '⏰', free_safe: false },
  { id: '5min', label: '5-Minute', description: 'High frequency (Pro only)', icon: '⚡', free_safe: false },
] as const;

export const OUTPUT_FORMAT_OPTIONS = [
  { id: 'dashboard', label: 'Dashboard', description: 'Visual dashboard with charts', icon: '📈' },
  { id: 'table', label: 'Table Export', description: 'Data tables for analysis', icon: '📋' },
  { id: 'charts', label: 'Charts Only', description: 'Focus on visualizations', icon: '📊' },
] as const;

export const PLAN_OPTIONS = [
  { id: 'free', label: 'Free', description: '100 calls/day limit', icon: '🆓' },
  { id: 'paid', label: 'Paid', description: 'Higher limits', icon: '💎' },
  { id: 'unknown', label: "Don't Know", description: "We'll assume free tier", icon: '❓' },
] as const;
