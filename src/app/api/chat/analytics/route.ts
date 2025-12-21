import { NextResponse } from 'next/server';
import { getQueryAnalytics, getTrendingTopics, getUserInsights } from '@/lib/ragAnalytics';
import { getCacheStats } from '@/lib/ragCache';
import { getProviderHealth } from '@/lib/ragProviders';
import { getAggregateStats } from '@/lib/ragCostTracker';

export const dynamic = 'force-dynamic';

/**
 * GET /api/chat/analytics
 * Get RAG system analytics and health status
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'overview';
    const days = parseInt(searchParams.get('days') || '7', 10);
    const userId = searchParams.get('userId');

    switch (type) {
      case 'overview': {
        // Get high-level system stats
        const [analytics, cacheStats, providerHealth, usageStats] = await Promise.all([
          getQueryAnalytics(days),
          getCacheStats(),
          getProviderHealth(),
          getAggregateStats(),
        ]);

        return NextResponse.json({
          success: true,
          data: {
            period: `Last ${days} days`,
            queries: analytics ? {
              total: analytics.totalQueries,
              uniqueUsers: analytics.uniqueUsers,
              avgResponseTime: `${analytics.avgResponseTimeMs}ms`,
              avgConfidence: analytics.avgConfidence,
              helpfulnessRate: analytics.helpfulnessRate,
            } : null,
            cache: cacheStats,
            providers: providerHealth,
            usage: usageStats,
          },
        });
      }

      case 'queries': {
        const analytics = await getQueryAnalytics(days);

        if (!analytics) {
          return NextResponse.json({
            success: false,
            error: 'Analytics not available',
          }, { status: 503 });
        }

        return NextResponse.json({
          success: true,
          data: analytics,
        });
      }

      case 'trending': {
        const trending = await getTrendingTopics();

        if (!trending) {
          return NextResponse.json({
            success: false,
            error: 'Trending data not available',
          }, { status: 503 });
        }

        return NextResponse.json({
          success: true,
          data: trending,
        });
      }

      case 'user': {
        if (!userId) {
          return NextResponse.json({
            success: false,
            error: 'userId parameter required',
          }, { status: 400 });
        }

        const insights = await getUserInsights(userId);

        if (!insights) {
          return NextResponse.json({
            success: false,
            error: 'User insights not available',
          }, { status: 404 });
        }

        return NextResponse.json({
          success: true,
          data: insights,
        });
      }

      case 'health': {
        const [cacheStats, providerHealth] = await Promise.all([
          getCacheStats(),
          getProviderHealth(),
        ]);

        return NextResponse.json({
          success: true,
          data: {
            cache: cacheStats,
            providers: providerHealth,
            timestamp: new Date().toISOString(),
          },
        });
      }

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid analytics type. Use: overview, queries, trending, user, health',
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch analytics',
    }, { status: 500 });
  }
}
