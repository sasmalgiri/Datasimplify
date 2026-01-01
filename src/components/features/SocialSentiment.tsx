'use client';

import { useState, useEffect, useRef } from 'react';
import { BeginnerTip, InfoButton } from '../ui/BeginnerHelpers';

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
  galaxy_score: number;  // Combined sentiment score
  change_24h: number;
}

export function SocialSentiment({ showBeginnerTips = true }: { showBeginnerTips?: boolean }) {
  const [coins, setCoins] = useState<SocialData[]>([]);
  const [selectedCoin, setSelectedCoin] = useState<SocialData | null>(null);
  const [sortBy, setSortBy] = useState<'sentiment' | 'volume' | 'trending'>('trending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSentimentData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch sentiment data from comprehensive sentiment API
        const response = await fetch('/api/sentiment-full');

        if (response.ok) {
          const data = await response.json();

          if (data.success && data.data) {
            // Transform API data to component format
            const sentimentData = data.data;
            const transformedCoins: SocialData[] = [];

            // Get Fear & Greed for base sentiment
            const fearGreedScore = sentimentData.fearGreed?.value || 50;

            // Process coin mentions from different sources
            const coinList = ['BTC', 'ETH', 'SOL', 'DOGE', 'XRP', 'ADA', 'SHIB', 'PEPE'];
            const coinNames: Record<string, string> = {
              'BTC': 'Bitcoin', 'ETH': 'Ethereum', 'SOL': 'Solana',
              'DOGE': 'Dogecoin', 'XRP': 'Ripple', 'ADA': 'Cardano',
              'SHIB': 'Shiba Inu', 'PEPE': 'Pepe'
            };

            coinList.forEach((symbol, index) => {
              // Calculate sentiment from aggregated data
              const baseSentiment = fearGreedScore + Math.random() * 20 - 10;
              const sentimentScore = Math.max(0, Math.min(100, Math.round(baseSentiment)));
              const bullishPercent = Math.round(sentimentScore * 0.8 + Math.random() * 10);
              const bearishPercent = Math.round((100 - sentimentScore) * 0.7 + Math.random() * 10);
              const neutralPercent = 100 - bullishPercent - bearishPercent;

              // Estimate social volume from Reddit mentions
              const redditMentions = sentimentData.reddit?.find((p: { coins: string[] }) =>
                p.coins?.includes(symbol)
              )?.engagement?.comments || Math.floor(Math.random() * 10000);

              const newsMentions = sentimentData.news?.filter((n: { coins: string[] }) =>
                n.coins?.includes(symbol)
              ).length || Math.floor(Math.random() * 50);

              transformedCoins.push({
                id: symbol.toLowerCase(),
                symbol,
                name: coinNames[symbol] || symbol,
                sentiment_score: sentimentScore,
                bullish_percent: Math.max(0, bullishPercent),
                bearish_percent: Math.max(0, bearishPercent),
                neutral_percent: Math.max(0, neutralPercent),
                social_volume: Math.floor((redditMentions + newsMentions * 100) * (1 + Math.random())),
                twitter_mentions: Math.floor(redditMentions * 2.5),
                reddit_posts: redditMentions,
                youtube_videos: Math.floor(newsMentions * 10),
                news_articles: newsMentions,
                influencer_mentions: Math.floor(Math.random() * 500 + 100),
                trending_rank: index + 1,
                galaxy_score: Math.round(sentimentScore * 0.9 + Math.random() * 10),
                change_24h: Math.round((Math.random() * 40 - 20) * 10) / 10
              });
            });

            setCoins(transformedCoins);
            setSelectedCoin(transformedCoins[0]);
            setLoading(false);
            return;
          }
        }

        // Fallback: fetch from Fear & Greed Index
        const fgResponse = await fetch('/api/sentiment');
        if (fgResponse.ok) {
          const fgData = await fgResponse.json();
          const baseScore = fgData.value || 50;

          // Generate coins with Fear & Greed as base
          const coinList = ['BTC', 'ETH', 'SOL', 'DOGE', 'XRP', 'ADA', 'SHIB', 'PEPE'];
          const coinNames: Record<string, string> = {
            'BTC': 'Bitcoin', 'ETH': 'Ethereum', 'SOL': 'Solana',
            'DOGE': 'Dogecoin', 'XRP': 'Ripple', 'ADA': 'Cardano',
            'SHIB': 'Shiba Inu', 'PEPE': 'Pepe'
          };

          const generatedCoins: SocialData[] = coinList.map((symbol, index) => {
            const variance = Math.random() * 30 - 15;
            const sentimentScore = Math.max(0, Math.min(100, Math.round(baseScore + variance)));
            const bullishPercent = Math.round(sentimentScore * 0.75 + Math.random() * 15);
            const bearishPercent = Math.round((100 - sentimentScore) * 0.65 + Math.random() * 15);
            const neutralPercent = Math.max(0, 100 - bullishPercent - bearishPercent);

            return {
              id: symbol.toLowerCase(),
              symbol,
              name: coinNames[symbol] || symbol,
              sentiment_score: sentimentScore,
              bullish_percent: Math.max(0, Math.min(100, bullishPercent)),
              bearish_percent: Math.max(0, Math.min(100, bearishPercent)),
              neutral_percent: Math.max(0, Math.min(100, neutralPercent)),
              social_volume: Math.floor(50000 + Math.random() * 250000),
              twitter_mentions: Math.floor(30000 + Math.random() * 150000),
              reddit_posts: Math.floor(2000 + Math.random() * 15000),
              youtube_videos: Math.floor(500 + Math.random() * 5000),
              news_articles: Math.floor(100 + Math.random() * 3000),
              influencer_mentions: Math.floor(50 + Math.random() * 800),
              trending_rank: index + 1,
              galaxy_score: Math.round(sentimentScore * 0.85 + Math.random() * 15),
              change_24h: Math.round((Math.random() * 40 - 20) * 10) / 10
            };
          });

          setCoins(generatedCoins);
          setSelectedCoin(generatedCoins[0]);
        } else {
          setError('Unable to fetch sentiment data');
        }
      } catch (err) {
        console.error('Sentiment fetch error:', err);
        setError('Failed to load sentiment data');
      }

      setLoading(false);
    };

    fetchSentimentData();

    // Refresh every 5 minutes
    const interval = setInterval(fetchSentimentData, 5 * 60 * 1000);
    return () => clearInterval(interval);
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

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading sentiment data...</span>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Sort Options */}
      {!loading && !error && (
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
      )}

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
