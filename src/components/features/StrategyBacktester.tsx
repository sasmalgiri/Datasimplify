'use client';

import { useState } from 'react';
import { BeginnerTip, InfoButton } from '../ui/BeginnerHelpers';

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
  const [coin, setCoin] = useState('BTC');
  const [initialAmount, setInitialAmount] = useState(1000);
  const [period, setPeriod] = useState('1y');
  const [isBacktesting, setIsBacktesting] = useState(false);
  const [result, setResult] = useState<BacktestResult | null>(null);

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

  // Simulate backtest (in production this would call an API)
  const runBacktest = async () => {
    setIsBacktesting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Generate mock results based on strategy
    const strategy = presetStrategies.find(s => s.id === selectedStrategy);
    
    let mockResult: BacktestResult;
    
    switch (selectedStrategy) {
      case 'dip-buy':
        mockResult = {
          totalReturn: 285,
          numTrades: 15,
          winRate: 73,
          maxDrawdown: 22,
          sharpeRatio: 1.65,
          bestTrade: 42,
          worstTrade: -15,
          vsHold: 12,
          finalValue: initialAmount * 3.85
        };
        break;
      case 'rsi':
        mockResult = {
          totalReturn: 195,
          numTrades: 28,
          winRate: 64,
          maxDrawdown: 18,
          sharpeRatio: 1.42,
          bestTrade: 28,
          worstTrade: -12,
          vsHold: -8,
          finalValue: initialAmount * 2.95
        };
        break;
      case 'dca':
        mockResult = {
          totalReturn: 245,
          numTrades: 52,
          winRate: 100,
          maxDrawdown: 35,
          sharpeRatio: 1.25,
          bestTrade: 0,
          worstTrade: 0,
          vsHold: -2,
          finalValue: initialAmount * 3.45
        };
        break;
      default:
        mockResult = {
          totalReturn: 220,
          numTrades: 18,
          winRate: 67,
          maxDrawdown: 25,
          sharpeRatio: 1.35,
          bestTrade: 35,
          worstTrade: -18,
          vsHold: 5,
          finalValue: initialAmount * 3.2
        };
    }
    
    setResult(mockResult);
    setIsBacktesting(false);
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Coin</label>
              <select
                value={coin}
                onChange={(e) => setCoin(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="BTC">Bitcoin (BTC)</option>
                <option value="ETH">Ethereum (ETH)</option>
                <option value="SOL">Solana (SOL)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time Period</label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="6m">6 Months</option>
                <option value="1y">1 Year</option>
                <option value="2y">2 Years</option>
                <option value="5y">5 Years</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Starting Amount: ${initialAmount.toLocaleString()}
            </label>
            <input
              type="range"
              min="100"
              max="10000"
              step="100"
              value={initialAmount}
              onChange={(e) => setInitialAmount(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <button
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
          {!result && !isBacktesting && (
            <div className="h-full flex items-center justify-center bg-gray-50 rounded-lg p-8 text-center">
              <div>
                <span className="text-6xl">📊</span>
                <p className="text-gray-500 mt-4">
                  Select a strategy and click &quot;Run Backtest&quot; to see results
                </p>
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
