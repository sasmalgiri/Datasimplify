// ============================================
// RAG QUERY ANALYTICS
// Analyze query patterns for insights
// ============================================

import { supabase, isSupabaseConfigured } from './supabase';

export interface QueryAnalytics {
  totalQueries: number;
  uniqueUsers: number;
  avgResponseTimeMs: number;
  avgConfidence: string;
  topQueryTypes: { type: string; count: number; percent: string }[];
  topCoins: { coin: string; count: number }[];
  hourlyDistribution: { hour: number; count: number }[];
  userLevelDistribution: { level: string; count: number; percent: string }[];
  marketSessionDistribution: { session: string; count: number }[];
  helpfulnessRate: string;
}

export interface TrendingTopics {
  coins: { symbol: string; mentions: number; trend: 'up' | 'down' | 'stable' }[];
  queryTypes: { type: string; count: number; change: number }[];
  themes: { theme: string; count: number }[];
}

/**
 * Get comprehensive query analytics
 */
export async function getQueryAnalytics(days: number = 7): Promise<QueryAnalytics | null> {
  if (!isSupabaseConfigured || !supabase) return null;

  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const { data, error } = await supabase
      .from('rag_query_history')
      .select('*')
      .gte('created_at', cutoffDate.toISOString());

    if (error || !data) {
      console.error('Failed to fetch analytics:', error);
      return null;
    }

    // Calculate metrics
    const totalQueries = data.length;
    const uniqueUsers = new Set(data.filter(d => d.user_id).map(d => d.user_id)).size;

    // Average response time
    const responseTimes = data.filter(d => d.response_time_ms).map(d => d.response_time_ms);
    const avgResponseTimeMs = responseTimes.length > 0
      ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
      : 0;

    // Confidence distribution
    const confidenceCounts = { high: 0, medium: 0, low: 0 };
    data.forEach(d => {
      if (d.confidence) confidenceCounts[d.confidence as keyof typeof confidenceCounts]++;
    });
    const avgConfidence = confidenceCounts.high >= confidenceCounts.medium ? 'high' : 'medium';

    // Query type distribution
    const queryTypeCounts: Record<string, number> = {};
    data.forEach(d => {
      const type = d.query_type || 'general';
      queryTypeCounts[type] = (queryTypeCounts[type] || 0) + 1;
    });
    const topQueryTypes = Object.entries(queryTypeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([type, count]) => ({
        type,
        count,
        percent: ((count / totalQueries) * 100).toFixed(1) + '%',
      }));

    // Top coins mentioned
    const coinCounts: Record<string, number> = {};
    data.forEach(d => {
      if (d.coins_mentioned) {
        d.coins_mentioned.forEach((coin: string) => {
          coinCounts[coin] = (coinCounts[coin] || 0) + 1;
        });
      }
    });
    const topCoins = Object.entries(coinCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([coin, count]) => ({ coin, count }));

    // Hourly distribution
    const hourCounts: Record<number, number> = {};
    data.forEach(d => {
      const hour = new Date(d.created_at).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    const hourlyDistribution = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      count: hourCounts[i] || 0,
    }));

    // User level distribution
    const levelCounts: Record<string, number> = {};
    data.forEach(d => {
      const level = d.user_level || 'intermediate';
      levelCounts[level] = (levelCounts[level] || 0) + 1;
    });
    const userLevelDistribution = Object.entries(levelCounts)
      .map(([level, count]) => ({
        level,
        count,
        percent: ((count / totalQueries) * 100).toFixed(1) + '%',
      }));

    // Market session distribution
    const sessionCounts: Record<string, number> = {};
    data.forEach(d => {
      if (d.market_session) {
        sessionCounts[d.market_session] = (sessionCounts[d.market_session] || 0) + 1;
      }
    });
    const marketSessionDistribution = Object.entries(sessionCounts)
      .map(([session, count]) => ({ session, count }));

    // Helpfulness rate
    const withFeedback = data.filter(d => d.was_helpful !== null);
    const helpful = withFeedback.filter(d => d.was_helpful).length;
    const helpfulnessRate = withFeedback.length > 0
      ? ((helpful / withFeedback.length) * 100).toFixed(1) + '%'
      : 'N/A';

    return {
      totalQueries,
      uniqueUsers,
      avgResponseTimeMs,
      avgConfidence,
      topQueryTypes,
      topCoins,
      hourlyDistribution,
      userLevelDistribution,
      marketSessionDistribution,
      helpfulnessRate,
    };
  } catch (error) {
    console.error('Analytics error:', error);
    return null;
  }
}

/**
 * Get trending topics from recent queries
 */
export async function getTrendingTopics(): Promise<TrendingTopics | null> {
  if (!isSupabaseConfigured || !supabase) return null;

  try {
    // Get last 24h vs previous 24h for comparison
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    const { data: recent } = await supabase
      .from('rag_query_history')
      .select('coins_mentioned, query_type, query')
      .gte('created_at', oneDayAgo.toISOString());

    const { data: previous } = await supabase
      .from('rag_query_history')
      .select('coins_mentioned, query_type')
      .gte('created_at', twoDaysAgo.toISOString())
      .lt('created_at', oneDayAgo.toISOString());

    if (!recent) return null;

    // Count coins in recent period
    const recentCoins: Record<string, number> = {};
    recent.forEach(d => {
      if (d.coins_mentioned) {
        d.coins_mentioned.forEach((coin: string) => {
          recentCoins[coin] = (recentCoins[coin] || 0) + 1;
        });
      }
    });

    // Count coins in previous period
    const prevCoins: Record<string, number> = {};
    (previous || []).forEach(d => {
      if (d.coins_mentioned) {
        d.coins_mentioned.forEach((coin: string) => {
          prevCoins[coin] = (prevCoins[coin] || 0) + 1;
        });
      }
    });

    // Calculate trends
    const coins = Object.entries(recentCoins)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([symbol, mentions]) => {
        const prevMentions = prevCoins[symbol] || 0;
        let trend: 'up' | 'down' | 'stable' = 'stable';
        if (mentions > prevMentions * 1.2) trend = 'up';
        if (mentions < prevMentions * 0.8) trend = 'down';
        return { symbol, mentions, trend };
      });

    // Query type trends
    const recentTypes: Record<string, number> = {};
    recent.forEach(d => {
      const type = d.query_type || 'general';
      recentTypes[type] = (recentTypes[type] || 0) + 1;
    });

    const prevTypes: Record<string, number> = {};
    (previous || []).forEach(d => {
      const type = d.query_type || 'general';
      prevTypes[type] = (prevTypes[type] || 0) + 1;
    });

    const queryTypes = Object.entries(recentTypes)
      .map(([type, count]) => ({
        type,
        count,
        change: count - (prevTypes[type] || 0),
      }))
      .sort((a, b) => b.count - a.count);

    // Extract themes from queries (simple keyword extraction)
    const themes: Record<string, number> = {};
    const themeKeywords = [
      'price', 'prediction', 'analysis', 'buy', 'sell', 'whale',
      'sentiment', 'fear', 'greed', 'bullish', 'bearish', 'ETF',
      'halving', 'DeFi', 'NFT', 'staking', 'yield', 'risk'
    ];

    recent.forEach(d => {
      themeKeywords.forEach(keyword => {
        if (d.query?.toLowerCase().includes(keyword.toLowerCase())) {
          themes[keyword] = (themes[keyword] || 0) + 1;
        }
      });
    });

    const themesList = Object.entries(themes)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([theme, count]) => ({ theme, count }));

    return {
      coins,
      queryTypes,
      themes: themesList,
    };
  } catch (error) {
    console.error('Trending topics error:', error);
    return null;
  }
}

/**
 * Get personalized insights for a user
 */
export async function getUserInsights(userId: string): Promise<{
  favoriteCoins: string[];
  preferredQueryType: string;
  avgSessionLength: number;
  totalQueries: number;
  lastActive: string;
} | null> {
  if (!isSupabaseConfigured || !supabase || !userId) return null;

  try {
    const { data, error } = await supabase
      .from('rag_query_history')
      .select('coins_mentioned, query_type, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error || !data || data.length === 0) return null;

    // Favorite coins
    const coinCounts: Record<string, number> = {};
    data.forEach(d => {
      if (d.coins_mentioned) {
        d.coins_mentioned.forEach((coin: string) => {
          coinCounts[coin] = (coinCounts[coin] || 0) + 1;
        });
      }
    });
    const favoriteCoins = Object.entries(coinCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([coin]) => coin);

    // Preferred query type
    const typeCounts: Record<string, number> = {};
    data.forEach(d => {
      const type = d.query_type || 'general';
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });
    const preferredQueryType = Object.entries(typeCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'general';

    // Session analysis: average queries per session.
    // A new session starts after 30 minutes of inactivity.
    const sorted = [...data]
      .filter(d => d.created_at)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    const SESSION_GAP_MS = 30 * 60 * 1000;
    let sessions = 0;
    let currentSessionCount = 0;
    let prevTs: number | null = null;

    for (const row of sorted) {
      const ts = new Date(row.created_at).getTime();
      if (!Number.isFinite(ts)) continue;

      if (prevTs === null || ts - prevTs > SESSION_GAP_MS) {
        if (currentSessionCount > 0) sessions += 1;
        currentSessionCount = 0;
      }

      currentSessionCount += 1;
      prevTs = ts;
    }

    if (currentSessionCount > 0) sessions += 1;
    const avgSessionLength = sessions > 0 ? Number((sorted.length / sessions).toFixed(1)) : 0;

    return {
      favoriteCoins,
      preferredQueryType,
      avgSessionLength,
      totalQueries: data.length,
      lastActive: data[0].created_at,
    };
  } catch (error) {
    console.error('User insights error:', error);
    return null;
  }
}
