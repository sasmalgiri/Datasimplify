'use client';

import { useState } from 'react';
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

export function OnChainMetrics({ showBeginnerTips = true }: { showBeginnerTips?: boolean }) {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'activity' | 'holders' | 'miners' | 'valuation'>('all');

  const metrics: OnChainMetric[] = [
    // Activity Metrics
    {
      name: 'Active Addresses',
      value: '1.2M',
      change: 8.5,
      signal: 'bullish',
      description: 'Number of unique addresses active in last 24h',
      beginnerExplanation: 'More active addresses = more people using Bitcoin. Growing usage is bullish!',
      category: 'activity'
    },
    {
      name: 'Transaction Count',
      value: '485,000',
      change: 12.3,
      signal: 'bullish',
      description: 'Number of transactions in last 24h',
      beginnerExplanation: 'High transaction count = network is being used heavily. Good sign!',
      category: 'activity'
    },
    {
      name: 'Exchange Inflows',
      value: '12,450 BTC',
      change: -15.2,
      signal: 'bullish',
      description: 'BTC moved to exchanges (potential sell pressure)',
      beginnerExplanation: 'LESS inflows = people aren\'t moving BTC to sell. Bullish!',
      category: 'activity'
    },
    {
      name: 'Exchange Outflows',
      value: '15,230 BTC',
      change: 22.5,
      signal: 'bullish',
      description: 'BTC withdrawn from exchanges (long-term holding)',
      beginnerExplanation: 'MORE outflows = people are taking BTC to hold long-term. Very bullish!',
      category: 'activity'
    },
    
    // Holder Metrics
    {
      name: 'HODL Waves (1y+)',
      value: '68%',
      change: 2.1,
      signal: 'bullish',
      description: 'Percentage of BTC not moved in 1+ year',
      beginnerExplanation: '68% of all Bitcoin hasn\'t moved in over a year! Diamond hands!',
      category: 'holders'
    },
    {
      name: 'Addresses with 1+ BTC',
      value: '1.02M',
      change: 1.8,
      signal: 'bullish',
      description: 'Number of "wholecoiners"',
      beginnerExplanation: 'Growing number of addresses with at least 1 full Bitcoin. Accumulation!',
      category: 'holders'
    },
    {
      name: 'Supply in Profit',
      value: '85%',
      change: 5.2,
      signal: 'neutral',
      description: 'Percentage of BTC supply currently in profit',
      beginnerExplanation: '85% of Bitcoin is "in the money". High profit could mean selling pressure.',
      category: 'holders'
    },
    {
      name: 'Long-Term Holder Supply',
      value: '14.2M BTC',
      change: 0.8,
      signal: 'bullish',
      description: 'BTC held by long-term holders (155+ days)',
      beginnerExplanation: 'Long-term holders are accumulating, not selling. Very bullish!',
      category: 'holders'
    },

    // Miner Metrics
    {
      name: 'Hash Rate',
      value: '650 EH/s',
      change: 5.5,
      signal: 'bullish',
      description: 'Network computing power',
      beginnerExplanation: 'Hash rate at all-time high! Network is more secure than ever.',
      category: 'miners'
    },
    {
      name: 'Miner Revenue',
      value: '$52M/day',
      change: 8.2,
      signal: 'bullish',
      description: 'Daily revenue for all miners',
      beginnerExplanation: 'Miners are profitable and happy. Network stays secure!',
      category: 'miners'
    },
    {
      name: 'Difficulty Ribbon',
      value: 'Expanding',
      change: 0,
      signal: 'bullish',
      description: 'Relationship between difficulty moving averages',
      beginnerExplanation: 'Expanding ribbon = miners are healthy, good for price.',
      category: 'miners'
    },
    {
      name: 'Miner Selling',
      value: '450 BTC/day',
      change: -12.5,
      signal: 'bullish',
      description: 'Amount miners are selling daily',
      beginnerExplanation: 'Miners selling less than usual. They expect higher prices!',
      category: 'miners'
    },

    // Valuation Metrics
    {
      name: 'MVRV Ratio',
      value: 2.8,
      change: 0.3,
      signal: 'neutral',
      description: 'Market Value to Realized Value',
      beginnerExplanation: 'MVRV at 2.8 is elevated but not extreme. Watch for >3.5 (overheated) or <1 (undervalued).',
      category: 'valuation'
    },
    {
      name: 'SOPR',
      value: 1.05,
      change: 0.02,
      signal: 'bullish',
      description: 'Spent Output Profit Ratio',
      beginnerExplanation: 'SOPR > 1 means people selling at profit. Healthy bull market!',
      category: 'valuation'
    },
    {
      name: 'NVT Ratio',
      value: 45,
      change: -5.2,
      signal: 'bullish',
      description: 'Network Value to Transactions',
      beginnerExplanation: 'NVT dropping = network value justified by usage. Good sign!',
      category: 'valuation'
    },
    {
      name: 'Puell Multiple',
      value: 1.2,
      change: 0.15,
      signal: 'neutral',
      description: 'Miner revenue vs 365-day average',
      beginnerExplanation: 'Puell at 1.2 is healthy. Watch for >4 (top signal) or <0.5 (bottom signal).',
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

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          ⛓️ On-Chain Metrics
          <InfoButton explanation="On-chain metrics analyze blockchain data directly - things like wallet activity, holder behavior, and miner actions. This is data that can't be manipulated!" />
        </h2>
        <p className="text-gray-500 text-sm mt-1">
          What the blockchain is telling us
        </p>
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
