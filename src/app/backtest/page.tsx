'use client';

import { useState, useCallback } from 'react';
import { FreeNavbar } from '@/components/FreeNavbar';
import { Breadcrumb } from '@/components/Breadcrumb';
import { SUPPORTED_COINS, getCoinGeckoId } from '@/lib/dataTypes';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Area, AreaChart,
  ReferenceLine,
} from 'recharts';

type StrategyType = 'ma_crossover' | 'rsi' | 'bollinger' | 'dca';

interface BacktestConfig {
  coinId: string;
  strategy: StrategyType;
  initialCapital: number;
  days: number;
  // MA Crossover params
  maFast: number;
  maSlow: number;
  // RSI params
  rsiPeriod: number;
  rsiBuy: number;
  rsiSell: number;
  // DCA params
  dcaInterval: number; // days between purchases
  dcaAmount: number;
}

interface Trade {
  date: string;
  type: 'buy' | 'sell';
  price: number;
  amount: number;
  total: number;
  reason: string;
}

interface BacktestResult {
  trades: Trade[];
  equityCurve: { date: string; equity: number; holdEquity: number; price: number }[];
  totalReturn: number;
  holdReturn: number;
  maxDrawdown: number;
  winRate: number;
  totalTrades: number;
  sharpeRatio: number;
  finalEquity: number;
}

// Simple Moving Average
function sma(data: number[], period: number): (number | null)[] {
  return data.map((_, i) => {
    if (i < period - 1) return null;
    const slice = data.slice(i - period + 1, i + 1);
    return slice.reduce((a, b) => a + b, 0) / period;
  });
}

// RSI calculation
function rsi(data: number[], period: number): (number | null)[] {
  const result: (number | null)[] = Array(period).fill(null);
  let avgGain = 0, avgLoss = 0;

  for (let i = 1; i <= period; i++) {
    const change = data[i] - data[i - 1];
    if (change > 0) avgGain += change;
    else avgLoss += Math.abs(change);
  }
  avgGain /= period;
  avgLoss /= period;

  result.push(avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss));

  for (let i = period + 1; i < data.length; i++) {
    const change = data[i] - data[i - 1];
    avgGain = (avgGain * (period - 1) + (change > 0 ? change : 0)) / period;
    avgLoss = (avgLoss * (period - 1) + (change < 0 ? Math.abs(change) : 0)) / period;
    result.push(avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss));
  }

  return result;
}

// Bollinger Bands
function bollingerBands(data: number[], period: number, stdDev: number): { upper: (number | null)[]; lower: (number | null)[]; middle: (number | null)[] } {
  const middle = sma(data, period);
  const upper: (number | null)[] = [];
  const lower: (number | null)[] = [];

  data.forEach((_, i) => {
    if (i < period - 1 || middle[i] === null) {
      upper.push(null);
      lower.push(null);
      return;
    }
    const slice = data.slice(i - period + 1, i + 1);
    const avg = middle[i]!;
    const variance = slice.reduce((sum, v) => sum + (v - avg) ** 2, 0) / period;
    const sd = Math.sqrt(variance) * stdDev;
    upper.push(avg + sd);
    lower.push(avg - sd);
  });

  return { upper, lower, middle };
}

const STRATEGY_INFO: Record<StrategyType, { name: string; icon: string; desc: string }> = {
  ma_crossover: { name: 'MA Crossover', icon: '📈', desc: 'Buy when fast MA crosses above slow MA, sell on cross below' },
  rsi: { name: 'RSI Strategy', icon: '📊', desc: 'Buy when RSI drops below oversold level, sell above overbought' },
  bollinger: { name: 'Bollinger Bands', icon: '📉', desc: 'Buy at lower band, sell at upper band (mean reversion)' },
  dca: { name: 'Dollar Cost Average', icon: '💰', desc: 'Invest fixed amount at regular intervals regardless of price' },
};

const TOP_COINS = SUPPORTED_COINS.slice(0, 30);

export default function BacktestPage() {
  const [config, setConfig] = useState<BacktestConfig>({
    coinId: 'BTC',
    strategy: 'ma_crossover',
    initialCapital: 10000,
    days: 365,
    maFast: 10,
    maSlow: 30,
    rsiPeriod: 14,
    rsiBuy: 30,
    rsiSell: 70,
    dcaInterval: 7,
    dcaAmount: 100,
  });
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runBacktest = useCallback(async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const geckoId = getCoinGeckoId(config.coinId);
      const res = await fetch(`/api/charts/history?coin=${geckoId}&days=${config.days}`);
      if (!res.ok) throw new Error('Failed to fetch price data');
      const json = await res.json();

      const rawPrices: [number, number][] = json.prices || [];
      if (rawPrices.length < 50) throw new Error('Not enough price data for backtesting');

      const prices = rawPrices.map(p => p[1]);
      const dates = rawPrices.map(p => new Date(p[0]).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));

      const trades: Trade[] = [];
      let cash = config.initialCapital;
      let holdings = 0;
      const equityCurve: BacktestResult['equityCurve'] = [];
      const holdStartPrice = prices[0];
      const holdCoins = config.initialCapital / holdStartPrice;
      let peakEquity = config.initialCapital;
      let maxDrawdown = 0;
      const dailyReturns: number[] = [];
      let prevEquity = config.initialCapital;

      if (config.strategy === 'ma_crossover') {
        const fast = sma(prices, config.maFast);
        const slow = sma(prices, config.maSlow);

        for (let i = 1; i < prices.length; i++) {
          if (fast[i] !== null && slow[i] !== null && fast[i - 1] !== null && slow[i - 1] !== null) {
            // Buy signal: fast crosses above slow
            if (fast[i - 1]! <= slow[i - 1]! && fast[i]! > slow[i]! && cash > 0) {
              const amount = cash / prices[i];
              trades.push({ date: dates[i], type: 'buy', price: prices[i], amount, total: cash, reason: 'Fast MA crossed above Slow MA' });
              holdings += amount;
              cash = 0;
            }
            // Sell signal: fast crosses below slow
            else if (fast[i - 1]! >= slow[i - 1]! && fast[i]! < slow[i]! && holdings > 0) {
              const total = holdings * prices[i];
              trades.push({ date: dates[i], type: 'sell', price: prices[i], amount: holdings, total, reason: 'Fast MA crossed below Slow MA' });
              cash += total;
              holdings = 0;
            }
          }

          const equity = cash + holdings * prices[i];
          const holdEquity = holdCoins * prices[i];
          equityCurve.push({ date: dates[i], equity, holdEquity, price: prices[i] });
          if (equity > peakEquity) peakEquity = equity;
          const dd = (peakEquity - equity) / peakEquity;
          if (dd > maxDrawdown) maxDrawdown = dd;
          dailyReturns.push((equity - prevEquity) / prevEquity);
          prevEquity = equity;
        }
      } else if (config.strategy === 'rsi') {
        const rsiValues = rsi(prices, config.rsiPeriod);

        for (let i = 1; i < prices.length; i++) {
          if (rsiValues[i] !== null) {
            if (rsiValues[i]! < config.rsiBuy && cash > 0) {
              const amount = cash / prices[i];
              trades.push({ date: dates[i], type: 'buy', price: prices[i], amount, total: cash, reason: `RSI ${rsiValues[i]!.toFixed(0)} < ${config.rsiBuy}` });
              holdings += amount;
              cash = 0;
            } else if (rsiValues[i]! > config.rsiSell && holdings > 0) {
              const total = holdings * prices[i];
              trades.push({ date: dates[i], type: 'sell', price: prices[i], amount: holdings, total, reason: `RSI ${rsiValues[i]!.toFixed(0)} > ${config.rsiSell}` });
              cash += total;
              holdings = 0;
            }
          }

          const equity = cash + holdings * prices[i];
          const holdEquity = holdCoins * prices[i];
          equityCurve.push({ date: dates[i], equity, holdEquity, price: prices[i] });
          if (equity > peakEquity) peakEquity = equity;
          const dd = (peakEquity - equity) / peakEquity;
          if (dd > maxDrawdown) maxDrawdown = dd;
          dailyReturns.push((equity - prevEquity) / prevEquity);
          prevEquity = equity;
        }
      } else if (config.strategy === 'bollinger') {
        const bb = bollingerBands(prices, 20, 2);

        for (let i = 1; i < prices.length; i++) {
          if (bb.lower[i] !== null && bb.upper[i] !== null) {
            if (prices[i] <= bb.lower[i]! && cash > 0) {
              const amount = cash / prices[i];
              trades.push({ date: dates[i], type: 'buy', price: prices[i], amount, total: cash, reason: 'Price touched lower Bollinger Band' });
              holdings += amount;
              cash = 0;
            } else if (prices[i] >= bb.upper[i]! && holdings > 0) {
              const total = holdings * prices[i];
              trades.push({ date: dates[i], type: 'sell', price: prices[i], amount: holdings, total, reason: 'Price touched upper Bollinger Band' });
              cash += total;
              holdings = 0;
            }
          }

          const equity = cash + holdings * prices[i];
          const holdEquity = holdCoins * prices[i];
          equityCurve.push({ date: dates[i], equity, holdEquity, price: prices[i] });
          if (equity > peakEquity) peakEquity = equity;
          const dd = (peakEquity - equity) / peakEquity;
          if (dd > maxDrawdown) maxDrawdown = dd;
          dailyReturns.push((equity - prevEquity) / prevEquity);
          prevEquity = equity;
        }
      } else if (config.strategy === 'dca') {
        let nextPurchaseDay = 0;

        for (let i = 0; i < prices.length; i++) {
          if (i >= nextPurchaseDay && cash >= config.dcaAmount) {
            const buyAmount = Math.min(config.dcaAmount, cash);
            const coins = buyAmount / prices[i];
            trades.push({ date: dates[i], type: 'buy', price: prices[i], amount: coins, total: buyAmount, reason: `DCA buy (every ${config.dcaInterval} days)` });
            holdings += coins;
            cash -= buyAmount;
            nextPurchaseDay = i + config.dcaInterval;
          }

          const equity = cash + holdings * prices[i];
          const holdEquity = holdCoins * prices[i];
          equityCurve.push({ date: dates[i], equity, holdEquity, price: prices[i] });
          if (equity > peakEquity) peakEquity = equity;
          const dd = (peakEquity - equity) / peakEquity;
          if (dd > maxDrawdown) maxDrawdown = dd;
          dailyReturns.push((equity - prevEquity) / prevEquity);
          prevEquity = equity;
        }
      }

      const finalEquity = cash + holdings * prices[prices.length - 1];
      const totalReturn = ((finalEquity - config.initialCapital) / config.initialCapital) * 100;
      const holdReturn = ((holdCoins * prices[prices.length - 1] - config.initialCapital) / config.initialCapital) * 100;

      // Win rate
      const sellTrades = trades.filter(t => t.type === 'sell');
      const buyTrades = trades.filter(t => t.type === 'buy');
      let wins = 0;
      for (let i = 0; i < sellTrades.length; i++) {
        if (i < buyTrades.length && sellTrades[i].price > buyTrades[i].price) wins++;
      }
      const winRate = sellTrades.length > 0 ? (wins / sellTrades.length) * 100 : 0;

      // Sharpe ratio (annualized)
      const avgReturn = dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length || 0;
      const stdDev = Math.sqrt(dailyReturns.reduce((sum, r) => sum + (r - avgReturn) ** 2, 0) / dailyReturns.length) || 1;
      const sharpeRatio = (avgReturn / stdDev) * Math.sqrt(365);

      setResult({
        trades,
        equityCurve,
        totalReturn,
        holdReturn,
        maxDrawdown: maxDrawdown * 100,
        winRate,
        totalTrades: trades.length,
        sharpeRatio,
        finalEquity,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Backtest failed');
    } finally {
      setLoading(false);
    }
  }, [config]);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <FreeNavbar />
      <Breadcrumb customTitle="Strategy Backtester" />

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <h1 className="text-3xl font-bold">🧪 Strategy Backtester</h1>
          <span className="px-2 py-0.5 bg-amber-600/20 text-amber-400 text-xs rounded-full">Beta</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Config Panel */}
          <div className="space-y-4">
            {/* Asset + Period */}
            <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
              <h3 className="font-semibold text-sm text-gray-400 mb-3">Configuration</h3>

              <label className="block text-xs text-gray-500 mb-1">Asset</label>
              <select
                title="Asset"
                value={config.coinId}
                onChange={(e) => setConfig(prev => ({ ...prev, coinId: e.target.value }))}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm mb-3"
              >
                {TOP_COINS.map(c => <option key={c.symbol} value={c.symbol}>{c.name} ({c.symbol})</option>)}
              </select>

              <label className="block text-xs text-gray-500 mb-1">Period</label>
              <select
                title="Period"
                value={config.days}
                onChange={(e) => setConfig(prev => ({ ...prev, days: Number(e.target.value) }))}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm mb-3"
              >
                <option value={90}>90 Days</option>
                <option value={180}>180 Days</option>
                <option value={365}>1 Year</option>
                <option value={730}>2 Years</option>
                <option value={1825}>5 Years</option>
              </select>

              <label className="block text-xs text-gray-500 mb-1">Starting Capital</label>
              <input
                type="number"
                title="Starting capital"
                value={config.initialCapital}
                onChange={(e) => setConfig(prev => ({ ...prev, initialCapital: Number(e.target.value) || 1000 }))}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm"
              />
            </div>

            {/* Strategy Selection */}
            <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
              <h3 className="font-semibold text-sm text-gray-400 mb-3">Strategy</h3>
              <div className="space-y-2">
                {(Object.keys(STRATEGY_INFO) as StrategyType[]).map(s => (
                  <button
                    key={s}
                    onClick={() => setConfig(prev => ({ ...prev, strategy: s }))}
                    className={`w-full text-left p-3 rounded-lg transition ${
                      config.strategy === s ? 'bg-blue-600/20 border border-blue-500' : 'bg-gray-700/50 border border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    <span className="font-medium text-sm">{STRATEGY_INFO[s].icon} {STRATEGY_INFO[s].name}</span>
                    <p className="text-xs text-gray-400 mt-1">{STRATEGY_INFO[s].desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Strategy Parameters */}
            <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
              <h3 className="font-semibold text-sm text-gray-400 mb-3">Parameters</h3>

              {config.strategy === 'ma_crossover' && (
                <>
                  <label className="block text-xs text-gray-500 mb-1">Fast MA Period</label>
                  <input type="number" title="Fast MA period" value={config.maFast} onChange={(e) => setConfig(prev => ({ ...prev, maFast: Number(e.target.value) }))} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm mb-3" />
                  <label className="block text-xs text-gray-500 mb-1">Slow MA Period</label>
                  <input type="number" title="Slow MA period" value={config.maSlow} onChange={(e) => setConfig(prev => ({ ...prev, maSlow: Number(e.target.value) }))} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm" />
                </>
              )}

              {config.strategy === 'rsi' && (
                <>
                  <label className="block text-xs text-gray-500 mb-1">RSI Period</label>
                  <input type="number" title="RSI period" value={config.rsiPeriod} onChange={(e) => setConfig(prev => ({ ...prev, rsiPeriod: Number(e.target.value) }))} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm mb-3" />
                  <label className="block text-xs text-gray-500 mb-1">Buy Below RSI</label>
                  <input type="number" title="Buy below RSI" value={config.rsiBuy} onChange={(e) => setConfig(prev => ({ ...prev, rsiBuy: Number(e.target.value) }))} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm mb-3" />
                  <label className="block text-xs text-gray-500 mb-1">Sell Above RSI</label>
                  <input type="number" title="Sell above RSI" value={config.rsiSell} onChange={(e) => setConfig(prev => ({ ...prev, rsiSell: Number(e.target.value) }))} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm" />
                </>
              )}

              {config.strategy === 'bollinger' && (
                <p className="text-xs text-gray-400">Uses 20-period Bollinger Bands with 2 standard deviations. Buys at lower band, sells at upper band.</p>
              )}

              {config.strategy === 'dca' && (
                <>
                  <label className="block text-xs text-gray-500 mb-1">Buy Every (days)</label>
                  <input type="number" title="DCA interval (days)" value={config.dcaInterval} onChange={(e) => setConfig(prev => ({ ...prev, dcaInterval: Number(e.target.value) }))} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm mb-3" />
                  <label className="block text-xs text-gray-500 mb-1">Amount Per Purchase ($)</label>
                  <input type="number" title="DCA amount per purchase" value={config.dcaAmount} onChange={(e) => setConfig(prev => ({ ...prev, dcaAmount: Number(e.target.value) }))} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm" />
                </>
              )}
            </div>

            <button
              onClick={runBacktest}
              disabled={loading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-600 text-white font-medium rounded-xl transition"
            >
              {loading ? '⏳ Running Backtest...' : '▶️ Run Backtest'}
            </button>

            {error && (
              <div className="p-3 bg-red-900/30 border border-red-800 rounded-lg text-red-400 text-sm">{error}</div>
            )}

            <div className="p-3 bg-amber-900/20 border border-amber-800/30 rounded-lg text-amber-400/80 text-xs">
              ⚠️ Past performance is not indicative of future results. This is for educational purposes only. Not financial advice.
            </div>
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-2 space-y-4">
            {!result && !loading && (
              <div className="bg-gray-800 rounded-xl p-12 border border-gray-700 text-center text-gray-500">
                <div className="text-4xl mb-4">🧪</div>
                <p className="font-medium">Configure your strategy and click &quot;Run Backtest&quot;</p>
                <p className="text-sm mt-2">Historical simulation using real market data from CoinGecko</p>
              </div>
            )}

            {loading && (
              <div className="bg-gray-800 rounded-xl p-12 border border-gray-700 text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto mb-4" />
                <p className="text-gray-400">Running backtest simulation...</p>
              </div>
            )}

            {result && (
              <>
                {/* Performance Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: 'Strategy Return', value: `${result.totalReturn >= 0 ? '+' : ''}${result.totalReturn.toFixed(1)}%`, color: result.totalReturn >= 0 ? 'text-green-400' : 'text-red-400' },
                    { label: 'Buy & Hold', value: `${result.holdReturn >= 0 ? '+' : ''}${result.holdReturn.toFixed(1)}%`, color: result.holdReturn >= 0 ? 'text-green-400' : 'text-red-400' },
                    { label: 'Max Drawdown', value: `-${result.maxDrawdown.toFixed(1)}%`, color: 'text-red-400' },
                    { label: 'Sharpe Ratio', value: result.sharpeRatio.toFixed(2), color: result.sharpeRatio > 1 ? 'text-green-400' : 'text-yellow-400' },
                    { label: 'Total Trades', value: result.totalTrades.toString(), color: 'text-blue-400' },
                    { label: 'Win Rate', value: `${result.winRate.toFixed(0)}%`, color: result.winRate >= 50 ? 'text-green-400' : 'text-red-400' },
                    { label: 'Final Equity', value: `$${result.finalEquity.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, color: 'text-white' },
                    { label: 'vs Hold', value: `${result.totalReturn > result.holdReturn ? '+' : ''}${(result.totalReturn - result.holdReturn).toFixed(1)}%`, color: result.totalReturn > result.holdReturn ? 'text-green-400' : 'text-red-400' },
                  ].map((m, i) => (
                    <div key={i} className="bg-gray-800 rounded-xl p-3 border border-gray-700">
                      <p className="text-xs text-gray-400">{m.label}</p>
                      <p className={`text-lg font-bold ${m.color}`}>{m.value}</p>
                    </div>
                  ))}
                </div>

                {/* Equity Curve Chart */}
                <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                  <h3 className="font-semibold mb-3 text-sm">Equity Curve: Strategy vs Buy & Hold</h3>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={result.equityCurve}>
                        <defs>
                          <linearGradient id="stratGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9CA3AF' }} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}K`} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px', fontSize: '11px' }}
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          formatter={(v: any, name: any) => [`$${Number(v).toLocaleString(undefined, { maximumFractionDigits: 0 })}`, name === 'equity' ? 'Strategy' : 'Buy & Hold']}
                        />
                        <Area type="monotone" dataKey="equity" stroke="#3B82F6" fill="url(#stratGrad)" strokeWidth={2} dot={false} name="equity" />
                        <Line type="monotone" dataKey="holdEquity" stroke="#9CA3AF" strokeWidth={1} strokeDasharray="4 4" dot={false} name="holdEquity" />
                        <ReferenceLine y={config.initialCapital} stroke="#F59E0B" strokeDasharray="3 3" label={{ value: 'Start', fill: '#F59E0B', fontSize: 10 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Trade Log */}
                <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                  <h3 className="font-semibold mb-3 text-sm">Trade Log ({result.trades.length} trades)</h3>
                  <div className="overflow-x-auto max-h-60 overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead className="sticky top-0 bg-gray-800">
                        <tr className="border-b border-gray-600 text-gray-400">
                          <th className="text-left py-2 px-2">#</th>
                          <th className="text-left py-2 px-2">Date</th>
                          <th className="text-center py-2 px-2">Type</th>
                          <th className="text-right py-2 px-2">Price</th>
                          <th className="text-right py-2 px-2">Amount</th>
                          <th className="text-right py-2 px-2">Total</th>
                          <th className="text-left py-2 px-2">Signal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.trades.map((trade, i) => (
                          <tr key={i} className="border-b border-gray-700/30">
                            <td className="py-1.5 px-2 text-gray-500">{i + 1}</td>
                            <td className="py-1.5 px-2">{trade.date}</td>
                            <td className="py-1.5 px-2 text-center">
                              <span className={`px-2 py-0.5 rounded text-xs ${trade.type === 'buy' ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
                                {trade.type.toUpperCase()}
                              </span>
                            </td>
                            <td className="py-1.5 px-2 text-right">${trade.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                            <td className="py-1.5 px-2 text-right">{trade.amount < 1 ? trade.amount.toFixed(6) : trade.amount.toFixed(2)}</td>
                            <td className="py-1.5 px-2 text-right font-medium">${trade.total.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                            <td className="py-1.5 px-2 text-gray-400">{trade.reason}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
