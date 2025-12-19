'use client';

import { useState, useEffect, useCallback } from 'react';
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

interface ExchangeFlow {
  exchange: string;
  inflow24h: number;
  outflow24h: number;
  netFlow24h: number;
}

interface WhaleTrackerProps {
  showBeginnerTips?: boolean;
}

// Static distribution data (would need paid API like Glassnode for real data)
const DISTRIBUTION_DATA: WalletDistribution[] = [
  { category: 'Shrimps', emoji: '🦐', description: 'Small retail investors like you and me', percentage: 8, btc_range: '< 1 BTC', trend: 'up' },
  { category: 'Crabs', emoji: '🦀', description: 'Serious individual investors', percentage: 11, btc_range: '1-10 BTC', trend: 'stable' },
  { category: 'Fish', emoji: '🐟', description: 'High net worth individuals', percentage: 15, btc_range: '10-100 BTC', trend: 'stable' },
  { category: 'Sharks', emoji: '🦈', description: 'Small funds and early adopters', percentage: 18, btc_range: '100-1K BTC', trend: 'down' },
  { category: 'Whales', emoji: '🐳', description: 'Large funds, exchanges', percentage: 25, btc_range: '1K-10K BTC', trend: 'stable' },
  { category: 'Humpbacks', emoji: '🐋', description: 'Mega institutions, Satoshi', percentage: 23, btc_range: '> 10K BTC', trend: 'down' }
];

export function WhaleTracker({ showBeginnerTips = true }: WhaleTrackerProps) {
  const [transactions, setTransactions] = useState<WhaleTransaction[]>([]);
  const [distribution] = useState<WalletDistribution[]>(DISTRIBUTION_DATA);
  const [exchangeFlows, setExchangeFlows] = useState<ExchangeFlow[]>([]);
  const [activeTab, setActiveTab] = useState<'alerts' | 'distribution' | 'flows'>('alerts');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const fetchWhaleData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [dashboardRes, flowsRes] = await Promise.all([
        fetch('/api/whales?type=dashboard'),
        fetch('/api/whales?type=exchange-flows')
      ]);

      if (dashboardRes.ok) {
        const dashboardData = await dashboardRes.json();
        if (dashboardData.data?.recentWhaleTransactions) {
          // Transform API data to component format
          const transformedTxs: WhaleTransaction[] = dashboardData.data.recentWhaleTransactions
            .slice(0, 10)
            .map((tx: {
              hash: string;
              timestamp: string;
              type: string;
              symbol: string;
              amount: number;
              amountUsd: number;
              fromLabel: string;
              toLabel: string;
            }, index: number) => {
              // Determine signal based on transaction type
              let signal: 'bullish' | 'bearish' | 'neutral' = 'neutral';
              let type: 'buy' | 'sell' | 'transfer' = 'transfer';
              let explanation = 'Large transaction detected';

              if (tx.type === 'exchange_inflow') {
                signal = 'bearish';
                type = 'sell';
                explanation = 'Moving to exchange might indicate intent to sell';
              } else if (tx.type === 'exchange_outflow') {
                signal = 'bullish';
                type = 'buy';
                explanation = 'Withdrawal from exchange = likely long-term holding';
              } else if (tx.type === 'whale_transfer') {
                signal = 'neutral';
                type = 'transfer';
                explanation = 'Large whale transfer between wallets';
              }

              return {
                id: tx.hash || `tx-${index}`,
                timestamp: new Date(tx.timestamp),
                type,
                coin: tx.symbol,
                amount: tx.amount,
                value_usd: tx.amountUsd,
                from_label: tx.fromLabel !== 'Unknown' ? tx.fromLabel : undefined,
                to_label: tx.toLabel !== 'Unknown' ? tx.toLabel : undefined,
                signal,
                explanation
              };
            });

          setTransactions(transformedTxs);
        }
      } else {
        console.error('Failed to fetch whale dashboard:', dashboardRes.status);
      }

      if (flowsRes.ok) {
        const flowsData = await flowsRes.json();
        if (flowsData.data && Array.isArray(flowsData.data)) {
          setExchangeFlows(flowsData.data);
        }
      }

      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Error fetching whale data:', err);
      setError('Failed to load whale data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWhaleData();
    const interval = setInterval(fetchWhaleData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchWhaleData]);

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

  // Loading skeleton
  if (loading && transactions.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
        <p className="text-gray-500 text-sm mt-4 text-center">Loading whale transactions...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            🐋 Whale Watch
            <InfoButton explanation="Track what the big players (whales) are doing with their crypto. Large movements often signal upcoming price changes." />
          </h2>
          <div className="flex items-center gap-2">
            {lastUpdated && (
              <span className="text-xs text-gray-400">Updated: {lastUpdated}</span>
            )}
            <button
              type="button"
              onClick={fetchWhaleData}
              disabled={loading}
              className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded transition-colors disabled:opacity-50"
            >
              {loading ? '⏳' : '🔄'} Refresh
            </button>
          </div>
        </div>
        <p className="text-gray-500 text-sm mt-1">
          Monitor large transactions and smart money movements
        </p>
        {error && (
          <p className="text-red-500 text-xs mt-1">⚠️ {error}</p>
        )}
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
          type="button"
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
          type="button"
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
          type="button"
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
            <button type="button" className="text-blue-600 hover:text-blue-800 font-medium">
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

          {/* Flow Stats - Using real data when available */}
          {(() => {
            const totalInflow = exchangeFlows.reduce((sum, f) => sum + f.inflow24h, 0);
            const totalOutflow = exchangeFlows.reduce((sum, f) => sum + f.outflow24h, 0);
            const netFlow = totalOutflow - totalInflow;
            const isBullish = netFlow > 0;

            return (
              <>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <p className="text-red-600 text-sm font-medium">Exchange Inflows (Recent)</p>
                    <p className="text-2xl font-bold text-red-700">
                      {totalInflow > 0 ? `${totalInflow.toFixed(1)} ETH` : 'Loading...'}
                    </p>
                    <p className="text-sm text-red-600">Moved to exchanges</p>
                    <TrafficLight status="bad" label="Bearish Signal" />
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <p className="text-green-600 text-sm font-medium">Exchange Outflows (Recent)</p>
                    <p className="text-2xl font-bold text-green-700">
                      {totalOutflow > 0 ? `${totalOutflow.toFixed(1)} ETH` : 'Loading...'}
                    </p>
                    <p className="text-sm text-green-600">Withdrawn from exchanges</p>
                    <TrafficLight status="good" label="Bullish Signal" />
                  </div>
                </div>

                {/* Net Flow */}
                <div className={`p-4 rounded-lg border ${isBullish ? 'bg-green-100 border-green-300' : 'bg-red-100 border-red-300'}`}>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className={`font-medium ${isBullish ? 'text-green-800' : 'text-red-800'}`}>Net Flow (Recent)</p>
                      <p className={`text-3xl font-bold ${isBullish ? 'text-green-700' : 'text-red-700'}`}>
                        {netFlow !== 0 ? `${netFlow > 0 ? '+' : ''}${netFlow.toFixed(1)} ETH ${isBullish ? 'Out' : 'In'}` : 'Loading...'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold text-xl ${isBullish ? 'text-green-700' : 'text-red-700'}`}>
                        {isBullish ? '🟢 Bullish' : '🔴 Bearish'}
                      </p>
                      <p className={`text-sm ${isBullish ? 'text-green-600' : 'text-red-600'}`}>
                        {isBullish ? 'More leaving than entering' : 'More entering than leaving'}
                      </p>
                    </div>
                  </div>

                  <div className={`mt-4 pt-4 border-t ${isBullish ? 'border-green-200' : 'border-red-200'}`}>
                    <p className={`text-sm ${isBullish ? 'text-green-800' : 'text-red-800'}`}>
                      <strong>What this means:</strong> {isBullish
                        ? 'More crypto is being withdrawn from exchanges than deposited. This suggests investors are moving to long-term storage (bullish).'
                        : 'More crypto is being deposited to exchanges than withdrawn. This could indicate selling pressure (bearish).'}
                    </p>
                  </div>
                </div>
              </>
            );
          })()}

          {/* Top Exchanges */}
          <div className="mt-6">
            <h4 className="font-semibold text-gray-700 mb-3">Exchange Flows (ETH)</h4>
            <div className="space-y-2">
              {(exchangeFlows.length > 0 ? exchangeFlows : [
                { exchange: 'Loading...', inflow24h: 0, outflow24h: 0, netFlow24h: 0 }
              ]).map((flow, idx) => {
                const flowNetFlow = flow.outflow24h - flow.inflow24h;
                const isPositive = flowNetFlow > 0;
                return (
                  <div key={flow.exchange || idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">{flow.exchange}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-red-600 text-sm">↓{flow.inflow24h.toFixed(1)}</span>
                      <span className="text-green-600 text-sm">↑{flow.outflow24h.toFixed(1)}</span>
                      <span className={`font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                        {isPositive ? '+' : ''}{flowNetFlow.toFixed(1)}
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
