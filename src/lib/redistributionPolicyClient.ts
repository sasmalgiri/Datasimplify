export type RedistributableSourceKey = string;

const FREE_ONLY_SOURCES_CLIENT = new Set([
  'coinlore',
  'alternativeme',
  'defillama',
  'blockchaininfo',
  'publicrpc',
]);

function parseAllowlist(raw: string | undefined): Set<string> {
  const value = (raw || '').trim();
  if (!value) return new Set();
  return new Set(
    value
      .split(',')
      .map(s => s.trim().toLowerCase())
      .filter(Boolean)
  );
}

export function isRedistributionPolicyEnabledClient(): boolean {
  const appMode = (process.env.NEXT_PUBLIC_APP_MODE || '').trim().toLowerCase();
  if (appMode === 'free') return true;
  const mode = (process.env.NEXT_PUBLIC_REDISTRIBUTION_MODE || '').trim().toLowerCase();
  return mode === 'strict' || mode === 'on' || mode === 'enabled' || mode === '1' || mode === 'true';
}

export function getRedistributableSourcesAllowlistClient(): Set<string> {
  const appMode = (process.env.NEXT_PUBLIC_APP_MODE || '').trim().toLowerCase();
  const fromEnv = parseAllowlist(process.env.NEXT_PUBLIC_REDISTRIBUTABLE_SOURCES);

  if (appMode === 'free') {
    const base = fromEnv.size > 0 ? fromEnv : new Set(FREE_ONLY_SOURCES_CLIENT);
    return new Set([...base].filter(s => FREE_ONLY_SOURCES_CLIENT.has(s)));
  }

  return fromEnv;
}

export function isSourceRedistributableClient(sourceKey: RedistributableSourceKey): boolean {
  if (!isRedistributionPolicyEnabledClient()) return true;
  const allowlist = getRedistributableSourcesAllowlistClient();
  if (allowlist.size === 0) return false;
  return allowlist.has(String(sourceKey).toLowerCase());
}

export function areAllSourcesRedistributableClient(sourceKeys: RedistributableSourceKey[]): boolean {
  if (!isRedistributionPolicyEnabledClient()) return true;
  if (!Array.isArray(sourceKeys) || sourceKeys.length === 0) return false;
  return sourceKeys.every(isSourceRedistributableClient);
}

export function isAnySourceRedistributableClient(sourceKeys: RedistributableSourceKey[]): boolean {
  if (!isRedistributionPolicyEnabledClient()) return true;
  const allowlist = getRedistributableSourcesAllowlistClient();
  if (allowlist.size === 0) return false;
  return sourceKeys.some(s => allowlist.has(String(s).toLowerCase()));
}

// Keep in sync with server-side assertions in src/app/api/download/route.ts
export const REQUIRED_SOURCES_BY_DOWNLOAD_CATEGORY: Record<string, RedistributableSourceKey[]> = {
  // CoinGecko-derived market data
  market_overview: ['coingecko'],
  historical_prices: ['coingecko'],
  global_stats: ['coingecko'],
  gainers_losers: ['coingecko'],
  categories: ['coingecko'],

  // On-chain / macro sources
  defi_protocols: ['defillama'],
  defi_yields: ['defillama'],
  stablecoins: ['defillama'],
  chain_tvl: ['defillama'],
  fear_greed: ['alternativeme'],
  bitcoin_onchain: ['blockchair', 'blockchaininfo'],
  eth_gas: ['publicrpc'],

  // Sentiment
  sentiment_aggregated: ['reddit', 'cryptopanic'],
  sentiment_reddit: ['reddit'],
  sentiment_news: ['cryptopanic'],
  sentiment_coin: ['reddit', 'cryptopanic'],

  // Whales
  whale_transactions: ['etherscan', 'coingecko', 'blockchair'],
  exchange_flows: ['etherscan', 'coingecko'],

  // Derivatives + technical
  funding_rates: ['coingecko'],
  open_interest: ['coingecko'],
  technical_indicators: ['coingecko'],
  correlation_matrix: ['coingecko'],

  // Token economics
  token_unlocks: ['defillama'],
  staking_rewards: ['defillama'],

  // NFT
  nft_collections: ['coingecko'],
  nft_stats: ['coingecko'],
};

export function isDownloadCategoryRedistributableClient(categoryId: string): boolean {
  if (!isRedistributionPolicyEnabledClient()) return true;
  const required = REQUIRED_SOURCES_BY_DOWNLOAD_CATEGORY[categoryId] || [];
  return areAllSourcesRedistributableClient(required);
}
