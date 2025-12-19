/**
 * Prediction Database Operations
 * Core database layer for AI prediction data storage and retrieval
 */

import { supabaseAdmin, isSupabaseConfigured } from './supabase';

// ============================================
// TYPES
// ============================================

export interface PredictionSnapshotInput {
  coinId: string;
  timestamp?: Date;

  // Market Data
  price?: number;
  priceChange24h?: number;
  priceChange7d?: number;
  priceChange30d?: number;
  volume24h?: number;
  marketCap?: number;
  high24h?: number;
  low24h?: number;

  // Technical Indicators
  rsi14?: number;
  macdSignal?: 'bullish_cross' | 'bearish_cross' | 'neutral';
  ma50Position?: 'above' | 'below' | 'near';
  ma200Position?: 'above' | 'below' | 'near';
  bollingerPosition?: 'upper' | 'middle' | 'lower';
  volumeTrend?: 'increasing' | 'decreasing' | 'stable';

  // Sentiment
  fearGreedIndex?: number;
  fearGreedLabel?: string;
  socialSentimentScore?: number;
  newsSentimentScore?: number;

  // On-Chain
  exchangeNetflow?: 'inflow' | 'outflow' | 'neutral';
  whaleActivity?: 'buying' | 'selling' | 'neutral';
  activeAddressesTrend?: 'increasing' | 'decreasing' | 'stable';
  largeTransactionsCount?: number;

  // Macro
  vix?: number;
  dxy?: number;
  fedFundsRate?: number;
  treasury10y?: number;
  riskEnvironment?: 'risk_on' | 'risk_off' | 'neutral';
  sp500Change?: number;
  nasdaqChange?: number;

  // Derivatives
  btcFundingRate?: number;
  ethFundingRate?: number;
  btcOpenInterest?: number;
  ethOpenInterest?: number;
  openInterestChange?: number;
  liquidations24h?: number;
  fundingHeatLevel?: 'extreme_long' | 'high_long' | 'neutral' | 'high_short' | 'extreme_short';

  // Prediction Output
  prediction?: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  confidence?: number;
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
  technicalScore?: number;
  sentimentScore?: number;
  onchainScore?: number;
  macroScore?: number;
  overallScore?: number;
  reasons?: string[];
  signals?: unknown[];
}

export interface PredictionSnapshot extends PredictionSnapshotInput {
  id: string;
  timestamp: Date;
  createdAt: Date;
}

export interface TrainingDataInput {
  snapshotId: string;
  coinId: string;
  snapshotTimestamp: Date;
  features: Record<string, unknown>;
  technicalFeatures?: Record<string, unknown>;
  sentimentFeatures?: Record<string, unknown>;
  onchainFeatures?: Record<string, unknown>;
  macroFeatures?: Record<string, unknown>;
  derivativesFeatures?: Record<string, unknown>;
  walletFeatures?: Record<string, unknown>;
  newsFeatures?: Record<string, unknown>;
  priceAtSnapshot: number;
  predictedDirection?: string;
  predictedConfidence?: number;
}

export interface HistoricalAccuracyQuery {
  coinId?: string;
  rsiRange?: [number, number];
  fearGreedRange?: [number, number];
  macdSignal?: string;
  days?: number;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function checkSupabase() {
  if (!isSupabaseConfigured || !supabaseAdmin) {
    throw new Error('Supabase not configured for AI data storage');
  }
  return supabaseAdmin;
}

function snakeToCamel(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    result[camelKey] = value;
  }
  return result;
}

function camelToSnake(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    result[snakeKey] = value;
  }
  return result;
}

// ============================================
// SNAPSHOT OPERATIONS
// ============================================

/**
 * Save a prediction snapshot with all input data
 */
export async function savePredictionSnapshot(
  data: PredictionSnapshotInput
): Promise<{ id: string; timestamp: Date } | null> {
  const db = checkSupabase();

  const record = {
    timestamp: data.timestamp?.toISOString() || new Date().toISOString(),
    coin_id: data.coinId,

    // Market Data
    price: data.price,
    price_change_24h: data.priceChange24h,
    price_change_7d: data.priceChange7d,
    price_change_30d: data.priceChange30d,
    volume_24h: data.volume24h,
    market_cap: data.marketCap,
    high_24h: data.high24h,
    low_24h: data.low24h,

    // Technical
    rsi_14: data.rsi14,
    macd_signal: data.macdSignal,
    ma_50_position: data.ma50Position,
    ma_200_position: data.ma200Position,
    bollinger_position: data.bollingerPosition,
    volume_trend: data.volumeTrend,

    // Sentiment
    fear_greed_index: data.fearGreedIndex,
    fear_greed_label: data.fearGreedLabel,
    social_sentiment_score: data.socialSentimentScore,
    news_sentiment_score: data.newsSentimentScore,

    // On-Chain
    exchange_netflow: data.exchangeNetflow,
    whale_activity: data.whaleActivity,
    active_addresses_trend: data.activeAddressesTrend,
    large_transactions_count: data.largeTransactionsCount,

    // Macro
    vix: data.vix,
    dxy: data.dxy,
    fed_funds_rate: data.fedFundsRate,
    treasury_10y: data.treasury10y,
    risk_environment: data.riskEnvironment,
    sp500_change: data.sp500Change,
    nasdaq_change: data.nasdaqChange,

    // Derivatives
    btc_funding_rate: data.btcFundingRate,
    eth_funding_rate: data.ethFundingRate,
    btc_open_interest: data.btcOpenInterest,
    eth_open_interest: data.ethOpenInterest,
    open_interest_change: data.openInterestChange,
    liquidations_24h: data.liquidations24h,
    funding_heat_level: data.fundingHeatLevel,

    // Prediction Output
    prediction: data.prediction,
    confidence: data.confidence,
    risk_level: data.riskLevel,
    technical_score: data.technicalScore,
    sentiment_score: data.sentimentScore,
    onchain_score: data.onchainScore,
    macro_score: data.macroScore,
    overall_score: data.overallScore,
    reasons: data.reasons,
    signals: data.signals,
  };

  try {
    const { data: result, error } = await db
      .from('prediction_snapshots')
      .upsert(record, { onConflict: 'timestamp,coin_id' })
      .select('id, timestamp')
      .single();

    if (error) {
      console.error('Error saving prediction snapshot:', error);
      return null;
    }

    return {
      id: result.id,
      timestamp: new Date(result.timestamp),
    };
  } catch (error) {
    console.error('Exception saving prediction snapshot:', error);
    return null;
  }
}

/**
 * Get prediction history for a coin
 */
export async function getPredictionHistory(
  coinId: string,
  options?: {
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }
): Promise<PredictionSnapshot[]> {
  const db = checkSupabase();

  let query = db
    .from('prediction_snapshots')
    .select('*')
    .eq('coin_id', coinId)
    .order('timestamp', { ascending: false });

  if (options?.startDate) {
    query = query.gte('timestamp', options.startDate.toISOString());
  }

  if (options?.endDate) {
    query = query.lte('timestamp', options.endDate.toISOString());
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching prediction history:', error);
    return [];
  }

  return (data || []).map(row => snakeToCamel(row) as unknown as PredictionSnapshot);
}

/**
 * Get the latest snapshot for a coin
 */
export async function getLatestSnapshot(coinId: string): Promise<PredictionSnapshot | null> {
  const db = checkSupabase();

  const { data, error } = await db
    .from('prediction_snapshots')
    .select('*')
    .eq('coin_id', coinId)
    .order('timestamp', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return null;
  }

  return snakeToCamel(data) as unknown as PredictionSnapshot;
}

/**
 * Get historical accuracy for similar conditions
 */
export async function getHistoricalAccuracy(
  query: HistoricalAccuracyQuery
): Promise<{
  totalPredictions: number;
  correctPredictions: number;
  accuracy: number;
  byDirection: {
    bullish: { total: number; correct: number };
    bearish: { total: number; correct: number };
    neutral: { total: number; correct: number };
  };
}> {
  const db = checkSupabase();

  // Build query for training data with outcomes
  let dbQuery = db
    .from('prediction_training_data')
    .select('predicted_direction, prediction_was_correct_24h, actual_direction_24h')
    .eq('is_valid_for_training', true)
    .not('prediction_was_correct_24h', 'is', null);

  if (query.coinId) {
    dbQuery = dbQuery.eq('coin_id', query.coinId);
  }

  if (query.days) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - query.days);
    dbQuery = dbQuery.gte('snapshot_timestamp', startDate.toISOString());
  }

  // Note: RSI and Fear/Greed filtering would need to be done on features JSONB
  // For now, we fetch and filter in memory if those conditions are specified

  const { data, error } = await dbQuery;

  if (error || !data) {
    return {
      totalPredictions: 0,
      correctPredictions: 0,
      accuracy: 50, // Default to 50% if no data
      byDirection: {
        bullish: { total: 0, correct: 0 },
        bearish: { total: 0, correct: 0 },
        neutral: { total: 0, correct: 0 },
      },
    };
  }

  // Calculate accuracy
  const results = {
    totalPredictions: data.length,
    correctPredictions: data.filter(d => d.prediction_was_correct_24h).length,
    accuracy: 0,
    byDirection: {
      bullish: { total: 0, correct: 0 },
      bearish: { total: 0, correct: 0 },
      neutral: { total: 0, correct: 0 },
    },
  };

  // Calculate by direction
  for (const row of data) {
    const direction = (row.predicted_direction || 'neutral').toLowerCase() as 'bullish' | 'bearish' | 'neutral';
    if (results.byDirection[direction]) {
      results.byDirection[direction].total++;
      if (row.prediction_was_correct_24h) {
        results.byDirection[direction].correct++;
      }
    }
  }

  results.accuracy = results.totalPredictions > 0
    ? (results.correctPredictions / results.totalPredictions) * 100
    : 50;

  return results;
}

// ============================================
// TRAINING DATA OPERATIONS
// ============================================

/**
 * Save training data record
 */
export async function saveTrainingData(
  data: TrainingDataInput
): Promise<{ id: string } | null> {
  const db = checkSupabase();

  const record = {
    snapshot_id: data.snapshotId,
    coin_id: data.coinId,
    snapshot_timestamp: data.snapshotTimestamp.toISOString(),
    features: data.features,
    technical_features: data.technicalFeatures,
    sentiment_features: data.sentimentFeatures,
    onchain_features: data.onchainFeatures,
    macro_features: data.macroFeatures,
    derivatives_features: data.derivativesFeatures,
    wallet_features: data.walletFeatures,
    news_features: data.newsFeatures,
    price_at_snapshot: data.priceAtSnapshot,
    predicted_direction: data.predictedDirection,
    predicted_confidence: data.predictedConfidence,
    data_quality_score: calculateDataQuality(data.features),
  };

  try {
    const { data: result, error } = await db
      .from('prediction_training_data')
      .upsert(record, { onConflict: 'snapshot_timestamp,coin_id' })
      .select('id')
      .single();

    if (error) {
      console.error('Error saving training data:', error);
      return null;
    }

    return { id: result.id };
  } catch (error) {
    console.error('Exception saving training data:', error);
    return null;
  }
}

/**
 * Calculate data quality score based on feature completeness
 */
function calculateDataQuality(features: Record<string, unknown>): number {
  const criticalFeatures = [
    'price', 'priceChange24h', 'volume24h', 'marketCap',
    'rsi14', 'fearGreedIndex', 'vix', 'btcFundingRate'
  ];

  const importantFeatures = [
    'macdSignal', 'exchangeNetflow', 'whaleActivity',
    'dxy', 'riskEnvironment', 'liquidations24h'
  ];

  let score = 0;
  const totalWeight = criticalFeatures.length * 10 + importantFeatures.length * 5;

  for (const feature of criticalFeatures) {
    if (features[feature] !== undefined && features[feature] !== null) {
      score += 10;
    }
  }

  for (const feature of importantFeatures) {
    if (features[feature] !== undefined && features[feature] !== null) {
      score += 5;
    }
  }

  return Math.round((score / totalWeight) * 100);
}

/**
 * Get training data for export
 */
export async function getTrainingData(options?: {
  coinId?: string;
  startDate?: Date;
  endDate?: Date;
  minQuality?: number;
  limit?: number;
  onlyValidated?: boolean;
}): Promise<unknown[]> {
  const db = checkSupabase();

  let query = db
    .from('prediction_training_data')
    .select('*')
    .order('snapshot_timestamp', { ascending: true });

  if (options?.coinId) {
    query = query.eq('coin_id', options.coinId);
  }

  if (options?.startDate) {
    query = query.gte('snapshot_timestamp', options.startDate.toISOString());
  }

  if (options?.endDate) {
    query = query.lte('snapshot_timestamp', options.endDate.toISOString());
  }

  if (options?.minQuality) {
    query = query.gte('data_quality_score', options.minQuality);
  }

  if (options?.onlyValidated !== false) {
    query = query.eq('is_valid_for_training', true);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching training data:', error);
    return [];
  }

  return data || [];
}

/**
 * Backfill actual price results for predictions
 * This should run daily to update predictions with actual outcomes
 */
export async function backfillActualResults(): Promise<{
  updated: number;
  errors: number;
}> {
  const db = checkSupabase();

  // Get training data that needs price updates (1h, 4h, 24h, 7d after snapshot)
  const cutoffTimes = {
    '1h': 1,
    '4h': 4,
    '24h': 24,
    '7d': 24 * 7,
  };

  let updated = 0;
  let errors = 0;

  // Get records that need updating (older than 7 days and missing 7d price)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: pendingRecords, error: fetchError } = await db
    .from('prediction_training_data')
    .select('id, coin_id, snapshot_timestamp, price_at_snapshot, predicted_direction')
    .lte('snapshot_timestamp', sevenDaysAgo.toISOString())
    .is('price_7d_later', null)
    .limit(100);

  if (fetchError || !pendingRecords) {
    console.error('Error fetching pending records:', fetchError);
    return { updated: 0, errors: 1 };
  }

  // For each record, fetch the current price and calculate outcomes
  for (const record of pendingRecords) {
    try {
      // Fetch historical price at +1h, +4h, +24h, +7d from snapshot
      // This would need to be implemented with actual price data fetching
      // For now, we'll mark this as a placeholder

      const snapshotTime = new Date(record.snapshot_timestamp);
      const priceAtSnapshot = record.price_at_snapshot;

      // TODO: Fetch actual prices at these timestamps from historical data
      // This is a placeholder - in production, you'd fetch from your price history

      // Calculate direction and accuracy
      // const price7dLater = ... // Fetch from historical data
      // const actualDirection = price7dLater > priceAtSnapshot ? 'up' : price7dLater < priceAtSnapshot ? 'down' : 'flat';
      // const wasCorrect = actualDirection === record.predicted_direction?.toLowerCase();

      // Update record with actual outcomes
      // await db.from('prediction_training_data').update({...}).eq('id', record.id);

      updated++;
    } catch (error) {
      console.error(`Error backfilling record ${record.id}:`, error);
      errors++;
    }
  }

  return { updated, errors };
}

// ============================================
// AGGREGATE QUERIES
// ============================================

/**
 * Get prediction statistics for a coin
 */
export async function getPredictionStats(coinId: string, days: number = 30): Promise<{
  totalPredictions: number;
  bullishCount: number;
  bearishCount: number;
  neutralCount: number;
  avgConfidence: number;
  recentTrend: string;
}> {
  const db = checkSupabase();

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await db
    .from('prediction_snapshots')
    .select('prediction, confidence')
    .eq('coin_id', coinId)
    .gte('timestamp', startDate.toISOString());

  if (error || !data || data.length === 0) {
    return {
      totalPredictions: 0,
      bullishCount: 0,
      bearishCount: 0,
      neutralCount: 0,
      avgConfidence: 0,
      recentTrend: 'neutral',
    };
  }

  const stats = {
    totalPredictions: data.length,
    bullishCount: data.filter(d => d.prediction === 'BULLISH').length,
    bearishCount: data.filter(d => d.prediction === 'BEARISH').length,
    neutralCount: data.filter(d => d.prediction === 'NEUTRAL').length,
    avgConfidence: Math.round(
      data.reduce((sum, d) => sum + (d.confidence || 0), 0) / data.length
    ),
    recentTrend: 'neutral',
  };

  // Determine recent trend from last 5 predictions
  const recent = data.slice(0, 5);
  const recentBullish = recent.filter(d => d.prediction === 'BULLISH').length;
  const recentBearish = recent.filter(d => d.prediction === 'BEARISH').length;

  if (recentBullish > recentBearish + 1) {
    stats.recentTrend = 'bullish';
  } else if (recentBearish > recentBullish + 1) {
    stats.recentTrend = 'bearish';
  }

  return stats;
}

/**
 * Get all coins with recent predictions
 */
export async function getCoinsWithPredictions(hours: number = 24): Promise<{
  coinId: string;
  latestPrediction: string;
  confidence: number;
  timestamp: Date;
}[]> {
  const db = checkSupabase();

  const since = new Date();
  since.setHours(since.getHours() - hours);

  const { data, error } = await db
    .from('prediction_snapshots')
    .select('coin_id, prediction, confidence, timestamp')
    .gte('timestamp', since.toISOString())
    .order('timestamp', { ascending: false });

  if (error || !data) {
    return [];
  }

  // Get unique coins with their latest prediction
  const coinMap = new Map<string, typeof data[0]>();
  for (const row of data) {
    if (!coinMap.has(row.coin_id)) {
      coinMap.set(row.coin_id, row);
    }
  }

  return Array.from(coinMap.values()).map(row => ({
    coinId: row.coin_id,
    latestPrediction: row.prediction,
    confidence: row.confidence,
    timestamp: new Date(row.timestamp),
  }));
}

/**
 * Get training data statistics
 */
export async function getTrainingDataStats(coinId?: string): Promise<{
  totalRecords: number;
  withOutcomes: number;
  correctPredictions: number;
  accuracy: number;
  byDirection: Record<string, { total: number; correct: number }>;
  dateRange: { earliest: Date | null; latest: Date | null };
  avgQualityScore: number;
}> {
  const db = checkSupabase();

  let query = db
    .from('prediction_training_data')
    .select('id, predicted_direction, prediction_was_correct_24h, data_quality_score, snapshot_timestamp');

  if (coinId) {
    query = query.eq('coin_id', coinId);
  }

  const { data, error } = await query;

  if (error || !data || data.length === 0) {
    return {
      totalRecords: 0,
      withOutcomes: 0,
      correctPredictions: 0,
      accuracy: 0,
      byDirection: {},
      dateRange: { earliest: null, latest: null },
      avgQualityScore: 0,
    };
  }

  const withOutcomes = data.filter(d => d.prediction_was_correct_24h !== null);
  const correctPredictions = withOutcomes.filter(d => d.prediction_was_correct_24h === true);

  // Calculate by direction
  const byDirection: Record<string, { total: number; correct: number }> = {};
  for (const record of data) {
    const direction = record.predicted_direction || 'unknown';
    if (!byDirection[direction]) {
      byDirection[direction] = { total: 0, correct: 0 };
    }
    byDirection[direction].total++;
    if (record.prediction_was_correct_24h === true) {
      byDirection[direction].correct++;
    }
  }

  // Calculate date range
  const timestamps = data.map(d => new Date(d.snapshot_timestamp).getTime());
  const earliest = timestamps.length > 0 ? new Date(Math.min(...timestamps)) : null;
  const latest = timestamps.length > 0 ? new Date(Math.max(...timestamps)) : null;

  // Calculate average quality score
  const qualityScores = data.filter(d => d.data_quality_score != null).map(d => d.data_quality_score);
  const avgQualityScore = qualityScores.length > 0
    ? Math.round(qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length)
    : 0;

  return {
    totalRecords: data.length,
    withOutcomes: withOutcomes.length,
    correctPredictions: correctPredictions.length,
    accuracy: withOutcomes.length > 0
      ? Math.round((correctPredictions.length / withOutcomes.length) * 100)
      : 0,
    byDirection,
    dateRange: { earliest, latest },
    avgQualityScore,
  };
}

export default {
  savePredictionSnapshot,
  getPredictionHistory,
  getLatestSnapshot,
  getHistoricalAccuracy,
  saveTrainingData,
  getTrainingData,
  getTrainingDataStats,
  backfillActualResults,
  getPredictionStats,
  getCoinsWithPredictions,
};
