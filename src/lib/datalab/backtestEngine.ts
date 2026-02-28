// Strategy Backtester for DataLab
// Runs simple strategy backtests using current price data

import type { BacktestResult } from './types';
import { computeSMA, computeRSI, computeMACD, computeBollingerBands } from './calculations';

export type StrategyType =
  | 'sma_cross'
  | 'rsi_oversold'
  | 'macd_cross'
  | 'bollinger_bounce'
  | 'buy_and_hold';

export interface StrategyConfig {
  type: StrategyType;
  label: string;
  description: string;
  params?: Record<string, number>;
}

export const STRATEGIES: StrategyConfig[] = [
  { type: 'buy_and_hold', label: 'Buy & Hold', description: 'Buy at start, hold until end' },
  { type: 'sma_cross', label: 'SMA Cross', description: 'Buy when fast SMA crosses above slow SMA', params: { fast: 20, slow: 50 } },
  { type: 'rsi_oversold', label: 'RSI Oversold', description: 'Buy when RSI < 30, sell when RSI > 70', params: { period: 14, buyLevel: 30, sellLevel: 70 } },
  { type: 'macd_cross', label: 'MACD Cross', description: 'Buy on MACD bullish cross, sell on bearish cross', params: { fast: 12, slow: 26, signal: 9 } },
  { type: 'bollinger_bounce', label: 'BB Bounce', description: 'Buy at lower band, sell at upper band', params: { period: 20, mult: 2 } },
];

/**
 * Generate buy/sell signals for a strategy.
 * Returns array of { idx, action: 'buy' | 'sell' }.
 */
function generateSignals(
  closes: number[],
  strategy: StrategyConfig,
): { idx: number; action: 'buy' | 'sell' }[] {
  const signals: { idx: number; action: 'buy' | 'sell' }[] = [];

  switch (strategy.type) {
    case 'buy_and_hold': {
      signals.push({ idx: 0, action: 'buy' });
      signals.push({ idx: closes.length - 1, action: 'sell' });
      break;
    }

    case 'sma_cross': {
      const fast = computeSMA(closes, strategy.params?.fast ?? 20);
      const slow = computeSMA(closes, strategy.params?.slow ?? 50);
      let inPosition = false;

      for (let i = 1; i < closes.length; i++) {
        const prevFast = fast[i - 1];
        const prevSlow = slow[i - 1];
        const currFast = fast[i];
        const currSlow = slow[i];
        if (prevFast === null || prevSlow === null || currFast === null || currSlow === null) continue;

        if (!inPosition && prevFast <= prevSlow && currFast > currSlow) {
          signals.push({ idx: i, action: 'buy' });
          inPosition = true;
        } else if (inPosition && prevFast >= prevSlow && currFast < currSlow) {
          signals.push({ idx: i, action: 'sell' });
          inPosition = false;
        }
      }

      if (inPosition) signals.push({ idx: closes.length - 1, action: 'sell' });
      break;
    }

    case 'rsi_oversold': {
      const rsi = computeRSI(closes, strategy.params?.period ?? 14);
      const buyLevel = strategy.params?.buyLevel ?? 30;
      const sellLevel = strategy.params?.sellLevel ?? 70;
      let inPosition = false;

      for (let i = 1; i < rsi.length; i++) {
        const val = rsi[i];
        if (val === null) continue;

        if (!inPosition && val < buyLevel) {
          signals.push({ idx: i, action: 'buy' });
          inPosition = true;
        } else if (inPosition && val > sellLevel) {
          signals.push({ idx: i, action: 'sell' });
          inPosition = false;
        }
      }

      if (inPosition) signals.push({ idx: closes.length - 1, action: 'sell' });
      break;
    }

    case 'macd_cross': {
      const { macd, signal } = computeMACD(
        closes,
        strategy.params?.fast ?? 12,
        strategy.params?.slow ?? 26,
        strategy.params?.signal ?? 9,
      );
      let inPosition = false;

      for (let i = 1; i < macd.length; i++) {
        const prevM = macd[i - 1];
        const prevS = signal[i - 1];
        const currM = macd[i];
        const currS = signal[i];
        if (prevM === null || prevS === null || currM === null || currS === null) continue;

        if (!inPosition && prevM <= prevS && currM > currS) {
          signals.push({ idx: i, action: 'buy' });
          inPosition = true;
        } else if (inPosition && prevM >= prevS && currM < currS) {
          signals.push({ idx: i, action: 'sell' });
          inPosition = false;
        }
      }

      if (inPosition) signals.push({ idx: closes.length - 1, action: 'sell' });
      break;
    }

    case 'bollinger_bounce': {
      const { upper, lower } = computeBollingerBands(
        closes,
        strategy.params?.period ?? 20,
        strategy.params?.mult ?? 2,
      );
      let inPosition = false;

      for (let i = 1; i < closes.length; i++) {
        const u = upper[i];
        const l = lower[i];
        if (u === null || l === null) continue;

        if (!inPosition && closes[i] <= l) {
          signals.push({ idx: i, action: 'buy' });
          inPosition = true;
        } else if (inPosition && closes[i] >= u) {
          signals.push({ idx: i, action: 'sell' });
          inPosition = false;
        }
      }

      if (inPosition) signals.push({ idx: closes.length - 1, action: 'sell' });
      break;
    }
  }

  return signals;
}

/**
 * Run a backtest with the given strategy on price data.
 */
export function runBacktest(closes: number[], strategy: StrategyConfig): BacktestResult {
  const signals = generateSignals(closes, strategy);

  const trades: { entryIdx: number; exitIdx: number; returnPct: number }[] = [];
  let i = 0;

  while (i < signals.length) {
    if (signals[i].action === 'buy') {
      const entry = signals[i];
      const exit = signals.find((s, j) => j > i && s.action === 'sell');
      if (exit) {
        const returnPct = ((closes[exit.idx] - closes[entry.idx]) / closes[entry.idx]) * 100;
        trades.push({ entryIdx: entry.idx, exitIdx: exit.idx, returnPct });
        i = signals.indexOf(exit) + 1;
      } else {
        break;
      }
    } else {
      i++;
    }
  }

  // Compute equity curve (starting at 100)
  const equity: number[] = [100];
  let currentEquity = 100;
  let tradeIdx = 0;
  let inTrade = false;
  let entryPrice = 0;

  for (let j = 1; j < closes.length; j++) {
    if (tradeIdx < trades.length && !inTrade && j === trades[tradeIdx].entryIdx) {
      inTrade = true;
      entryPrice = closes[j];
    }

    if (inTrade) {
      currentEquity = equity[trades[tradeIdx].entryIdx] * (closes[j] / entryPrice);
    }

    if (tradeIdx < trades.length && inTrade && j === trades[tradeIdx].exitIdx) {
      inTrade = false;
      tradeIdx++;
    }

    equity.push(currentEquity);
  }

  // Compute max drawdown
  let peak = equity[0];
  let maxDrawdown = 0;
  for (const val of equity) {
    if (val > peak) peak = val;
    const dd = (peak - val) / peak;
    if (dd > maxDrawdown) maxDrawdown = dd;
  }

  const wins = trades.filter((t) => t.returnPct > 0);
  const losses = trades.filter((t) => t.returnPct <= 0);
  const totalReturn = trades.length > 0
    ? (equity[equity.length - 1] / equity[0] - 1) * 100
    : 0;

  // Simplified Sharpe (annualized daily returns)
  const dailyReturns: number[] = [];
  for (let j = 1; j < equity.length; j++) {
    dailyReturns.push(equity[j] / equity[j - 1] - 1);
  }
  const avgReturn = dailyReturns.reduce((s, r) => s + r, 0) / (dailyReturns.length || 1);
  const stdReturn = Math.sqrt(
    dailyReturns.reduce((s, r) => s + (r - avgReturn) ** 2, 0) / (dailyReturns.length || 1),
  );
  const sharpeRatio = stdReturn > 0 ? (avgReturn / stdReturn) * Math.sqrt(365) : 0;

  return {
    trades,
    equity,
    totalReturn,
    maxDrawdown: maxDrawdown * 100,
    sharpeRatio,
    winRate: trades.length > 0 ? (wins.length / trades.length) * 100 : 0,
    avgWin: wins.length > 0 ? wins.reduce((s, t) => s + t.returnPct, 0) / wins.length : 0,
    avgLoss: losses.length > 0 ? losses.reduce((s, t) => s + t.returnPct, 0) / losses.length : 0,
  };
}
