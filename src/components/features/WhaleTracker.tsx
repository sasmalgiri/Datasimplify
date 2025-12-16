'use client';

import { useState, useEffect } from 'react';
import { BeginnerTip, InfoButton, TrafficLight } from '../ui/BeginnerHelpers';

interface WhaleTransaction {
  id: string;
  timestamp: Date;
  type: 'buy' | 'sell' | 'transfer';
  coin: string;
  amount: number;
  value_usd: number;
  from_label?: string;
  to_label?: string;
  signal: 'bullish' | 'bearish' | 'neutral';
  explanation: string;
}

interface WalletDistribution {
  category: string;
  emoji: string;
  description: string;
  percentage: number;
  btc_range: string;
  trend: 'up' | 'down' | 'stable';
}

interface WhaleTrackerProps {
  showBeginnerTips?: boolean;
}

export function WhaleTracker({ showBeginnerTips = true }: WhaleTrackerProps) {
  const [transactions, setTransactions] = useState<WhaleTransaction[]>([]);
  const [distribution, setDistribution] = useState<WalletDistribution[]>([]);
  const [activeTab, setActiveTab] = useState<'alerts' | 'distribution' | 'flows'>('alerts');

  // Sample data - in production, this would come from an API
  useEffect(() => {
    const sampleTransactions: WhaleTransaction[] = [
      {
        id: '1',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        type: 'buy',
        coin: 'BTC',
        amount: 500,
        value_usd: 48500000,
        to_label: 'Unknown Whale',
        signal: 'bullish',
        explanation: 'Large purchase suggests confidence in price increase'
      },
      {
        id: '2',
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
        type: 'transfer',
        coin: 'BTC',
        amount: 2000,
        value_usd: 194000000,
        from_label: 'Unknown Whale',
        to_label: 'Coinbase',
        signal: 'bearish',
        explanation: 'Moving to exchange might indicate intent to sell'
      },
      {
        id: '3',
        timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
        type: 'sell',
        coin: 'ETH',
        amount: 5000,
        value_usd: 19500000,
        from_label: 'Early DeFi Investor',
        signal: 'bearish',
        explanation: 'Smart money taking profits'
      },
      {
        id: '4',
        timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
        type: 'transfer',
        coin: 'BTC',
        amount: 1500,
        value_usd: 145500000,
        from_label: 'Binance',
        to_label: 'Unknown Wallet',
        signal: 'bullish',
        explanation: 'Withdrawal from exchange = likely long-term holding'
      }
    ];

    const sampleDistribution: WalletDistribution[] = [
      { category: 'Shrimps', emoji: '🦐', description: 'Small retail investors like you and me', percentage: 8, btc_range: '< 1 BTC', trend: 'up' },
      { category: 'Crabs', emoji: '🦀', description: 'Serious individual investors', percentage: 11, btc_range: '1-10 BTC', trend: 'stable' },
      { category: 'Fish', emoji: '🐟', description: 'High net worth individuals', percentage: 15, btc_range: '10-100 BTC', trend: 'stable' },
      { category: 'Sharks', emoji: '🦈', description: 'Small funds and early adopters', percentage: 18, btc_range: '100-1K BTC', trend: 'down' },
      { category: 'Whales', emoji: '🐳', description: 'Large funds, exchanges', percentage: 25, btc_range: '1K-10K BTC', trend: 'stable' },
      { category: 'Humpbacks', emoji: '🐋', description: 'Mega institutions, Satoshi', percentage: 23, btc_range: '> 10K BTC', trend: 'down' }
    ];

    setTransactions(sampleTransactions);
    setDistribution(sampleDistribution);
  }, []);

  // Format time ago
  const timeAgo = (date: Date) => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  // Format large numbers
  const formatValue = (value: number) => {
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(1)}K`;
    return `$${value.toFixed(2)}`;
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          🐋 Whale Watch
          <InfoButton explanation="Track what the big players (whales) are doing with their crypto. Large movements often signal upcoming price changes." />
        </h2>
        <p className="text-gray-500 text-sm mt-1">
          Monitor large transactions and smart money movements
        </p>
      </div>

      {/* Beginner Tip */}
      {showBeginnerTips && (
        <BeginnerTip title="💡 What Are Whales?">
          &quot;Whales&quot; are people or companies that own <strong>lots of crypto</strong>. When they buy or sell, 
          it can move prices. Watching what they do can give you hints about where the market is heading.
          <br/><br/>
          📈 <strong>Whales buying</strong> = Usually bullish (price might go up)
          <br/>
          📉 <strong>Whales selling</strong> = Usually bearish (price might go down)
        </BeginnerTip>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('alerts')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'alerts' 
              ? 'text-blue-600 border-b-2 border-blue-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          🚨 Whale Alerts
        </button>
        <button
          onClick={() => setActiveTab('distribution')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'distribution' 
              ? 'text-blue-600 border-b-2 border-blue-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          👥 Who Owns Bitcoin
        </button>
        <button
          onClick={() => setActiveTab('flows')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'flows' 
              ? 'text-blue-600 border-b-2 border-blue-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          📊 Exchange Flows
        </button>
      </div>

      {/* Whale Alerts Tab */}
      {activeTab === 'alerts' && (
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-700">Last 24 Hours</h3>
          
          {transactions.map((tx) => (
            <div 
              key={tx.id}
              className={`p-4 rounded-lg border ${
                tx.signal === 'bullish' ? 'bg-green-50 border-green-200' :
                tx.signal === 'bearish' ? 'bg-red-50 border-red-200' :
                'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">
                    {tx.type === 'buy' ? '💰' : tx.type === 'sell' ? '💸' : '🔄'}
                  </span>
                  <div>
                    <p className="font-semibold">
                      {tx.type === 'buy' ? 'Whale Bought' : tx.type === 'sell' ? 'Whale Sold' : 'Large Transfer'}
                      {' '}{tx.amount.toLocaleString()} {tx.coin}
                    </p>
                    <p className="text-sm text-gray-500">
                      Worth {formatValue(tx.value_usd)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <TrafficLight 
                    status={tx.signal === 'bullish' ? 'good' : tx.signal === 'bearish' ? 'bad' : 'neutral'}
                    label={tx.signal.toUpperCase()}
                  />
                  <p className="text-xs text-gray-500 mt-1">{timeAgo(tx.timestamp)}</p>
                </div>
              </div>
              
              {tx.from_label || tx.to_label ? (
                <div className="text-sm text-gray-600 mb-2">
                  {tx.from_label && <span>From: <strong>{tx.from_label}</strong></span>}
                  {tx.from_label && tx.to_label && <span className="mx-2">→</span>}
                  {tx.to_label && <span>To: <strong>{tx.to_label}</strong></span>}
                </div>
              ) : null}
              
              <div className="bg-white/50 rounded p-2 mt-2">
                <p className="text-sm">
                  <strong>💡 What this means:</strong> {tx.explanation}
                </p>
              </div>
            </div>
          ))}

          <div className="text-center pt-4">
            <button className="text-blue-600 hover:text-blue-800 font-medium">
              View More Alerts →
            </button>
          </div>
        </div>
      )}

      {/* Wallet Distribution Tab */}
      {activeTab === 'distribution' && (
        <div>
          <div className="mb-4">
            <h3 className="font-semibold text-gray-700">Bitcoin Wallet Distribution</h3>
            <p className="text-sm text-gray-500">
              See how Bitcoin is spread across different holder sizes
            </p>
          </div>

          <div className="space-y-4">
            {distribution.map((cat) => (
              <div key={cat.category} className="flex items-center gap-4">
                <span className="text-3xl">{cat.emoji}</span>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <div>
                      <span className="font-medium">{cat.category}</span>
                      <span className="text-gray-500 text-sm ml-2">({cat.btc_range})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{cat.percentage}%</span>
                      <span className={`text-sm ${
                        cat.trend === 'up' ? 'text-green-600' : 
                        cat.trend === 'down' ? 'text-red-600' : 'text-gray-500'
                      }`}>
                        {cat.trend === 'up' ? '↑' : cat.trend === 'down' ? '↓' : '→'}
                      </span>
                    </div>
                  </div>
                  <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        cat.category === 'Humpbacks' || cat.category === 'Whales' ? 'bg-blue-600' :
                        cat.category === 'Sharks' ? 'bg-blue-500' :
                        cat.category === 'Fish' ? 'bg-blue-400' :
                        'bg-blue-300'
                      }`}
                      style={{ width: `${cat.percentage}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{cat.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Insight Box */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">📈 Current Trend</h4>
            <p className="text-sm text-blue-900">
              <strong>Small holders (Shrimps) are increasing!</strong> This is typically bullish - 
              it means more regular people are buying Bitcoin, spreading ownership more widely.
            </p>
          </div>
        </div>
      )}

      {/* Exchange Flows Tab */}
      {activeTab === 'flows' && (
        <div>
          <div className="mb-4">
            <h3 className="font-semibold text-gray-700">Exchange Inflows & Outflows</h3>
            <p className="text-sm text-gray-500">
              Track crypto moving in and out of exchanges
            </p>
          </div>

          {/* Key Insight */}
          {showBeginnerTips && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-yellow-800">
                <strong>💡 Pro Tip:</strong><br/>
                • <strong>Inflows to exchanges</strong> = People might want to sell (bearish)<br/>
                • <strong>Outflows from exchanges</strong> = People are holding long-term (bullish)
              </p>
            </div>
          )}

          {/* Flow Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <p className="text-red-600 text-sm font-medium">Exchange Inflows (24h)</p>
              <p className="text-2xl font-bold text-red-700">12,450 BTC</p>
              <p className="text-sm text-red-600">$1.21B moved to exchanges</p>
              <TrafficLight status="bad" label="Bearish Signal" />
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <p className="text-green-600 text-sm font-medium">Exchange Outflows (24h)</p>
              <p className="text-2xl font-bold text-green-700">15,230 BTC</p>
              <p className="text-sm text-green-600">$1.48B withdrawn from exchanges</p>
              <TrafficLight status="good" label="Bullish Signal" />
            </div>
          </div>

          {/* Net Flow */}
          <div className="bg-green-100 p-4 rounded-lg border border-green-300">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-green-800 font-medium">Net Flow (24h)</p>
                <p className="text-3xl font-bold text-green-700">+2,780 BTC Out</p>
              </div>
              <div className="text-right">
                <p className="text-green-700 font-bold text-xl">🟢 Bullish</p>
                <p className="text-sm text-green-600">More BTC leaving than entering</p>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-green-200">
              <p className="text-sm text-green-800">
                <strong>What this means:</strong> More Bitcoin is being withdrawn from exchanges 
                than deposited. This suggests investors are moving to long-term storage (bullish).
              </p>
            </div>
          </div>

          {/* Top Exchanges */}
          <div className="mt-6">
            <h4 className="font-semibold text-gray-700 mb-3">Top Exchanges by Volume</h4>
            <div className="space-y-2">
              {[
                { name: 'Binance', inflow: 5200, outflow: 6100 },
                { name: 'Coinbase', inflow: 3100, outflow: 4200 },
                { name: 'Kraken', inflow: 1800, outflow: 2100 },
                { name: 'OKX', inflow: 2350, outflow: 2830 }
              ].map((exchange) => {
                const netFlow = exchange.outflow - exchange.inflow;
                const isPositive = netFlow > 0;
                return (
                  <div key={exchange.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">{exchange.name}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-red-600 text-sm">↓{exchange.inflow.toLocaleString()}</span>
                      <span className="text-green-600 text-sm">↑{exchange.outflow.toLocaleString()}</span>
                      <span className={`font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                        {isPositive ? '+' : ''}{netFlow.toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default WhaleTracker;
