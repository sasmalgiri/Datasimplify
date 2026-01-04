// ============================================
// DATABASE CLEANUP SERVICE
// Keeps only recent data that Groq can't know
// ============================================
// Groq is trained on historical data - no need to store old info
// We only store: current prices, recent events, live metrics

import { supabaseAdmin, isSupabaseConfigured } from './supabase';

// Retention periods (in days)
const RETENTION = {
  fear_greed_history: 7,      // Last week of sentiment
  whale_transactions: 7,      // Recent whale moves only
  sentiment_posts: 3,         // Very recent posts
  bitcoin_stats: 7,           // Week of on-chain data
  eth_gas_prices: 3,          // Recent gas only
  exchange_balances: 7,       // Week of balance history
  market_sentiment: 7,        // Week of market mood
  sync_log: 3,                // Cleanup sync logs too
  daily_summaries: 7,         // AI-generated summaries
  rag_query_history: 30,      // 30-day RAG query history for analytics
  prediction_snapshots: 90,   // 3 months of AI snapshots
  prediction_training_data: 365, // 1 year of training rows
};

// Tables that use UPSERT (no cleanup needed - always latest)
const UPSERT_TABLES = [
  'market_data',        // Always latest price
  'derivatives_cache',  // Always current funding
  'macro_data_cache',   // Always current indicators
  'prediction_cache',   // Always latest predictions
  'defi_protocols',     // Always current TVL
  'coin_sentiment',     // Always current sentiment
  'chain_tvl',          // Always current TVL
  'exchange_flows',     // Always current flows
  'stablecoins',        // Always current data
  'defi_yields',        // Always current yields
];

interface CleanupResult {
  table: string;
  deleted: number;
  error?: string;
}

export async function cleanupOldData(): Promise<{
  success: boolean;
  results: CleanupResult[];
  totalDeleted: number;
}> {
  if (!isSupabaseConfigured || !supabaseAdmin) {
    return { success: false, results: [], totalDeleted: 0 };
  }

  const results: CleanupResult[] = [];
  let totalDeleted = 0;

  console.log('🧹 Starting database cleanup...');

  for (const [table, days] of Object.entries(RETENTION)) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      const cutoffISO = cutoffDate.toISOString();

      // Determine the timestamp column for each table
      let timestampCol = 'recorded_at';
      if (table === 'whale_transactions') timestampCol = 'tx_time';
      if (table === 'sentiment_posts') timestampCol = 'posted_at';
      if (table === 'sync_log') timestampCol = 'started_at';
      if (table === 'daily_summaries') timestampCol = 'summary_date';
      if (table === 'rag_query_history') timestampCol = 'created_at';
      if (table === 'prediction_snapshots') timestampCol = 'timestamp';
      if (table === 'prediction_training_data') timestampCol = 'snapshot_timestamp';

      const { data, error } = await supabaseAdmin
        .from(table)
        .delete()
        .lt(timestampCol, cutoffISO)
        .select('id');

      if (error) {
        results.push({ table, deleted: 0, error: error.message });
      } else {
        const deleted = data?.length || 0;
        totalDeleted += deleted;
        results.push({ table, deleted });
        if (deleted > 0) {
          console.log(`  ✓ ${table}: deleted ${deleted} old records`);
        }
      }
    } catch (err) {
      results.push({
        table,
        deleted: 0,
        error: err instanceof Error ? err.message : 'Unknown error'
      });
    }
  }

  console.log(`🧹 Cleanup complete. Deleted ${totalDeleted} total records.`);

  return {
    success: results.every(r => !r.error),
    results,
    totalDeleted,
  };
}

// Get database size estimate
export async function getDatabaseStats(): Promise<{
  tables: Record<string, { rows: number; type: 'rolling' | 'latest' }>;
  totalRows: number;
}> {
  if (!isSupabaseConfigured || !supabaseAdmin) {
    return { tables: {}, totalRows: 0 };
  }

  const tables: Record<string, { rows: number; type: 'rolling' | 'latest' }> = {};
  let totalRows = 0;

  // Check rolling tables
  for (const table of Object.keys(RETENTION)) {
    try {
      const { count } = await supabaseAdmin
        .from(table)
        .select('*', { count: 'exact', head: true });

      tables[table] = { rows: count || 0, type: 'rolling' };
      totalRows += count || 0;
    } catch {
      tables[table] = { rows: 0, type: 'rolling' };
    }
  }

  // Check upsert tables
  for (const table of UPSERT_TABLES) {
    try {
      const { count } = await supabaseAdmin
        .from(table)
        .select('*', { count: 'exact', head: true });

      tables[table] = { rows: count || 0, type: 'latest' };
      totalRows += count || 0;
    } catch {
      tables[table] = { rows: 0, type: 'latest' };
    }
  }

  return { tables, totalRows };
}

// Estimate monthly storage (rough calculation)
export function estimateMonthlyStorage(totalRows: number): string {
  // Rough estimate: ~500 bytes per row average
  const bytesPerRow = 500;
  const totalBytes = totalRows * bytesPerRow;
  const totalMB = totalBytes / (1024 * 1024);

  // With cleanup, growth is limited
  // Supabase free tier: 500MB
  if (totalMB < 50) return `${totalMB.toFixed(1)}MB - Well within free tier`;
  if (totalMB < 200) return `${totalMB.toFixed(1)}MB - Safe on free tier`;
  if (totalMB < 400) return `${totalMB.toFixed(1)}MB - Monitor usage`;
  return `${totalMB.toFixed(1)}MB - Consider more aggressive cleanup`;
}
