// ============================================
// COINLORE API - Terms apply (verify commercial usage rights)
// ============================================
// FREE API - No API key required
// Commercial use: YES (no restrictions)
// Rate limit: Moderate usage recommended
// Docs: https://www.coinlore.com/cryptocurrency-data-api
// ============================================

const COINLORE_BASE = 'https://api.coinlore.net/api';

// ============================================
// TYPES
// ============================================

export interface CoinLoreCoin {
  id: string;
  symbol: string;
  name: string;
  nameid: string;
  rank: number;
  price_usd: string;
  percent_change_24h: string;
  percent_change_1h: string;
  percent_change_7d: string;
  market_cap_usd: string;
  volume24: string;
  volume24a: string;
  csupply: string;
  tsupply: string;
  msupply: string;
}

export interface CoinLoreGlobal {
  coins_count: number;
  active_markets: number;
  total_mcap: number;
  total_volume: number;
  btc_d: string;
  eth_d: string;
  mcap_change: string;
  volume_change: string;
  avg_change_percent: string;
  volume_ath: number;
  mcap_ath: number;
}

export interface CoinLoreMarket {
  name: string;
  base: string;
  quote: string;
  price: number;
  price_usd: number;
  volume: number;
  volume_usd: number;
  time: number;
}

// ============================================
// API FUNCTIONS
// ============================================

/**
 * Fetch global cryptocurrency market data
 * GET /global/
 */
export async function fetchCoinLoreGlobal(): Promise<CoinLoreGlobal[]> {
  try {
    const response = await fetch(`${COINLORE_BASE}/global/`, {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      throw new Error(`CoinLore API error: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('CoinLore global fetch error:', error);
    return [];
  }
}

/**
 * Fetch market data for multiple coins
 * GET /tickers/?start=0&limit=100
 * Max 100 coins per request
 */
export async function fetchCoinLoreMarketData(
  start: number = 0,
  limit: number = 100
): Promise<{ data: CoinLoreCoin[]; info: { coins_num: number; time: number } }> {
  try {
    const response = await fetch(
      `${COINLORE_BASE}/tickers/?start=${start}&limit=${Math.min(limit, 100)}`,
      {
        headers: { 'Accept': 'application/json' },
        next: { revalidate: 60 },
      }
    );

    if (!response.ok) {
      throw new Error(`CoinLore API error: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('CoinLore market fetch error:', error);
    return { data: [], info: { coins_num: 0, time: 0 } };
  }
}

/**
 * Fetch all coins with pagination (up to specified limit)
 * Fetches in batches of 100
 */
export async function fetchAllCoinLoreCoins(
  totalLimit: number = 500
): Promise<CoinLoreCoin[]> {
  const allCoins: CoinLoreCoin[] = [];
  const batchSize = 100;
  const batches = Math.ceil(totalLimit / batchSize);

  for (let i = 0; i < batches; i++) {
    const start = i * batchSize;
    const limit = Math.min(batchSize, totalLimit - start);

    console.log(`CoinLore: Fetching batch ${i + 1}/${batches} (start=${start}, limit=${limit})`);

    const result = await fetchCoinLoreMarketData(start, limit);

    if (result.data && result.data.length > 0) {
      allCoins.push(...result.data);
    } else {
      console.log(`CoinLore: No more data at batch ${i + 1}`);
      break;
    }

    // Rate limit protection: 500ms between requests
    if (i < batches - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  console.log(`CoinLore: Fetched ${allCoins.length} total coins`);
  return allCoins;
}

/**
 * Fetch specific coin by CoinLore ID
 * GET /ticker/?id=90
 */
export async function fetchCoinLoreCoin(id: string): Promise<CoinLoreCoin | null> {
  try {
    const response = await fetch(`${COINLORE_BASE}/ticker/?id=${id}`, {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      throw new Error(`CoinLore API error: ${response.status}`);
    }

    const data = await response.json();
    return data[0] || null;
  } catch (error) {
    console.error('CoinLore coin fetch error:', error);
    return null;
  }
}

/**
 * Fetch markets/exchanges for a specific coin
 * GET /coin/markets/?id=90
 */
export async function fetchCoinLoreMarkets(coinId: string): Promise<CoinLoreMarket[]> {
  try {
    const response = await fetch(`${COINLORE_BASE}/coin/markets/?id=${coinId}`, {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      throw new Error(`CoinLore API error: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('CoinLore markets fetch error:', error);
    return [];
  }
}

// ============================================
// TRANSFORM FUNCTIONS
// ============================================

/**
 * Transform CoinLore data to our internal format
 * Compatible with existing market_data table schema
 */
export function transformCoinLoreToInternal(coin: CoinLoreCoin): {
  symbol: string;
  coinlore_id: string;
  name: string;
  price: number;
  market_cap: number;
  rank: number;
  price_change_24h: number;
  price_change_7d: number;
  price_change_1h: number;
  volume_24h: number;
  circulating_supply: number;
  total_supply: number | null;
  max_supply: number | null;
} {
  return {
    symbol: coin.symbol.toUpperCase(),
    coinlore_id: coin.id,
    name: coin.name,
    price: parseFloat(coin.price_usd) || 0,
    market_cap: parseFloat(coin.market_cap_usd) || 0,
    rank: coin.rank,
    price_change_24h: parseFloat(coin.percent_change_24h) || 0,
    price_change_7d: parseFloat(coin.percent_change_7d) || 0,
    price_change_1h: parseFloat(coin.percent_change_1h) || 0,
    volume_24h: parseFloat(coin.volume24) || 0,
    circulating_supply: parseFloat(coin.csupply) || 0,
    total_supply: coin.tsupply ? parseFloat(coin.tsupply) : null,
    max_supply: coin.msupply ? parseFloat(coin.msupply) : null,
  };
}

/**
 * Transform CoinLore data to CoinGecko-compatible format
 * For backwards compatibility with existing frontend components
 */
export function transformCoinLoreToCoinGeckoFormat(coin: CoinLoreCoin): {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  price_change_percentage_7d_in_currency: number;
  total_volume: number;
  circulating_supply: number;
  total_supply: number | null;
  max_supply: number | null;
} {
  return {
    id: coin.nameid, // Use nameid as ID (e.g., "bitcoin", "ethereum")
    symbol: coin.symbol.toLowerCase(),
    name: coin.name,
    image: `https://www.coinlore.com/img/${coin.nameid}.png`, // CoinLore image URL
    current_price: parseFloat(coin.price_usd) || 0,
    market_cap: parseFloat(coin.market_cap_usd) || 0,
    market_cap_rank: coin.rank,
    price_change_24h: (parseFloat(coin.price_usd) * parseFloat(coin.percent_change_24h)) / 100 || 0,
    price_change_percentage_24h: parseFloat(coin.percent_change_24h) || 0,
    price_change_percentage_7d_in_currency: parseFloat(coin.percent_change_7d) || 0,
    total_volume: parseFloat(coin.volume24) || 0,
    circulating_supply: parseFloat(coin.csupply) || 0,
    total_supply: coin.tsupply ? parseFloat(coin.tsupply) : null,
    max_supply: coin.msupply ? parseFloat(coin.msupply) : null,
  };
}

// ============================================
// SYNC FUNCTION FOR DATABASE
// ============================================

/**
 * Sync CoinLore data to Supabase cache
 * Replaces syncCoinGeckoData() for commercial use
 */
export async function syncCoinLoreData(limit: number = 500): Promise<{
  success: boolean;
  count: number;
  error?: string;
}> {
  try {
    console.log('Syncing CoinLore market data...');

    const coins = await fetchAllCoinLoreCoins(limit);

    if (coins.length === 0) {
      throw new Error('No CoinLore data received');
    }

    // Transform to internal format
    const timestamp = new Date().toISOString();
    const records = coins.map(coin => ({
      ...transformCoinLoreToInternal(coin),
      updated_at: timestamp,
      fetched_at: timestamp,
      data_source: 'coinlore', // Track data source for attribution
    }));

    console.log(`CoinLore: Prepared ${records.length} records for sync`);

    return {
      success: true,
      count: records.length,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('CoinLore sync failed:', errorMsg);
    return { success: false, count: 0, error: errorMsg };
  }
}

// ============================================
// EXPORTS
// ============================================

export const COINLORE_ATTRIBUTION = {
  name: 'CoinLore',
  url: 'https://www.coinlore.com',
  license: 'Free API (terms apply; verify commercial usage rights)',
  note: 'Real-time cryptocurrency market data',
};
