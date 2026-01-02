/**
 * Token Unlocks Data Fetcher
 * Fetches upcoming token unlocks from DeFiLlama
 */

// Cache for unlock data (10 minute TTL)
let unlocksCache: { data: TokenUnlockData[] | null; timestamp: number } = { data: null, timestamp: 0 };
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export interface TokenUnlock {
  date: string;
  timestamp: number;
  amount: number;
  amountUSD: number | null;
  percentOfCirculating: number;
  percentOfTotal: number;
  unlockType: 'cliff' | 'linear' | 'unknown';
  description?: string;
}

export interface TokenUnlockData {
  id: string;
  name: string;
  symbol: string;
  totalLocked: number;
  totalLockedUSD: number | null;
  percentLocked: number;
  upcomingUnlocks: TokenUnlock[];
  next7dUnlockPercent: number;
  next30dUnlockPercent: number;
  next90dUnlockPercent: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

// Map of CoinGecko IDs to DeFiLlama protocol names
const COIN_TO_PROTOCOL: Record<string, string> = {
  'solana': 'solana',
  'avalanche-2': 'avalanche',
  'arbitrum': 'arbitrum',
  'optimism': 'optimism',
  'aptos': 'aptos',
  'sui': 'sui',
  'celestia': 'celestia',
  'worldcoin-wld': 'worldcoin',
  'blur': 'blur',
  'jito-governance-token': 'jito',
  'pyth-network': 'pyth',
  'sei-network': 'sei',
  'dydx-chain': 'dydx',
  'starknet': 'starknet',
  'immutable-x': 'immutable',
  'axie-infinity': 'axie',
  'the-sandbox': 'sandbox',
  'ape-coin': 'apecoin',
};

// Major tokens with known vesting schedules (static data as fallback)
const KNOWN_UNLOCKS: Record<string, TokenUnlockData> = {
  'solana': {
    id: 'solana',
    name: 'Solana',
    symbol: 'SOL',
    totalLocked: 0,
    totalLockedUSD: null,
    percentLocked: 0,
    upcomingUnlocks: [],
    next7dUnlockPercent: 0,
    next30dUnlockPercent: 0,
    next90dUnlockPercent: 0,
    riskLevel: 'low'
  }
};

/**
 * Fetch token unlocks from DeFiLlama
 */
async function fetchDeFiLlamaUnlocks(): Promise<TokenUnlockData[]> {
  try {
    // DeFiLlama unlocks endpoint
    const res = await fetch(
      'https://api.llama.fi/unlocks',
      { next: { revalidate: 600 } }
    );

    if (!res.ok) {
      console.error('DeFiLlama unlocks API error:', res.status);
      return [];
    }

    const data = await res.json();

    if (!Array.isArray(data)) {
      return [];
    }

    const now = Date.now();
    const day7 = now + 7 * 24 * 60 * 60 * 1000;
    const day30 = now + 30 * 24 * 60 * 60 * 1000;
    const day90 = now + 90 * 24 * 60 * 60 * 1000;

    const unlockData: TokenUnlockData[] = data.map((token: {
      name?: string;
      symbol?: string;
      gecko_id?: string;
      events?: Array<{
        timestamp?: number;
        noOfTokens?: number | string;
        description?: string;
      }>;
      maxSupply?: number;
      totalLocked?: number;
    }) => {
      const upcomingUnlocks: TokenUnlock[] = [];
      let next7d = 0, next30d = 0, next90d = 0;

      // Parse unlock events
      if (token.events && Array.isArray(token.events)) {
        for (const event of token.events) {
          const timestamp = event.timestamp ? event.timestamp * 1000 : 0;
          if (timestamp > now && timestamp < day90) {
            const amount = typeof event.noOfTokens === 'string'
              ? parseFloat(event.noOfTokens)
              : (event.noOfTokens || 0);

            const percentOfTotal = token.maxSupply
              ? (amount / token.maxSupply) * 100
              : 0;

            upcomingUnlocks.push({
              date: new Date(timestamp).toISOString().split('T')[0],
              timestamp,
              amount,
              amountUSD: null,
              percentOfCirculating: 0, // Would need circulating supply
              percentOfTotal,
              unlockType: 'unknown',
              description: event.description
            });

            // Accumulate by time period
            if (timestamp < day7) next7d += percentOfTotal;
            if (timestamp < day30) next30d += percentOfTotal;
            if (timestamp < day90) next90d += percentOfTotal;
          }
        }
      }

      // Determine risk level based on unlock pressure
      let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
      if (next30d > 10) riskLevel = 'critical';
      else if (next30d > 5) riskLevel = 'high';
      else if (next30d > 2) riskLevel = 'medium';

      return {
        id: token.gecko_id || token.name?.toLowerCase().replace(/\s+/g, '-') || 'unknown',
        name: token.name || 'Unknown',
        symbol: token.symbol || '???',
        totalLocked: token.totalLocked || 0,
        totalLockedUSD: null,
        percentLocked: token.maxSupply && token.totalLocked
          ? (token.totalLocked / token.maxSupply) * 100
          : 0,
        upcomingUnlocks: upcomingUnlocks.sort((a, b) => a.timestamp - b.timestamp),
        next7dUnlockPercent: next7d,
        next30dUnlockPercent: next30d,
        next90dUnlockPercent: next90d,
        riskLevel
      };
    });

    return unlockData.filter(u => u.upcomingUnlocks.length > 0);
  } catch (error) {
    console.error('Error fetching DeFiLlama unlocks:', error);
    return [];
  }
}

/**
 * Fetch unlocks for a specific coin
 */
export async function fetchCoinUnlocks(coinId: string): Promise<TokenUnlockData | null> {
  const allUnlocks = await fetchAllUnlocks();

  // Find by ID or mapped protocol name
  const protocolName = COIN_TO_PROTOCOL[coinId] || coinId;

  return allUnlocks.find(u =>
    u.id.toLowerCase() === coinId.toLowerCase() ||
    u.id.toLowerCase() === protocolName.toLowerCase() ||
    u.symbol.toLowerCase() === coinId.toLowerCase()
  ) || null;
}

/**
 * Fetch all token unlocks with caching
 */
export async function fetchAllUnlocks(): Promise<TokenUnlockData[]> {
  // Check cache
  const now = Date.now();
  if (unlocksCache.data && (now - unlocksCache.timestamp) < CACHE_TTL) {
    return unlocksCache.data;
  }

  const data = await fetchDeFiLlamaUnlocks();

  // Update cache
  unlocksCache = { data, timestamp: now };

  return data;
}

/**
 * Get upcoming unlocks for the next 7 days (high impact events)
 */
export async function getUpcomingMajorUnlocks(days: number = 7): Promise<TokenUnlockData[]> {
  const allUnlocks = await fetchAllUnlocks();

  const now = Date.now();
  const cutoff = now + days * 24 * 60 * 60 * 1000;

  // Filter tokens with unlocks in the period and significant unlock %
  return allUnlocks
    .filter(token => {
      const hasUpcoming = token.upcomingUnlocks.some(u =>
        u.timestamp > now && u.timestamp < cutoff
      );
      return hasUpcoming && token.next30dUnlockPercent > 1; // > 1% unlock
    })
    .sort((a, b) => b.next7dUnlockPercent - a.next7dUnlockPercent);
}

/**
 * Get unlock risk interpretation
 */
export function getUnlockRiskInterpretation(data: TokenUnlockData): string {
  const parts: string[] = [];

  if (data.next7dUnlockPercent > 5) {
    parts.push(`CRITICAL: ${data.next7dUnlockPercent.toFixed(1)}% unlocking in 7 days`);
  } else if (data.next7dUnlockPercent > 2) {
    parts.push(`HIGH: ${data.next7dUnlockPercent.toFixed(1)}% unlocking in 7 days`);
  }

  if (data.next30dUnlockPercent > 10) {
    parts.push(`Major supply increase: ${data.next30dUnlockPercent.toFixed(1)}% in 30 days`);
  }

  if (data.percentLocked > 50) {
    parts.push(`${data.percentLocked.toFixed(0)}% of supply still locked - future dilution risk`);
  }

  return parts.length > 0
    ? parts.join('. ')
    : 'No significant unlock pressure';
}

/**
 * Format unlock date relative to now
 */
export function formatUnlockDate(timestamp: number): string {
  const now = Date.now();
  const diff = timestamp - now;
  const days = Math.floor(diff / (24 * 60 * 60 * 1000));

  if (days < 1) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days < 7) return `In ${days} days`;
  if (days < 30) return `In ${Math.floor(days / 7)} weeks`;
  return `In ${Math.floor(days / 30)} months`;
}

/**
 * Calculate unlock impact on price (rough estimate)
 * Based on supply increase and typical sell pressure
 */
export function estimateUnlockPriceImpact(
  unlockPercent: number,
  marketCap: number,
  avgDailyVolume: number
): { impact: string; severity: 'low' | 'medium' | 'high' } {
  // Assume 20-50% of unlocked tokens get sold
  const estimatedSellPercent = unlockPercent * 0.35;
  const sellPressure = (marketCap * estimatedSellPercent) / 100;
  const daysToAbsorb = sellPressure / avgDailyVolume;

  if (daysToAbsorb < 1) {
    return { impact: 'Minimal impact - easily absorbed by daily volume', severity: 'low' };
  } else if (daysToAbsorb < 7) {
    return { impact: `Moderate sell pressure - ~${daysToAbsorb.toFixed(0)} days to absorb`, severity: 'medium' };
  } else {
    return { impact: `Heavy sell pressure - ${daysToAbsorb.toFixed(0)}+ days to absorb`, severity: 'high' };
  }
}

// ============================================
// DOWNLOAD CENTER EXPORTS
// ============================================

export interface TokenUnlockDownload {
  name: string;
  symbol: string;
  unlockDate: string;
  daysUntil: number;
  unlockAmount: number;
  unlockValueUsd: number | null;
  percentOfTotal: number;
  percentOfCirculating: number;
  unlockType: string;
  riskLevel: string;
}

export interface StakingRewardDownload {
  name: string;
  symbol: string;
  stakingApy: number;
  inflationRate: number;
  totalStaked: number;
  stakedPercent: number;
  lockupPeriod: string;
  minStake: number;
}

/**
 * Fetch token unlocks for download (flattened format)
 */
export async function fetchTokenUnlocksForDownload(limit: number = 50): Promise<TokenUnlockDownload[]> {
  const allUnlocks = await fetchAllUnlocks();
  const results: TokenUnlockDownload[] = [];
  const now = Date.now();

  for (const token of allUnlocks.slice(0, limit)) {
    for (const unlock of token.upcomingUnlocks.slice(0, 5)) { // Max 5 unlocks per token
      const daysUntil = Math.ceil((unlock.timestamp - now) / (24 * 60 * 60 * 1000));

      results.push({
        name: token.name,
        symbol: token.symbol,
        unlockDate: unlock.date,
        daysUntil,
        unlockAmount: unlock.amount,
        unlockValueUsd: unlock.amountUSD,
        percentOfTotal: unlock.percentOfTotal,
        percentOfCirculating: unlock.percentOfCirculating,
        unlockType: unlock.unlockType,
        riskLevel: token.riskLevel,
      });
    }
  }

  // Sort by unlock date
  return results.sort((a, b) => a.daysUntil - b.daysUntil);
}

// Cache for staking data
let stakingCache: { data: StakingRewardDownload[] | null; timestamp: number } = { data: null, timestamp: 0 };
const STAKING_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

// DeFiLlama yields API response type
interface DeFiLlamaPool {
  chain: string;
  project: string;
  symbol: string;
  tvlUsd: number;
  apy: number;
  apyBase?: number;
  apyReward?: number;
  pool?: string;
  underlyingTokens?: string[];
}

// Fallback static data
const FALLBACK_STAKING: StakingRewardDownload[] = [
  { name: 'Ethereum', symbol: 'ETH', stakingApy: 3.8, inflationRate: 0.5, totalStaked: 34000000, stakedPercent: 28, lockupPeriod: 'Variable', minStake: 32 },
  { name: 'Solana', symbol: 'SOL', stakingApy: 7.2, inflationRate: 5.5, totalStaked: 390000000, stakedPercent: 72, lockupPeriod: '~2-3 days', minStake: 0 },
  { name: 'Cardano', symbol: 'ADA', stakingApy: 3.5, inflationRate: 2.0, totalStaked: 23000000000, stakedPercent: 63, lockupPeriod: 'No lockup', minStake: 0 },
  { name: 'Polkadot', symbol: 'DOT', stakingApy: 14.5, inflationRate: 10.0, totalStaked: 750000000, stakedPercent: 52, lockupPeriod: '28 days', minStake: 10 },
  { name: 'Cosmos', symbol: 'ATOM', stakingApy: 18.0, inflationRate: 14.0, totalStaked: 250000000, stakedPercent: 64, lockupPeriod: '21 days', minStake: 0 },
];

// Mapping for chain names to symbol names
const STAKING_SYMBOL_MAP: Record<string, { name: string; lockup: string; minStake: number }> = {
  'ETH': { name: 'Ethereum', lockup: 'Variable', minStake: 0.01 },
  'SOL': { name: 'Solana', lockup: '~2-3 days', minStake: 0 },
  'ATOM': { name: 'Cosmos', lockup: '21 days', minStake: 0 },
  'DOT': { name: 'Polkadot', lockup: '28 days', minStake: 10 },
  'AVAX': { name: 'Avalanche', lockup: '2 weeks', minStake: 25 },
  'NEAR': { name: 'Near Protocol', lockup: '52-65 hours', minStake: 0 },
  'MATIC': { name: 'Polygon', lockup: '~2 days', minStake: 1 },
  'SUI': { name: 'Sui', lockup: '~1 day', minStake: 0 },
  'APT': { name: 'Aptos', lockup: '~30 days', minStake: 10 },
  'ADA': { name: 'Cardano', lockup: 'No lockup', minStake: 0 },
  'BNB': { name: 'BNB Chain', lockup: '7 days', minStake: 1 },
  'FTM': { name: 'Fantom', lockup: '7 days', minStake: 1 },
  'OSMO': { name: 'Osmosis', lockup: '14 days', minStake: 0 },
  'TIA': { name: 'Celestia', lockup: '21 days', minStake: 0 },
  'SEI': { name: 'Sei', lockup: '21 days', minStake: 0 },
};

/**
 * Fetch staking rewards from DeFiLlama Yields API (real data)
 */
export async function fetchStakingRewardsForDownload(): Promise<StakingRewardDownload[]> {
  // Check cache
  const now = Date.now();
  if (stakingCache.data && (now - stakingCache.timestamp) < STAKING_CACHE_TTL) {
    return stakingCache.data;
  }

  try {
    // Fetch from DeFiLlama yields API
    const response = await fetch('https://yields.llama.fi/pools', {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 600 }, // Cache for 10 minutes
    });

    if (!response.ok) {
      console.error('DeFiLlama yields API error:', response.status);
      return FALLBACK_STAKING;
    }

    const data = await response.json();
    const pools: DeFiLlamaPool[] = data.data || [];

    // Filter for staking-related pools (liquid staking and native staking)
    const stakingPools = pools.filter((pool: DeFiLlamaPool) => {
      const project = pool.project?.toLowerCase() || '';
      const symbol = pool.symbol?.toUpperCase() || '';

      // Include liquid staking protocols and native staking
      const isStaking =
        project.includes('lido') ||
        project.includes('rocket') ||
        project.includes('stader') ||
        project.includes('stakewise') ||
        project.includes('marinade') ||
        project.includes('jito') ||
        project.includes('benqi') ||
        project.includes('ankr') ||
        project === 'stride' ||
        project === 'persistence' ||
        // Or single-asset pools with staking-like tokens
        symbol.startsWith('ST') ||
        symbol.includes('STAKED');

      // Must have reasonable APY and TVL
      return isStaking && pool.apy > 0 && pool.apy < 100 && pool.tvlUsd > 1000000;
    });

    // Group by base token and get best APY for each
    const tokenMap = new Map<string, StakingRewardDownload>();

    for (const pool of stakingPools) {
      // Extract base token symbol (e.g., "stETH" -> "ETH")
      let baseSymbol = pool.symbol?.toUpperCase()
        .replace(/^ST/i, '')
        .replace(/^W/i, '')
        .replace(/^M/i, '')
        .split('-')[0]
        .split('/')[0]
        || 'UNKNOWN';

      // Special cases
      if (pool.symbol?.toLowerCase().includes('eth')) baseSymbol = 'ETH';
      if (pool.symbol?.toLowerCase().includes('sol')) baseSymbol = 'SOL';
      if (pool.symbol?.toLowerCase().includes('atom')) baseSymbol = 'ATOM';
      if (pool.symbol?.toLowerCase().includes('matic')) baseSymbol = 'MATIC';
      if (pool.symbol?.toLowerCase().includes('avax')) baseSymbol = 'AVAX';

      const existing = tokenMap.get(baseSymbol);
      const info = STAKING_SYMBOL_MAP[baseSymbol] || { name: baseSymbol, lockup: 'Variable', minStake: 0 };

      // Update if better APY or doesn't exist
      if (!existing || pool.apy > existing.stakingApy) {
        tokenMap.set(baseSymbol, {
          name: info.name,
          symbol: baseSymbol,
          stakingApy: Math.round(pool.apy * 100) / 100,
          inflationRate: 0, // Not available from this API
          totalStaked: pool.tvlUsd,
          stakedPercent: 0, // Not available from this API
          lockupPeriod: info.lockup,
          minStake: info.minStake,
        });
      }
    }

    // Convert to array and sort by APY
    const results = Array.from(tokenMap.values())
      .sort((a, b) => b.stakingApy - a.stakingApy)
      .slice(0, 20); // Top 20

    if (results.length > 0) {
      // Update cache
      stakingCache = { data: results, timestamp: now };
      return results;
    }
  } catch (error) {
    console.error('Error fetching staking rewards from DeFiLlama:', error);
  }

  // Fallback to static data
  return FALLBACK_STAKING;
}
