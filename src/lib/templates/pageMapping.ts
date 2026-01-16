/**
 * Page-Template Mapping
 *
 * Associates each page with relevant templates based on the page's data and features.
 * Templates are ordered by relevance to the page context.
 */

import { TemplateType } from './templateConfig';

/**
 * Page identifiers matching route paths
 */
export type PageId =
  | 'market'
  | 'compare'
  | 'charts'
  | 'technical'
  | 'sentiment'
  | 'monitor'
  | 'correlation'
  | 'onchain'
  | 'screener'
  | 'portfolio'
  | 'download'
  | 'defi'
  | 'derivatives'
  | 'nft'
  | 'tokens'
  | 'research'
  | 'risk'
  // Analytics pages with recreate options
  | 'trending'
  | 'gainers_losers'
  | 'categories'
  | 'dex_pools'
  // Additional pages
  | 'etf'
  | 'whales'
  | 'backtest'
  | 'alerts'
  | 'dashboard'
  | 'social'
  | 'glossary'
  | 'learn';

/**
 * Maps page IDs to their relevant template types
 * Templates are ordered by relevance (most relevant first)
 */
export const PAGE_TEMPLATE_MAP: Record<PageId, TemplateType[]> = {
  // Market Analytics - Primary market data page
  market: ['screener', 'market_overview', 'gainers_losers', 'watchlist'],

  // Compare - Side-by-side coin comparison
  compare: ['compare', 'correlation_matrix'],

  // Charts - OHLCV and technical charts
  charts: ['ohlcv_history', 'technical_indicators'],

  // Technical Analysis - RSI, MACD, MAs etc.
  technical: ['technical_indicators', 'ohlcv_history'],

  // Sentiment - Fear & Greed, social metrics
  sentiment: ['fear_greed', 'social_sentiment'],

  // Monitor/Dashboard - Overview of all metrics
  monitor: ['market_overview', 'fear_greed', 'funding_rates', 'onchain_btc'],

  // Correlation - Asset correlation analysis
  correlation: ['correlation_matrix', 'compare'],

  // On-Chain Analytics - Network metrics
  onchain: ['onchain_btc', 'eth_gas_tracker'],

  // Screener - Filter and find coins
  screener: ['screener', 'market_overview', 'gainers_losers'],

  // Portfolio - Personal holdings tracker
  portfolio: ['portfolio_tracker', 'watchlist'],

  // Download - General download page (shows all)
  download: [
    'screener',
    'market_overview',
    'ohlcv_history',
    'compare',
    'technical_indicators',
    'fear_greed',
    'portfolio_tracker',
    'watchlist',
  ],

  // DeFi - TVL and yields
  defi: ['defi_tvl', 'defi_yields'],

  // Derivatives - Funding rates and open interest
  derivatives: ['funding_rates', 'open_interest'],

  // NFT - NFT collections and stats
  nft: ['nft_collections'],

  // Tokens - Token unlocks and staking
  tokens: ['token_unlocks', 'staking_rewards'],

  // Research - Analysis tools
  research: ['compare', 'correlation_matrix'],

  // Risk - Risk metrics and analysis
  risk: ['risk_dashboard', 'correlation_matrix'],

  // Analytics pages with recreate options
  trending: ['market_overview', 'gainers_losers', 'watchlist'],
  gainers_losers: ['gainers_losers', 'screener', 'market_overview'],
  categories: ['screener', 'market_overview'],
  dex_pools: ['defi_tvl', 'defi_yields'],

  // Additional page mappings for full coverage

  // ETF - Bitcoin ETF tracking
  etf: ['etf_tracker', 'market_overview'],

  // Whale Tracking - Large holder activity
  whales: ['whale_tracker', 'exchange_flows', 'onchain_btc'],

  // Historical Analysis - Educational price study
  backtest: ['backtest_results', 'ohlcv_history', 'technical_indicators'],

  // Alerts - Price and market alerts
  alerts: ['alerts_summary', 'watchlist'],

  // Dashboard - User dashboard
  dashboard: ['portfolio_tracker', 'watchlist', 'alerts_summary'],

  // Social - Social metrics
  social: ['social_sentiment', 'fear_greed'],

  // Glossary - Educational content
  glossary: ['market_overview'],

  // Learn - Educational content
  learn: ['market_overview', 'technical_indicators'],
};

/**
 * Get templates available for a specific page
 */
export function getTemplatesForPage(pageId: PageId): TemplateType[] {
  return PAGE_TEMPLATE_MAP[pageId] || [];
}

/**
 * Check if a template is available for a page
 */
export function isTemplateAvailableForPage(
  pageId: PageId,
  templateType: TemplateType
): boolean {
  const templates = PAGE_TEMPLATE_MAP[pageId];
  return templates ? templates.includes(templateType) : false;
}

/**
 * Get all unique templates across all pages
 */
export function getAllTemplates(): TemplateType[] {
  const allTemplates = new Set<TemplateType>();
  Object.values(PAGE_TEMPLATE_MAP).forEach((templates) => {
    templates.forEach((template) => allTemplates.add(template));
  });
  return Array.from(allTemplates);
}

/**
 * Context information that can be captured from each page
 */
export interface PageContext {
  pageId: PageId;
  // Common context
  selectedCoins?: string[];
  timeframe?: string;
  currency?: string;
  // Market page
  sortBy?: string;
  filters?: Record<string, unknown>;
  // Compare page
  comparedCoins?: string[];
  visibleColumns?: string[];
  // Charts page
  selectedCoin?: string;
  chartType?: string;
  interval?: string;
  // Technical page
  selectedIndicators?: string[];
  // Correlation page
  correlationCoins?: string[];
  period?: string;
  // Portfolio page
  holdings?: Array<{ coin: string; quantity: number; avgPrice?: number }>;
  // Dashboard/Monitor
  dashboardMetrics?: string[];
  // Generic customizations
  customizations?: Record<string, unknown>;
}

/**
 * Default context values for new templates
 */
export const DEFAULT_PAGE_CONTEXT: Partial<PageContext> = {
  timeframe: '24h',
  currency: 'USD',
  selectedCoins: [],
  customizations: {
    includeCharts: true,
  },
};

/**
 * Merge page context with defaults
 */
export function mergeWithDefaults(context: Partial<PageContext>): PageContext {
  return {
    ...DEFAULT_PAGE_CONTEXT,
    ...context,
    customizations: {
      ...DEFAULT_PAGE_CONTEXT.customizations,
      ...context.customizations,
    },
  } as PageContext;
}

/**
 * Page display metadata for UI
 */
export interface PageMeta {
  title: string;
  description: string;
  icon: string;
}

export const PAGE_META: Record<PageId, PageMeta> = {
  market: {
    title: 'Market Analytics',
    description: 'Market overview and rankings',
    icon: '📊',
  },
  compare: {
    title: 'Compare',
    description: 'Side-by-side coin comparison',
    icon: '⚖️',
  },
  charts: {
    title: 'Charts',
    description: 'OHLCV and price charts',
    icon: '📈',
  },
  technical: {
    title: 'Technical',
    description: 'Technical indicators (educational)',
    icon: '📉',
  },
  sentiment: {
    title: 'Sentiment',
    description: 'Fear & Greed and social metrics',
    icon: '😨',
  },
  monitor: {
    title: 'Dashboard',
    description: 'Market monitoring dashboard',
    icon: '🖥️',
  },
  correlation: {
    title: 'Correlation',
    description: 'Asset correlation analysis',
    icon: '🔗',
  },
  onchain: {
    title: 'On-Chain',
    description: 'Network and blockchain metrics',
    icon: '⛓️',
  },
  screener: {
    title: 'Screener',
    description: 'Filter and find coins',
    icon: '🔍',
  },
  portfolio: {
    title: 'Portfolio',
    description: 'Track your holdings',
    icon: '💼',
  },
  download: {
    title: 'Templates',
    description: 'CryptoSheets formula templates',
    icon: '📋',
  },
  defi: {
    title: 'DeFi',
    description: 'DeFi protocols and yields',
    icon: '🏦',
  },
  derivatives: {
    title: 'Derivatives',
    description: 'Futures and funding rates',
    icon: '📊',
  },
  nft: {
    title: 'NFT',
    description: 'NFT collections and stats',
    icon: '🖼️',
  },
  tokens: {
    title: 'Tokens',
    description: 'Token unlocks and staking',
    icon: '🪙',
  },
  research: {
    title: 'Research',
    description: 'Research and analysis tools',
    icon: '🔬',
  },
  risk: {
    title: 'Risk',
    description: 'Risk metrics and analysis',
    icon: '⚠️',
  },
  // Analytics pages
  trending: {
    title: 'Trending',
    description: 'Trending coins and market movers',
    icon: '🔥',
  },
  gainers_losers: {
    title: 'Gainers & Losers',
    description: 'Top performers and biggest drops',
    icon: '📊',
  },
  categories: {
    title: 'Categories',
    description: 'Coin categories and sectors',
    icon: '🏷️',
  },
  dex_pools: {
    title: 'DEX Pools',
    description: 'Decentralized exchange liquidity',
    icon: '💧',
  },
  // Additional page metadata
  etf: {
    title: 'ETF Tracker',
    description: 'Bitcoin & Crypto ETF flows',
    icon: '📊',
  },
  whales: {
    title: 'Whale Watch',
    description: 'Large holder tracking',
    icon: '🐋',
  },
  backtest: {
    title: 'Historical Analysis',
    description: 'Educational price study',
    icon: '📈',
  },
  alerts: {
    title: 'Alerts',
    description: 'Price and market alerts',
    icon: '🔔',
  },
  dashboard: {
    title: 'Dashboard',
    description: 'Personal dashboard',
    icon: '🏠',
  },
  social: {
    title: 'Social',
    description: 'Social metrics and sentiment',
    icon: '📱',
  },
  glossary: {
    title: 'Glossary',
    description: 'Crypto terminology',
    icon: '📚',
  },
  learn: {
    title: 'Learn',
    description: 'Educational resources',
    icon: '🎓',
  },
};
