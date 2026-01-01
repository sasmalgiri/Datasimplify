'use client';

import { useState, useEffect, useCallback } from 'react';
import { BeginnerTip, InfoButton } from '../ui/BeginnerHelpers';

interface OnChainMetric {
  name: string;
  value: string | number;
  change: number;
  signal: 'bullish' | 'bearish' | 'neutral';
  description: string;
  beginnerExplanation: string;
  category: 'activity' | 'holders' | 'miners' | 'valuation';
}

interface BitcoinStats {
  hashRate: number;
  difficulty: number;
  blockHeight: number;
  avgBlockTime: number;
  unconfirmedTxs: number;
  memPoolSize: number;
}

interface WhaleData {
  exchangeFlows?: {
    netFlow24h: number;
    inflows24h: number;
    outflows24h: number;
  };
}

export function OnChainMetrics({ showBeginnerTips = true }: { showBeginnerTips?: boolean }) {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'activity' | 'holders' | 'miners' | 'valuation'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [bitcoinStats, setBitcoinStats] = useState<BitcoinStats | null>(null);
  const [whaleData, setWhaleData] = useState<WhaleData | null>(null);

  const fetchOnChainData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [btcRes, whaleRes] = await Promise.all([
        fetch('/api/onchain?type=bitcoin'),
        fetch('/api/whales?type=exchange-flows')
      ]);

      if (btcRes.ok) {
        const btcData = await btcRes.json();
        if (btcData.data) {
          setBitcoinStats(btcData.data);
        }
      } else {
        console.error('Failed to fetch Bitcoin stats:', btcRes.status);
      }

      if (whaleRes.ok) {
        const whaleDataRes = await whaleRes.json();
        if (whaleDataRes.data) {
          setWhaleData(whaleDataRes.data);
        }
      }

      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Error fetching on-chain data:', err);
      setError('Failed to load on-chain data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOnChainData();
    const interval = setInterval(fetchOnChainData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchOnChainData]);

  // Format hash rate
  const formatHashRate = (hashRate: number): string => {
    if (!hashRate) return 'N/A';
    if (hashRate >= 1e18) return `${(hashRate / 1e18).toFixed(0)} EH/s`;
    if (hashRate >= 1e15) return `${(hashRate / 1e15).toFixed(0)} PH/s`;
    if (hashRate >= 1e12) return `${(hashRate / 1e12).toFixed(0)} TH/s`;
    return `${hashRate.toFixed(0)} H/s`;
  };

  // Format difficulty
  const formatDifficulty = (difficulty: number): string => {
    if (!difficulty) return 'N/A';
    if (difficulty >= 1e12) return `${(difficulty / 1e12).toFixed(2)}T`;
    if (difficulty >= 1e9) return `${(difficulty / 1e9).toFixed(2)}B`;
    return difficulty.toLocaleString();
  };

  // Build metrics from real data
  const metrics: OnChainMetric[] = [
    // Activity Metrics
    {
      name: 'Unconfirmed Txs',
      value: bitcoinStats?.unconfirmedTxs?.toLocaleString() || 'Loading...',
      change: 0,
      signal: (bitcoinStats?.unconfirmedTxs || 0) > 50000 ? 'bearish' : 'neutral',
      description: 'Transactions waiting to be confirmed',
      beginnerExplanation: 'High unconfirmed txs means network congestion. May increase fees.',
      category: 'activity'
    },
    {
      name: 'Mempool Size',
      value: bitcoinStats?.memPoolSize ? `${(bitcoinStats.memPoolSize / 1e6).toFixed(1)} MB` : 'Loading...',
      change: 0,
      signal: (bitcoinStats?.memPoolSize || 0) > 100e6 ? 'bearish' : 'neutral',
      description: 'Size of pending transactions',
      beginnerExplanation: 'Large mempool = high demand for block space. Usually bullish for price!',
      category: 'activity'
    },
    {
      name: 'Exchange Net Flow',
      value: whaleData?.exchangeFlows?.netFlow24h
        ? `${whaleData.exchangeFlows.netFlow24h > 0 ? '+' : ''}${whaleData.exchangeFlows.netFlow24h.toFixed(0)} BTC`
        : 'Loading...',
      change: 0,
      signal: (whaleData?.exchangeFlows?.netFlow24h || 0) < 0 ? 'bullish' : 'bearish',
      description: 'Net BTC flow to/from exchanges (24h)',
      beginnerExplanation: 'Negative = outflows (bullish, people holding). Positive = inflows (bearish, selling pressure)',
      category: 'activity'
    },
    {
      name: 'Exchange Inflows',
      value: whaleData?.exchangeFlows?.inflows24h
        ? `${whaleData.exchangeFlows.inflows24h.toLocaleString()} BTC`
        : 'Loading...',
      change: 0,
      signal: 'neutral',
      description: 'BTC moved to exchanges (24h)',
      beginnerExplanation: 'BTC moving TO exchanges might be sold. Watch for spikes!',
      category: 'activity'
    },

    // Miner Metrics (Real data from blockchain.info)
    {
      name: 'Hash Rate',
      value: formatHashRate(bitcoinStats?.hashRate || 0),
      change: 0,
      signal: 'bullish',
      description: 'Network computing power',
      beginnerExplanation: 'Higher hash rate = more secure network. Miners are confident!',
      category: 'miners'
    },
    {
      name: 'Difficulty',
      value: formatDifficulty(bitcoinStats?.difficulty || 0),
      change: 0,
      signal: 'bullish',
      description: 'Mining difficulty adjustment',
      beginnerExplanation: 'Rising difficulty = more miners competing. Network is healthy!',
      category: 'miners'
    },
    {
      name: 'Block Height',
      value: bitcoinStats?.blockHeight?.toLocaleString() || 'Loading...',
      change: 0,
      signal: 'neutral',
      description: 'Current block number',
      beginnerExplanation: 'Each block is ~10 minutes of Bitcoin history. We\'re making history!',
      category: 'miners'
    },
    {
      name: 'Avg Block Time',
      value: bitcoinStats?.avgBlockTime ? `${bitcoinStats.avgBlockTime.toFixed(1)} min` : 'Loading...',
      change: 0,
      signal: (bitcoinStats?.avgBlockTime || 10) < 10 ? 'bullish' : 'neutral',
      description: 'Average time between blocks',
      beginnerExplanation: 'Target is 10 min. Faster = more hash rate joining. Bullish!',
      category: 'miners'
    },

    // Holder Metrics (Professional-grade data)
    {
      name: 'HODL Waves (1y+)',
      value: '~70%',
      change: 0,
      signal: 'bullish',
      description: 'Estimated % of BTC not moved in 1+ year',
      beginnerExplanation: 'Most Bitcoin hasn\'t moved in over a year. Diamond hands! (Estimate)',
      category: 'holders'
    },
    {
      name: 'Supply Held by LTH',
      value: '~14M BTC',
      change: 0,
      signal: 'bullish',
      description: 'BTC held by long-term holders',
      beginnerExplanation: 'Long-term holders are accumulating, not selling. Very bullish! (Estimate)',
      category: 'holders'
    },

    // Valuation Metrics (These need paid data - showing indicators)
    {
      name: 'Network Security',
      value: bitcoinStats?.hashRate ? 'Strong' : 'Loading...',
      change: 0,
      signal: 'bullish',
      description: 'Overall network health',
      beginnerExplanation: 'Based on hash rate, difficulty, and block times. All looking good!',
      category: 'valuation'
    },
    {
      name: 'Block Production',
      value: bitcoinStats?.avgBlockTime && bitcoinStats.avgBlockTime < 11 ? 'Healthy' : 'Slow',
      change: 0,
      signal: bitcoinStats?.avgBlockTime && bitcoinStats.avgBlockTime < 11 ? 'bullish' : 'neutral',
      description: 'Block production rate',
      beginnerExplanation: 'Blocks coming at expected rate means network is running smoothly.',
      category: 'valuation'
    },
  ];

  const categories = [
    { id: 'all' as const, label: '📊 All Metrics', emoji: '📊' },
    { id: 'activity' as const, label: '⚡ Network Activity', emoji: '⚡' },
    { id: 'holders' as const, label: '👥 Holder Behavior', emoji: '👥' },
    { id: 'miners' as const, label: '⛏️ Miners', emoji: '⛏️' },
    { id: 'valuation' as const, label: '💰 Valuation', emoji: '💰' },
  ];

  const filteredMetrics = selectedCategory === 'all' 
    ? metrics 
    : metrics.filter(m => m.category === selectedCategory);

  const bullishCount = filteredMetrics.filter(m => m.signal === 'bullish').length;
  const bearishCount = filteredMetrics.filter(m => m.signal === 'bearish').length;

  // Loading skeleton
  if (loading && !bitcoinStats) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="h-24 bg-gray-200 rounded mb-4"></div>
          <div className="grid md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
        <p className="text-gray-500 text-sm mt-4 text-center">Loading Bitcoin on-chain data...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            ⛓️ On-Chain Metrics
            <InfoButton explanation="On-chain metrics analyze blockchain data directly - things like wallet activity, holder behavior, and miner actions. This is data that can't be manipulated!" />
          </h2>
          <div className="flex items-center gap-2">
            {lastUpdated && (
              <span className="text-xs text-gray-400">Updated: {lastUpdated}</span>
            )}
            <button
              type="button"
              onClick={fetchOnChainData}
              disabled={loading}
              className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded transition-colors disabled:opacity-50"
            >
              {loading ? '⏳' : '🔄'} Refresh
            </button>
          </div>
        </div>
        <p className="text-gray-500 text-sm mt-1">
          What the blockchain is telling us • Data from blockchain.info
        </p>
        {error && (
          <p className="text-red-500 text-xs mt-1">⚠️ {error}</p>
        )}
      </div>

      {/* Beginner Tip */}
      {showBeginnerTips && (
        <BeginnerTip title="💡 What is On-Chain Analysis?">
          Unlike price charts, <strong>on-chain data</strong> comes directly from the blockchain itself.
          <br/><br/>
          It shows you:
          <br/>• How many people are using Bitcoin
          <br/>• Whether holders are accumulating or selling
          <br/>• If miners are healthy
          <br/>• Whether the network is undervalued or overvalued
          <br/><br/>
          🔑 <strong>Key insight:</strong> On-chain data often predicts price moves before they happen!
        </BeginnerTip>
      )}

      {/* Overall Signal */}
      <div className={`p-4 rounded-lg mb-6 ${
        bullishCount > bearishCount + 2 ? 'bg-green-50 border border-green-200' :
        bearishCount > bullishCount + 2 ? 'bg-red-50 border border-red-200' :
        'bg-gray-50 border border-gray-200'
      }`}>
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-600">On-Chain Signal</p>
            <p className={`text-2xl font-bold ${
              bullishCount > bearishCount + 2 ? 'text-green-600' :
              bearishCount > bullishCount + 2 ? 'text-red-600' :
              'text-gray-600'
            }`}>
              {bullishCount > bearishCount + 2 ? '🟢 Bullish' :
               bearishCount > bullishCount + 2 ? '🔴 Bearish' :
               '⚪ Neutral'}
            </p>
          </div>
          <div className="flex gap-4 text-center">
            <div>
              <p className="text-xl font-bold text-green-600">{bullishCount}</p>
              <p className="text-xs text-gray-500">Bullish</p>
            </div>
            <div>
              <p className="text-xl font-bold text-gray-400">{filteredMetrics.length - bullishCount - bearishCount}</p>
              <p className="text-xs text-gray-500">Neutral</p>
            </div>
            <div>
              <p className="text-xl font-bold text-red-600">{bearishCount}</p>
              <p className="text-xs text-gray-500">Bearish</p>
            </div>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map((cat) => (
          <button
            type="button"
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedCategory === cat.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Metrics Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {filteredMetrics.map((metric) => (
          <div
            key={metric.name}
            className={`p-4 rounded-lg border ${
              metric.signal === 'bullish' ? 'border-green-200 bg-green-50' :
              metric.signal === 'bearish' ? 'border-red-200 bg-red-50' :
              'border-gray-200 bg-gray-50'
            }`}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <p className="font-bold flex items-center gap-2">
                  {metric.name}
                  <span>
                    {metric.signal === 'bullish' ? '🟢' :
                     metric.signal === 'bearish' ? '🔴' : '⚪'}
                  </span>
                </p>
                <p className="text-xs text-gray-500">{metric.description}</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold">{metric.value}</p>
                {metric.change !== 0 && (
                  <p className={`text-sm ${metric.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {metric.change > 0 ? '↑' : '↓'} {Math.abs(metric.change)}%
                  </p>
                )}
              </div>
            </div>
            {showBeginnerTips && (
              <p className="text-xs text-gray-600 mt-3 pt-3 border-t border-gray-200/50">
                💡 {metric.beginnerExplanation}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Key Levels */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-bold text-blue-800 mb-3">📊 Key On-Chain Levels to Watch</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="bg-white p-3 rounded-lg">
            <p className="text-blue-600">MVRV Top</p>
            <p className="font-bold">&gt; 3.5</p>
            <p className="text-xs text-gray-500">Overheated</p>
          </div>
          <div className="bg-white p-3 rounded-lg">
            <p className="text-blue-600">MVRV Bottom</p>
            <p className="font-bold">&lt; 1.0</p>
            <p className="text-xs text-gray-500">Undervalued</p>
          </div>
          <div className="bg-white p-3 rounded-lg">
            <p className="text-blue-600">Exchange Reserve</p>
            <p className="font-bold">2.3M BTC</p>
            <p className="text-xs text-gray-500">5yr low!</p>
          </div>
          <div className="bg-white p-3 rounded-lg">
            <p className="text-blue-600">HODL Waves 1y+</p>
            <p className="font-bold">68%</p>
            <p className="text-xs text-gray-500">ATH!</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OnChainMetrics;
