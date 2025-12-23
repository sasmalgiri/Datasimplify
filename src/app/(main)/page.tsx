'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Users,
  Trophy,
  Flame,
  Zap,
  Crown,
  Medal
} from 'lucide-react';

// Sentiment bar component using ref to avoid inline style warnings
function SentimentBar({ percentage, colorClass }: { percentage: number; colorClass: string }) {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (barRef.current) {
      barRef.current.style.width = `${Math.max(0, Math.min(100, percentage))}%`;
    }
  }, [percentage]);

  return <div ref={barRef} className={`h-full ${colorClass}`} />;
}
import { Treemap } from '@/components/features/Treemap';
import { FearGreedIndex } from '@/components/features/FearGreedIndex';
import { CorrelationHeatmapDemo } from '@/components/features/CorrelationHeatmap';
import { RiskDashboardDemo } from '@/components/features/RiskDashboard';
import { WhaleTracker } from '@/components/features/WhaleTracker';
import { UserLevelSelector, StatCard, BeginnerTip } from '@/components/ui/BeginnerHelpers';

interface MarketData {
  total_market_cap: number;
  total_volume_24h: number;
  btc_dominance: number;
  market_cap_change_24h: number;
}

interface CoinData {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  market_cap: number;
  price_change_percentage_24h: number;
}

export default function HomePage() {
  const [userLevel, setUserLevel] = useState<'beginner' | 'intermediate' | 'pro'>('beginner');
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [coins, setCoins] = useState<CoinData[]>([]);
  const [, setLoading] = useState(true); // Loading state set but UI handles loading inline
  const [activeSection, setActiveSection] = useState('overview');

  // Fetch market data
  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch global market data
        const globalRes = await fetch('https://api.coingecko.com/api/v3/global');
        const globalData = await globalRes.json();
        
        setMarketData({
          total_market_cap: globalData.data.total_market_cap.usd,
          total_volume_24h: globalData.data.total_volume.usd,
          btc_dominance: globalData.data.market_cap_percentage.btc,
          market_cap_change_24h: globalData.data.market_cap_change_percentage_24h_usd
        });

        // Fetch top coins
        const coinsRes = await fetch(
          'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1'
        );
        const coinsData = await coinsRes.json();
        setCoins(coinsData);
      } catch (error) {
        console.error('Error fetching data:', error);
        // Use mock data
        setMarketData({
          total_market_cap: 3.2e12,
          total_volume_24h: 150e9,
          btc_dominance: 52.3,
          market_cap_change_24h: 2.4
        });
      }
      setLoading(false);
    }

    fetchData();
  }, []);

  const formatNumber = (num: number) => {
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    return `$${num.toFixed(2)}`;
  };

  const showTips = userLevel === 'beginner';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section for First Time Users */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">🌟 DataSimplify</h1>
              <p className="text-blue-100 mt-1">Crypto investing made simple. No experience needed.</p>
            </div>
            <UserLevelSelector currentLevel={userLevel} onLevelChange={setUserLevel} />
          </div>

          {/* First Time User Welcome */}
          {userLevel === 'beginner' && (
            <div className="mt-6 bg-white/10 backdrop-blur rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-3">👋 New to Crypto?</h2>
              <p className="text-blue-100 mb-4">
                Don&apos;t worry! We&apos;ll explain everything as you go. Look for the 💡 tips throughout the app.
              </p>
              <div className="flex gap-3">
                <Link 
                  href="/learn"
                  className="bg-white text-blue-600 px-6 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors"
                >
                  📚 Start Learning
                </Link>
                <Link 
                  href="/quiz"
                  className="bg-white/20 text-white px-6 py-2 rounded-lg font-medium hover:bg-white/30 transition-colors"
                >
                  🎯 Take Quiz
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Market Overview Cards */}
        {showTips && (
          <BeginnerTip title="💡 What Am I Looking At?">
            This is the <strong>Market Overview</strong>. It shows the big picture of the entire crypto market. 
            Think of &quot;Total Market Cap&quot; as the total value of ALL cryptocurrencies combined - like measuring 
            the size of the entire crypto economy.
          </BeginnerTip>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Total Market Cap"
            value={marketData ? formatNumber(marketData.total_market_cap) : '-'}
            change={marketData?.market_cap_change_24h}
            changeLabel="24h"
            icon="🌍"
            explanation="The total value of all cryptocurrencies combined. Like the GDP of the crypto world."
          />
          <StatCard
            title="24h Volume"
            value={marketData ? formatNumber(marketData.total_volume_24h) : '-'}
            icon="📊"
            explanation="How much crypto was traded in the last 24 hours. Higher volume = more activity."
          />
          <StatCard
            title="BTC Dominance"
            value={marketData ? `${marketData.btc_dominance.toFixed(1)}%` : '-'}
            icon="₿"
            explanation="What percentage of the total market is Bitcoin. Higher = Bitcoin is leading."
          />
          <StatCard
            title="Market Status"
            value={marketData && marketData.market_cap_change_24h > 0 ? '🟢 Bullish' : '🔴 Bearish'}
            icon="📈"
            explanation="Overall market direction today. Green = prices mostly going up."
          />
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 bg-white p-2 rounded-xl shadow-sm">
          {[
            { id: 'overview', label: '🗺️ Market Map', desc: 'Visual overview' },
            { id: 'sentiment', label: '😱 Fear & Greed', desc: 'Market mood' },
            { id: 'whales', label: '🐋 Whales', desc: 'Big player activity' },
            { id: 'risk', label: '⚠️ Risk', desc: 'Safety analysis' },
            { id: 'correlation', label: '🔗 Correlation', desc: 'How coins relate' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id)}
              className={`px-4 py-3 rounded-lg font-medium transition-all ${
                activeSection === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span className="block">{tab.label}</span>
              {userLevel === 'beginner' && (
                <span className="text-xs opacity-75 block">{tab.desc}</span>
              )}
            </button>
          ))}
        </div>

        {/* Content Sections - Side by Side Layout */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Side - Main Content (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Market Map / Treemap */}
            {activeSection === 'overview' && (
              <Treemap coins={coins} showBeginnerTips={showTips} />
            )}

          {/* Fear & Greed Index */}
          {activeSection === 'sentiment' && (
            <div className="grid md:grid-cols-2 gap-6">
              <FearGreedIndex showBeginnerTips={showTips} />
              
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-bold mb-4">📱 Social Sentiment</h3>
                
                {showTips && (
                  <BeginnerTip>
                    Social sentiment shows what people are saying about crypto on Twitter, Reddit, and other platforms.
                    High positive sentiment can mean prices might rise!
                  </BeginnerTip>
                )}

                <div className="space-y-4">
                  {[
                    { coin: 'BTC', sentiment: 72, trend: 'up', mentions: '45K' },
                    { coin: 'ETH', sentiment: 68, trend: 'stable', mentions: '32K' },
                    { coin: 'SOL', sentiment: 81, trend: 'up', mentions: '28K' },
                    { coin: 'DOGE', sentiment: 85, trend: 'up', mentions: '52K' },
                  ].map((item) => (
                    <div key={item.coin} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="font-bold">{item.coin}</span>
                        <span className="text-sm text-gray-500">{item.mentions} mentions</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <SentimentBar
                            percentage={item.sentiment}
                            colorClass={item.sentiment >= 70 ? 'bg-green-500' : item.sentiment >= 50 ? 'bg-yellow-500' : 'bg-red-500'}
                          />
                        </div>
                        <span className={`text-sm font-medium ${item.sentiment >= 70 ? 'text-green-600' : 'text-gray-600'}`}>
                          {item.sentiment}% 😊
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <Link 
                  href="/social"
                  className="block text-center text-blue-600 hover:text-blue-800 font-medium mt-4"
                >
                  View Full Social Dashboard →
                </Link>
              </div>
            </div>
          )}

          {/* Whale Tracker */}
          {activeSection === 'whales' && (
            <WhaleTracker showBeginnerTips={showTips} />
          )}

          {/* Risk Dashboard */}
          {activeSection === 'risk' && (
            <RiskDashboardDemo showBeginnerTips={showTips} />
          )}

          {/* Correlation Heatmap */}
          {activeSection === 'correlation' && (
            <CorrelationHeatmapDemo showBeginnerTips={showTips} />
          )}
          </div>

          {/* Right Side - AI Community Sidebar */}
          <div className="space-y-6">
            {/* Leaderboard Preview */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 sticky top-20">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                Top Predictors
              </h3>
              <div className="space-y-3">
                {[
                  { rank: 1, user: 'CryptoKing', emoji: '👑', points: 15420, accuracy: 82 },
                  { rank: 2, user: 'MoonShot', emoji: '🚀', points: 12850, accuracy: 79 },
                  { rank: 3, user: 'DiamondHands', emoji: '💎', points: 11200, accuracy: 76 },
                  { rank: 4, user: 'CryptoWizard', emoji: '🧙', points: 9840, accuracy: 78 },
                  { rank: 5, user: 'WhaleHunter', emoji: '🐋', points: 8720, accuracy: 71 },
                ].map((user) => (
                  <div key={user.rank} className={`flex items-center gap-3 p-2 rounded-lg ${
                    user.rank <= 3 ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200' : 'bg-gray-50'
                  }`}>
                    <div className="w-6 flex justify-center text-sm">
                      {user.rank === 1 ? <Crown className="w-4 h-4 text-yellow-500" /> :
                       user.rank === 2 ? <Medal className="w-4 h-4 text-gray-400" /> :
                       user.rank === 3 ? <Medal className="w-4 h-4 text-orange-400" /> :
                       <span className="text-gray-500 font-mono text-xs">#{user.rank}</span>}
                    </div>
                    <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center text-sm">
                      {user.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate">{user.user}</p>
                      <p className="text-xs text-gray-500">{user.accuracy}% acc</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-purple-600 font-bold text-sm">
                        <Zap className="w-3 h-3" />
                        {user.points.toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Link
                href="/community?tab=leaderboard"
                className="block text-center text-purple-600 hover:text-purple-800 font-medium mt-4 text-sm"
              >
                View Full Leaderboard →
              </Link>
            </div>

            {/* Recent Predictions Mini */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-500" />
                Hot Predictions
              </h3>
              <div className="space-y-3">
                {[
                  { user: 'CryptoWizard', emoji: '🧙', coin: 'BTC', prediction: 'BULLISH', target: '$105K' },
                  { user: 'WhaleHunter', emoji: '🐋', coin: 'ETH', prediction: 'BULLISH', target: '$4.2K' },
                  { user: 'SolanaFan', emoji: '☀️', coin: 'SOL', prediction: 'BEARISH', target: '$180' },
                ].map((pred, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                    <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center text-sm">
                      {pred.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate">{pred.user}</p>
                      <div className="flex items-center gap-1">
                        <span className={`text-xs font-medium ${
                          pred.prediction === 'BULLISH' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {pred.prediction === 'BULLISH' ? '↑' : '↓'} {pred.coin}
                        </span>
                        <span className="text-xs text-gray-500">→ {pred.target}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Link
                href="/community"
                className="block text-center text-purple-600 hover:text-purple-800 font-medium mt-4 text-sm"
              >
                View All Predictions →
              </Link>
            </div>

            {/* Community CTA Mini */}
            <div className="bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl p-5 text-white">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold">AI Community</h3>
                  <p className="text-purple-200 text-xs">Join 2,341 traders</p>
                </div>
              </div>
              <Link
                href="/community"
                className="block w-full text-center py-2 bg-white text-purple-600 rounded-lg font-bold text-sm hover:bg-purple-50 transition"
              >
                Start Predicting
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <Link
            href="/download"
            className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow group"
          >
            <span className="text-4xl">📥</span>
            <h3 className="text-lg font-bold mt-3 group-hover:text-blue-600">Download Data</h3>
            <p className="text-gray-500 text-sm mt-1">
              Export crypto data to Excel, CSV, or PDF with one click.
            </p>
          </Link>

          <Link
            href="/compare"
            className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow group"
          >
            <span className="text-4xl">⚖️</span>
            <h3 className="text-lg font-bold mt-3 group-hover:text-blue-600">Compare Coins</h3>
            <p className="text-gray-500 text-sm mt-1">
              Side-by-side comparison of different cryptocurrencies.
            </p>
          </Link>

          <Link
            href="/chat"
            className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow group"
          >
            <span className="text-4xl">🤖</span>
            <h3 className="text-lg font-bold mt-3 group-hover:text-blue-600">Ask AI</h3>
            <p className="text-gray-500 text-sm mt-1">
              Get instant answers about crypto in plain English.
            </p>
          </Link>
        </div>

        {/* Beginner CTA */}
        {userLevel === 'beginner' && (
          <div className="mt-12 bg-gradient-to-r from-green-500 to-teal-500 rounded-2xl p-8 text-white text-center">
            <h2 className="text-2xl font-bold mb-3">🎓 Ready to Learn More?</h2>
            <p className="text-green-100 mb-6 max-w-2xl mx-auto">
              We have a complete Crypto Academy to help you understand everything from the basics 
              to advanced trading strategies. It&apos;s free and takes just 30 minutes!
            </p>
            <Link 
              href="/learn"
              className="inline-block bg-white text-green-600 px-8 py-3 rounded-lg font-bold hover:bg-green-50 transition-colors"
            >
              Start Free Course →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
