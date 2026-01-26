export type AppMode = 'free' | 'full';

function parseBool(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined || value === null || value === '') return defaultValue;
  const normalized = value.trim().toLowerCase();
  if (['1', 'true', 'yes', 'y', 'on', 'enabled'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'n', 'off', 'disabled'].includes(normalized)) return false;
  return defaultValue;
}

export const APP_MODE: AppMode = ((process.env.NEXT_PUBLIC_APP_MODE || 'full').trim().toLowerCase() as AppMode) || 'full';

const isFreeMode = APP_MODE === 'free';

const defaultAdvancedEnabled = APP_MODE !== 'free';

export const FEATURES = {
  // Data providers
  // CoinGecko: DISPLAY-ONLY mode (UI charts/dashboards only, NO downloads)
  // Requires Analyst plan or higher. Attribution required.
  coingecko: isFreeMode ? false : parseBool(process.env.NEXT_PUBLIC_FEATURE_COINGECKO, true),

  // CoinGecko display-only mode: when true, CoinGecko data is shown in UI but NOT available for download
  // This is the legally compliant way to use CoinGecko without a redistribution license
  coingeckoDisplayOnly: parseBool(process.env.NEXT_PUBLIC_COINGECKO_DISPLAY_ONLY, true),

  // Social/news aggregation can have higher ToS/redistribution risk.
  // Defaults to OFF even in "full" mode; enable only if you're comfortable with the sources' terms.
  socialSentiment: isFreeMode ? false : parseBool(process.env.NEXT_PUBLIC_FEATURE_SOCIAL_SENTIMENT, false),

  // Macro data relies on third-party APIs (some with restrictive terms, e.g. Yahoo Finance endpoints).
  // Defaults to OFF; enable only if you're comfortable with the sources' terms.
  macro: isFreeMode ? false : parseBool(process.env.NEXT_PUBLIC_FEATURE_MACRO, false),

  // Allow Yahoo Finance fallbacks inside macro data (often more restrictive).
  // Defaults to OFF even if macro is ON.
  macroYahoo: isFreeMode ? false : parseBool(process.env.NEXT_PUBLIC_FEATURE_MACRO_YAHOO, false),

  // Public blockchain RPC endpoints (Ankr/public-rpc/publicnode/etc).
  // Defaults to OFF; enable only if you have permission and acceptable terms.
  publicRpc: parseBool(process.env.NEXT_PUBLIC_FEATURE_PUBLIC_RPC, isFreeMode ? true : false),

  // Monetization
  payments: parseBool(process.env.NEXT_PUBLIC_FEATURE_PAYMENTS, defaultAdvancedEnabled),
  pricing: parseBool(process.env.NEXT_PUBLIC_FEATURE_PRICING, defaultAdvancedEnabled),

  // Product modules
  predictions: isFreeMode ? false : parseBool(process.env.NEXT_PUBLIC_FEATURE_PREDICTIONS, defaultAdvancedEnabled),
  community: isFreeMode ? false : parseBool(process.env.NEXT_PUBLIC_FEATURE_COMMUNITY, defaultAdvancedEnabled),
  // Smart contract verification is part of the core toolset
  smartContractVerifier: parseBool(process.env.NEXT_PUBLIC_FEATURE_SMART_CONTRACT_VERIFIER, true),

  // alerts: Price alerts
  alerts: isFreeMode ? false : parseBool(process.env.NEXT_PUBLIC_FEATURE_ALERTS, defaultAdvancedEnabled),

  // chat: AI chat features
  chat: isFreeMode ? false : parseBool(process.env.NEXT_PUBLIC_FEATURE_CHAT, defaultAdvancedEnabled),

  // risk: Risk scoring/analysis
  risk: isFreeMode ? false : parseBool(process.env.NEXT_PUBLIC_FEATURE_RISK, defaultAdvancedEnabled),

  // Data domains with higher licensing/compliance risk.
  // These default to OFF even in "full" mode; explicitly enable only if you have rights/permission.
  defi: isFreeMode ? false : parseBool(process.env.NEXT_PUBLIC_FEATURE_DEFI, false),
  whales: isFreeMode ? false : parseBool(process.env.NEXT_PUBLIC_FEATURE_WHALES, false),
  nft: isFreeMode ? false : parseBool(process.env.NEXT_PUBLIC_FEATURE_NFT, false),

  // Placeholder/unfinished features - DISABLED until properly implemented
  // exchanges: Exchange rankings page (currently showing placeholder data)
  exchanges: isFreeMode ? false : parseBool(process.env.NEXT_PUBLIC_FEATURE_EXCHANGES, false),
  // dashboard: Custom dashboard page (currently under construction)
  dashboard: isFreeMode ? false : parseBool(process.env.NEXT_PUBLIC_FEATURE_DASHBOARD, false),
  // onchain: On-chain analytics page (currently disabled message)
  onchain: isFreeMode ? false : parseBool(process.env.NEXT_PUBLIC_FEATURE_ONCHAIN, false),
} as const;

export type FeatureKey = keyof typeof FEATURES;

export function isFeatureEnabled(key: FeatureKey): boolean {
  return Boolean(FEATURES[key]);
}

// Download categories that rely on higher-risk/third-party aggregation sources.
// If disabled, both UI and API should refuse the category.
export function isDownloadCategoryEnabled(categoryId: string): boolean {
  // Social/news aggregation
  if (
    [
      'sentiment_aggregated',
      'sentiment_reddit',
      'sentiment_news',
      'sentiment_coin',
    ].includes(categoryId)
  ) {
    return FEATURES.socialSentiment;
  }

  // DeFiLlama-backed domains
  if (
    [
      'defi_protocols',
      'defi_yields',
      'stablecoins',
      'chain_tvl',
      'token_unlocks',
      'staking_rewards',
    ].includes(categoryId)
  ) {
    return FEATURES.defi;
  }

  // Explorer/labeling-heavy domains
  if (['whale_transactions', 'exchange_flows'].includes(categoryId)) {
    return FEATURES.whales;
  }

  // NFT domains
  if (['nft_collections', 'nft_stats'].includes(categoryId)) {
    return FEATURES.nft;
  }

  return true;
}
