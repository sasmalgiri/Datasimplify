'use client';

import { Twitter, Users, MessageCircle, Send, ThumbsUp, Eye, ExternalLink } from 'lucide-react';

interface CommunityData {
  twitter_followers: number;
  reddit_subscribers: number;
  reddit_active_accounts: number;
  reddit_avg_posts_48h: number;
  reddit_avg_comments_48h: number;
  telegram_users: number;
  facebook_likes: number;
}

interface SentimentData {
  votes_up_percentage: number;
  votes_down_percentage: number;
}

interface SocialStatsProps {
  data: CommunityData | null;
  sentiment?: SentimentData | null;
  watchlistUsers?: number;
  links?: {
    twitter?: string | null;
    reddit?: string | null;
    telegram?: string | null;
  };
}

export function SocialStats({ data, sentiment, watchlistUsers, links }: SocialStatsProps) {
  if (!data) {
    return null;
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const sentimentPositive = sentiment?.votes_up_percentage || 50;
  const sentimentPositiveClamped = Math.max(0, Math.min(sentimentPositive, 100));

  return (
    <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-5">
      <h3 className="text-white font-semibold flex items-center gap-2 mb-4">
        <Users className="w-5 h-5 text-cyan-400" />
        Community & Social
      </h3>

      {/* Main Social Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Twitter */}
        <div className="bg-gray-900/50 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-1">
              <Twitter className="w-3.5 h-3.5 text-blue-400" />
              Twitter
            </div>
            {links?.twitter && (
              <a
                href={links.twitter}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open Twitter profile"
                title="Open Twitter profile"
                className="text-gray-500 hover:text-blue-400 transition"
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
          <div className="text-lg font-semibold text-white">
            {formatNumber(data.twitter_followers)}
          </div>
          <div className="text-xs text-gray-500">followers</div>
        </div>

        {/* Reddit */}
        <div className="bg-gray-900/50 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-1">
              <MessageCircle className="w-3.5 h-3.5 text-orange-400" />
              Reddit
            </div>
            {links?.reddit && (
              <a
                href={links.reddit}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open Reddit community"
                title="Open Reddit community"
                className="text-gray-500 hover:text-orange-400 transition"
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
          <div className="text-lg font-semibold text-white">
            {formatNumber(data.reddit_subscribers)}
          </div>
          <div className="text-xs text-gray-500">subscribers</div>
        </div>

        {/* Telegram */}
        <div className="bg-gray-900/50 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-1">
              <Send className="w-3.5 h-3.5 text-blue-300" />
              Telegram
            </div>
            {links?.telegram && (
              <a
                href={links.telegram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open Telegram channel"
                title="Open Telegram channel"
                className="text-gray-500 hover:text-blue-300 transition"
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
          <div className="text-lg font-semibold text-white">
            {formatNumber(data.telegram_users)}
          </div>
          <div className="text-xs text-gray-500">members</div>
        </div>

        {/* Watchlist */}
        {watchlistUsers !== undefined && watchlistUsers > 0 && (
          <div className="bg-gray-900/50 rounded-lg p-3">
            <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-1">
              <Eye className="w-3.5 h-3.5 text-purple-400" />
              Watchlists
            </div>
            <div className="text-lg font-semibold text-white">{formatNumber(watchlistUsers)}</div>
            <div className="text-xs text-gray-500">users tracking</div>
          </div>
        )}
      </div>

      {/* Reddit Activity */}
      {(data.reddit_active_accounts > 0 ||
        data.reddit_avg_posts_48h > 0 ||
        data.reddit_avg_comments_48h > 0) && (
        <div className="bg-gray-900/50 rounded-lg p-3 mb-4">
          <div className="text-gray-400 text-xs mb-2">Reddit Activity (48h)</div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-white font-medium">{formatNumber(data.reddit_active_accounts)}</div>
              <div className="text-xs text-gray-500">Active</div>
            </div>
            <div>
              <div className="text-white font-medium">{data.reddit_avg_posts_48h.toFixed(1)}</div>
              <div className="text-xs text-gray-500">Avg Posts</div>
            </div>
            <div>
              <div className="text-white font-medium">{data.reddit_avg_comments_48h.toFixed(1)}</div>
              <div className="text-xs text-gray-500">Avg Comments</div>
            </div>
          </div>
        </div>
      )}

      {/* Community Sentiment */}
      {sentiment && (
        <div className="bg-gray-900/50 rounded-lg p-3">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-400 flex items-center gap-1.5">
              <ThumbsUp className="w-3.5 h-3.5" />
              Community Sentiment
            </span>
            <span
              className={`font-medium ${
                sentimentPositive >= 50 ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              {sentimentPositive.toFixed(0)}% Bullish
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full">
            <svg
              viewBox="0 0 100 10"
              className="w-full h-2"
              preserveAspectRatio="none"
              role="img"
              aria-label="Sentiment bar"
            >
              <rect x="0" y="0" width={sentimentPositiveClamped} height="10" className="fill-emerald-500" />
              <rect
                x={sentimentPositiveClamped}
                y="0"
                width={100 - sentimentPositiveClamped}
                height="10"
                className="fill-red-500"
              />
            </svg>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span className="text-emerald-400">{sentimentPositive.toFixed(0)}% Bullish</span>
            <span className="text-red-400">{(100 - sentimentPositive).toFixed(0)}% Bearish</span>
          </div>
        </div>
      )}
    </div>
  );
}
