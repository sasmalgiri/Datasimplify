/**
 * Sentiment Profiler
 * Multi-dimensional sentiment profiling with timestamp-based storage
 * Tracks sentiment across various crypto aspects for AI predictions
 */

import { supabase, isSupabaseConfigured } from './supabase';
import {
  aggregateAllSentiment,
  getCoinDeepSentiment,
  fetchRedditSentiment,
  fetchCryptoPanicSentiment,
  analyzeSentimentAdvanced,
  SentimentPost,
  AggregatedSentiment,
} from './comprehensiveSentiment';

// ============================================
// TYPES
// ============================================

export type SentimentCategory =
  | 'market'      // Overall market sentiment
  | 'technology'  // Tech developments, upgrades, innovations
  | 'regulation'  // Government policies, laws, enforcement
  | 'adoption'    // Retail/institutional adoption signals
  | 'security'    // Hacks, exploits, safety concerns
  | 'defi'        // DeFi specific sentiment
  | 'nft'         // NFT market sentiment
  | 'layer2'      // L2 ecosystem sentiment
  | 'stablecoin'  // Stablecoin confidence
  | 'meme'        // Meme coin sentiment
  | 'etf'         // ETF and institutional products
  | 'cbdc';       // Central bank digital currencies

export interface SentimentProfile {
  id?: string;
  timestamp: Date;
  category: SentimentCategory;
  subcategory?: string;

  // Sentiment Scores (-100 to +100)
  overallScore: number;

  // Source Breakdown
  redditScore: number | null;
  twitterScore: number | null;
  newsScore: number | null;
  youtubeScore: number | null;
  telegramScore: number | null;

  // Volume Metrics
  mentionCount: number;
  engagementScore: number;
  viralCoefficient: number;

  // Trending Analysis
  isTrending: boolean;
  trendDirection: 'rising' | 'falling' | 'stable';
  trendVelocity: number;

  // Key Phrases
  topKeywords: string[];
  notablePosts: NotablePost[];
}

export interface NotablePost {
  title: string;
  url: string;
  source: string;
  sentiment: number;
  engagement: number;
  timestamp: string;
}

export interface SentimentShift {
  category: SentimentCategory;
  previousScore: number;
  currentScore: number;
  change: number;
  changePercent: number;
  direction: 'bullish_shift' | 'bearish_shift' | 'stable';
  timestamp: Date;
  triggerPosts?: NotablePost[];
}

export interface CategorySentimentSignals {
  category: SentimentCategory;
  score: number;
  trend: 'rising' | 'falling' | 'stable';
  confidence: number;
  signal: 'strongly_bullish' | 'bullish' | 'neutral' | 'bearish' | 'strongly_bearish';
  keywords: string[];
}

export interface AggregatedSentimentSignals {
  timestamp: Date;
  overallScore: number;
  overallSignal: string;
  confidence: number;
  categories: CategorySentimentSignals[];
  dominantTheme: string;
  riskLevel: 'low' | 'medium' | 'high';
  topBullishCategories: SentimentCategory[];
  topBearishCategories: SentimentCategory[];
}

// ============================================
// CATEGORY KEYWORDS FOR CLASSIFICATION
// ============================================

const CATEGORY_KEYWORDS: Record<SentimentCategory, string[]> = {
  market: [
    'price', 'market', 'bullish', 'bearish', 'rally', 'dump', 'pump', 'correction',
    'bull run', 'bear market', 'crypto winter', 'altseason', 'btc dominance'
  ],
  technology: [
    'upgrade', 'mainnet', 'testnet', 'protocol', 'consensus', 'scaling', 'layer',
    'merge', 'fork', 'eip', 'bip', 'development', 'roadmap', 'release', 'v2', 'v3'
  ],
  regulation: [
    'sec', 'cftc', 'regulation', 'law', 'legal', 'ban', 'lawsuit', 'court', 'compliance',
    'aml', 'kyc', 'tax', 'policy', 'government', 'congress', 'senate', 'legislation'
  ],
  adoption: [
    'adoption', 'accept', 'payment', 'merchant', 'institutional', 'retail', 'mainstream',
    'partnership', 'integration', 'users', 'wallet', 'download', 'onboard'
  ],
  security: [
    'hack', 'exploit', 'vulnerability', 'breach', 'stolen', 'attack', 'security',
    'audit', 'bug', 'drain', 'compromised', 'safe', 'secure', 'multisig', 'cold wallet'
  ],
  defi: [
    'defi', 'tvl', 'yield', 'apy', 'apr', 'liquidity', 'lending', 'borrowing', 'dex',
    'amm', 'swap', 'pool', 'farm', 'stake', 'vault', 'protocol'
  ],
  nft: [
    'nft', 'opensea', 'blur', 'collection', 'mint', 'floor price', 'pfp', 'art',
    'royalty', 'marketplace', 'drop', 'rarity'
  ],
  layer2: [
    'layer 2', 'l2', 'rollup', 'optimism', 'arbitrum', 'zksync', 'polygon', 'base',
    'scaling', 'gas', 'bridge', 'sequencer'
  ],
  stablecoin: [
    'usdt', 'usdc', 'dai', 'stablecoin', 'peg', 'depeg', 'reserve', 'backing',
    'tether', 'circle', 'algorithmic', 'collateral'
  ],
  meme: [
    'meme', 'doge', 'shib', 'pepe', 'bonk', 'wif', 'floki', 'pump fun', 'rug',
    'gem', 'moonshot', '100x', 'degen', 'ape'
  ],
  etf: [
    'etf', 'spot etf', 'bitcoin etf', 'ethereum etf', 'blackrock', 'fidelity',
    'grayscale', 'institutional', 'inflow', 'outflow', 'approval'
  ],
  cbdc: [
    'cbdc', 'central bank', 'digital dollar', 'digital euro', 'digital yuan',
    'fed', 'ecb', 'boe', 'government digital currency'
  ]
};

// ============================================
// HELPER FUNCTIONS
// ============================================

function checkSupabase() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured');
  }
  return supabase;
}

/**
 * Classify a post into sentiment categories
 */
function classifyPostCategory(post: SentimentPost): SentimentCategory[] {
  const text = `${post.title} ${post.content}`.toLowerCase();
  const categories: SentimentCategory[] = [];

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (text.includes(keyword.toLowerCase())) {
        categories.push(category as SentimentCategory);
        break;
      }
    }
  }

  // Default to 'market' if no specific category found
  if (categories.length === 0) {
    categories.push('market');
  }

  return categories;
}

/**
 * Calculate trend direction from historical data
 */
function calculateTrend(
  scores: number[]
): { direction: 'rising' | 'falling' | 'stable'; velocity: number } {
  if (scores.length < 2) {
    return { direction: 'stable', velocity: 0 };
  }

  // Calculate average of first half vs second half
  const mid = Math.floor(scores.length / 2);
  const firstHalf = scores.slice(0, mid);
  const secondHalf = scores.slice(mid);

  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

  const change = secondAvg - firstAvg;
  const velocity = Math.abs(change) / scores.length;

  if (change > 5) return { direction: 'rising', velocity };
  if (change < -5) return { direction: 'falling', velocity };
  return { direction: 'stable', velocity };
}

/**
 * Convert sentiment score to signal label
 */
function scoreToSignal(score: number): CategorySentimentSignals['signal'] {
  if (score >= 50) return 'strongly_bullish';
  if (score >= 20) return 'bullish';
  if (score <= -50) return 'strongly_bearish';
  if (score <= -20) return 'bearish';
  return 'neutral';
}

// ============================================
// CORE FUNCTIONS
// ============================================

/**
 * Record a sentiment snapshot for a category
 */
export async function recordSentimentSnapshot(
  category: SentimentCategory,
  data: Partial<SentimentProfile>
): Promise<{ id: string; timestamp: Date } | null> {
  const db = checkSupabase();

  const record = {
    timestamp: data.timestamp?.toISOString() || new Date().toISOString(),
    category,
    subcategory: data.subcategory || null,
    overall_score: data.overallScore ?? 0,
    reddit_score: data.redditScore ?? null,
    twitter_score: data.twitterScore ?? null,
    news_score: data.newsScore ?? null,
    youtube_score: data.youtubeScore ?? null,
    telegram_score: data.telegramScore ?? null,
    mention_count: data.mentionCount ?? 0,
    engagement_score: data.engagementScore ?? 0,
    viral_coefficient: data.viralCoefficient ?? 0,
    is_trending: data.isTrending ?? false,
    trend_direction: data.trendDirection ?? 'stable',
    trend_velocity: data.trendVelocity ?? 0,
    top_keywords: data.topKeywords ?? [],
    notable_posts: data.notablePosts ?? [],
  };

  const { data: result, error } = await db
    .from('sentiment_profiles')
    .upsert(record, {
      onConflict: 'timestamp,category,subcategory',
    })
    .select('id, timestamp')
    .single();

  if (error) {
    console.error('Error recording sentiment snapshot:', error);
    return null;
  }

  return {
    id: result.id,
    timestamp: new Date(result.timestamp),
  };
}

/**
 * Get sentiment history for a category
 */
export async function getSentimentHistory(
  category: SentimentCategory,
  days: number = 7,
  subcategory?: string
): Promise<SentimentProfile[]> {
  const db = checkSupabase();

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  let query = db
    .from('sentiment_profiles')
    .select('*')
    .eq('category', category)
    .gte('timestamp', startDate.toISOString())
    .order('timestamp', { ascending: false });

  if (subcategory) {
    query = query.eq('subcategory', subcategory);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching sentiment history:', error);
    return [];
  }

  return (data || []).map(row => ({
    id: row.id,
    timestamp: new Date(row.timestamp),
    category: row.category,
    subcategory: row.subcategory,
    overallScore: row.overall_score,
    redditScore: row.reddit_score,
    twitterScore: row.twitter_score,
    newsScore: row.news_score,
    youtubeScore: row.youtube_score,
    telegramScore: row.telegram_score,
    mentionCount: row.mention_count,
    engagementScore: row.engagement_score,
    viralCoefficient: row.viral_coefficient,
    isTrending: row.is_trending,
    trendDirection: row.trend_direction,
    trendVelocity: row.trend_velocity,
    topKeywords: row.top_keywords || [],
    notablePosts: row.notable_posts || [],
  }));
}

/**
 * Aggregate sentiment signals from all categories for AI
 */
export async function aggregateSentimentSignals(): Promise<AggregatedSentimentSignals> {
  // Fetch live sentiment from all sources
  const [aggregated, redditPosts, cryptoPanicPosts] = await Promise.all([
    aggregateAllSentiment(),
    fetchRedditSentiment(['cryptocurrency', 'bitcoin', 'ethtrader'], 30),
    fetchCryptoPanicSentiment('hot'),
  ]);

  const allPosts = [...redditPosts, ...cryptoPanicPosts];

  // Classify posts by category
  const categoryPosts: Record<SentimentCategory, SentimentPost[]> = {
    market: [],
    technology: [],
    regulation: [],
    adoption: [],
    security: [],
    defi: [],
    nft: [],
    layer2: [],
    stablecoin: [],
    meme: [],
    etf: [],
    cbdc: [],
  };

  for (const post of allPosts) {
    const categories = classifyPostCategory(post);
    for (const category of categories) {
      categoryPosts[category].push(post);
    }
  }

  // Calculate signals for each category
  const categories: CategorySentimentSignals[] = [];

  for (const [category, posts] of Object.entries(categoryPosts)) {
    if (posts.length === 0) continue;

    const avgScore = posts.reduce((sum, p) => sum + p.sentiment.score, 0) / posts.length;
    const score = Math.round(avgScore * 100);

    // Get all keywords from posts
    const allKeywords = posts.flatMap(p => p.keywords);
    const keywordCounts = allKeywords.reduce((acc, kw) => {
      acc[kw] = (acc[kw] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topKeywords = Object.entries(keywordCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([kw]) => kw);

    // Calculate confidence based on volume
    const confidence = Math.min(1, posts.length / 20);

    categories.push({
      category: category as SentimentCategory,
      score,
      trend: 'stable', // Would need historical data to calculate
      confidence,
      signal: scoreToSignal(score),
      keywords: topKeywords,
    });
  }

  // Sort by volume (confidence) to find dominant themes
  categories.sort((a, b) => b.confidence - a.confidence);

  // Calculate overall
  const weightedSum = categories.reduce((sum, c) => sum + c.score * c.confidence, 0);
  const totalWeight = categories.reduce((sum, c) => sum + c.confidence, 0);
  const overallScore = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;

  // Find bullish/bearish categories
  const bullishCategories = categories
    .filter(c => c.score > 20)
    .map(c => c.category);
  const bearishCategories = categories
    .filter(c => c.score < -20)
    .map(c => c.category);

  // Determine risk level
  let riskLevel: 'low' | 'medium' | 'high' = 'medium';
  if (bearishCategories.includes('security') || bearishCategories.includes('regulation')) {
    riskLevel = 'high';
  } else if (bullishCategories.length > bearishCategories.length) {
    riskLevel = 'low';
  }

  // Store snapshots for each category
  const timestamp = new Date();
  for (const cat of categories) {
    const posts = categoryPosts[cat.category];
    await recordSentimentSnapshot(cat.category, {
      timestamp,
      overallScore: cat.score,
      redditScore: posts.filter(p => p.source === 'reddit').length > 0
        ? Math.round(posts.filter(p => p.source === 'reddit')
            .reduce((s, p) => s + p.sentiment.score, 0) /
            posts.filter(p => p.source === 'reddit').length * 100)
        : null,
      newsScore: posts.filter(p => p.source === 'cryptopanic' || p.source === 'rss').length > 0
        ? Math.round(posts.filter(p => p.source === 'cryptopanic' || p.source === 'rss')
            .reduce((s, p) => s + p.sentiment.score, 0) /
            posts.filter(p => p.source === 'cryptopanic' || p.source === 'rss').length * 100)
        : null,
      mentionCount: posts.length,
      engagementScore: posts.reduce((s, p) => s + p.engagement.likes + p.engagement.comments, 0),
      topKeywords: cat.keywords,
      notablePosts: posts
        .sort((a, b) => (b.engagement.likes + b.engagement.comments) - (a.engagement.likes + a.engagement.comments))
        .slice(0, 5)
        .map(p => ({
          title: p.title.slice(0, 200),
          url: p.url,
          source: p.source,
          sentiment: Math.round(p.sentiment.score * 100),
          engagement: p.engagement.likes + p.engagement.comments,
          timestamp: p.timestamp,
        })),
    }).catch(err => console.error(`Error storing ${cat.category} sentiment:`, err));
  }

  return {
    timestamp,
    overallScore,
    overallSignal: scoreToSignal(overallScore),
    confidence: totalWeight > 0 ? totalWeight / categories.length : 0,
    categories,
    dominantTheme: categories[0]?.category || 'market',
    riskLevel,
    topBullishCategories: bullishCategories.slice(0, 3),
    topBearishCategories: bearishCategories.slice(0, 3),
  };
}

/**
 * Detect sudden sentiment shifts (for alerts)
 */
export async function detectSentimentShifts(
  hoursBack: number = 6,
  minChangePercent: number = 20
): Promise<SentimentShift[]> {
  const db = checkSupabase();

  const now = new Date();
  const startTime = new Date(now.getTime() - hoursBack * 60 * 60 * 1000);
  const midTime = new Date(now.getTime() - (hoursBack / 2) * 60 * 60 * 1000);

  const shifts: SentimentShift[] = [];
  const categories: SentimentCategory[] = [
    'market', 'regulation', 'security', 'adoption', 'defi', 'etf'
  ];

  for (const category of categories) {
    try {
      // Get first half average
      const { data: firstHalf } = await db
        .from('sentiment_profiles')
        .select('overall_score')
        .eq('category', category)
        .gte('timestamp', startTime.toISOString())
        .lt('timestamp', midTime.toISOString());

      // Get second half average
      const { data: secondHalf } = await db
        .from('sentiment_profiles')
        .select('overall_score, notable_posts')
        .eq('category', category)
        .gte('timestamp', midTime.toISOString())
        .lte('timestamp', now.toISOString());

      if (!firstHalf?.length || !secondHalf?.length) continue;

      const firstAvg = firstHalf.reduce((s, r) => s + r.overall_score, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((s, r) => s + r.overall_score, 0) / secondHalf.length;

      const change = secondAvg - firstAvg;
      const changePercent = firstAvg !== 0 ? Math.abs(change / firstAvg) * 100 : Math.abs(change);

      if (changePercent >= minChangePercent) {
        // Get trigger posts from recent data
        const recentPosts = secondHalf
          .flatMap(r => r.notable_posts || [])
          .slice(0, 5);

        shifts.push({
          category,
          previousScore: Math.round(firstAvg),
          currentScore: Math.round(secondAvg),
          change: Math.round(change),
          changePercent: Math.round(changePercent),
          direction: change > 0 ? 'bullish_shift' : change < 0 ? 'bearish_shift' : 'stable',
          timestamp: now,
          triggerPosts: recentPosts,
        });
      }
    } catch (error) {
      console.error(`Error detecting shift for ${category}:`, error);
    }
  }

  return shifts.sort((a, b) => b.changePercent - a.changePercent);
}

/**
 * Get coin-specific sentiment with category breakdown
 */
export async function getCoinSentimentProfile(
  symbol: string
): Promise<{
  coin: string;
  overallScore: number;
  signal: string;
  categories: { category: string; score: number; mentions: number }[];
  trending: boolean;
  recentPosts: NotablePost[];
  keywords: string[];
}> {
  const deepSentiment = await getCoinDeepSentiment(symbol);

  // Classify the posts by category
  const categoryScores: Record<string, { score: number; count: number }> = {};

  for (const post of deepSentiment.recentPosts) {
    const categories = classifyPostCategory(post);
    for (const category of categories) {
      if (!categoryScores[category]) {
        categoryScores[category] = { score: 0, count: 0 };
      }
      categoryScores[category].score += post.sentiment.score;
      categoryScores[category].count++;
    }
  }

  const categories = Object.entries(categoryScores)
    .map(([category, data]) => ({
      category,
      score: Math.round((data.score / data.count) * 100),
      mentions: data.count,
    }))
    .sort((a, b) => b.mentions - a.mentions);

  return {
    coin: symbol,
    overallScore: deepSentiment.overallSentiment,
    signal: scoreToSignal(deepSentiment.overallSentiment),
    categories,
    trending: deepSentiment.trending,
    recentPosts: deepSentiment.recentPosts.slice(0, 10).map(p => ({
      title: p.title.slice(0, 200),
      url: p.url,
      source: p.source,
      sentiment: Math.round(p.sentiment.score * 100),
      engagement: p.engagement.likes + p.engagement.comments,
      timestamp: p.timestamp,
    })),
    keywords: deepSentiment.keywords,
  };
}

/**
 * Get sentiment signals formatted for AI prediction engine
 */
export async function getSentimentSignalsForPrediction(): Promise<{
  overallScore: number;
  signal: string;
  confidence: number;
  riskLevel: string;
  dominantTheme: string;
  bullishFactors: string[];
  bearishFactors: string[];
  categoryBreakdown: Record<string, number>;
}> {
  const signals = await aggregateSentimentSignals();

  // Create category breakdown
  const categoryBreakdown: Record<string, number> = {};
  for (const cat of signals.categories) {
    categoryBreakdown[cat.category] = cat.score;
  }

  // Extract bullish/bearish factors from keywords
  const bullishFactors = signals.categories
    .filter(c => c.score > 20)
    .flatMap(c => c.keywords.slice(0, 2).map(k => `${c.category}: ${k}`));

  const bearishFactors = signals.categories
    .filter(c => c.score < -20)
    .flatMap(c => c.keywords.slice(0, 2).map(k => `${c.category}: ${k}`));

  return {
    overallScore: signals.overallScore,
    signal: signals.overallSignal,
    confidence: signals.confidence,
    riskLevel: signals.riskLevel,
    dominantTheme: signals.dominantTheme,
    bullishFactors,
    bearishFactors,
    categoryBreakdown,
  };
}

/**
 * Get trending topics across all categories
 */
export async function getTrendingTopics(): Promise<{
  topics: { topic: string; category: SentimentCategory; score: number; volume: number }[];
  lastUpdated: Date;
}> {
  // Get recent sentiment data
  const allCategories: SentimentCategory[] = [
    'market', 'technology', 'regulation', 'adoption', 'defi', 'etf', 'meme'
  ];

  const topics: { topic: string; category: SentimentCategory; score: number; volume: number }[] = [];

  for (const category of allCategories) {
    try {
      const history = await getSentimentHistory(category, 1);

      if (history.length > 0) {
        const latest = history[0];
        for (const keyword of latest.topKeywords.slice(0, 3)) {
          topics.push({
            topic: keyword,
            category,
            score: latest.overallScore,
            volume: latest.mentionCount,
          });
        }
      }
    } catch {
      // Skip if no data
    }
  }

  // Sort by volume and score
  topics.sort((a, b) => (b.volume * Math.abs(b.score)) - (a.volume * Math.abs(a.score)));

  return {
    topics: topics.slice(0, 20),
    lastUpdated: new Date(),
  };
}
