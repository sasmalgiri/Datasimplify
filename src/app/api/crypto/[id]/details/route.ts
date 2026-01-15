/**
 * Coin Details API Route
 *
 * Returns detailed coin info including developer and social stats from CoinGecko
 * Data is for display only - not redistributable
 *
 * COMPLIANCE: This route is protected against external API access.
 * CoinGecko data cannot be redistributed without a Data Redistribution License.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCoinDetailedInfo } from '@/lib/coingecko/client';
import { enforceDisplayOnly } from '@/lib/apiSecurity';

// Cache data for 10 minutes
const detailsCache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Enforce display-only access - block external API scraping
  const blocked = enforceDisplayOnly(request, '/api/crypto/[id]/details');
  if (blocked) return blocked;

  const { id } = await params;

  try {
    // Check cache first
    const cached = detailsCache.get(id);
    const now = Date.now();
    if (cached && now - cached.timestamp < CACHE_TTL) {
      return NextResponse.json({
        success: true,
        data: cached.data,
        cached: true,
        source: 'coingecko',
        attribution: 'Data provided by CoinGecko',
      });
    }

    // Fetch from CoinGecko
    const result = await getCoinDetailedInfo(id);

    if (!result.success || !result.data) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to fetch coin details',
        },
        { status: 500 }
      );
    }

    const coinData = result.data;

    // Extract relevant data
    const details = {
      id: coinData.id,
      symbol: coinData.symbol,
      name: coinData.name,
      description: coinData.description?.en || '',
      image: coinData.image?.large || coinData.image?.small || '',
      categories: coinData.categories || [],
      genesis_date: coinData.genesis_date,
      links: {
        homepage: coinData.links?.homepage?.filter(Boolean) || [],
        twitter: coinData.links?.twitter_screen_name
          ? `https://twitter.com/${coinData.links.twitter_screen_name}`
          : null,
        reddit: coinData.links?.subreddit_url || null,
        telegram: coinData.links?.telegram_channel_identifier
          ? `https://t.me/${coinData.links.telegram_channel_identifier}`
          : null,
        github: coinData.links?.repos_url?.github?.filter(Boolean) || [],
        blockchain_explorers: coinData.links?.blockchain_site?.filter(Boolean) || [],
      },
      developer_data: coinData.developer_data
        ? {
            forks: coinData.developer_data.forks || 0,
            stars: coinData.developer_data.stars || 0,
            subscribers: coinData.developer_data.subscribers || 0,
            total_issues: coinData.developer_data.total_issues || 0,
            closed_issues: coinData.developer_data.closed_issues || 0,
            pull_requests_merged: coinData.developer_data.pull_requests_merged || 0,
            pull_request_contributors: coinData.developer_data.pull_request_contributors || 0,
            commit_count_4_weeks: coinData.developer_data.commit_count_4_weeks || 0,
            code_additions_4_weeks:
              coinData.developer_data.code_additions_deletions_4_weeks?.additions || 0,
            code_deletions_4_weeks:
              coinData.developer_data.code_additions_deletions_4_weeks?.deletions || 0,
            commit_activity: coinData.developer_data.last_4_weeks_commit_activity_series || [],
          }
        : null,
      community_data: coinData.community_data
        ? {
            twitter_followers: coinData.community_data.twitter_followers || 0,
            reddit_subscribers: coinData.community_data.reddit_subscribers || 0,
            reddit_active_accounts: coinData.community_data.reddit_accounts_active_48h || 0,
            reddit_avg_posts_48h: coinData.community_data.reddit_average_posts_48h || 0,
            reddit_avg_comments_48h: coinData.community_data.reddit_average_comments_48h || 0,
            telegram_users: coinData.community_data.telegram_channel_user_count || 0,
            facebook_likes: coinData.community_data.facebook_likes || 0,
          }
        : null,
      sentiment: {
        votes_up_percentage: coinData.sentiment_votes_up_percentage || 0,
        votes_down_percentage: coinData.sentiment_votes_down_percentage || 0,
      },
      watchlist_users: coinData.watchlist_portfolio_users || 0,
      last_updated: coinData.last_updated,
    };

    // Update cache
    detailsCache.set(id, { data: details, timestamp: now });

    return NextResponse.json({
      success: true,
      data: details,
      cached: false,
      source: 'coingecko',
      attribution: 'Data provided by CoinGecko',
    });
  } catch (error) {
    console.error('[Coin Details API] Error:', error);

    // Return cached data if available
    const cached = detailsCache.get(id);
    if (cached) {
      return NextResponse.json({
        success: true,
        data: cached.data,
        cached: true,
        stale: true,
        source: 'coingecko',
        attribution: 'Data provided by CoinGecko',
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch coin details',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
