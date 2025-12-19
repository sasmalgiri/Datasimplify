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
