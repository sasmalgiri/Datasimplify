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
  value: number;
  previous_value: number;
  change: number;
  source: string;
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
  value: number;
  previousValue: number;
  change: number;
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

// Cache TTL: 1 minute for market data
const BULK_MARKET_CACHE_TTL_MS = 60 * 1000;

export interface BulkMarketCoin {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  price_change_percentage_7d_in_currency?: number;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  circulating_supply: number;
  max_supply: number | null;
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
      id: coin.symbol?.toLowerCase() || '',
      symbol: coin.symbol?.toLowerCase() || '',
      name: coin.name || '',
      image: '', // Not in actual schema
      current_price: Number(coin.price) || 0,
      market_cap: Number(coin.market_cap) || 0,
      market_cap_rank: Number(coin.rank) || 0,
      price_change_24h: Number(coin.price_change_24h) || 0,
      price_change_percentage_24h: Number(coin.price_change_24h) || 0, // Schema uses same column
      price_change_percentage_7d_in_currency: Number(coin.price_change_7d) || 0,
      total_volume: Number(coin.volume_24h) || 0, // Actual column name in schema
      high_24h: Number(coin.ath) || 0, // Use ATH as fallback
      low_24h: Number(coin.atl) || 0, // Use ATL as fallback
      circulating_supply: Number(coin.circulating_supply) || 0,
      max_supply: Number(coin.max_supply) || null
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
  current_price: number;
  market_cap: number;
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
      name: coin.name,
      price: coin.current_price,
      market_cap: coin.market_cap,
      rank: coin.market_cap_rank || null,
      price_change_24h: coin.price_change_24h || 0,
      price_change_7d: coin.price_change_percentage_7d_in_currency || 0,
      volume_24h: coin.total_volume || 0, // Actual column name in schema
      circulating_supply: coin.circulating_supply || 0,
      total_supply: coin.total_supply || null,
      max_supply: coin.max_supply || null,
      ath: coin.high_24h || coin.ath || null, // Store as ATH
      atl: coin.low_24h || coin.atl || null, // Store as ATL
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
  technical_score: number;
  sentiment_score: number;
  onchain_score: number;
  macro_score: number;
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
