/**
 * Report Builder - Rule-Based Template Selection
 *
 * Deterministic template selection based on user requirements.
 * No AI predictions or financial advice - just template matching.
 */

import {
  TEMPLATE_CATALOG,
  type TemplateCatalogEntry,
  type ReportType,
  type AssetScope,
  type TimeframeOption,
  type OutputFormat,
  type PlanTier,
  type QuotaCost,
  getTemplateById,
} from './reportBuilderCatalog';

// ============ TYPES ============

export interface UserRequirements {
  reportType: ReportType;
  assetScope: AssetScope;
  timeframe: TimeframeOption;
  outputFormat: OutputFormat;
  planTier: PlanTier;
  coinCount?: number; // Optional: specific number of coins
}

export interface TemplateRecommendation {
  primary: TemplateCatalogEntry;
  alternatives: TemplateCatalogEntry[];
  reasoning: string;
  quotaEstimate: QuotaCost;
  refreshMode: 'manual' | 'on_open';
  warnings: string[];
  setupSteps: string[];
  config: {
    coins: string[];
    timeframe: string;
    refreshFrequency: string;
    includeCharts: boolean;
  };
}

// ============ SELECTION RULES ============

/**
 * Rule-based template selection - deterministic, not AI
 */
export function selectTemplate(requirements: UserRequirements): TemplateRecommendation {
  const { reportType, assetScope, timeframe, outputFormat, planTier } = requirements;

  // Determine if user is on free tier
  const isFreeUser = planTier === 'free' || planTier === 'unknown';

  // Get candidate templates by report type
  let candidates = TEMPLATE_CATALOG.filter((t) => t.report_type === reportType);

  // If free user, prioritize free-safe templates
  if (isFreeUser) {
    const freeSafe = candidates.filter((t) => t.free_safe);
    if (freeSafe.length > 0) {
      candidates = freeSafe;
    }
  }

  // Filter by timeframe support
  const timeframeCompatible = candidates.filter((t) =>
    t.inputs.supported_timeframes.includes(timeframe)
  );
  if (timeframeCompatible.length > 0) {
    candidates = timeframeCompatible;
  }

  // Determine coin count based on asset scope
  const targetCoinCount = requirements.coinCount || getCoinCountFromScope(assetScope, isFreeUser);

  // Filter by coin count range
  const coinCountCompatible = candidates.filter(
    (t) => targetCoinCount >= t.inputs.min_coins && targetCoinCount <= t.inputs.max_coins
  );
  if (coinCountCompatible.length > 0) {
    candidates = coinCountCompatible;
  }

  // Sort by difficulty (prefer simpler) and quota cost (prefer lower)
  candidates.sort((a, b) => {
    const difficultyOrder = { beginner: 0, intermediate: 1, advanced: 2 };
    const quotaOrder = { low: 0, medium: 1, high: 2 };

    // Free users: prioritize free-safe
    if (isFreeUser && a.free_safe !== b.free_safe) {
      return a.free_safe ? -1 : 1;
    }

    // Then by difficulty
    if (difficultyOrder[a.difficulty] !== difficultyOrder[b.difficulty]) {
      return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
    }

    // Then by quota cost
    return quotaOrder[a.quota_cost_estimate] - quotaOrder[b.quota_cost_estimate];
  });

  // Select primary template
  const primary = candidates[0] || getFallbackTemplate(reportType);

  // Get alternatives (different from primary)
  const alternatives = getAlternatives(primary, candidates, isFreeUser);

  // Generate warnings
  const warnings = generateWarnings(primary, requirements, isFreeUser);

  // Generate setup steps
  const setupSteps = generateSetupSteps(primary, requirements);

  // Determine refresh mode
  const refreshMode = isFreeUser || primary.quota_cost_estimate === 'high' ? 'manual' : 'manual';

  // Generate config
  const config = generateConfig(primary, requirements, isFreeUser);

  // Generate reasoning
  const reasoning = generateReasoning(primary, requirements, isFreeUser);

  return {
    primary,
    alternatives,
    reasoning,
    quotaEstimate: primary.quota_cost_estimate,
    refreshMode,
    warnings,
    setupSteps,
    config,
  };
}

// ============ HELPER FUNCTIONS ============

function getCoinCountFromScope(scope: AssetScope, isFreeUser: boolean): number {
  switch (scope) {
    case 'single_coin':
      return 1;
    case 'my_list':
      return isFreeUser ? 5 : 10;
    case 'top_coins':
      return isFreeUser ? 10 : 25;
    default:
      return isFreeUser ? 5 : 10;
  }
}

function getFallbackTemplate(reportType: ReportType): TemplateCatalogEntry {
  // Default fallbacks by report type
  const fallbacks: Record<ReportType, string> = {
    market: 'market-overview',
    watchlist: 'watchlist-simple',
    screener: 'screener-basic',
    portfolio: 'portfolio-tracker',
    correlation: 'correlation-matrix',
    risk: 'risk-dashboard',
  };

  const template = getTemplateById(fallbacks[reportType]);
  if (template) return template;

  // Ultimate fallback
  return TEMPLATE_CATALOG.find((t) => t.free_safe) || TEMPLATE_CATALOG[0];
}

function getAlternatives(
  primary: TemplateCatalogEntry,
  candidates: TemplateCatalogEntry[],
  isFreeUser: boolean
): TemplateCatalogEntry[] {
  const alternatives: TemplateCatalogEntry[] = [];

  // Add other candidates that aren't the primary
  for (const candidate of candidates) {
    if (candidate.template_id !== primary.template_id && alternatives.length < 2) {
      alternatives.push(candidate);
    }
  }

  // Add fallback templates if we don't have enough alternatives
  for (const fallbackId of primary.fallback_templates) {
    if (alternatives.length >= 2) break;
    const fallback = getTemplateById(fallbackId);
    if (fallback && fallback.template_id !== primary.template_id) {
      const alreadyAdded = alternatives.some((a) => a.template_id === fallback.template_id);
      if (!alreadyAdded) {
        alternatives.push(fallback);
      }
    }
  }

  // For free users, ensure at least one free-safe alternative
  if (isFreeUser && !primary.free_safe) {
    const freeSafeAlt = TEMPLATE_CATALOG.find(
      (t) =>
        t.free_safe &&
        t.template_id !== primary.template_id &&
        !alternatives.some((a) => a.template_id === t.template_id)
    );
    if (freeSafeAlt && alternatives.length < 2) {
      alternatives.push(freeSafeAlt);
    }
  }

  return alternatives.slice(0, 2);
}

function generateWarnings(
  template: TemplateCatalogEntry,
  requirements: UserRequirements,
  isFreeUser: boolean
): string[] {
  const warnings: string[] = [];

  // Free user trying to use non-free-safe template
  if (isFreeUser && !template.free_safe) {
    warnings.push(
      'This template may exceed free API tier limits. Consider upgrading your CoinGecko plan or reducing asset count.'
    );
  }

  // Hourly or 5-min timeframe
  if (requirements.timeframe !== 'daily') {
    warnings.push(
      'Hourly/5-min timeframes use more API calls. Consider daily timeframe to conserve quota.'
    );
  }

  // Large coin count
  if ((requirements.coinCount || 0) > 25) {
    warnings.push('Large watchlists use more API calls. Each refresh will be quota-intensive.');
  }

  // Screener or correlation on free tier
  if (isFreeUser && (template.features.screener || template.features.correlation)) {
    warnings.push(
      'Advanced features like screener/correlation work best with a CoinGecko Pro API plan.'
    );
  }

  return warnings;
}

function generateSetupSteps(
  template: TemplateCatalogEntry,
  requirements: UserRequirements
): string[] {
  const steps: string[] = [];

  // Step 1: Download
  steps.push(`Download the ${template.name} template (.xlsx file)`);

  // Step 2: Open in Excel Desktop
  steps.push('Open the file in Excel Desktop (Excel Online is NOT supported)');

  // Step 3: Explore data
  steps.push('Data is prefetched and ready to use');

  // Step 4: Charts
  steps.push('Select data and Insert charts to visualize');

  // Step 5: Live data
  steps.push('For live data, visit cryptoreportkit.com/live-dashboards with your BYOK API key');

  // Step 6: Verify
  steps.push('Check that the data sheets contain your prefetched market data');

  return steps;
}

function generateConfig(
  template: TemplateCatalogEntry,
  requirements: UserRequirements,
  isFreeUser: boolean
): TemplateRecommendation['config'] {
  // Determine coin count
  const coinCount = requirements.coinCount || getCoinCountFromScope(requirements.assetScope, isFreeUser);

  // Default coins based on count
  const defaultCoins = getDefaultCoins(coinCount);

  // Map timeframe
  const timeframeMap: Record<TimeframeOption, string> = {
    daily: '1d',
    hourly: '1h',
    '5min': '5m',
  };

  return {
    coins: defaultCoins,
    timeframe: timeframeMap[requirements.timeframe] || '1d',
    refreshFrequency: 'manual', // Always default to manual
    includeCharts: template.features.charts && requirements.outputFormat !== 'table',
  };
}

function getDefaultCoins(count: number): string[] {
  const topCoins = [
    'BTC', 'ETH', 'SOL', 'BNB', 'XRP',
    'ADA', 'DOGE', 'AVAX', 'DOT', 'MATIC',
    'LINK', 'UNI', 'ATOM', 'LTC', 'ETC',
    'XLM', 'ALGO', 'VET', 'FIL', 'NEAR',
    'APT', 'ARB', 'OP', 'INJ', 'SUI',
  ];

  return topCoins.slice(0, Math.min(count, topCoins.length));
}

function generateReasoning(
  template: TemplateCatalogEntry,
  requirements: UserRequirements,
  isFreeUser: boolean
): string {
  const parts: string[] = [];

  // Report type match
  parts.push(`Selected for ${requirements.reportType} analysis.`);

  // Free tier consideration
  if (isFreeUser) {
    if (template.free_safe) {
      parts.push('Works within CoinGecko free API tier limits.');
    } else {
      parts.push('May require CoinGecko Pro API for best results.');
    }
  }

  // Best for
  parts.push(template.best_for + '.');

  // Quota estimate
  const quotaDescriptions: Record<QuotaCost, string> = {
    low: 'Low API usage (~' + template.calls_per_refresh + ' calls per refresh)',
    medium: 'Medium API usage (~' + template.calls_per_refresh + ' calls per refresh)',
    high: 'Higher API usage (~' + template.calls_per_refresh + ' calls per refresh)',
  };
  parts.push(quotaDescriptions[template.quota_cost_estimate] + '.');

  return parts.join(' ');
}

// ============ TROUBLESHOOTING ============

export interface TroubleshootingItem {
  symptom: string;
  cause: string;
  solution: string;
}

export const TROUBLESHOOTING_GUIDE: TroubleshootingItem[] = [
  {
    symptom: '#NAME? errors in cells',
    cause: 'Formula references not available in this template',
    solution: 'Data is prefetched. For live data, use web dashboards at cryptoreportkit.com',
  },
  {
    symptom: 'Empty data / #VALUE! errors',
    cause: 'Data not loaded or invalid reference',
    solution: 'Re-download the template or check cell references',
  },
  {
    symptom: 'Rate limit / quota errors',
    cause: 'API quota exceeded',
    solution: 'Wait for quota reset, reduce coins, or upgrade your CoinGecko plan',
  },
  {
    symptom: 'Stale data',
    cause: 'Data not refreshed recently',
    solution: 'Download a fresh template or use live web dashboards at cryptoreportkit.com',
  },
  {
    symptom: 'Formulas showing as text',
    cause: 'Excel Online or mobile app',
    solution: 'Open in Excel Desktop app for best experience',
  },
  {
    symptom: 'Data looks outdated',
    cause: 'Template was downloaded some time ago',
    solution: 'Download a new template from cryptoreportkit.com for latest data',
  },
];

// ============ REFUSED REQUESTS ============

/**
 * Patterns that the Report Builder must refuse
 */
export const REFUSED_PATTERNS = [
  'what to buy',
  'what to sell',
  'price prediction',
  'price target',
  'stop loss',
  'take profit',
  'trading signal',
  'investment advice',
  'should i invest',
  'will it go up',
  'will it go down',
  'best coin to buy',
  'moon',
  'when lambo',
];

/**
 * Check if a user query should be refused
 */
export function shouldRefuseQuery(query: string): boolean {
  const lowerQuery = query.toLowerCase();
  return REFUSED_PATTERNS.some((pattern) => lowerQuery.includes(pattern));
}

/**
 * Standard refusal message
 */
export const REFUSAL_MESSAGE =
  "I'm a Report Builder that helps you select and configure templates. I cannot provide trading signals, price predictions, or investment advice. Would you like help choosing a template for market analysis, watchlist, or portfolio tracking instead?";
