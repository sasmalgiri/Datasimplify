/**
 * Adoption Tracker
 * Tracks public understanding, usefulness perception, and adoption metrics
 * Provides timestamp-based profiling for AI predictions
 */

import { supabase, isSupabaseConfigured } from './supabase';
import { fetchGitHubActivity, fetchCoinGeckoTrending } from './comprehensiveSentiment';

// ============================================
// TYPES
// ============================================

export interface AdoptionMetrics {
  id?: string;
  timestamp: Date;

  // Search Interest (Google Trends style, 0-100)
  googleTrendsBtc: number | null;
  googleTrendsCrypto: number | null;
  googleTrendsDefi: number | null;
  googleTrendsNft: number | null;

  // Wallet Adoption
  activeWalletsBtc: number | null;
  activeWalletsEth: number | null;
  newWallets24h: number | null;

  // Retail Sentiment
  retailBuyPressure: number | null;  // From exchange order flow
  retailSentimentScore: number | null;

  // Institutional Activity
  etfInflows: number | null;
  institutionalHoldingsChange: number | null;
  corporateAnnouncements: number | null;

  // Developer Activity
  githubCommitsTotal: number | null;
  newDappsLaunched: number | null;
  developerSentiment: number | null;

  // Education/Understanding Metrics
  educationSearches: number | null;
  howToBuySearches: number | null;
  scamWarningSearches: number | null;

  // Payment Adoption
  merchantAdoptionScore: number | null;
  paymentVolumeCrypto: number | null;
}

export interface AdoptionScore {
  overall: number;  // 0-100
  breakdown: {
    retail: number;
    institutional: number;
    developer: number;
    education: number;
    payment: number;
  };
  trend: 'growing' | 'declining' | 'stable';
  phase: 'early' | 'growth' | 'mainstream' | 'mature';
  keyDrivers: string[];
  concerns: string[];
}

export interface AdoptionTrend {
  metric: string;
  values: { timestamp: Date; value: number }[];
  trend: 'up' | 'down' | 'flat';
  changePercent: number;
}

export interface RetailSentiment {
  score: number;
  label: 'very_fearful' | 'fearful' | 'neutral' | 'greedy' | 'very_greedy';
  buyPressure: number;
  searchInterest: number;
  newUserGrowth: number;
  fomo: boolean;
  capitulation: boolean;
}

// ============================================
// ADOPTION PHASE DEFINITIONS
// ============================================

const ADOPTION_PHASES = {
  early: {
    threshold: 25,
    description: 'Early adopters and tech enthusiasts',
    characteristics: ['Low search interest', 'High developer activity ratio', 'Few mainstream merchants'],
  },
  growth: {
    threshold: 50,
    description: 'Growing mainstream awareness',
    characteristics: ['Rising search trends', 'Increasing retail participation', 'More payment integrations'],
  },
  mainstream: {
    threshold: 75,
    description: 'Mainstream recognition and use',
    characteristics: ['High search interest', 'Significant institutional investment', 'Wide merchant acceptance'],
  },
  mature: {
    threshold: 100,
    description: 'Full mainstream integration',
    characteristics: ['Stable search interest', 'Regulatory clarity', 'Default payment option'],
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

function checkSupabase() {
  if (!isSupabaseConfigured() || !supabase) {
    throw new Error('Supabase is not configured');
  }
  return supabase;
}

/**
 * Determine adoption phase based on score
 */
function getAdoptionPhase(score: number): 'early' | 'growth' | 'mainstream' | 'mature' {
  if (score < ADOPTION_PHASES.early.threshold) return 'early';
  if (score < ADOPTION_PHASES.growth.threshold) return 'growth';
  if (score < ADOPTION_PHASES.mainstream.threshold) return 'mainstream';
  return 'mature';
}

/**
 * Calculate trend from historical values
 */
function calculateTrend(values: number[]): 'growing' | 'declining' | 'stable' {
  if (values.length < 2) return 'stable';

  const mid = Math.floor(values.length / 2);
  const firstHalfAvg = values.slice(0, mid).reduce((a, b) => a + b, 0) / mid;
  const secondHalfAvg = values.slice(mid).reduce((a, b) => a + b, 0) / (values.length - mid);

  const change = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;

  if (change > 5) return 'growing';
  if (change < -5) return 'declining';
  return 'stable';
}

/**
 * Convert retail sentiment score to label
 */
function sentimentScoreToLabel(score: number): RetailSentiment['label'] {
  if (score >= 75) return 'very_greedy';
  if (score >= 55) return 'greedy';
  if (score <= 25) return 'very_fearful';
  if (score <= 45) return 'fearful';
  return 'neutral';
}

// ============================================
// CORE FUNCTIONS
// ============================================

/**
 * Record adoption metrics snapshot
 */
export async function recordAdoptionMetrics(
  metrics: Partial<AdoptionMetrics>
): Promise<{ id: string; timestamp: Date } | null> {
  const db = checkSupabase();

  const timestamp = metrics.timestamp || new Date();

  const record = {
    timestamp: timestamp.toISOString(),
    google_trends_btc: metrics.googleTrendsBtc ?? null,
    google_trends_crypto: metrics.googleTrendsCrypto ?? null,
    google_trends_defi: metrics.googleTrendsDefi ?? null,
    google_trends_nft: metrics.googleTrendsNft ?? null,
    active_wallets_btc: metrics.activeWalletsBtc ?? null,
    active_wallets_eth: metrics.activeWalletsEth ?? null,
    new_wallets_24h: metrics.newWallets24h ?? null,
    retail_buy_pressure: metrics.retailBuyPressure ?? null,
    retail_sentiment_score: metrics.retailSentimentScore ?? null,
    etf_inflows: metrics.etfInflows ?? null,
    institutional_holdings_change: metrics.institutionalHoldingsChange ?? null,
    corporate_announcements: metrics.corporateAnnouncements ?? null,
    github_commits_total: metrics.githubCommitsTotal ?? null,
    new_dapps_launched: metrics.newDappsLaunched ?? null,
    developer_sentiment: metrics.developerSentiment ?? null,
    education_searches: metrics.educationSearches ?? null,
    how_to_buy_searches: metrics.howToBuySearches ?? null,
    scam_warning_searches: metrics.scamWarningSearches ?? null,
    merchant_adoption_score: metrics.merchantAdoptionScore ?? null,
    payment_volume_crypto: metrics.paymentVolumeCrypto ?? null,
  };

  const { data, error } = await db
    .from('adoption_metrics')
    .upsert(record, { onConflict: 'timestamp' })
    .select('id, timestamp')
    .single();

  if (error) {
    console.error('Error recording adoption metrics:', error);
    return null;
  }

  return {
    id: data.id,
    timestamp: new Date(data.timestamp),
  };
}

/**
 * Get adoption metrics history
 */
export async function getAdoptionHistory(
  days: number = 30
): Promise<AdoptionMetrics[]> {
  const db = checkSupabase();

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await db
    .from('adoption_metrics')
    .select('*')
    .gte('timestamp', startDate.toISOString())
    .order('timestamp', { ascending: false });

  if (error) {
    console.error('Error fetching adoption history:', error);
    return [];
  }

  return (data || []).map(row => ({
    id: row.id,
    timestamp: new Date(row.timestamp),
    googleTrendsBtc: row.google_trends_btc,
    googleTrendsCrypto: row.google_trends_crypto,
    googleTrendsDefi: row.google_trends_defi,
    googleTrendsNft: row.google_trends_nft,
    activeWalletsBtc: row.active_wallets_btc,
    activeWalletsEth: row.active_wallets_eth,
    newWallets24h: row.new_wallets_24h,
    retailBuyPressure: row.retail_buy_pressure,
    retailSentimentScore: row.retail_sentiment_score,
    etfInflows: row.etf_inflows,
    institutionalHoldingsChange: row.institutional_holdings_change,
    corporateAnnouncements: row.corporate_announcements,
    githubCommitsTotal: row.github_commits_total,
    newDappsLaunched: row.new_dapps_launched,
    developerSentiment: row.developer_sentiment,
    educationSearches: row.education_searches,
    howToBuySearches: row.how_to_buy_searches,
    scamWarningSearches: row.scam_warning_searches,
    merchantAdoptionScore: row.merchant_adoption_score,
    paymentVolumeCrypto: row.payment_volume_crypto,
  }));
}

/**
 * Get latest adoption metrics
 */
export async function getLatestAdoptionMetrics(): Promise<AdoptionMetrics | null> {
  const db = checkSupabase();

  const { data, error } = await db
    .from('adoption_metrics')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    console.error('Error fetching latest adoption metrics:', error);
    return null;
  }

  if (!data) return null;

  return {
    id: data.id,
    timestamp: new Date(data.timestamp),
    googleTrendsBtc: data.google_trends_btc,
    googleTrendsCrypto: data.google_trends_crypto,
    googleTrendsDefi: data.google_trends_defi,
    googleTrendsNft: data.google_trends_nft,
    activeWalletsBtc: data.active_wallets_btc,
    activeWalletsEth: data.active_wallets_eth,
    newWallets24h: data.new_wallets_24h,
    retailBuyPressure: data.retail_buy_pressure,
    retailSentimentScore: data.retail_sentiment_score,
    etfInflows: data.etf_inflows,
    institutionalHoldingsChange: data.institutional_holdings_change,
    corporateAnnouncements: data.corporate_announcements,
    githubCommitsTotal: data.github_commits_total,
    newDappsLaunched: data.new_dapps_launched,
    developerSentiment: data.developer_sentiment,
    educationSearches: data.education_searches,
    howToBuySearches: data.how_to_buy_searches,
    scamWarningSearches: data.scam_warning_searches,
    merchantAdoptionScore: data.merchant_adoption_score,
    paymentVolumeCrypto: data.payment_volume_crypto,
  };
}

/**
 * Calculate comprehensive adoption score
 */
export async function calculateAdoptionScore(): Promise<AdoptionScore> {
  const history = await getAdoptionHistory(30);

  if (history.length === 0) {
    return {
      overall: 50,
      breakdown: {
        retail: 50,
        institutional: 50,
        developer: 50,
        education: 50,
        payment: 50,
      },
      trend: 'stable',
      phase: 'growth',
      keyDrivers: [],
      concerns: [],
    };
  }

  const latest = history[0];

  // Calculate component scores (0-100)
  const retailScore = calculateComponentScore([
    latest.retailSentimentScore ?? 50,
    latest.googleTrendsBtc ?? 50,
    latest.howToBuySearches ? Math.min(100, latest.howToBuySearches / 10) : 50,
  ]);

  const institutionalScore = calculateComponentScore([
    latest.etfInflows ? (latest.etfInflows > 0 ? 70 : 30) : 50,
    latest.institutionalHoldingsChange ? (latest.institutionalHoldingsChange > 0 ? 70 : 30) : 50,
    latest.corporateAnnouncements ? Math.min(100, latest.corporateAnnouncements * 10) : 50,
  ]);

  const developerScore = calculateComponentScore([
    latest.githubCommitsTotal ? Math.min(100, latest.githubCommitsTotal / 100) : 50,
    latest.newDappsLaunched ? Math.min(100, latest.newDappsLaunched * 5) : 50,
    latest.developerSentiment ?? 50,
  ]);

  const educationScore = calculateComponentScore([
    latest.educationSearches ? Math.min(100, latest.educationSearches / 10) : 50,
    latest.scamWarningSearches ? Math.max(0, 100 - latest.scamWarningSearches / 5) : 50, // Inverse
    latest.googleTrendsCrypto ?? 50,
  ]);

  const paymentScore = calculateComponentScore([
    latest.merchantAdoptionScore ?? 50,
    latest.paymentVolumeCrypto ? Math.min(100, latest.paymentVolumeCrypto / 1000000) : 50,
  ]);

  // Calculate overall score (weighted average)
  const overall = Math.round(
    retailScore * 0.25 +
    institutionalScore * 0.25 +
    developerScore * 0.2 +
    educationScore * 0.15 +
    paymentScore * 0.15
  );

  // Calculate trend from historical data
  const historicalScores = history.map(h =>
    calculateComponentScore([
      h.retailSentimentScore ?? 50,
      h.googleTrendsBtc ?? 50,
      h.institutionalHoldingsChange ? (h.institutionalHoldingsChange > 0 ? 70 : 30) : 50,
    ])
  );
  const trend = calculateTrend(historicalScores);

  // Determine phase
  const phase = getAdoptionPhase(overall);

  // Identify key drivers and concerns
  const keyDrivers: string[] = [];
  const concerns: string[] = [];

  if (institutionalScore > 70) keyDrivers.push('Strong institutional interest');
  if (developerScore > 70) keyDrivers.push('Active developer ecosystem');
  if (retailScore > 70) keyDrivers.push('Growing retail adoption');
  if (latest.etfInflows && latest.etfInflows > 0) keyDrivers.push('Positive ETF inflows');

  if (latest.scamWarningSearches && latest.scamWarningSearches > 50) concerns.push('High scam-related searches');
  if (retailScore < 30) concerns.push('Low retail interest');
  if (paymentScore < 30) concerns.push('Limited payment adoption');
  if (developerScore < 30) concerns.push('Declining developer activity');

  return {
    overall,
    breakdown: {
      retail: Math.round(retailScore),
      institutional: Math.round(institutionalScore),
      developer: Math.round(developerScore),
      education: Math.round(educationScore),
      payment: Math.round(paymentScore),
    },
    trend,
    phase,
    keyDrivers,
    concerns,
  };
}

/**
 * Helper to calculate component score from multiple values
 */
function calculateComponentScore(values: number[]): number {
  const validValues = values.filter(v => v !== null && !isNaN(v));
  if (validValues.length === 0) return 50;
  return validValues.reduce((a, b) => a + b, 0) / validValues.length;
}

/**
 * Get adoption trends for specific metrics
 */
export async function getAdoptionTrends(
  days: number = 7
): Promise<AdoptionTrend[]> {
  const history = await getAdoptionHistory(days);

  if (history.length < 2) {
    return [];
  }

  const metrics = [
    { key: 'googleTrendsBtc', name: 'Bitcoin Search Interest' },
    { key: 'retailSentimentScore', name: 'Retail Sentiment' },
    { key: 'activeWalletsBtc', name: 'Active BTC Wallets' },
    { key: 'etfInflows', name: 'ETF Inflows' },
    { key: 'githubCommitsTotal', name: 'Developer Activity' },
  ];

  const trends: AdoptionTrend[] = [];

  for (const metric of metrics) {
    const values = history
      .filter(h => (h as Record<string, unknown>)[metric.key] !== null)
      .map(h => ({
        timestamp: h.timestamp,
        value: (h as Record<string, unknown>)[metric.key] as number,
      }))
      .reverse();

    if (values.length < 2) continue;

    const numericValues = values.map(v => v.value);
    const firstValue = numericValues[0];
    const lastValue = numericValues[numericValues.length - 1];
    const changePercent = firstValue !== 0 ? ((lastValue - firstValue) / firstValue) * 100 : 0;

    let trendDirection: 'up' | 'down' | 'flat' = 'flat';
    if (changePercent > 5) trendDirection = 'up';
    else if (changePercent < -5) trendDirection = 'down';

    trends.push({
      metric: metric.name,
      values,
      trend: trendDirection,
      changePercent: Math.round(changePercent * 10) / 10,
    });
  }

  return trends;
}

/**
 * Get retail sentiment analysis
 */
export async function getRetailSentiment(): Promise<RetailSentiment> {
  const latest = await getLatestAdoptionMetrics();
  const history = await getAdoptionHistory(7);

  // Default values if no data
  if (!latest) {
    return {
      score: 50,
      label: 'neutral',
      buyPressure: 50,
      searchInterest: 50,
      newUserGrowth: 0,
      fomo: false,
      capitulation: false,
    };
  }

  const score = latest.retailSentimentScore ?? 50;
  const buyPressure = latest.retailBuyPressure ?? 50;
  const searchInterest = latest.googleTrendsBtc ?? 50;

  // Calculate new user growth rate
  let newUserGrowth = 0;
  if (history.length >= 2 && history[0].newWallets24h && history[1].newWallets24h) {
    newUserGrowth = ((history[0].newWallets24h - history[1].newWallets24h) / history[1].newWallets24h) * 100;
  }

  // Detect FOMO (high greed + high search interest + high buy pressure)
  const fomo = score > 75 && searchInterest > 70 && buyPressure > 70;

  // Detect capitulation (extreme fear + declining interest)
  const capitulation = score < 25 && searchInterest < 30;

  return {
    score,
    label: sentimentScoreToLabel(score),
    buyPressure,
    searchInterest,
    newUserGrowth: Math.round(newUserGrowth * 10) / 10,
    fomo,
    capitulation,
  };
}

/**
 * Collect adoption metrics from various sources
 */
export async function collectAdoptionMetrics(): Promise<AdoptionMetrics> {
  // Fetch developer activity from GitHub
  const githubActivity = await fetchGitHubActivity([
    'bitcoin/bitcoin',
    'ethereum/go-ethereum',
    'solana-labs/solana',
  ]);

  // Fetch trending data
  const trending = await fetchCoinGeckoTrending();

  // Calculate total GitHub activity
  const totalCommits = Object.values(githubActivity).reduce(
    (sum, repo) => sum + repo.commits,
    0
  );
  const totalStars = Object.values(githubActivity).reduce(
    (sum, repo) => sum + repo.stars,
    0
  );

  // Developer sentiment based on activity
  const developerSentiment = Math.min(100, Math.round((totalCommits / 100) * 20 + (totalStars / 10000) * 30 + 50));

  const metrics: AdoptionMetrics = {
    timestamp: new Date(),
    googleTrendsBtc: null, // Would need Google Trends API
    googleTrendsCrypto: null,
    googleTrendsDefi: null,
    googleTrendsNft: null,
    activeWalletsBtc: null, // Would need on-chain data
    activeWalletsEth: null,
    newWallets24h: null,
    retailBuyPressure: null, // Would need exchange data
    retailSentimentScore: null,
    etfInflows: null, // Would need ETF data
    institutionalHoldingsChange: null,
    corporateAnnouncements: null,
    githubCommitsTotal: totalCommits,
    newDappsLaunched: null,
    developerSentiment,
    educationSearches: null,
    howToBuySearches: null,
    scamWarningSearches: null,
    merchantAdoptionScore: null,
    paymentVolumeCrypto: null,
  };

  return metrics;
}

/**
 * Get adoption signals formatted for AI prediction
 */
export async function getAdoptionSignalsForPrediction(): Promise<{
  adoptionScore: number;
  phase: string;
  trend: string;
  retailSentiment: number;
  institutionalInterest: number;
  developerActivity: number;
  bullishFactors: string[];
  bearishFactors: string[];
  fomo: boolean;
  capitulation: boolean;
}> {
  const [adoptionScore, retailSentiment] = await Promise.all([
    calculateAdoptionScore(),
    getRetailSentiment(),
  ]);

  return {
    adoptionScore: adoptionScore.overall,
    phase: adoptionScore.phase,
    trend: adoptionScore.trend,
    retailSentiment: retailSentiment.score,
    institutionalInterest: adoptionScore.breakdown.institutional,
    developerActivity: adoptionScore.breakdown.developer,
    bullishFactors: adoptionScore.keyDrivers,
    bearishFactors: adoptionScore.concerns,
    fomo: retailSentiment.fomo,
    capitulation: retailSentiment.capitulation,
  };
}

/**
 * Record adoption snapshot (for scheduled ingestion)
 */
export async function recordAdoptionSnapshot(): Promise<{
  success: boolean;
  metrics?: AdoptionMetrics;
  error?: string;
}> {
  try {
    const metrics = await collectAdoptionMetrics();
    const result = await recordAdoptionMetrics(metrics);

    if (result) {
      return { success: true, metrics };
    } else {
      return { success: false, error: 'Failed to save to database' };
    }
  } catch (error) {
    console.error('Error recording adoption snapshot:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Get adoption phase description
 */
export function getAdoptionPhaseDescription(phase: string): {
  description: string;
  characteristics: string[];
} {
  const phaseData = ADOPTION_PHASES[phase as keyof typeof ADOPTION_PHASES];
  if (!phaseData) {
    return {
      description: 'Unknown phase',
      characteristics: [],
    };
  }
  return {
    description: phaseData.description,
    characteristics: phaseData.characteristics,
  };
}
