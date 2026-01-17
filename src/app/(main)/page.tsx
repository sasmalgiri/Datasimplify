'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Treemap } from '@/components/features/Treemap';
import { FearGreedIndex } from '@/components/features/FearGreedIndex';
import { CorrelationHeatmapDemo } from '@/components/features/CorrelationHeatmap';
import { RiskDashboardDemo } from '@/components/features/RiskDashboard';
import { WhaleTracker } from '@/components/features/WhaleTracker';
import { UserLevelSelector, StatCard, BeginnerTip } from '@/components/ui/BeginnerHelpers';
import { isFeatureEnabled } from '@/lib/featureFlags';



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
        const globalRes = await fetch('/api/crypto/global');
        const globalJson = await globalRes.json();
        const globalData = globalJson?.data;
        
        setMarketData({
          total_market_cap: globalData?.total_market_cap?.usd || 0,
          total_volume_24h: globalData?.total_volume?.usd || 0,
          btc_dominance: globalData?.market_cap_percentage?.btc || 0,
          market_cap_change_24h: globalData?.market_cap_change_percentage_24h_usd || 0
        });

        // Fetch top coins
        const coinsRes = await fetch('/api/crypto?limit=100');
        const coinsJson = await coinsRes.json();
        setCoins(Array.isArray(coinsJson?.data) ? coinsJson.data : []);
      } catch (error) {
        console.error('Error fetching data:', error);
        // No placeholders: if we can't fetch real data, show Unavailable
        setMarketData(null);
        setCoins([]);
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
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Hero Section for First Time Users */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">🌟 CryptoReportKit — Crypto Research Tools</h1>
              <p className="text-blue-100 mt-1">Charts, comparisons, and CryptoSheets formula templates for live data analysis.</p>
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
                  href="/research"
                  className="bg-white/20 text-white px-6 py-2 rounded-lg font-medium hover:bg-white/30 transition-colors"
                >
                  🔎 Open Research Workspace
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
            value={marketData ? (marketData.market_cap_change_24h > 0 ? '🟢 Bullish' : '🔴 Bearish') : '-'}
            icon="📈"
            explanation="Overall market direction today. Green = prices mostly going up."
          />
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 bg-white p-2 rounded-xl border border-gray-200 shadow-sm">
          {[
            { id: 'overview', label: '🗺️ Market Map', desc: 'Visual overview' },
            { id: 'sentiment', label: '😱 Fear & Greed', desc: 'Market mood' },
            ...(isFeatureEnabled('whales')
              ? [{ id: 'whales', label: '🐋 Whales', desc: 'Big player activity' }]
              : []),
            { id: 'risk', label: '⚠️ Risk', desc: 'Safety analysis' },
            { id: 'correlation', label: '🔗 Correlation', desc: 'How coins relate' },
          ].map((tab) => (
            <button
              type="button"
              key={tab.id}
              onClick={() => setActiveSection(tab.id)}
              className={`px-4 py-3 rounded-lg font-medium transition-all ${
                activeSection === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
            <FearGreedIndex showBeginnerTips={showTips} />
          )}

          {/* Whale Tracker */}
          {isFeatureEnabled('whales') && activeSection === 'whales' && (
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

          {/* Right Side - Research Shortcuts */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-5 sticky top-20 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-3">🔎 Research Shortcuts</h3>
              <p className="text-sm text-gray-600 mb-4">
                Use these pages to explore metrics and analyze data. This is educational content, not trading advice.
              </p>
              <div className="space-y-2">
                <Link href="/research" className="block w-full text-center py-2 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 transition">
                  Open Research Workspace
                </Link>
                <Link href="/templates" className="block w-full text-center py-2 bg-white border border-gray-300 text-gray-900 rounded-lg font-bold text-sm hover:bg-gray-50 transition">
                  Excel Templates
                </Link>
                <Link href="/charts" className="block w-full text-center py-2 bg-white border border-gray-300 text-gray-900 rounded-lg font-bold text-sm hover:bg-gray-50 transition">
                  Explore Charts
                </Link>
                <Link href="/compare" className="block w-full text-center py-2 bg-white border border-gray-300 text-gray-900 rounded-lg font-bold text-sm hover:bg-gray-50 transition">
                  Compare Assets
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <Link
            href="/templates"
            className="bg-white p-6 rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all group"
          >
            <span className="text-4xl">📊</span>
            <h3 className="text-lg font-bold mt-3 text-gray-900 group-hover:text-blue-600">Excel Templates</h3>
            <p className="text-gray-600 text-sm mt-1">
              CryptoSheets formula templates for live data.
            </p>
          </Link>

          <Link
            href="/compare"
            className="bg-white p-6 rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all group"
          >
            <span className="text-4xl">⚖️</span>
            <h3 className="text-lg font-bold mt-3 text-gray-900 group-hover:text-blue-600">Compare Coins</h3>
            <p className="text-gray-600 text-sm mt-1">
              Side-by-side comparison of different cryptocurrencies.
            </p>
          </Link>

          <Link
            href="/research"
            className="bg-white p-6 rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all group"
          >
            <span className="text-4xl">🔎</span>
            <h3 className="text-lg font-bold mt-3 text-gray-900 group-hover:text-blue-600">Research Workspace</h3>
            <p className="text-gray-600 text-sm mt-1">
              Keep your research flow organized across charts, comparisons, and downloads.
            </p>
          </Link>
        </div>

        {/* Beginner CTA */}
        {userLevel === 'beginner' && (
          <div className="mt-12 bg-gradient-to-r from-green-500 to-teal-500 rounded-2xl p-8 text-white text-center">
            <h2 className="text-2xl font-bold mb-3">🎓 Ready to Learn More?</h2>
            <p className="text-green-100 mb-6 max-w-2xl mx-auto">
              Use the Academy and Glossary to understand metrics, indicators, and market structure.
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
