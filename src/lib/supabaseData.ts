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
