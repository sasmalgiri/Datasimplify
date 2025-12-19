'use client';

import { useState, useEffect, useRef } from 'react';
import { BeginnerTip, InfoButton, TrafficLight } from '../ui/BeginnerHelpers';

// Sentiment bar segment using ref to set width dynamically (avoids inline style attribute)
function SentimentBarSegment({ width, className }: { width: number; className: string }) {
  const barRef = useRef<HTMLDivElement>(null);
  const safeWidth = Math.max(0, Math.min(100, width || 0));

  useEffect(() => {
    if (barRef.current) {
      barRef.current.style.width = `${safeWidth}%`;
    }
  }, [safeWidth]);

  return <div ref={barRef} className={className} />;
}

interface SocialData {
  id: string;
  symbol: string;
  name: string;
  sentiment_score: number;  // 0-100
  bullish_percent: number;
  bearish_percent: number;
  neutral_percent: number;
  social_volume: number;
  twitter_mentions: number;
  reddit_posts: number;
  youtube_videos: number;
  news_articles: number;
  influencer_mentions: number;
  trending_rank: number | null;
  galaxy_score: number;  // LunarCrush-style combined score
  change_24h: number;
}

export function SocialSentiment({ showBeginnerTips = true }: { showBeginnerTips?: boolean }) {
  const [coins, setCoins] = useState<SocialData[]>([]);
  const [selectedCoin, setSelectedCoin] = useState<SocialData | null>(null);
  const [sortBy, setSortBy] = useState<'sentiment' | 'volume' | 'trending'>('trending');

  useEffect(() => {
    // Sample data - in production would come from LunarCrush or similar API
    const sampleData: SocialData[] = [
      {
        id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin',
        sentiment_score: 72, bullish_percent: 68, bearish_percent: 18, neutral_percent: 14,
        social_volume: 245000, twitter_mentions: 145000, reddit_posts: 12000, youtube_videos: 5200, news_articles: 3500, influencer_mentions: 850,
        trending_rank: 1, galaxy_score: 78, change_24h: 5
      },
      {
        id: 'ethereum', symbol: 'ETH', name: 'Ethereum',
        sentiment_score: 68, bullish_percent: 62, bearish_percent: 22, neutral_percent: 16,
        social_volume: 185000, twitter_mentions: 98000, reddit_posts: 8500, youtube_videos: 3800, news_articles: 2800, influencer_mentions: 620,
        trending_rank: 2, galaxy_score: 72, change_24h: 3
      },
      {
        id: 'solana', symbol: 'SOL', name: 'Solana',
        sentiment_score: 81, bullish_percent: 78, bearish_percent: 12, neutral_percent: 10,
        social_volume: 125000, twitter_mentions: 72000, reddit_posts: 5200, youtube_videos: 2800, news_articles: 1500, influencer_mentions: 480,
        trending_rank: 3, galaxy_score: 85, change_24h: 15
      },
      {
        id: 'dogecoin', symbol: 'DOGE', name: 'Dogecoin',
        sentiment_score: 85, bullish_percent: 82, bearish_percent: 8, neutral_percent: 10,
        social_volume: 312000, twitter_mentions: 220000, reddit_posts: 18000, youtube_videos: 4500, news_articles: 1200, influencer_mentions: 920,
        trending_rank: 4, galaxy_score: 88, change_24h: 25
      },
      {
        id: 'xrp', symbol: 'XRP', name: 'Ripple',
        sentiment_score: 58, bullish_percent: 52, bearish_percent: 32, neutral_percent: 16,
        social_volume: 95000, twitter_mentions: 52000, reddit_posts: 4200, youtube_videos: 1800, news_articles: 2200, influencer_mentions: 280,
        trending_rank: 5, galaxy_score: 55, change_24h: -8
      },
      {
        id: 'cardano', symbol: 'ADA', name: 'Cardano',
        sentiment_score: 62, bullish_percent: 58, bearish_percent: 25, neutral_percent: 17,
        social_volume: 78000, twitter_mentions: 42000, reddit_posts: 6500, youtube_videos: 1200, news_articles: 800, influencer_mentions: 180,
        trending_rank: 8, galaxy_score: 60, change_24h: 2
      },
      {
        id: 'shiba', symbol: 'SHIB', name: 'Shiba Inu',
        sentiment_score: 79, bullish_percent: 75, bearish_percent: 15, neutral_percent: 10,
        social_volume: 145000, twitter_mentions: 95000, reddit_posts: 8200, youtube_videos: 2100, news_articles: 450, influencer_mentions: 520,
        trending_rank: 6, galaxy_score: 76, change_24h: 18
      },
      {
        id: 'pepe', symbol: 'PEPE', name: 'Pepe',
        sentiment_score: 88, bullish_percent: 85, bearish_percent: 8, neutral_percent: 7,
        social_volume: 198000, twitter_mentions: 142000, reddit_posts: 15000, youtube_videos: 3200, news_articles: 280, influencer_mentions: 680,
        trending_rank: 7, galaxy_score: 82, change_24h: 35
      },
    ];
    
    setCoins(sampleData);
    setSelectedCoin(sampleData[0]);
  }, []);

  // Sort coins
  const sortedCoins = [...coins].sort((a, b) => {
    if (sortBy === 'sentiment') return b.sentiment_score - a.sentiment_score;
    if (sortBy === 'volume') return b.social_volume - a.social_volume;
    return (a.trending_rank || 999) - (b.trending_rank || 999);
  });

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getSentimentEmoji = (score: number) => {
    if (score >= 80) return '🤑';
    if (score >= 60) return '😊';
    if (score >= 40) return '😐';
    if (score >= 20) return '😟';
    return '😨';
  };

  const getSentimentLabel = (score: number) => {
    if (score >= 80) return 'Very Bullish';
    if (score >= 60) return 'Bullish';
    if (score >= 40) return 'Neutral';
    if (score >= 20) return 'Bearish';
    return 'Very Bearish';
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          📱 Social Sentiment Analysis
          <InfoButton explanation="This tracks what people are saying about crypto on Twitter, Reddit, YouTube, and news sites. High positive sentiment often (but not always) leads to price increases." />
        </h2>
        <p className="text-gray-500 text-sm mt-1">
          See what the crowd is thinking about each coin
        </p>
      </div>

      {/* Beginner Tip */}
      {showBeginnerTips && (
        <BeginnerTip title="💡 Why Track Social Sentiment?">
          Crypto prices are heavily influenced by <strong>what people think and say</strong>.
          <br/><br/>
          • High buzz + positive sentiment = prices might rise (but watch for FOMO!)
          <br/>
          • Low buzz = fewer people interested, less price movement
          <br/>
          • Negative sentiment = people are scared, prices might drop
          <br/><br/>
          ⚠️ <strong>Warning:</strong> Don&apos;t buy just because everyone is excited - that&apos;s often the worst time!
        </BeginnerTip>
      )}

      {/* Sort Options */}
      <div className="flex gap-2 mb-4">
        {[
          { id: 'trending' as const, label: '🔥 Trending' },
          { id: 'sentiment' as const, label: '😊 Most Bullish' },
          { id: 'volume' as const, label: '📊 Most Discussed' },
        ].map((option) => (
          <button
            key={option.id}
            onClick={() => setSortBy(option.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              sortBy === option.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Two Column Layout */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Left: Coin List */}
        <div className="space-y-2">
          {sortedCoins.map((coin, index) => (
            <button
              key={coin.id}
              onClick={() => setSelectedCoin(coin)}
              className={`w-full p-4 rounded-lg border text-left transition-all ${
                selectedCoin?.id === coin.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {coin.trending_rank && (
                    <span className={`text-sm font-bold ${
                      coin.trending_rank <= 3 ? 'text-orange-500' : 'text-gray-400'
                    }`}>
                      #{coin.trending_rank}
                    </span>
                  )}
                  <div>
                    <span className="font-bold">{coin.symbol}</span>
                    <span className="text-gray-500 text-sm ml-1">{coin.name}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{getSentimentEmoji(coin.sentiment_score)}</span>
                  <div className="text-right">
                    <div className={`font-bold ${
                      coin.sentiment_score >= 60 ? 'text-green-600' : 
                      coin.sentiment_score >= 40 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {coin.sentiment_score}%
                    </div>
                    <div className={`text-xs ${coin.change_24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {coin.change_24h >= 0 ? '↑' : '↓'}{Math.abs(coin.change_24h)}%
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Mini sentiment bar */}
              <div className="flex h-2 mt-2 rounded-full overflow-hidden">
                <SentimentBarSegment width={coin.bullish_percent} className="bg-green-500" />
                <SentimentBarSegment width={coin.neutral_percent} className="bg-gray-300" />
                <SentimentBarSegment width={coin.bearish_percent} className="bg-red-500" />
              </div>
            </button>
          ))}
        </div>

        {/* Right: Selected Coin Details */}
        {selectedCoin && (
          <div className="space-y-4">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg p-6 text-white">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-bold">{selectedCoin.name}</h3>
                  <p className="text-blue-100">{selectedCoin.symbol}</p>
                </div>
                <div className="text-right">
                  <div className="text-4xl">{getSentimentEmoji(selectedCoin.sentiment_score)}</div>
                  <div className="font-bold text-xl">{selectedCoin.sentiment_score}%</div>
                  <div className="text-sm text-blue-100">{getSentimentLabel(selectedCoin.sentiment_score)}</div>
                </div>
              </div>
            </div>

            {/* Sentiment Breakdown */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold mb-3">Sentiment Breakdown</h4>
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-green-600">😊 Bullish</span>
                    <span className="font-bold">{selectedCoin.bullish_percent}%</span>
                  </div>
                  <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                    <SentimentBarSegment width={selectedCoin.bullish_percent} className="h-full bg-green-500" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">😐 Neutral</span>
                    <span className="font-bold">{selectedCoin.neutral_percent}%</span>
                  </div>
                  <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                    <SentimentBarSegment width={selectedCoin.neutral_percent} className="h-full bg-gray-400" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-red-600">😟 Bearish</span>
                    <span className="font-bold">{selectedCoin.bearish_percent}%</span>
                  </div>
                  <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                    <SentimentBarSegment width={selectedCoin.bearish_percent} className="h-full bg-red-500" />
                  </div>
                </div>
              </div>
            </div>

            {/* Social Volume */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold mb-3">Where People Are Talking</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white p-3 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-500">
                    <span>🐦</span>
                    <span className="text-sm">Twitter/X</span>
                  </div>
                  <div className="font-bold text-lg">{formatNumber(selectedCoin.twitter_mentions)}</div>
                </div>
                <div className="bg-white p-3 rounded-lg">
                  <div className="flex items-center gap-2 text-orange-500">
                    <span>📱</span>
                    <span className="text-sm">Reddit</span>
                  </div>
                  <div className="font-bold text-lg">{formatNumber(selectedCoin.reddit_posts)}</div>
                </div>
                <div className="bg-white p-3 rounded-lg">
                  <div className="flex items-center gap-2 text-red-500">
                    <span>▶️</span>
                    <span className="text-sm">YouTube</span>
                  </div>
                  <div className="font-bold text-lg">{formatNumber(selectedCoin.youtube_videos)}</div>
                </div>
                <div className="bg-white p-3 rounded-lg">
                  <div className="flex items-center gap-2 text-gray-600">
                    <span>📰</span>
                    <span className="text-sm">News</span>
                  </div>
                  <div className="font-bold text-lg">{formatNumber(selectedCoin.news_articles)}</div>
                </div>
              </div>
              
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Social Volume</span>
                  <span className="font-bold text-lg">{formatNumber(selectedCoin.social_volume)} mentions</span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-gray-600">Influencer Mentions</span>
                  <span className="font-bold">{formatNumber(selectedCoin.influencer_mentions)}</span>
                </div>
              </div>
            </div>

            {/* Galaxy Score */}
            <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-semibold">🌟 Galaxy Score</h4>
                  <p className="text-xs text-gray-500">Combined social + price performance</p>
                </div>
                <div className={`text-3xl font-bold ${
                  selectedCoin.galaxy_score >= 70 ? 'text-green-600' : 
                  selectedCoin.galaxy_score >= 50 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {selectedCoin.galaxy_score}
                </div>
              </div>
            </div>

            {/* Interpretation */}
            <div className={`p-4 rounded-lg ${
              selectedCoin.sentiment_score >= 70 ? 'bg-green-50 border border-green-200' :
              selectedCoin.sentiment_score >= 40 ? 'bg-yellow-50 border border-yellow-200' :
              'bg-red-50 border border-red-200'
            }`}>
              <h4 className="font-semibold mb-2">💡 What This Means</h4>
              {selectedCoin.sentiment_score >= 80 ? (
                <p className="text-sm text-green-800">
                  <strong>Very High Excitement!</strong> Everyone is talking positively about {selectedCoin.symbol}.
                  ⚠️ Be careful - extreme excitement often means prices are already high. 
                  Don&apos;t FOMO buy at the top!
                </p>
              ) : selectedCoin.sentiment_score >= 60 ? (
                <p className="text-sm text-green-800">
                  <strong>Positive Sentiment.</strong> People are generally bullish on {selectedCoin.symbol}.
                  This could support price growth, but always do your own research.
                </p>
              ) : selectedCoin.sentiment_score >= 40 ? (
                <p className="text-sm text-yellow-800">
                  <strong>Mixed Feelings.</strong> The crowd is uncertain about {selectedCoin.symbol}.
                  Wait for clearer signals before making decisions.
                </p>
              ) : (
                <p className="text-sm text-red-800">
                  <strong>Negative Sentiment.</strong> People are bearish on {selectedCoin.symbol}.
                  Could be a buying opportunity OR a warning sign. Research why people are negative.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SocialSentiment;
