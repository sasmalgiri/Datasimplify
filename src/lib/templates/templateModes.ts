/**
 * CryptoSheets Template Modes Configuration
 *
 * Templates ship with two modes to manage CryptoSheets API quota:
 * - Low-Quota Mode (default): Manual refresh, small watchlist, daily intervals only
 * - Pro Mode: Larger watchlists, more intervals, optional auto-refresh
 *
 * This ensures users don't hit CryptoSheets rate limits unexpectedly.
 */

export type RefreshFrequency = 'manual' | 'on_open' | 'hourly' | 'daily';

export interface TemplateMode {
  id: 'low_quota' | 'pro';
  name: string;
  description: string;
  maxAssets: number;
  allowedIntervals: string[];
  refreshFrequency: RefreshFrequency;
  autoRefresh: boolean;
  estimatedCallsPerRefresh: (assetCount: number) => number;
  cryptoSheetsRequirement: string;
}

/**
 * Low-Quota Mode Configuration (Default)
 *
 * Designed to work within CryptoSheets free tier limits:
 * - Manual refresh only
 * - Small watchlist (5-10 assets)
 * - Daily intervals only
 */
export const LOW_QUOTA_MODE: TemplateMode = {
  id: 'low_quota',
  name: 'Low-Quota Mode',
  description: 'Conservative settings for CryptoSheets Free/Basic plans',
  maxAssets: 10,
  allowedIntervals: ['1d'],
  refreshFrequency: 'manual',
  autoRefresh: false,
  estimatedCallsPerRefresh: (assetCount) => assetCount * 3, // ~3 calls per asset (price, change, volume)
  cryptoSheetsRequirement: 'CryptoSheets Free (100 calls/day) or higher',
};

/**
 * Pro Mode Configuration
 *
 * For CryptoSheets Pro/Premium users with higher limits:
 * - Larger watchlists (up to 100 assets)
 * - Multiple intervals (1h, 4h, 1d, 1w)
 * - Optional auto-refresh (disabled by default)
 */
export const PRO_MODE: TemplateMode = {
  id: 'pro',
  name: 'Pro Mode',
  description: 'Full features for CryptoSheets Pro/Premium plans',
  maxAssets: 100,
  allowedIntervals: ['1h', '4h', '1d', '1w'],
  refreshFrequency: 'manual', // Still manual by default even in Pro
  autoRefresh: false,
  estimatedCallsPerRefresh: (assetCount) => assetCount * 8, // More metrics per asset
  cryptoSheetsRequirement: 'CryptoSheets Pro (1,000+ calls/day) or higher',
};

/**
 * Template Requirements Checklist
 *
 * Hard requirements that must be met before template will work
 */
export interface TemplateRequirements {
  excelDesktop: boolean;
  cryptoSheetsAddin: boolean;
  cryptoSheetsAccount: boolean;
}

export const TEMPLATE_REQUIREMENTS: {
  id: string;
  name: string;
  description: string;
  howToCheck: string;
  howToFix: string;
}[] = [
  {
    id: 'excel_desktop',
    name: 'Microsoft Excel Desktop',
    description: 'Excel Desktop (Windows or Mac) is required. Excel Online does NOT support CryptoSheets.',
    howToCheck: 'Open in Excel Desktop, not browser',
    howToFix: 'Download and install Microsoft Office or Microsoft 365',
  },
  {
    id: 'cryptosheets_addin',
    name: 'CryptoSheets Add-in',
    description: 'The CryptoSheets Excel add-in must be installed for formulas to work.',
    howToCheck: 'Insert > Get Add-ins > Search "CryptoSheets"',
    howToFix: 'Visit https://www.cryptosheets.com/ to install the free add-in',
  },
  {
    id: 'cryptosheets_account',
    name: 'CryptoSheets Account',
    description: 'You must be signed in to CryptoSheets to fetch data.',
    howToCheck: 'Click CryptoSheets tab > Check if signed in',
    howToFix: 'Create a free account at https://www.cryptosheets.com/signup',
  },
];

/**
 * Quota Status Messages
 *
 * User-friendly messages for different quota/error states
 */
export const QUOTA_STATUS_MESSAGES = {
  missing_addin: {
    title: 'CryptoSheets Add-in Not Installed',
    message: 'You will see #NAME? errors because the CryptoSheets add-in is not installed.',
    action: 'Install CryptoSheets: Insert > Get Add-ins > Search "CryptoSheets"',
    severity: 'error' as const,
  },
  not_signed_in: {
    title: 'Not Signed In to CryptoSheets',
    message: 'Data cannot be fetched because you are not signed in to CryptoSheets.',
    action: 'Click the CryptoSheets tab and sign in to your account',
    severity: 'warning' as const,
  },
  quota_exceeded: {
    title: 'CryptoSheets Plan Limit Reached',
    message: 'Your CryptoSheets plan limit was reached. Data may be stale or missing.',
    action: 'Reduce watchlist size, lower refresh frequency, or upgrade your CryptoSheets plan',
    severity: 'warning' as const,
  },
  rate_limited: {
    title: 'Rate Limited',
    message: 'Too many requests. CryptoSheets is temporarily blocking new data.',
    action: 'Wait a few minutes and try refreshing again. Consider enabling Low-Quota Mode.',
    severity: 'warning' as const,
  },
  ok: {
    title: 'CryptoSheets Connected',
    message: 'CryptoSheets is working correctly.',
    action: 'Press Ctrl+Alt+F5 to refresh all data',
    severity: 'success' as const,
  },
};

/**
 * Refresh Frequency Options
 *
 * Options for the refresh frequency selector
 */
export const REFRESH_FREQUENCY_OPTIONS: {
  id: RefreshFrequency;
  label: string;
  description: string;
  estimatedDailyCallsPerAsset: number;
  recommended: boolean;
}[] = [
  {
    id: 'manual',
    label: 'Manual (Recommended)',
    description: 'Refresh only when you click Refresh All or press Ctrl+Alt+F5',
    estimatedDailyCallsPerAsset: 0,
    recommended: true,
  },
  {
    id: 'on_open',
    label: 'On Open',
    description: 'Refresh automatically when you open the workbook',
    estimatedDailyCallsPerAsset: 3, // Assume ~3 opens/day
    recommended: false,
  },
  {
    id: 'hourly',
    label: 'Hourly',
    description: 'Auto-refresh every hour (requires workbook to be open)',
    estimatedDailyCallsPerAsset: 24,
    recommended: false,
  },
  {
    id: 'daily',
    label: 'Daily',
    description: 'Auto-refresh once per day when workbook is open',
    estimatedDailyCallsPerAsset: 1,
    recommended: false,
  },
];

/**
 * Asset Count Presets
 *
 * Quick selection options for asset count
 */
export const ASSET_COUNT_PRESETS: {
  label: string;
  count: number;
  mode: 'low_quota' | 'pro';
  description: string;
}[] = [
  { label: '5 Assets', count: 5, mode: 'low_quota', description: 'Best for free CryptoSheets plans' },
  { label: '10 Assets', count: 10, mode: 'low_quota', description: 'Recommended for most users' },
  { label: '25 Assets', count: 25, mode: 'pro', description: 'Requires CryptoSheets Pro' },
  { label: '50 Assets', count: 50, mode: 'pro', description: 'Requires CryptoSheets Pro' },
  { label: '100 Assets', count: 100, mode: 'pro', description: 'Requires CryptoSheets Premium' },
];

/**
 * Timeframe Options
 *
 * Available timeframes based on template mode
 */
export const TIMEFRAME_OPTIONS: {
  id: string;
  label: string;
  availableIn: ('low_quota' | 'pro')[];
  callMultiplier: number;
}[] = [
  { id: '1d', label: 'Daily', availableIn: ['low_quota', 'pro'], callMultiplier: 1 },
  { id: '4h', label: '4 Hour', availableIn: ['pro'], callMultiplier: 1.5 },
  { id: '1h', label: 'Hourly', availableIn: ['pro'], callMultiplier: 2 },
  { id: '1w', label: 'Weekly', availableIn: ['pro'], callMultiplier: 0.5 },
];

/**
 * Calculate estimated API calls based on configuration
 */
export function estimateApiCalls(config: {
  assetCount: number;
  refreshFrequency: RefreshFrequency;
  timeframe: string;
  includeCharts: boolean;
}): {
  perRefresh: number;
  perDay: number;
  perMonth: number;
  withinFreeLimit: boolean;
  withinProLimit: boolean;
} {
  const baseCallsPerAsset = 3; // price, change, volume
  const chartCallsPerAsset = config.includeCharts ? 2 : 0;
  const timeframeMultiplier = TIMEFRAME_OPTIONS.find(t => t.id === config.timeframe)?.callMultiplier || 1;

  const perRefresh = Math.ceil(
    config.assetCount * (baseCallsPerAsset + chartCallsPerAsset) * timeframeMultiplier
  );

  // Estimate daily calls based on refresh frequency
  let refreshesPerDay = 0;
  switch (config.refreshFrequency) {
    case 'manual':
      refreshesPerDay = 2; // Assume user refreshes ~2 times per day
      break;
    case 'on_open':
      refreshesPerDay = 3; // Assume workbook opened ~3 times per day
      break;
    case 'hourly':
      refreshesPerDay = 8; // Assume workbook open ~8 hours per day
      break;
    case 'daily':
      refreshesPerDay = 1;
      break;
  }

  const perDay = perRefresh * refreshesPerDay;
  const perMonth = perDay * 30;

  // CryptoSheets limits (approximate)
  const FREE_DAILY_LIMIT = 100;
  const PRO_DAILY_LIMIT = 1000;

  return {
    perRefresh,
    perDay,
    perMonth,
    withinFreeLimit: perDay <= FREE_DAILY_LIMIT,
    withinProLimit: perDay <= PRO_DAILY_LIMIT,
  };
}

/**
 * Get recommended mode based on asset count
 */
export function getRecommendedMode(assetCount: number): TemplateMode {
  return assetCount <= LOW_QUOTA_MODE.maxAssets ? LOW_QUOTA_MODE : PRO_MODE;
}

/**
 * Validate configuration against mode limits
 */
export function validateConfigForMode(
  config: {
    assetCount: number;
    timeframe: string;
    refreshFrequency: RefreshFrequency;
  },
  mode: TemplateMode
): { valid: boolean; warnings: string[] } {
  const warnings: string[] = [];

  if (config.assetCount > mode.maxAssets) {
    warnings.push(
      `${mode.name} supports up to ${mode.maxAssets} assets. You selected ${config.assetCount}. ` +
      `Consider using Pro Mode or reducing asset count.`
    );
  }

  if (!mode.allowedIntervals.includes(config.timeframe)) {
    warnings.push(
      `${config.timeframe} timeframe is not available in ${mode.name}. ` +
      `Available: ${mode.allowedIntervals.join(', ')}. Switch to Pro Mode for more options.`
    );
  }

  if (config.refreshFrequency !== 'manual' && !mode.autoRefresh) {
    warnings.push(
      `Auto-refresh is disabled in ${mode.name} to conserve API quota. ` +
      `Use manual refresh (Ctrl+Alt+F5) or switch to Pro Mode.`
    );
  }

  return { valid: warnings.length === 0, warnings };
}

/**
 * Get CryptoSheets plan recommendation based on usage
 */
export function getCryptoSheetsPlanRecommendation(
  estimatedDailyCalls: number
): {
  plan: string;
  reason: string;
} {
  if (estimatedDailyCalls <= 100) {
    return {
      plan: 'CryptoSheets Free',
      reason: 'Your estimated usage fits within the free tier (100 calls/day)',
    };
  } else if (estimatedDailyCalls <= 1000) {
    return {
      plan: 'CryptoSheets Pro',
      reason: 'Your estimated usage requires Pro tier (1,000 calls/day)',
    };
  } else {
    return {
      plan: 'CryptoSheets Premium',
      reason: 'Your estimated usage requires Premium tier (10,000+ calls/day)',
    };
  }
}
