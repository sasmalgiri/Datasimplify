'use client';

import { useEffect, useState } from 'react';
import { BeginnerTip, InfoButton, RiskMeter, TrafficLight } from '../ui/BeginnerHelpers';

interface CoinRisk {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  var_95: number;          // Value at Risk 95%
  var_99: number;          // Value at Risk 99%
  sharpe_ratio: number;    // Risk-adjusted return
  sortino_ratio: number;   // Downside risk-adjusted return
  max_drawdown: number;    // Maximum historical decline
  volatility: number;      // Daily volatility %
  risk_level: 1 | 2 | 3 | 4 | 5;  // 1 = Very Low, 5 = Very High
}

interface RiskDashboardProps {
  coins: CoinRisk[];
  investmentAmount?: number;
  showBeginnerTips?: boolean;
}

export function RiskDashboard({ 
  coins, 
  investmentAmount = 1000, 
  showBeginnerTips = true 
}: RiskDashboardProps) {
  const [selectedCoin, setSelectedCoin] = useState<CoinRisk | null>(coins[0] || null);
  const [amount, setAmount] = useState(investmentAmount);

  // Calculate potential loss based on VaR
  const calculateLoss = (var_percent: number) => {
    return (amount * var_percent / 100).toFixed(2);
  };

  // Get risk label
  const getRiskLabel = (level: number) => {
    const labels = ['Very Low', 'Low', 'Medium', 'High', 'Very High'];
    return labels[level - 1];
  };

  // Get risk color
  const getRiskColor = (level: number) => {
    const colors = ['text-green-400', 'text-green-400', 'text-yellow-400', 'text-orange-400', 'text-red-400'];
    return colors[level - 1];
  };

  return (
    <div className="bg-gray-800/60 rounded-xl border border-gray-700/50 p-6">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          ⚠️ Risk Analytics Dashboard
          <InfoButton explanation="This dashboard shows how risky different cryptocurrencies are. Use it to understand how much money you could potentially lose and make smarter investment decisions." />
        </h2>
        <p className="text-gray-400 text-sm mt-1">
          Understand the risk before you invest
        </p>
      </div>

      {/* Beginner Tip */}
      {showBeginnerTips && (
        <BeginnerTip title="💡 Understanding Risk">
          <strong>Risk = How much money you could lose.</strong> Higher risk coins can make you more money, 
          but can also lose more. As a beginner, start with lower risk coins (🟢) and only invest what you can afford to lose completely.
        </BeginnerTip>
      )}

      {/* Investment Amount Input */}
      <div className="mb-6 p-4 bg-gray-700/50 rounded-lg">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          How much are you thinking of investing?
        </label>
        <div className="flex items-center gap-2">
          <span className="text-gray-400">$</span>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value) || 0)}
            className="flex-1 px-4 py-2 bg-gray-800 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter amount"
          />
        </div>
        <p className="text-xs text-gray-400 mt-1">
          We&apos;ll show you potential losses based on this amount
        </p>
      </div>

      {/* Risk Comparison Table */}
      <div className="overflow-x-auto mb-6">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-gray-800">
            <tr className="border-b border-gray-700/50">
              <th className="text-left py-3 px-2">Coin</th>
              <th className="text-center py-3 px-2">
                Risk Level
                <InfoButton explanation="Overall risk rating from 1 (safest) to 5 (riskiest)" />
              </th>
              <th className="text-center py-3 px-2">
                Daily Swing
                <InfoButton explanation="How much the price typically moves each day" />
              </th>
              <th className="text-center py-3 px-2">
                Bad Day Loss*
                <InfoButton explanation="How much you could lose on a really bad day (95% confidence)" />
              </th>
              <th className="text-center py-3 px-2">
                Sharpe Ratio
                <InfoButton explanation="Risk-adjusted return. Higher is better! Above 1.0 is good." />
              </th>
            </tr>
          </thead>
          <tbody>
            {coins.map((coin) => (
              <tr 
                key={coin.id}
                onClick={() => setSelectedCoin(coin)}
                className={`border-b border-gray-700/50 cursor-pointer hover:bg-gray-700 transition-colors ${
                  selectedCoin?.id === coin.id ? 'bg-gray-700/50' : ''
                }`}
              >
                <td className="py-3 px-2">
                  <div className="font-medium text-white">{coin.symbol}</div>
                  <div className="text-xs text-gray-400">{coin.name}</div>
                </td>
                <td className="text-center py-3 px-2">
                  <span className={`font-bold ${getRiskColor(coin.risk_level)}`}>
                    {getRiskLabel(coin.risk_level)}
                  </span>
                </td>
                <td className="text-center py-3 px-2">
                  ±{coin.volatility.toFixed(1)}%
                </td>
                <td className="text-center py-3 px-2 text-red-400 font-medium">
                  -${calculateLoss(coin.var_95)}
                </td>
                <td className="text-center py-3 px-2">
                  <span className={coin.sharpe_ratio >= 1 ? 'text-green-400' : 'text-gray-400'}>
                    {coin.sharpe_ratio.toFixed(2)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-xs text-gray-400 mt-2">
          *Based on ${amount.toLocaleString()} investment. Click any row for details.
        </p>
      </div>

      {/* Selected Coin Details */}
      {selectedCoin && (
        <div className="border-t border-gray-700/50 pt-6">
          <h3 className="text-lg font-bold text-white mb-4">
            {selectedCoin.name} ({selectedCoin.symbol}) Risk Analysis
          </h3>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Risk Meter */}
            <div className="bg-gray-700/50 p-4 rounded-lg">
              <h4 className="font-semibold text-white mb-3">Overall Risk Level</h4>
              <RiskMeter level={selectedCoin.risk_level} />

              <div className="mt-4 text-sm text-gray-400">
                {selectedCoin.risk_level <= 2 && (
                  <p>✅ This coin is relatively safe for crypto. Good for beginners!</p>
                )}
                {selectedCoin.risk_level === 3 && (
                  <p>⚠️ Medium risk. Suitable for investors who can handle some volatility.</p>
                )}
                {selectedCoin.risk_level >= 4 && (
                  <p>🔴 High risk! Only invest money you&apos;re willing to lose completely.</p>
                )}
              </div>
            </div>

            {/* Potential Losses */}
            <div className="bg-red-500/10 p-4 rounded-lg">
              <h4 className="font-semibold mb-3 text-red-400">
                Potential Losses (${amount.toLocaleString()} investment)
              </h4>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm">
                    <span className="text-red-400">Bad day (95% confidence)</span>
                    <span className="font-bold text-red-400">-${calculateLoss(selectedCoin.var_95)}</span>
                  </div>
                  <p className="text-xs text-red-400/70 mt-1">
                    On most bad days, you won&apos;t lose more than this
                  </p>
                </div>

                <div>
                  <div className="flex justify-between text-sm">
                    <span className="text-red-300">Very bad day (99% confidence)</span>
                    <span className="font-bold text-red-300">-${calculateLoss(selectedCoin.var_99)}</span>
                  </div>
                  <p className="text-xs text-red-400/70 mt-1">
                    In extreme cases (1 in 100 days), losses could be this much
                  </p>
                </div>

                <div>
                  <div className="flex justify-between text-sm">
                    <span className="text-red-300">Biggest historical drop</span>
                    <span className="font-bold text-red-300">-{selectedCoin.max_drawdown.toFixed(0)}%</span>
                  </div>
                  <p className="text-xs text-red-400/70 mt-1">
                    The worst decline ever recorded for this coin
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-gray-800/60 border border-gray-700/50 p-4 rounded-lg">
              <p className="text-gray-400 text-sm flex items-center gap-1">
                Daily Volatility
                <InfoButton explanation="How much the price typically swings each day. Higher = more unpredictable." />
              </p>
              <p className="text-xl font-bold text-white">±{selectedCoin.volatility.toFixed(1)}%</p>
              <p className="text-xs text-gray-400 mt-1">
                Price moves about {selectedCoin.volatility.toFixed(1)}% up or down daily
              </p>
            </div>

            <div className="bg-gray-800/60 border border-gray-700/50 p-4 rounded-lg">
              <p className="text-gray-400 text-sm flex items-center gap-1">
                Sharpe Ratio
                <InfoButton explanation="Risk-adjusted return. Measures return per unit of risk. Above 1.0 is good, above 2.0 is excellent." />
              </p>
              <p className={`text-xl font-bold ${selectedCoin.sharpe_ratio >= 1 ? 'text-green-400' : 'text-gray-300'}`}>
                {selectedCoin.sharpe_ratio.toFixed(2)}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {selectedCoin.sharpe_ratio >= 2 ? 'Excellent' : selectedCoin.sharpe_ratio >= 1 ? 'Good' : 'Below average'} risk-return
              </p>
            </div>

            <div className="bg-gray-800/60 border border-gray-700/50 p-4 rounded-lg">
              <p className="text-gray-400 text-sm flex items-center gap-1">
                Sortino Ratio
                <InfoButton explanation="Like Sharpe, but only considers downside risk. Focuses on bad volatility, not good volatility." />
              </p>
              <p className={`text-xl font-bold ${selectedCoin.sortino_ratio >= 1 ? 'text-green-400' : 'text-gray-300'}`}>
                {selectedCoin.sortino_ratio.toFixed(2)}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Downside risk adjusted
              </p>
            </div>

            <div className="bg-gray-800/60 border border-gray-700/50 p-4 rounded-lg">
              <p className="text-gray-400 text-sm flex items-center gap-1">
                Max Drawdown
                <InfoButton explanation="The largest peak-to-trough decline in history. Shows the worst-case scenario that actually happened." />
              </p>
              <p className="text-xl font-bold text-red-400">-{selectedCoin.max_drawdown.toFixed(0)}%</p>
              <p className="text-xs text-gray-400 mt-1">
                Worst historical decline
              </p>
            </div>
          </div>

          {/* Recommendation */}
          <div className="mt-6 p-4 bg-blue-500/10 rounded-lg">
            <h4 className="font-semibold text-blue-400 mb-2">💡 What Should You Do?</h4>
            <div className="text-sm text-blue-300 space-y-2">
              {selectedCoin.risk_level <= 2 ? (
                <>
                  <p>✅ This is one of the <strong>safer</strong> cryptocurrencies.</p>
                  <p>• Good for beginners and long-term holding</p>
                  <p>• Still volatile compared to stocks - be prepared for swings</p>
                  <p>• Consider holding for 3+ years for best results</p>
                </>
              ) : selectedCoin.risk_level === 3 ? (
                <>
                  <p>⚠️ This coin has <strong>medium risk</strong>.</p>
                  <p>• Suitable for investors comfortable with volatility</p>
                  <p>• Don&apos;t put all your crypto allocation here</p>
                  <p>• Consider a smaller position than BTC/ETH</p>
                </>
              ) : (
                <>
                  <p>🔴 This is a <strong>high risk</strong> investment!</p>
                  <p>• Only invest money you&apos;re willing to lose 100%</p>
                  <p>• Keep position size small (5-10% of portfolio max)</p>
                  <p>• Be prepared for extreme price swings</p>
                  <p>• Never invest based on hype or FOMO</p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Quick-start widget (fetches real API data)
export function RiskDashboardDemo({ showBeginnerTips = true }: { showBeginnerTips?: boolean }) {
  const [coins, setCoins] = useState<CoinRisk[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoadError(null);
        const res = await fetch('/api/risk?coins=bitcoin,ethereum,solana,dogecoin,shiba-inu&days=365');
        const json = await res.json();
        if (!res.ok || !json?.success || !json?.data?.coins) {
          throw new Error(json?.error || 'Risk analytics unavailable');
        }
        if (!cancelled) setCoins(json.data.coins);
      } catch (e) {
        if (!cancelled) {
          setCoins(null);
          setLoadError(e instanceof Error ? e.message : 'Risk analytics unavailable');
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loadError) {
    return (
      <div className="bg-gray-800/60 rounded-xl border border-gray-700/50 p-6">
        <h2 className="text-xl font-bold text-white mb-2">⚠️ Risk Analytics Dashboard</h2>
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-sm text-amber-400">
          ⚠️ Risk analytics unavailable: {loadError}
        </div>
      </div>
    );
  }

  if (!coins) {
    return (
      <div className="bg-gray-800/60 rounded-xl border border-gray-700/50 p-6">
        <h2 className="text-xl font-bold text-white mb-2">⚠️ Risk Analytics Dashboard</h2>
        <p className="text-sm text-gray-400">Loading real risk metrics…</p>
      </div>
    );
  }

  return <RiskDashboard coins={coins} showBeginnerTips={showBeginnerTips} />;
}

export default RiskDashboard;
