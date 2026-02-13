/**
 * Template Filtering and Scoring Logic
 *
 * Filters and scores templates based on user configuration,
 * providing smart "Best Match" recommendations.
 */

import {
  getTemplateList,
  TemplateCategoryId,
  TEMPLATE_CATEGORIES,
  getSortedCategories,
} from './templateConfig';

// ============================================
// TYPES
// ============================================

export type TemplateMode = 'crk' | 'cryptosheets';
export type RefreshEngine = 'pack' | 'formula';
export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export interface UserConfiguration {
  coins: string[];
  timeframe: string;
  currency: string;
  category?: TemplateCategoryId | 'all';
  mode?: TemplateMode | 'all';
  refreshEngine?: RefreshEngine | 'all';
  difficulty?: Difficulty | 'all';
}

export interface FilteredTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: TemplateCategoryId;
  tier: 'free' | 'pro';
  relevanceScore: number;
  matchReasons: string[];
  isBestMatch: boolean;
  coinCountHint?: 'single' | 'few' | 'many' | 'any';
  specificCoins?: string[];
  mode: TemplateMode;
  refreshEngine: RefreshEngine;
  difficulty: Difficulty;
}

export interface CategoryGroup {
  category: {
    id: TemplateCategoryId;
    name: string;
    icon: string;
    order: number;
    description: string;
  };
  templates: FilteredTemplate[];
}

// ============================================
// TEMPLATE METADATA MAPPING
// ============================================

/**
 * Get template metadata (mode, refreshEngine, difficulty)
 * Based on template ID and complexity
 */
export function getTemplateMetadata(templateId: string): {
  mode: TemplateMode;
  refreshEngine: RefreshEngine;
  difficulty: Difficulty;
} {
  // Default: CRK with pack mode (beginner-friendly)
  const defaults = {
    mode: 'crk' as TemplateMode,
    refreshEngine: 'pack' as RefreshEngine,
    difficulty: 'beginner' as Difficulty,
  };

  // Mode mapping (CRK vs CryptoSheets)
  // Most templates use CRK (BYOK with prefetched data)
  // CryptoSheets fallback only for specific advanced cases
  const cryptoSheetsTemplates = [
    'whale_tracker', // Requires custom scraping
    'exchange_flows', // Requires exchange-specific APIs
    'mining_stats', // Requires pool-specific data
  ];

  // RefreshEngine mapping (Pack vs Formula)
  // Pack = Pre-built workbook with __CRK__ recipe sheet
  // Formula = Individual custom functions
  const formulaTemplates = [
    'watchlist', // Simple, manual setup preferred
    'compare', // Direct comparison, no complex recipe
    'ohlcv_history', // Simple historical data fetch
  ];

  // Difficulty mapping
  const beginnerTemplates = [
    'screener',
    'watchlist',
    'market_overview',
    'gainers_losers',
    'fear_greed',
    'nft_collections',
  ];

  const advancedTemplates = [
    'correlation_matrix',
    'backtest_results',
    'whale_tracker',
    'exchange_flows',
    'mining_stats',
    'staking_rewards',
    'alerts_summary',
  ];

  return {
    mode: cryptoSheetsTemplates.includes(templateId) ? 'cryptosheets' : 'crk',
    refreshEngine: formulaTemplates.includes(templateId) ? 'formula' : 'pack',
    difficulty: beginnerTemplates.includes(templateId)
      ? 'beginner'
      : advancedTemplates.includes(templateId)
      ? 'advanced'
      : 'intermediate',
  };
}

// ============================================
// SCORING CONFIGURATION
// ============================================

const SCORE_THRESHOLDS = {
  BEST_MATCH: 10,
  COIN_COUNT_MATCH: 10,
  SPECIFIC_COIN_MATCH: 8,
  CATEGORY_FILTER_MATCH: 5,
};

// ============================================
// MAIN FILTERING FUNCTION
// ============================================

/**
 * Filter and score templates based on user configuration
 */
export function filterAndScoreTemplates(
  config: UserConfiguration
): FilteredTemplate[] {
  const allTemplates = getTemplateList();

  const scored = allTemplates.map((template) => {
    let score = 0;
    const reasons: string[] = [];

    // === Score based on coin count ===
    const coinCount = config.coins.length;

    if (coinCount === 1 && template.coinCountHint === 'single') {
      score += SCORE_THRESHOLDS.COIN_COUNT_MATCH;
      reasons.push('Best for single coin analysis');
    } else if (coinCount >= 2 && coinCount <= 5 && template.coinCountHint === 'few') {
      score += SCORE_THRESHOLDS.COIN_COUNT_MATCH;
      reasons.push('Best for comparing 2-5 coins');
    } else if (coinCount > 5 && template.coinCountHint === 'many') {
      score += SCORE_THRESHOLDS.COIN_COUNT_MATCH;
      reasons.push('Best for many coins');
    } else if (template.coinCountHint === 'any') {
      score += 2; // Small bonus for versatile templates
    }

    // === Score based on specific coin matches ===
    if (template.specificCoins && config.coins.length > 0) {
      const matchingCoins = template.specificCoins.filter((coin) =>
        config.coins.some(
          (userCoin) => userCoin.toUpperCase() === coin.toUpperCase()
        )
      );

      if (matchingCoins.length > 0) {
        score += SCORE_THRESHOLDS.SPECIFIC_COIN_MATCH;
        reasons.push(`Specialized for ${matchingCoins.join(', ')}`);
      }
    }

    // === Special template recommendations ===
    // BTC on-chain for BTC
    if (
      template.id === 'onchain_btc' &&
      config.coins.some((c) => c.toUpperCase() === 'BTC')
    ) {
      score += 5;
      reasons.push('BTC on-chain metrics');
    }

    // ETH gas tracker for ETH
    if (
      template.id === 'eth_gas_tracker' &&
      config.coins.some((c) => c.toUpperCase() === 'ETH')
    ) {
      score += 5;
      reasons.push('ETH gas price tracking');
    }

    // Mining stats for BTC
    if (
      template.id === 'mining_stats' &&
      config.coins.some((c) => c.toUpperCase() === 'BTC')
    ) {
      score += 3;
      reasons.push('Mining profitability data');
    }

    // ETF tracker for BTC/ETH
    if (
      template.id === 'etf_tracker' &&
      config.coins.some((c) =>
        ['BTC', 'ETH'].includes(c.toUpperCase())
      )
    ) {
      score += 4;
      reasons.push('ETF flow tracking');
    }

    // Compare template for 2-10 coins
    if (
      template.id === 'compare' &&
      coinCount >= 2 &&
      coinCount <= 10
    ) {
      score += 8;
      reasons.push('Side-by-side comparison');
    }

    // Correlation matrix for 2+ coins
    if (
      template.id === 'correlation_matrix' &&
      coinCount >= 2
    ) {
      score += 6;
      reasons.push('Portfolio correlation');
    }

    // Portfolio tracker for 2+ coins
    if (
      template.id === 'portfolio_tracker' &&
      coinCount >= 2
    ) {
      score += 5;
      reasons.push('Track multiple holdings');
    }

    // Risk dashboard for 2+ coins
    if (
      template.id === 'risk_dashboard' &&
      coinCount >= 2
    ) {
      score += 4;
      reasons.push('Risk analysis');
    }

    // Screener/overview for many coins or no coins selected
    if (
      (template.id === 'screener' || template.id === 'market_overview') &&
      (coinCount === 0 || coinCount > 5)
    ) {
      score += 6;
      reasons.push('Market-wide screening');
    }

    // Technical indicators for single coin
    if (
      template.id === 'technical_indicators' &&
      coinCount === 1
    ) {
      score += 8;
      reasons.push('Technical analysis');
    }

    // OHLCV history for single coin
    if (
      template.id === 'ohlcv_history' &&
      coinCount === 1
    ) {
      score += 8;
      reasons.push('Candlestick data');
    }

    // Get metadata for this template
    const metadata = getTemplateMetadata(template.id);

    return {
      id: template.id,
      name: template.name,
      description: template.description,
      icon: template.icon,
      category: template.category,
      tier: template.tier || 'free',
      relevanceScore: score,
      matchReasons: reasons,
      isBestMatch: score >= SCORE_THRESHOLDS.BEST_MATCH,
      coinCountHint: template.coinCountHint,
      specificCoins: template.specificCoins,
      mode: metadata.mode,
      refreshEngine: metadata.refreshEngine,
      difficulty: metadata.difficulty,
    };
  });

  // Filter by mode, refreshEngine, difficulty if specified
  let filtered = scored;

  if (config.mode && config.mode !== 'all') {
    filtered = filtered.filter((t) => t.mode === config.mode);
  }

  if (config.refreshEngine && config.refreshEngine !== 'all') {
    filtered = filtered.filter((t) => t.refreshEngine === config.refreshEngine);
  }

  if (config.difficulty && config.difficulty !== 'all') {
    filtered = filtered.filter((t) => t.difficulty === config.difficulty);
  }

  // Sort by relevance score (highest first)
  return filtered.sort((a, b) => b.relevanceScore - a.relevanceScore);
}

/**
 * Get best match templates
 */
export function getBestMatches(
  config: UserConfiguration,
  limit: number = 3
): FilteredTemplate[] {
  const scored = filterAndScoreTemplates(config);
  return scored.filter((t) => t.isBestMatch).slice(0, limit);
}

/**
 * Get templates grouped by category with filtering
 */
export function getFilteredTemplatesGroupedByCategory(
  config: UserConfiguration
): CategoryGroup[] {
  const scoredTemplates = filterAndScoreTemplates(config);
  const categories = getSortedCategories();

  // Filter by category if specified
  const filtered =
    config.category && config.category !== 'all'
      ? scoredTemplates.filter((t) => t.category === config.category)
      : scoredTemplates;

  return categories
    .map((category) => ({
      category,
      templates: filtered
        .filter((t) => t.category === category.id)
        .sort((a, b) => b.relevanceScore - a.relevanceScore),
    }))
    .filter((group) => group.templates.length > 0);
}

/**
 * Get default configuration
 */
export function getDefaultConfiguration(): UserConfiguration {
  return {
    coins: [],
    timeframe: '24h',
    currency: 'USD',
    category: 'all',
    mode: 'all',
    refreshEngine: 'all',
    difficulty: 'all',
  };
}

/**
 * Timeframe options for the selector
 */
export const TIMEFRAME_OPTIONS = [
  { value: '24h', label: '24h' },
  { value: '7d', label: '7d' },
  { value: '30d', label: '30d' },
  { value: '90d', label: '90d' },
  { value: '1y', label: '1y' },
];

/**
 * Currency options for the selector
 */
export const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR' },
  { value: 'GBP', label: 'GBP' },
  { value: 'BTC', label: 'BTC' },
  { value: 'ETH', label: 'ETH' },
];

/**
 * Mode options (CRK vs CryptoSheets)
 */
export const MODE_OPTIONS = [
  { value: 'all', label: 'All Modes', icon: '🔌' },
  { value: 'crk', label: 'CRK (BYOK)', icon: '📊', description: 'Prefetched data with your API keys' },
  { value: 'cryptosheets', label: '3rd Party Integration', icon: '🔗', description: 'Compatible with 3rd party integrations (not affiliated, separate license required)' },
] as const;

/**
 * Refresh Engine options (Pack vs Formula)
 */
export const REFRESH_ENGINE_OPTIONS = [
  { value: 'all', label: 'All Types', icon: '🔄' },
  { value: 'pack', label: 'Pack Mode', icon: '📦', description: 'Pre-built with one-click refresh' },
  { value: 'formula', label: 'Formula Mode', icon: '⚙️', description: 'Custom functions, manual setup' },
] as const;

/**
 * Difficulty options
 */
export const DIFFICULTY_OPTIONS = [
  { value: 'all', label: 'All Levels', icon: '📚' },
  { value: 'beginner', label: 'Beginner', icon: '🟢', description: 'Easy to use, quick setup' },
  { value: 'intermediate', label: 'Intermediate', icon: '🟡', description: 'Some Excel knowledge needed' },
  { value: 'advanced', label: 'Advanced', icon: '🔴', description: 'Complex formulas, requires experience' },
] as const;

/**
 * Get category options including "All"
 */
export function getCategoryOptions() {
  const categories = getSortedCategories();
  return [
    { id: 'all' as const, name: 'All Categories', icon: '📋' },
    ...categories.map((c) => ({
      id: c.id,
      name: c.name,
      icon: c.icon,
    })),
  ];
}
