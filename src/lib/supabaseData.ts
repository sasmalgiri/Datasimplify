// ============================================
// SUPABASE DATA SERVICE
// Query cached data from Supabase (FAST!)
// Instead of hitting external APIs every time
// ============================================

import { supabase, isSupabaseConfigured } from './supabase';

// Helper to check if Supabase is ready
function checkSupabase() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local');
  }
  return supabase;
}

// ============================================
// MARKET DATA QUERIES
// ============================================

export async function getMarketDataFromCache(options?: {
  symbols?: string[];
  category?: string;
  sortBy?: 'market_cap' | 'price_change' | 'volume';
  limit?: number;
}) {
  let query = checkSupabase()
    .from('market_data')
    .select('*');
  
  if (options?.symbols && options.symbols.length > 0) {
    query = query.in('symbol', options.symbols);
  }
  
  if (options?.category && options.category !== 'all') {
    query = query.eq('category', options.category);
  }
  
  // Sorting
  switch (options?.sortBy) {
    case 'price_change':
      query = query.order('price_change_percent_24h', { ascending: false });
      break;
    case 'volume':
      query = query.order('quote_volume_24h', { ascending: false });
      break;
    default:
      query = query.order('market_cap', { ascending: false, nullsFirst: false });
  }
  
  if (options?.limit) {
    query = query.limit(options.limit);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  return data || [];
}

export async function getCoinFromCache(symbol: string) {
  const { data, error } = await checkSupabase()
    .from('market_data')
    .select('*')
    .eq('symbol', symbol)
    .single();
  
  if (error) throw error;
  return data;
}

// ============================================
// HISTORICAL PRICE QUERIES
// ============================================

export async function getHistoricalPricesFromCache(
  symbol: string,
  interval: string,
  limit: number = 100
) {
  const { data, error } = await checkSupabase()
    .from('klines')
    .select('*')
    .eq('symbol', symbol)
    .eq('interval', interval)
    .order('open_time', { ascending: false })
    .limit(limit);
  
  if (error) throw error;
  return data?.reverse() || []; // Return in chronological order
}

// ============================================
// DEFI DATA QUERIES
// ============================================

export async function getDefiProtocolsFromCache(limit: number = 50) {
  const { data, error } = await checkSupabase()
    .from('defi_protocols')
    .select('*')
    .order('tvl', { ascending: false })
    .limit(limit);
  
  if (error) throw error;
  return data || [];
}

export async function getDefiYieldsFromCache(limit: number = 50) {
  const { data, error } = await checkSupabase()
    .from('defi_yields')
    .select('*')
    .order('apy', { ascending: false })
    .limit(limit);
  
  if (error) throw error;
  return data || [];
}

export async function getChainTvlFromCache() {
  const { data, error } = await checkSupabase()
    .from('chain_tvl')
    .select('*')
    .order('tvl', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

export async function getStablecoinsFromCache() {
  const { data, error } = await checkSupabase()
    .from('stablecoins')
    .select('*')
    .order('market_cap', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

// ============================================
// SENTIMENT DATA QUERIES
// ============================================

// Cache TTL: 5 minutes for Fear & Greed (updates once per day, but we check often)
const FEAR_GREED_CACHE_TTL_MS = 5 * 60 * 1000;

export async function getFearGreedFromCache(): Promise<{
  value: number;
  classification: string;
  recorded_at: string;
} | null> {
  try {
    const db = checkSupabase();
    const { data, error } = await db
      .from('fear_greed_history')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      return null;
    }

    // Check freshness - use 'timestamp' column from actual schema
    if (data?.timestamp) {
      const cacheAge = Date.now() - new Date(data.timestamp).getTime();
      if (cacheAge > FEAR_GREED_CACHE_TTL_MS) {
        return null;
      }
    }

    return {
      value: data.value,
      classification: data.classification, // Actual column name in schema
      recorded_at: data.timestamp // Map to expected field
    };
  } catch {
    return null;
  }
}

export async function saveFearGreedToCache(data: {
  value: number;
  classification: string;
}): Promise<boolean> {
  try {
    const db = checkSupabase();
    const { error } = await db
      .from('fear_greed_history')
      .upsert({
        value: data.value,
        classification: data.classification, // Actual column name in schema
        timestamp: new Date().toISOString() // Actual column name in schema
      }, {
        onConflict: 'timestamp'
      });

    return !error;
  } catch {
    return false;
  }
}

export async function getMarketSentimentFromCache() {
  const { data, error } = await checkSupabase()
    .from('market_sentiment')
    .select('*')
    .order('recorded_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // Ignore "no rows" error
  return data;
}

export async function getCoinSentimentFromCache(symbol?: string) {
  let query = checkSupabase()
    .from('coin_sentiment')
    .select('*');
  
  if (symbol) {
    query = query.eq('symbol', symbol);
  } else {
    query = query.order('social_volume', { ascending: false }).limit(50);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  return symbol ? data?.[0] : data || [];
}

export async function getSentimentPostsFromCache(options?: {
  source?: string;
  coins?: string[];
  limit?: number;
  sentiment?: 'bullish' | 'bearish';
}) {
  let query = checkSupabase()
    .from('sentiment_posts')
    .select('*');
  
  if (options?.source) {
    query = query.eq('source', options.source);
  }
  
  if (options?.coins && options.coins.length > 0) {
    query = query.contains('coins_mentioned', options.coins);
  }
  
  if (options?.sentiment === 'bullish') {
    query = query.gt('sentiment_score', 0.2);
  } else if (options?.sentiment === 'bearish') {
    query = query.lt('sentiment_score', -0.2);
  }
  
  query = query
    .order('posted_at', { ascending: false })
    .limit(options?.limit || 50);
  
  const { data, error } = await query;
  
  if (error) throw error;
  return data || [];
}

export async function getFearGreedHistoryFromCache(days: number = 30) {
  const { data, error } = await checkSupabase()
    .from('fear_greed_history')
    .select('*')
    .order('recorded_at', { ascending: false })
    .limit(days);
  
  if (error) throw error;
  return data?.reverse() || [];
}

// ============================================
// WHALE DATA QUERIES
// ============================================

export async function getWhaleTransactionsFromCache(options?: {
  blockchain?: string;
  type?: string;
  minAmountUsd?: number;
  limit?: number;
}) {
  let query = checkSupabase()
    .from('whale_transactions')
    .select('*');
  
  if (options?.blockchain && options.blockchain !== 'all') {
    query = query.eq('blockchain', options.blockchain);
  }
  
  if (options?.type) {
    query = query.eq('tx_type', options.type);
  }
  
  if (options?.minAmountUsd) {
    query = query.gte('amount_usd', options.minAmountUsd);
  }
  
  query = query
    .order('tx_time', { ascending: false })
    .limit(options?.limit || 50);
  
  const { data, error } = await query;
  
  if (error) throw error;
  return data || [];
}

export async function getExchangeFlowsFromCache() {
  const { data, error } = await checkSupabase()
    .from('exchange_flows')
    .select('*')
    .order('updated_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

export async function getExchangeBalanceHistoryFromCache(
  exchange: string,
  days: number = 7
) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  const { data, error } = await checkSupabase()
    .from('exchange_balances')
    .select('*')
    .eq('exchange', exchange)
    .gte('recorded_at', cutoffDate.toISOString())
    .order('recorded_at', { ascending: true });
  
  if (error) throw error;
  return data || [];
}

// ============================================
// ON-CHAIN METRICS QUERIES
// ============================================

export async function getBitcoinStatsFromCache() {
  const { data, error } = await checkSupabase()
    .from('bitcoin_stats')
    .select('*')
    .order('recorded_at', { ascending: false })
    .limit(1)
    .single();
  
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function getBitcoinStatsHistoryFromCache(days: number = 7) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  const { data, error } = await checkSupabase()
    .from('bitcoin_stats')
    .select('*')
    .gte('recorded_at', cutoffDate.toISOString())
    .order('recorded_at', { ascending: true });
  
  if (error) throw error;
  return data || [];
}

export async function getGasPricesFromCache() {
  const { data, error } = await checkSupabase()
    .from('eth_gas_prices')
    .select('*')
    .order('recorded_at', { ascending: false })
    .limit(1)
    .single();
  
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function getGasHistoryFromCache(hours: number = 24) {
  const cutoffDate = new Date();
  cutoffDate.setHours(cutoffDate.getHours() - hours);

  const { data, error } = await checkSupabase()
    .from('eth_gas_prices')
    .select('*')
    .gte('recorded_at', cutoffDate.toISOString())
    .order('recorded_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

// ============================================
// DERIVATIVES CACHE (Binance Futures)
// ============================================

// Cache TTL: 1 minute for derivatives data
const DERIVATIVES_CACHE_TTL_MS = 60 * 1000;

export interface CachedDerivativesData {
  symbol: string;
  open_interest: number;
  open_interest_change_24h: number;
  funding_rate: number;
  long_short_ratio: number;
  volume_24h: number;
  liquidations_24h: number;
  updated_at: string;
}

export async function getDerivativesFromCache(symbol: string = 'BTCUSDT'): Promise<CachedDerivativesData | null> {
  try {
    const db = checkSupabase();
    const { data, error } = await db
      .from('derivatives_cache')
      .select('*')
      .eq('symbol', symbol)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      return null;
    }

    // Check freshness
    if (data?.updated_at) {
      const cacheAge = Date.now() - new Date(data.updated_at).getTime();
      if (cacheAge > DERIVATIVES_CACHE_TTL_MS) {
        return null;
      }
    }

    return data as CachedDerivativesData;
  } catch {
    return null;
  }
}

export async function saveDerivativesToCache(data: {
  symbol: string;
  openInterest: number;
  openInterestChange24h: number;
  fundingRate: number;
  longShortRatio: number;
  volume24h: number;
  liquidations24h: number;
}): Promise<boolean> {
  try {
    const db = checkSupabase();
    const { error } = await db
      .from('derivatives_cache')
      .upsert({
        symbol: data.symbol,
        open_interest: data.openInterest,
        open_interest_change_24h: data.openInterestChange24h,
        funding_rate: data.fundingRate,
        long_short_ratio: data.longShortRatio,
        volume_24h: data.volume24h,
        liquidations_24h: data.liquidations24h,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'symbol'
      });

    return !error;
  } catch {
    return false;
  }
}

// ============================================
// MACRO DATA CACHE (Economic Indicators)
// ============================================

// Cache TTL: 5 minutes for macro data
const MACRO_CACHE_TTL_MS = 5 * 60 * 1000;

export interface CachedMacroData {
  indicator: string;
  value: number | null;
  previous_value: number | null;
  change: number | null;
  source: string | null;
  updated_at: string;
}

export async function getMacroDataFromCache(): Promise<CachedMacroData[] | null> {
  try {
    const db = checkSupabase();
    const { data, error } = await db
      .from('macro_data_cache')
      .select('*');

    if (error) return null;
    if (!data || data.length === 0) return null;

    // Check freshness of first record
    const cacheAge = Date.now() - new Date(data[0].updated_at).getTime();
    if (cacheAge > MACRO_CACHE_TTL_MS) {
      return null;
    }

    return data as CachedMacroData[];
  } catch {
    return null;
  }
}

export async function saveMacroDataToCache(indicators: Array<{
  indicator: string;
  value: number | null;
  previousValue: number | null;
  change: number | null;
  source: string;
}>): Promise<boolean> {
  try {
    const db = checkSupabase();
    const timestamp = new Date().toISOString();

    const records = indicators.map(i => ({
      indicator: i.indicator,
      value: i.value,
      previous_value: i.previousValue,
      change: i.change,
      source: i.source,
      updated_at: timestamp
    }));

    const { error } = await db
      .from('macro_data_cache')
      .upsert(records, {
        onConflict: 'indicator'
      });

    return !error;
  } catch {
    return false;
  }
}

// ============================================
// SMART CONTRACT VERIFICATION CACHE (Sourcify)
// ============================================

export type ContractVerificationStatus = 'verified' | 'not_verified';

export interface CachedContractVerification {
  chain_id: number;
  address: string;
  status: ContractVerificationStatus;
  match_type: string | null;
  contract_name: string | null;
  raw: unknown | null;
  updated_at: string;
}

export async function getContractVerificationFromCache(
  chainId: number,
  address: string
): Promise<CachedContractVerification | null> {
  try {
    const db = checkSupabase();
    const { data, error } = await db
      .from('contract_verification_cache')
      .select('*')
      .eq('chain_id', chainId)
      .eq('address', address)
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      return null;
    }

    return (data as CachedContractVerification) ?? null;
  } catch {
    return null;
  }
}

export async function saveContractVerificationToCache(input: {
  chainId: number;
  address: string;
  status: ContractVerificationStatus;
  matchType: string | null;
  contractName: string | null;
  raw: unknown | null;
}): Promise<boolean> {
  try {
    const db = checkSupabase();
    const { error } = await db
      .from('contract_verification_cache')
      .upsert({
        chain_id: input.chainId,
        address: input.address,
        status: input.status,
        match_type: input.matchType,
        contract_name: input.contractName,
        raw: input.raw,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'chain_id,address'
      });

    return !error;
  } catch {
    return false;
  }
}

// ============================================
// WHALE TRANSACTIONS CACHE
// ============================================

// Cache TTL: 2 minutes for whale data
const WHALE_CACHE_TTL_MS = 2 * 60 * 1000;

// Match actual schema: tx_hash, blockchain, from_address, to_address, amount, amount_usd, tx_type, timestamp
export interface CachedWhaleTransaction {
  tx_hash: string;
  blockchain: string;
  from_address: string;
  to_address: string;
  amount: number;
  amount_usd: number;
  tx_type: string;
  timestamp: string;
}

export async function saveWhaleTransactionsToCache(transactions: Array<{
  txHash: string;
  blockchain: string;
  fromAddress: string;
  fromLabel?: string; // Not in actual schema, ignored
  toAddress: string;
  toLabel?: string; // Not in actual schema, ignored
  amount: number;
  amountUsd: number;
  symbol?: string; // Not in actual schema, ignored
  txType: string;
  txTime: string;
}>): Promise<boolean> {
  try {
    const db = checkSupabase();

    // Map to actual schema columns
    const records = transactions.map(tx => ({
      tx_hash: tx.txHash,
      blockchain: tx.blockchain,
      from_address: tx.fromAddress,
      to_address: tx.toAddress,
      amount: tx.amount,
      amount_usd: tx.amountUsd,
      tx_type: tx.txType,
      timestamp: tx.txTime // Actual column name in schema
    }));

    const { error } = await db
      .from('whale_transactions')
      .upsert(records, {
        onConflict: 'tx_hash'
      });

    return !error;
  } catch {
    return false;
  }
}

export async function getWhaleDataFreshness(): Promise<boolean> {
  try {
    const db = checkSupabase();
    const { data, error } = await db
      .from('whale_transactions')
      .select('created_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) return false;

    const cacheAge = Date.now() - new Date(data.created_at).getTime();
    return cacheAge <= WHALE_CACHE_TTL_MS;
  } catch {
    return false;
  }
}

// ============================================
// BULK MARKET DATA CACHE (for /api/crypto)
// ============================================

// Cache TTL: 5 minutes for market data (reduces CoinGecko API calls)
const BULK_MARKET_CACHE_TTL_MS = 5 * 60 * 1000;

export interface BulkMarketCoin {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number | null;
  market_cap: number | null;
  market_cap_rank: number | null;
  price_change_24h: number | null;
  price_change_percentage_24h: number | null;
  price_change_percentage_7d_in_currency?: number | null;
  total_volume: number | null;
  high_24h: number | null;
  low_24h: number | null;
  circulating_supply: number | null;
  max_supply: number | null;
}

function toNumberOrNull(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export async function getBulkMarketDataFromCache(limit: number = 100): Promise<BulkMarketCoin[] | null> {
  try {
    const db = checkSupabase();
    const { data, error } = await db
      .from('market_data')
      .select('*')
      .order('market_cap', { ascending: false, nullsFirst: false })
      .limit(limit);

    if (error || !data || data.length === 0) return null;

    // Check freshness - use 'fetched_at' or 'updated_at' from actual schema
    const timestamp = data[0].updated_at || data[0].fetched_at;
    if (timestamp) {
      const cacheAge = Date.now() - new Date(timestamp).getTime();
      if (cacheAge > BULK_MARKET_CACHE_TTL_MS) {
        return null;
      }
    }

    // Transform to CoinGecko format - match actual schema columns
    return data.map(coin => ({
      id: coin.coingecko_id || coin.symbol?.toLowerCase() || '',
      symbol: coin.symbol?.toLowerCase() || '',
      name: coin.name || '',
      image: '', // Not in actual schema
      current_price: toNumberOrNull(coin.price),
      market_cap: toNumberOrNull(coin.market_cap),
      market_cap_rank: toNumberOrNull(coin.rank),
      price_change_24h: toNumberOrNull(coin.price_change_24h),
      price_change_percentage_24h: toNumberOrNull(coin.price_change_24h), // Schema uses same column
      price_change_percentage_7d_in_currency: toNumberOrNull(coin.price_change_7d),
      total_volume: toNumberOrNull(coin.volume_24h), // Actual column name in schema
      high_24h: toNumberOrNull(coin.ath), // Use ATH as fallback
      low_24h: toNumberOrNull(coin.atl), // Use ATL as fallback
      circulating_supply: toNumberOrNull(coin.circulating_supply),
      max_supply: toNumberOrNull(coin.max_supply)
    }));
  } catch {
    return null;
  }
}

export async function saveBulkMarketDataToCache(coins: Array<{
  id: string;
  symbol: string;
  name: string;
  image?: string;
  current_price: number | null;
  market_cap: number | null;
  market_cap_rank?: number;
  price_change_24h?: number;
  price_change_percentage_24h?: number;
  price_change_percentage_7d_in_currency?: number;
  total_volume?: number;
  high_24h?: number;
  low_24h?: number;
  circulating_supply?: number;
  total_supply?: number;
  max_supply?: number | null;
  ath?: number;
  atl?: number;
}>): Promise<boolean> {
  try {
    const db = checkSupabase();
    const timestamp = new Date().toISOString();

    // Map to actual schema columns
    const records = coins.map(coin => ({
      symbol: coin.symbol.toUpperCase(),
      coingecko_id: coin.id, // Store CoinGecko ID for proper cache matching
      name: coin.name,
      price: coin.current_price,
      market_cap: coin.market_cap,
      rank: typeof coin.market_cap_rank === 'number' && Number.isFinite(coin.market_cap_rank) ? coin.market_cap_rank : null,
      price_change_24h: typeof coin.price_change_24h === 'number' && Number.isFinite(coin.price_change_24h) ? coin.price_change_24h : null,
      price_change_7d: typeof coin.price_change_percentage_7d_in_currency === 'number' && Number.isFinite(coin.price_change_percentage_7d_in_currency) ? coin.price_change_percentage_7d_in_currency : null,
      volume_24h: typeof coin.total_volume === 'number' && Number.isFinite(coin.total_volume) ? coin.total_volume : null, // Actual column name in schema
      circulating_supply: typeof coin.circulating_supply === 'number' && Number.isFinite(coin.circulating_supply) ? coin.circulating_supply : null,
      total_supply: coin.total_supply || null,
      max_supply: coin.max_supply || null,
      ath: (typeof coin.high_24h === 'number' && Number.isFinite(coin.high_24h) ? coin.high_24h : null) ?? (typeof coin.ath === 'number' && Number.isFinite(coin.ath) ? coin.ath : null),
      atl: (typeof coin.low_24h === 'number' && Number.isFinite(coin.low_24h) ? coin.low_24h : null) ?? (typeof coin.atl === 'number' && Number.isFinite(coin.atl) ? coin.atl : null),
      updated_at: timestamp,
      fetched_at: timestamp
    }));

    const { error } = await db
      .from('market_data')
      .upsert(records, { onConflict: 'symbol' });

    return !error;
  } catch {
    return false;
  }
}

// ============================================
// COMBINED DASHBOARD QUERY
// ============================================

export async function getDashboardDataFromCache() {
  const [
    marketData,
    sentiment,
    fearGreed,
    whales,
    gasPrice,
    topDefi
  ] = await Promise.all([
    getMarketDataFromCache({ limit: 20 }),
    getMarketSentimentFromCache(),
    getFearGreedHistoryFromCache(1),
    getWhaleTransactionsFromCache({ limit: 10 }),
    getGasPricesFromCache(),
    getDefiProtocolsFromCache(10)
  ]);
  
  return {
    marketData,
    sentiment,
    fearGreed: fearGreed[0],
    recentWhales: whales,
    gasPrice,
    topDefi,
    timestamp: new Date().toISOString()
  };
}

// ============================================
// DATA FRESHNESS CHECK
// ============================================

export async function checkDataFreshness() {
  const { data, error } = await checkSupabase()
    .from('sync_log')
    .select('data_type, status, completed_at')
    .eq('status', 'success')
    .order('completed_at', { ascending: false });

  if (error) throw error;

  // Get latest sync time for each data type
  const freshness: Record<string, { lastSync: string; age: number }> = {};
  const seen = new Set<string>();

  for (const row of data || []) {
    if (!seen.has(row.data_type)) {
      seen.add(row.data_type);
      const lastSync = new Date(row.completed_at);
      const ageMs = Date.now() - lastSync.getTime();
      freshness[row.data_type] = {
        lastSync: row.completed_at,
        age: Math.round(ageMs / 1000 / 60) // minutes
      };
    }
  }

  return freshness;
}

// ============================================
// PREDICTION CACHE
// ============================================

export interface CachedPrediction {
  id?: string;
  coin_id: string;
  coin_name: string;
  prediction: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  confidence: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
  reasons: string[];
  technical_score: number | null;
  sentiment_score: number | null;
  onchain_score: number | null;
  macro_score: number | null;
  overall_score: number;
  market_data?: Record<string, unknown>;
  updated_at: string;
}

// Cache TTL: 10 minutes for predictions
const PREDICTION_CACHE_TTL_MS = 10 * 60 * 1000;

export async function getPredictionFromCache(coinId: string): Promise<CachedPrediction | null> {
  try {
    const db = checkSupabase();

    const { data, error } = await db
      .from('prediction_cache')
      .select('*')
      .eq('coin_id', coinId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      console.error('Cache read error:', error);
      return null;
    }

    // Check if cache is stale
    if (data?.updated_at) {
      const cacheAge = Date.now() - new Date(data.updated_at).getTime();
      if (cacheAge > PREDICTION_CACHE_TTL_MS) {
        return null; // Cache expired
      }
    }

    return data as CachedPrediction;
  } catch {
    return null;
  }
}

// Returns cached prediction even if stale (caller must label it as such)
export async function getPredictionFromCacheAnyAge(coinId: string): Promise<CachedPrediction | null> {
  try {
    const db = checkSupabase();

    const { data, error } = await db
      .from('prediction_cache')
      .select('*')
      .eq('coin_id', coinId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      return null;
    }

    return data as CachedPrediction;
  } catch {
    return null;
  }
}

export async function savePredictionToCache(prediction: CachedPrediction): Promise<boolean> {
  try {
    const db = checkSupabase();

    const { error } = await db
      .from('prediction_cache')
      .upsert({
        ...prediction,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'coin_id'
      });

    if (error) {
      console.error('Cache write error:', error);
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

export async function getAllCachedPredictions(): Promise<CachedPrediction[]> {
  try {
    const db = checkSupabase();

    const { data, error } = await db
      .from('prediction_cache')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Cache read error:', error);
      return [];
    }

    // Filter out stale predictions
    const now = Date.now();
    return (data || []).filter(p => {
      const cacheAge = now - new Date(p.updated_at).getTime();
      return cacheAge <= PREDICTION_CACHE_TTL_MS;
    }) as CachedPrediction[];
  } catch {
    return [];
  }
}

// ============================================
// COIN MARKET DATA CACHE (for prediction API)
// ============================================

export interface CachedCoinMarketData {
  coin_id: string;
  price: number;
  price_change_24h: number;
  price_change_7d: number;
  price_change_30d: number;
  volume_24h: number;
  market_cap: number;
  high_24h: number;
  low_24h: number;
  updated_at: string;
}

// Cache TTL: 5 minutes for market data
const MARKET_DATA_CACHE_TTL_MS = 5 * 60 * 1000;

export async function getCoinMarketDataFromCache(coinId: string): Promise<CachedCoinMarketData | null> {
  try {
    const db = checkSupabase();

    const { data, error } = await db
      .from('coin_market_cache')
      .select('*')
      .eq('coin_id', coinId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      return null;
    }

    // Check if cache is stale
    if (data?.updated_at) {
      const cacheAge = Date.now() - new Date(data.updated_at).getTime();
      if (cacheAge > MARKET_DATA_CACHE_TTL_MS) {
        return null;
      }
    }

    return data as CachedCoinMarketData;
  } catch {
    return null;
  }
}

export async function saveCoinMarketDataToCache(coinId: string, marketData: {
  price: number;
  priceChange24h: number;
  priceChange7d: number;
  priceChange30d: number;
  volume24h: number;
  marketCap: number;
  high24h: number;
  low24h: number;
}): Promise<boolean> {
  try {
    const db = checkSupabase();

    const { error } = await db
      .from('coin_market_cache')
      .upsert({
        coin_id: coinId,
        price: marketData.price,
        price_change_24h: marketData.priceChange24h,
        price_change_7d: marketData.priceChange7d,
        price_change_30d: marketData.priceChange30d,
        volume_24h: marketData.volume24h,
        market_cap: marketData.marketCap,
        high_24h: marketData.high24h,
        low_24h: marketData.low24h,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'coin_id'
      });

    if (error) {
      console.error('Market data cache write error:', error);
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

// ============================================
// COMMUNITY PREDICTIONS
// ============================================

export interface CommunityPrediction {
  id: string;
  user_id: string;
  coin_id: string;
  coin_symbol: string;
  coin_name: string;
  prediction: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  target_price?: number;
  current_price?: number;
  timeframe: '24h' | '7d' | '30d';
  confidence: number;
  reasoning?: string;
  outcome: 'pending' | 'correct' | 'incorrect';
  likes: number;
  dislikes: number;
  comments_count: number;
  expires_at: string;
  created_at: string;
  // Joined data
  user?: UserPredictionStats;
}

export interface UserPredictionStats {
  id: string;
  user_id: string;
  display_name: string;
  avatar_emoji: string;
  total_predictions: number;
  correct_predictions: number;
  accuracy: number;
  current_streak: number;
  best_streak: number;
  points: number;
  rank: number;
  badges: string[];
  followers: number;
  following: number;
  is_verified: boolean;
  created_at: string;
}

export interface PredictionComment {
  id: string;
  prediction_id: string;
  user_id: string;
  content: string;
  likes: number;
  created_at: string;
  user?: UserPredictionStats;
}

export interface PredictionContest {
  id: string;
  title: string;
  description?: string;
  contest_type: 'weekly' | 'monthly' | 'special';
  prize: string;
  prize_amount?: number;
  min_predictions: number;
  starts_at: string;
  ends_at: string;
  status: 'upcoming' | 'active' | 'ended';
  participants_count: number;
}

export interface CommunityStats {
  total_predictions: number;
  active_predictors: number;
  bullish_percent: number;
  bearish_percent: number;
  neutral_percent: number;
  avg_accuracy: number;
}

// Get community predictions with user data
export async function getCommunityPredictions(options?: {
  coinId?: string;
  prediction?: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  userId?: string;
  limit?: number;
  offset?: number;
}): Promise<CommunityPrediction[]> {
  try {
    const db = checkSupabase();

    let query = db
      .from('community_predictions')
      .select(`
        *,
        user:user_prediction_stats(*)
      `)
      .order('created_at', { ascending: false });

    if (options?.coinId) {
      query = query.eq('coin_id', options.coinId);
    }

    if (options?.prediction) {
      query = query.eq('prediction', options.prediction);
    }

    if (options?.userId) {
      query = query.eq('user_id', options.userId);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching community predictions:', error);
      return [];
    }

    return (data || []) as CommunityPrediction[];
  } catch {
    return [];
  }
}

// Create a new prediction
export async function createCommunityPrediction(prediction: {
  userId: string;
  coinId: string;
  coinSymbol: string;
  coinName: string;
  prediction: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  targetPrice?: number;
  currentPrice?: number;
  timeframe: '24h' | '7d' | '30d';
  confidence: number;
  reasoning?: string;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const db = checkSupabase();

    // Calculate expiry based on timeframe
    const expiresAt = new Date();
    if (prediction.timeframe === '24h') {
      expiresAt.setHours(expiresAt.getHours() + 24);
    } else if (prediction.timeframe === '7d') {
      expiresAt.setDate(expiresAt.getDate() + 7);
    } else {
      expiresAt.setDate(expiresAt.getDate() + 30);
    }

    const { data, error } = await db
      .from('community_predictions')
      .insert({
        user_id: prediction.userId,
        coin_id: prediction.coinId,
        coin_symbol: prediction.coinSymbol,
        coin_name: prediction.coinName,
        prediction: prediction.prediction,
        target_price: prediction.targetPrice,
        current_price: prediction.currentPrice,
        timeframe: prediction.timeframe,
        confidence: prediction.confidence,
        reasoning: prediction.reasoning,
        expires_at: expiresAt.toISOString()
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating prediction:', error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

// Vote on a prediction
export async function votePrediction(
  predictionId: string,
  userId: string,
  voteType: 'like' | 'dislike'
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = checkSupabase();

    // Check if user already voted
    const { data: existing } = await db
      .from('prediction_votes')
      .select('id, vote_type')
      .eq('prediction_id', predictionId)
      .eq('user_id', userId)
      .single();

    if (existing) {
      if (existing.vote_type === voteType) {
        // Remove vote
        await db
          .from('prediction_votes')
          .delete()
          .eq('id', existing.id);
      } else {
        // Change vote
        await db
          .from('prediction_votes')
          .update({ vote_type: voteType })
          .eq('id', existing.id);
      }
    } else {
      // New vote
      const { error } = await db
        .from('prediction_votes')
        .insert({
          prediction_id: predictionId,
          user_id: userId,
          vote_type: voteType
        });

      if (error) {
        return { success: false, error: error.message };
      }
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

// Get leaderboard
export async function getLeaderboard(options?: {
  limit?: number;
  sortBy?: 'points' | 'accuracy' | 'predictions';
}): Promise<UserPredictionStats[]> {
  try {
    const db = checkSupabase();

    const sortColumn = options?.sortBy === 'accuracy' ? 'accuracy' :
      options?.sortBy === 'predictions' ? 'total_predictions' : 'points';

    const { data, error } = await db
      .from('user_prediction_stats')
      .select('*')
      .order(sortColumn, { ascending: false })
      .limit(options?.limit || 50);

    if (error) {
      console.error('Error fetching leaderboard:', error);
      return [];
    }

    return (data || []) as UserPredictionStats[];
  } catch {
    return [];
  }
}

// Get user stats
export async function getUserPredictionStats(userId: string): Promise<UserPredictionStats | null> {
  try {
    const db = checkSupabase();

    const { data, error } = await db
      .from('user_prediction_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      console.error('Error fetching user stats:', error);
      return null;
    }

    return data as UserPredictionStats;
  } catch {
    return null;
  }
}

// Update user profile
export async function updateUserPredictionProfile(
  userId: string,
  profile: { displayName?: string; avatarEmoji?: string }
): Promise<boolean> {
  try {
    const db = checkSupabase();

    const updates: Record<string, string> = {};
    if (profile.displayName) updates.display_name = profile.displayName;
    if (profile.avatarEmoji) updates.avatar_emoji = profile.avatarEmoji;

    const { error } = await db
      .from('user_prediction_stats')
      .upsert({
        user_id: userId,
        ...updates,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    return !error;
  } catch {
    return false;
  }
}

// Get community stats
export async function getCommunityStats(): Promise<CommunityStats> {
  try {
    const db = checkSupabase();

    // Get recent predictions (last 24h)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: predictions, error } = await db
      .from('community_predictions')
      .select('prediction, user_id')
      .gte('created_at', oneDayAgo);

    if (error || !predictions) {
      return {
        total_predictions: 0,
        active_predictors: 0,
        bullish_percent: 33,
        bearish_percent: 33,
        neutral_percent: 34,
        avg_accuracy: 0
      };
    }

    const total = predictions.length;
    const bullish = predictions.filter(p => p.prediction === 'BULLISH').length;
    const bearish = predictions.filter(p => p.prediction === 'BEARISH').length;
    const neutral = predictions.filter(p => p.prediction === 'NEUTRAL').length;
    const uniqueUsers = new Set(predictions.map(p => p.user_id)).size;

    // Get total predictions all time
    const { count: totalPredictions } = await db
      .from('community_predictions')
      .select('id', { count: 'exact', head: true });

    // Get average accuracy from leaderboard
    const { data: stats } = await db
      .from('user_prediction_stats')
      .select('accuracy')
      .gt('total_predictions', 5);

    const avgAccuracy = stats && stats.length > 0
      ? stats.reduce((sum, s) => sum + Number(s.accuracy), 0) / stats.length
      : 0;

    return {
      total_predictions: totalPredictions || 0,
      active_predictors: uniqueUsers,
      bullish_percent: total > 0 ? Math.round((bullish / total) * 100) : 33,
      bearish_percent: total > 0 ? Math.round((bearish / total) * 100) : 33,
      neutral_percent: total > 0 ? Math.round((neutral / total) * 100) : 34,
      avg_accuracy: Math.round(avgAccuracy * 10) / 10
    };
  } catch {
    return {
      total_predictions: 0,
      active_predictors: 0,
      bullish_percent: 33,
      bearish_percent: 33,
      neutral_percent: 34,
      avg_accuracy: 0
    };
  }
}

// Get prediction comments
export async function getPredictionComments(predictionId: string): Promise<PredictionComment[]> {
  try {
    const db = checkSupabase();

    const { data, error } = await db
      .from('prediction_comments')
      .select(`
        *,
        user:user_prediction_stats(*)
      `)
      .eq('prediction_id', predictionId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching comments:', error);
      return [];
    }

    return (data || []) as PredictionComment[];
  } catch {
    return [];
  }
}

// Add comment
export async function addPredictionComment(
  predictionId: string,
  userId: string,
  content: string
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const db = checkSupabase();

    const { data, error } = await db
      .from('prediction_comments')
      .insert({
        prediction_id: predictionId,
        user_id: userId,
        content
      })
      .select('id')
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

// Get active contests
export async function getActiveContests(): Promise<PredictionContest[]> {
  try {
    const db = checkSupabase();

    const now = new Date().toISOString();

    const { data, error } = await db
      .from('prediction_contests')
      .select('*')
      .or(`status.eq.active,and(status.eq.upcoming,starts_at.lte.${now})`)
      .order('ends_at', { ascending: true });

    if (error) {
      console.error('Error fetching contests:', error);
      return [];
    }

    return (data || []) as PredictionContest[];
  } catch {
    return [];
  }
}

// Follow/unfollow user
export async function toggleFollowUser(
  followerId: string,
  followingId: string
): Promise<{ success: boolean; isFollowing: boolean }> {
  try {
    const db = checkSupabase();

    // Check if already following
    const { data: existing } = await db
      .from('user_follows')
      .select('id')
      .eq('follower_id', followerId)
      .eq('following_id', followingId)
      .single();

    if (existing) {
      // Unfollow
      await db.from('user_follows').delete().eq('id', existing.id);
      return { success: true, isFollowing: false };
    } else {
      // Follow
      const { error } = await db
        .from('user_follows')
        .insert({ follower_id: followerId, following_id: followingId });

      if (error) {
        return { success: false, isFollowing: false };
      }
      return { success: true, isFollowing: true };
    }
  } catch {
    return { success: false, isFollowing: false };
  }
}

// Check if user is following another
export async function isFollowing(followerId: string, followingId: string): Promise<boolean> {
  try {
    const db = checkSupabase();

    const { data } = await db
      .from('user_follows')
      .select('id')
      .eq('follower_id', followerId)
      .eq('following_id', followingId)
      .single();

    return !!data;
  } catch {
    return false;
  }
}

// Get trending coins by community predictions
export async function getTrendingCoinsByCommunity(limit: number = 10): Promise<Array<{
  coin_id: string;
  coin_symbol: string;
  coin_name: string;
  predictions_count: number;
  bullish_percent: number;
}>> {
  try {
    const db = checkSupabase();

    // Get predictions from last 24h
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await db
      .from('community_predictions')
      .select('coin_id, coin_symbol, coin_name, prediction')
      .gte('created_at', oneDayAgo);

    if (error || !data) return [];

    // Aggregate by coin
    const coinMap = new Map<string, {
      coin_id: string;
      coin_symbol: string;
      coin_name: string;
      total: number;
      bullish: number;
    }>();

    for (const p of data) {
      const existing = coinMap.get(p.coin_id) || {
        coin_id: p.coin_id,
        coin_symbol: p.coin_symbol,
        coin_name: p.coin_name || '',
        total: 0,
        bullish: 0
      };

      existing.total++;
      if (p.prediction === 'BULLISH') existing.bullish++;

      coinMap.set(p.coin_id, existing);
    }

    // Convert to array and sort
    return Array.from(coinMap.values())
      .map(c => ({
        coin_id: c.coin_id,
        coin_symbol: c.coin_symbol,
        coin_name: c.coin_name,
        predictions_count: c.total,
        bullish_percent: c.total > 0 ? Math.round((c.bullish / c.total) * 100) : 50
      }))
      .sort((a, b) => b.predictions_count - a.predictions_count)
      .slice(0, limit);
  } catch {
    return [];
  }
}
