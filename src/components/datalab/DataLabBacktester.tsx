'use client';

import { useState } from 'react';
import { Play, X, TrendingUp } from 'lucide-react';
import { useDataLabStore } from '@/lib/datalab/store';
import { isFeatureAvailable } from '@/lib/datalab/modeConfig';
import { STRATEGIES, runBacktest, type StrategyConfig } from '@/lib/datalab/backtestEngine';
import type { BacktestResult } from '@/lib/datalab/types';

interface DataLabBacktesterProps {
  show: boolean;
  onClose: () => void;
}

export function DataLabBacktester({ show, onClose }: DataLabBacktesterProps) {
  const dataLabMode = useDataLabStore((s) => s.dataLabMode);
  const rawData = useDataLabStore((s) => s.rawData);
  const coin = useDataLabStore((s) => s.coin);
  const days = useDataLabStore((s) => s.days);

  const [selectedStrategy, setSelectedStrategy] = useState<StrategyConfig>(STRATEGIES[0]);
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  if (!isFeatureAvailable(dataLabMode, 'strategyBacktester')) return null;
  if (!show) return null;

  const closes = rawData.price as number[] | undefined;

  const handleRun = () => {
    if (!closes || closes.length < 30) return;
    setIsRunning(true);
    setTimeout(() => {
      const res = runBacktest(closes, selectedStrategy);
      setResult(res);
      setIsRunning(false);
    }, 100);
  };

  return (
    <div className="border-t border-white/[0.04] bg-white/[0.01] max-w-[1800px] mx-auto">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-semibold text-white flex items-center gap-2">
            <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
            Strategy Backtester
            <span className="text-[10px] text-gray-500 font-normal ml-2">
              {coin} &middot; {days}d &middot; {closes?.length ?? 0} candles
            </span>
          </h4>
          <button type="button" title="Close backtester" onClick={onClose}
            className="text-gray-500 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-3 mb-3 flex-wrap">
          <select
            title="Select strategy"
            value={selectedStrategy.type}
            onChange={(e) => {
              const s = STRATEGIES.find((st) => st.type === e.target.value);
              if (s) setSelectedStrategy(s);
            }}
            className="bg-white/[0.04] border border-white/[0.06] text-gray-300 text-[11px] px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-blue-400/40"
          >
            {STRATEGIES.map((s) => (
              <option key={s.type} value={s.type}>{s.label}</option>
            ))}
          </select>
          <span className="text-[10px] text-gray-500">{selectedStrategy.description}</span>
          <button
            type="button"
            onClick={handleRun}
            disabled={isRunning || !closes || closes.length < 30}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-[11px] font-medium rounded-lg transition disabled:opacity-30"
          >
            <Play className="w-3 h-3" />
            {isRunning ? 'Running...' : 'Run Backtest'}
          </button>
        </div>

        {result && (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            {[
              { label: 'Total Return', value: `${result.totalReturn >= 0 ? '+' : ''}${result.totalReturn.toFixed(1)}%`, positive: result.totalReturn >= 0 },
              { label: 'Max Drawdown', value: `-${result.maxDrawdown.toFixed(1)}%`, positive: false },
              { label: 'Sharpe Ratio', value: result.sharpeRatio.toFixed(2), positive: result.sharpeRatio > 0 },
              { label: 'Win Rate', value: `${result.winRate.toFixed(0)}%`, positive: result.winRate > 50 },
              { label: 'Trades', value: `${result.trades.length}`, positive: true },
              { label: 'Avg Win', value: `+${result.avgWin.toFixed(1)}%`, positive: true },
              { label: 'Avg Loss', value: `${result.avgLoss.toFixed(1)}%`, positive: false },
              { label: 'Final Equity', value: `$${result.equity[result.equity.length - 1]?.toFixed(0) ?? 100}`, positive: (result.equity[result.equity.length - 1] ?? 100) > 100 },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/[0.02] border border-white/[0.06] rounded-lg px-2.5 py-2 text-center">
                <div className="text-[9px] text-gray-500 uppercase">{stat.label}</div>
                <div className={`text-sm font-mono font-medium ${stat.positive ? 'text-emerald-400' : 'text-red-400'}`}>
                  {stat.value}
                </div>
              </div>
            ))}
          </div>
        )}

        {!result && !isRunning && (
          <p className="text-[11px] text-gray-600 text-center py-2">
            Select a strategy and click Run to see backtesting results.
          </p>
        )}
      </div>
    </div>
  );
}
