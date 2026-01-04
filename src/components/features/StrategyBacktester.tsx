'use client';

import { useState } from 'react';
import { BeginnerTip, InfoButton } from '../ui/BeginnerHelpers';

type Candle = { timestamp: number; open: number; high: number; low: number; close: number; volume?: number };

function roundPercent(value: number): number {
  return Math.round(value * 10) / 10;
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function stddev(values: number[]): number {
  if (values.length < 2) return 0;
  const m = mean(values);
  const variance = values.reduce((acc, v) => acc + (v - m) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

function computeSMA(closes: number[], window: number): Array<number | null> {
  const out: Array<number | null> = new Array(closes.length).fill(null);
  if (window <= 0) return out;
  let sum = 0;
  for (let i = 0; i < closes.length; i++) {
    sum += closes[i];
    if (i >= window) sum -= closes[i - window];
    if (i >= window - 1) out[i] = sum / window;
  }
  return out;
}

function computeRSI(closes: number[], period: number = 14): Array<number | null> {
  const out: Array<number | null> = new Array(closes.length).fill(null);
  if (closes.length < period + 1) return out;

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const change = closes[i] - closes[i - 1];
    if (change >= 0) gains += change;
    else losses += -change;
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;
  const rs0 = avgLoss === 0 ? Infinity : avgGain / avgLoss;
  out[period] = 100 - 100 / (1 + rs0);

  for (let i = period + 1; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1];
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? -change : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    const rs = avgLoss === 0 ? Infinity : avgGain / avgLoss;
    out[i] = 100 - 100 / (1 + rs);
  }

  return out;
}

function maxDrawdownPercent(equity: number[]): number {
  if (equity.length === 0) return 0;
  let peak = equity[0];
  let maxDd = 0;
  for (const v of equity) {
    if (v > peak) peak = v;
    const dd = peak > 0 ? (peak - v) / peak : 0;
    if (dd > maxDd) maxDd = dd;
  }
  return maxDd * 100;
}

function sharpeFromEquity(equity: number[], annualPeriods: number): number {
  if (equity.length < 3) return 0;
  const returns: number[] = [];
  for (let i = 1; i < equity.length; i++) {
    if (equity[i - 1] <= 0) continue;
    returns.push(equity[i] / equity[i - 1] - 1);
  }
  const mu = mean(returns);
  const sd = stddev(returns);
  if (sd === 0) return 0;
  return (mu / sd) * Math.sqrt(annualPeriods);
}

type Trade = { pct: number };

function backtestSignalStrategy(params: {
  candles: Candle[];
  initialAmount: number;
  shouldBuy: (i: number) => boolean;
  shouldSell: (i: number, entryPrice: number) => boolean;
  annualPeriods: number;
}): BacktestResult {
  const { candles, initialAmount, shouldBuy, shouldSell, annualPeriods } = params;
  const closes = candles.map(c => c.close);
  const equity: number[] = [];

  let cash = initialAmount;
  let units = 0;
  let entryPrice = 0;
  const trades: Trade[] = [];

  for (let i = 0; i < candles.length; i++) {
    const price = closes[i];

    if (units === 0 && cash > 0 && shouldBuy(i)) {
      units = cash / price;
      cash = 0;
      entryPrice = price;
    } else if (units > 0 && shouldSell(i, entryPrice)) {
      const exitPrice = price;
      const pct = (exitPrice / entryPrice - 1) * 100;
      trades.push({ pct });
      cash = units * exitPrice;
      units = 0;
      entryPrice = 0;
    }

    equity.push(cash + units * price);
  }

  const finalValue = equity.length > 0 ? equity[equity.length - 1] : initialAmount;
  const totalReturn = initialAmount > 0 ? (finalValue / initialAmount - 1) * 100 : 0;
  const mdd = maxDrawdownPercent(equity);
  const sharpe = sharpeFromEquity(equity, annualPeriods);

  const numTrades = trades.length;
  const wins = trades.filter(t => t.pct > 0).length;
  const winRate = numTrades > 0 ? (wins / numTrades) * 100 : 0;
  const bestTrade = numTrades > 0 ? Math.max(...trades.map(t => t.pct)) : 0;
  const worstTrade = numTrades > 0 ? Math.min(...trades.map(t => t.pct)) : 0;

  const holdFinal = closes.length >= 2 ? initialAmount * (closes[closes.length - 1] / closes[0]) : initialAmount;
  const vsHold = holdFinal > 0 ? ((finalValue - holdFinal) / holdFinal) * 100 : 0;

  return {
    totalReturn: roundPercent(totalReturn),
    numTrades,
    winRate: roundPercent(winRate),
    maxDrawdown: roundPercent(mdd),
    sharpeRatio: sharpe,
    bestTrade: roundPercent(bestTrade),
    worstTrade: roundPercent(worstTrade),
    vsHold: roundPercent(vsHold),
    finalValue,
  };
}

function backtestDCA(params: { candles: Candle[]; initialAmount: number; buyEvery: number; annualPeriods: number }): BacktestResult {
  const { candles, initialAmount, buyEvery, annualPeriods } = params;
  const closes = candles.map(c => c.close);
  const equity: number[] = [];

  const buyIndices: number[] = [];
  for (let i = 0; i < candles.length; i += Math.max(1, buyEvery)) buyIndices.push(i);
  if (buyIndices.length === 0) buyIndices.push(0);

  const perBuy = initialAmount / buyIndices.length;

  let cash = initialAmount;
  let units = 0;
  const purchaseReturns: number[] = [];

  for (let i = 0; i < candles.length; i++) {
    const price = closes[i];
    if (buyIndices.includes(i)) {
      const spend = Math.min(perBuy, cash);
      if (spend > 0) {
        units += spend / price;
        cash -= spend;
        if (closes.length >= 2) {
          const endRet = (closes[closes.length - 1] / price - 1) * 100;
          purchaseReturns.push(endRet);
        }
      }
    }
    equity.push(cash + units * price);
  }

  const finalValue = equity.length > 0 ? equity[equity.length - 1] : initialAmount;
  const totalReturn = initialAmount > 0 ? (finalValue / initialAmount - 1) * 100 : 0;
  const mdd = maxDrawdownPercent(equity);
  const sharpe = sharpeFromEquity(equity, annualPeriods);

  const numTrades = buyIndices.length;
  const wins = purchaseReturns.filter(r => r > 0).length;
  const winRate = purchaseReturns.length > 0 ? (wins / purchaseReturns.length) * 100 : 0;
  const bestTrade = purchaseReturns.length > 0 ? Math.max(...purchaseReturns) : 0;
  const worstTrade = purchaseReturns.length > 0 ? Math.min(...purchaseReturns) : 0;

  const holdFinal = closes.length >= 2 ? initialAmount * (closes[closes.length - 1] / closes[0]) : initialAmount;
  const vsHold = holdFinal > 0 ? ((finalValue - holdFinal) / holdFinal) * 100 : 0;

  return {
    totalReturn: roundPercent(totalReturn),
    numTrades,
    winRate: roundPercent(winRate),
    maxDrawdown: roundPercent(mdd),
    sharpeRatio: sharpe,
    bestTrade: roundPercent(bestTrade),
    worstTrade: roundPercent(worstTrade),
    vsHold: roundPercent(vsHold),
    finalValue,
  };
}

interface BacktestResult {
  totalReturn: number;
  numTrades: number;
  winRate: number;
  maxDrawdown: number;
  sharpeRatio: number;
  bestTrade: number;
  worstTrade: number;
  vsHold: number;
  finalValue: number;
}

interface PresetStrategy {
  id: string;
  name: string;
  description: string;
  emoji: string;
  simpleRule: string;
}

export function StrategyBacktester({ showBeginnerTips = true }: { showBeginnerTips?: boolean }) {
  const [selectedStrategy, setSelectedStrategy] = useState<string | null>(null);
  const [customStrategy, setCustomStrategy] = useState('');
  const [coin, setCoin] = useState('bitcoin');
  const [initialAmount, setInitialAmount] = useState(1000);
  const [period, setPeriod] = useState('1y');
  const [isBacktesting, setIsBacktesting] = useState(false);
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [backtestError, setBacktestError] = useState<string | null>(null);

  const presetStrategies: PresetStrategy[] = [
    {
      id: 'dip-buy',
      name: 'Buy the Dip',
      emoji: '📉',
      description: 'Buy when price drops significantly',
      simpleRule: 'Buy when price drops 10% in a week, sell when it rises 20%'
    },
    {
      id: 'rsi',
      name: 'RSI Strategy',
      emoji: '📊',
      description: 'Buy oversold, sell overbought',
      simpleRule: 'Buy when RSI falls below 30, sell when RSI rises above 70'
    },
    {
      id: 'ma-cross',
      name: 'Moving Average Cross',
      emoji: '📈',
      description: 'Follow the trend',
      simpleRule: 'Buy when 20-day average crosses above 50-day average, sell when it crosses below'
    },
    {
      id: 'dca',
      name: 'Dollar Cost Average',
      emoji: '💵',
      description: 'Buy same amount weekly',
      simpleRule: 'Buy $100 worth every Monday, regardless of price'
    },
    {
      id: 'fear-greed',
      name: 'Fear & Greed',
      emoji: '😱',
      description: 'Buy fear, sell greed',
      simpleRule: 'Buy when Fear & Greed Index falls below 25, sell when it rises above 75'
    },
  ];

  const runBacktest = async () => {
    setIsBacktesting(true);
    setResult(null);
    setBacktestError(null);

    try {
      const periodDays = period === '6m' ? 180 : period === '1y' ? 365 : period === '2y' ? 730 : 1825;
      const interval = periodDays > 1000 ? '1w' : undefined;

      if (selectedStrategy === 'fear-greed' && periodDays > 365) {
        setBacktestError('Fear & Greed history is only available up to 365 days from the free API.');
        setIsBacktesting(false);
        return;
      }

      const candlesUrl = `/api/charts/candles?coin=${encodeURIComponent(coin)}&days=${periodDays}${interval ? `&interval=${interval}` : ''}`;
      const candlesRes = await fetch(candlesUrl);
      const candlesJson = await candlesRes.json();
      const candles: Candle[] = Array.isArray(candlesJson?.candles) ? candlesJson.candles : [];

      if (!candlesRes.ok || candles.length < 30) {
        const reason = typeof candlesJson?.error === 'string' ? candlesJson.error : 'No candle data available.';
        setBacktestError(reason);
        setIsBacktesting(false);
        return;
      }

      const closes = candles.map(c => c.close);
      const annualPeriods = candlesJson?.interval === '1w' ? 52 : 252;

      let computed: BacktestResult;

      if (selectedStrategy === 'dca') {
        const buyEvery = candlesJson?.interval === '1w' ? 1 : 7;
        computed = backtestDCA({ candles, initialAmount, buyEvery, annualPeriods });
      } else if (selectedStrategy === 'rsi') {
        const rsi = computeRSI(closes, 14);
        computed = backtestSignalStrategy({
          candles,
          initialAmount,
          annualPeriods,
          shouldBuy: (i) => rsi[i] !== null && (rsi[i] as number) < 30,
          shouldSell: (i) => rsi[i] !== null && (rsi[i] as number) > 70,
        });
      } else if (selectedStrategy === 'ma-cross') {
        const sma20 = computeSMA(closes, 20);
        const sma50 = computeSMA(closes, 50);
        computed = backtestSignalStrategy({
          candles,
          initialAmount,
          annualPeriods,
          shouldBuy: (i) => i > 0 && sma20[i - 1] !== null && sma50[i - 1] !== null && sma20[i] !== null && sma50[i] !== null
            && (sma20[i - 1] as number) <= (sma50[i - 1] as number) && (sma20[i] as number) > (sma50[i] as number),
          shouldSell: (i) => i > 0 && sma20[i - 1] !== null && sma50[i - 1] !== null && sma20[i] !== null && sma50[i] !== null
            && (sma20[i - 1] as number) >= (sma50[i - 1] as number) && (sma20[i] as number) < (sma50[i] as number),
        });
      } else if (selectedStrategy === 'dip-buy') {
        computed = backtestSignalStrategy({
          candles,
          initialAmount,
          annualPeriods,
          shouldBuy: (i) => i >= 7 && (closes[i] / closes[i - 7] - 1) <= -0.10,
          shouldSell: (_i, entryPrice) => entryPrice > 0 && (closes[_i] / entryPrice - 1) >= 0.20,
        });
      } else if (selectedStrategy === 'fear-greed') {
        const fgRes = await fetch(`/api/onchain/fear-greed-history?limit=${Math.min(365, periodDays)}`);
        const fgJson = await fgRes.json();
        if (!fgRes.ok || !fgJson?.success || !Array.isArray(fgJson?.data) || fgJson.data.length === 0) {
          setBacktestError('Fear & Greed data unavailable from the free API.');
          setIsBacktesting(false);
          return;
        }

        const byDay = new Map<string, number>();
        for (const row of fgJson.data as Array<{ timestamp: string; value: number }>) {
          if (typeof row?.timestamp === 'string' && typeof row?.value === 'number' && Number.isFinite(row.value)) {
            byDay.set(row.timestamp.slice(0, 10), row.value);
          }
        }

        computed = backtestSignalStrategy({
          candles,
          initialAmount,
          annualPeriods,
          shouldBuy: (i) => {
            const dayKey = new Date(candles[i].timestamp).toISOString().slice(0, 10);
            const v = byDay.get(dayKey);
            return typeof v === 'number' && v < 25;
          },
          shouldSell: (i) => {
            const dayKey = new Date(candles[i].timestamp).toISOString().slice(0, 10);
            const v = byDay.get(dayKey);
            return typeof v === 'number' && v > 75;
          },
        });
      } else {
        setBacktestError('Please select a strategy.');
        setIsBacktesting(false);
        return;
      }

      setResult(computed);
    } catch (e) {
      setBacktestError(e instanceof Error ? e.message : 'Backtest failed.');
    } finally {
      setIsBacktesting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          🧪 Strategy Backtester
          <InfoButton explanation="Test if a trading strategy would have worked in the past. Enter a strategy in plain English, and we'll show you how it would have performed." />
        </h2>
        <p className="text-gray-500 text-sm mt-1">
          Test trading strategies before risking real money
        </p>
      </div>

      {/* Beginner Tip */}
      {showBeginnerTips && (
        <BeginnerTip title="💡 What is Backtesting?">
          Backtesting lets you test a trading idea using <strong>past data</strong>. 
          If a strategy worked well historically, it <em>might</em> work in the future (no guarantees!).
          It&apos;s like a practice run before using real money.
        </BeginnerTip>
      )}

      {/* Two Columns: Config + Results */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Left: Configuration */}
        <div className="space-y-6">
          {/* Preset Strategies */}
          <div>
            <h3 className="font-semibold mb-3">Choose a Strategy</h3>
            <div className="space-y-2">
              {presetStrategies.map((strategy) => (
                <button
                  key={strategy.id}
                  onClick={() => {
                    setSelectedStrategy(strategy.id);
                    setCustomStrategy(strategy.simpleRule);
                    setResult(null);
                  }}
                  className={`w-full p-4 rounded-lg border text-left transition-all ${
                    selectedStrategy === strategy.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{strategy.emoji}</span>
                    <div>
                      <p className="font-medium">{strategy.name}</p>
                      <p className="text-sm text-gray-500">{strategy.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Strategy Details */}
          {selectedStrategy && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Strategy Rule:</h4>
              <p className="text-sm text-gray-700">{customStrategy}</p>
            </div>
          )}

          {/* Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="coin-select" className="block text-sm font-medium text-gray-700 mb-1">Coin</label>
              <select
                id="coin-select"
                value={coin}
                onChange={(e) => setCoin(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                title="Select cryptocurrency to backtest"
                aria-label="Select cryptocurrency to backtest"
              >
                <option value="bitcoin">Bitcoin (BTC)</option>
                <option value="ethereum">Ethereum (ETH)</option>
                <option value="solana">Solana (SOL)</option>
              </select>
            </div>
            <div>
              <label htmlFor="period-select" className="block text-sm font-medium text-gray-700 mb-1">Time Period</label>
              <select
                id="period-select"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                title="Select time period for backtest"
                aria-label="Select time period for backtest"
              >
                <option value="6m">6 Months</option>
                <option value="1y">1 Year</option>
                <option value="2y">2 Years</option>
                <option value="5y">5 Years</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="amount-range" className="block text-sm font-medium text-gray-700 mb-1">
              Starting Amount: ${initialAmount.toLocaleString()}
            </label>
            <input
              id="amount-range"
              type="range"
              min="100"
              max="10000"
              step="100"
              value={initialAmount}
              onChange={(e) => setInitialAmount(Number(e.target.value))}
              className="w-full"
              aria-label={`Starting amount: $${initialAmount.toLocaleString()}`}
            />
          </div>

          <button
            type="button"
            onClick={runBacktest}
            disabled={!selectedStrategy || isBacktesting}
            className={`w-full py-3 rounded-lg font-bold transition-colors ${
              selectedStrategy && !isBacktesting
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isBacktesting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin">⏳</span> Testing Strategy...
              </span>
            ) : (
              '🧪 Run Backtest'
            )}
          </button>
        </div>

        {/* Right: Results */}
        <div>
          {!result && !isBacktesting && !backtestError && (
            <div className="h-full flex items-center justify-center bg-gray-50 rounded-lg p-8 text-center">
              <div>
                <span className="text-6xl">📊</span>
                <p className="text-gray-500 mt-4">
                  Select a strategy and click &quot;Run Backtest&quot; to see results
                </p>
              </div>
            </div>
          )}

          {backtestError && !isBacktesting && (
            <div className="h-full flex items-center justify-center bg-gray-50 rounded-lg p-8 text-center">
              <div>
                <span className="text-6xl">⚠️</span>
                <p className="text-gray-700 mt-4 font-medium">Backtest unavailable</p>
                <p className="text-gray-500 mt-2 text-sm">{backtestError}</p>
              </div>
            </div>
          )}

          {isBacktesting && (
            <div className="h-full flex items-center justify-center bg-gray-50 rounded-lg p-8 text-center">
              <div>
                <span className="text-6xl animate-pulse">🔬</span>
                <p className="text-gray-600 mt-4 font-medium">
                  Analyzing historical data...
                </p>
                <p className="text-gray-400 text-sm mt-2">
                  Testing strategy across {period === '5y' ? '5 years' : period === '2y' ? '2 years' : period === '1y' ? '1 year' : '6 months'} of data
                </p>
              </div>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              {/* Main Result */}
              <div className={`p-6 rounded-lg text-center ${
                result.totalReturn > 0 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
              }`}>
                <p className="text-gray-600 text-sm">
                  ${initialAmount.toLocaleString()} would have become:
                </p>
                <p className={`text-4xl font-bold ${result.totalReturn > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${Math.round(result.finalValue).toLocaleString()}
                </p>
                <p className={`text-xl ${result.totalReturn > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {result.totalReturn > 0 ? '+' : ''}{result.totalReturn}%
                </p>
              </div>

              {/* vs Buy & Hold */}
              <div className={`p-4 rounded-lg ${result.vsHold >= 0 ? 'bg-green-50' : 'bg-yellow-50'}`}>
                <p className="text-sm text-gray-600">Compared to Just Holding:</p>
                <p className={`font-bold ${result.vsHold >= 0 ? 'text-green-600' : 'text-yellow-600'}`}>
                  {result.vsHold >= 0 
                    ? `🏆 Beat buy & hold by ${result.vsHold}%!` 
                    : `📉 Underperformed by ${Math.abs(result.vsHold)}%`}
                </p>
              </div>

              {/* Detailed Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">Total Trades</p>
                  <p className="font-bold">{result.numTrades}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">Win Rate</p>
                  <p className="font-bold text-green-600">{result.winRate}%</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">Best Trade</p>
                  <p className="font-bold text-green-600">+{result.bestTrade}%</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">Worst Trade</p>
                    <p className="font-bold text-red-600">{result.worstTrade}%</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">Max Drawdown</p>
                  <p className="font-bold text-red-600">-{result.maxDrawdown}%</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">Sharpe Ratio</p>
                  <p className={`font-bold ${result.sharpeRatio >= 1 ? 'text-green-600' : 'text-gray-600'}`}>
                    {result.sharpeRatio.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Disclaimer */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-xs text-amber-700">
                  ⚠️ <strong>Disclaimer:</strong> Past performance does NOT guarantee future results. 
                  Markets change, and what worked before might not work again. 
                  This is for educational purposes only.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default StrategyBacktester;
