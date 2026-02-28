/**
 * Power Combos — pre-defined "quick add" layer combinations
 * for detecting specific market conditions.
 */

import type { DataSource, ChartType, YAxisSide } from './types';

export interface PowerCombo {
  id: string;
  name: string;
  description: string;
  icon: string; // lucide icon name
  layers: {
    label: string;
    source: DataSource;
    chartType: ChartType;
    yAxis: YAxisSide;
    color: string;
    gridIndex: number;
    params?: Record<string, number>;
  }[];
}

export const POWER_COMBOS: PowerCombo[] = [
  {
    id: 'accumulation',
    name: 'Accumulation Detection',
    description: 'Rising volume + flat price + declining volatility = smart money accumulation',
    icon: 'TrendingUp',
    layers: [
      { label: 'Price', source: 'price', chartType: 'line', yAxis: 'left', color: '#34d399', gridIndex: 0 },
      { label: 'SMA 50', source: 'sma', chartType: 'line', yAxis: 'left', color: '#f59e0b', gridIndex: 0, params: { window: 50 } },
      { label: 'Volume', source: 'volume', chartType: 'bar', yAxis: 'right', color: '#60a5fa', gridIndex: 1 },
      { label: 'Vol SMA 20', source: 'volume_sma', chartType: 'line', yAxis: 'right', color: '#38bdf8', gridIndex: 1, params: { window: 20 } },
      { label: 'Vol Ratio', source: 'volume_ratio', chartType: 'bar', yAxis: 'right', color: '#c084fc', gridIndex: 1, params: { window: 20 } },
    ],
  },
  {
    id: 'distribution',
    name: 'Distribution Warning',
    description: 'RSI divergence + declining volume + price at resistance = potential distribution',
    icon: 'TrendingDown',
    layers: [
      { label: 'Price (OHLC)', source: 'ohlc', chartType: 'candlestick', yAxis: 'left', color: '#34d399', gridIndex: 0 },
      { label: 'BB Upper', source: 'bollinger_upper', chartType: 'line', yAxis: 'left', color: '#f59e0b', gridIndex: 0, params: { window: 20, multiplier: 2 } },
      { label: 'BB Lower', source: 'bollinger_lower', chartType: 'line', yAxis: 'left', color: '#f59e0b', gridIndex: 0, params: { window: 20, multiplier: 2 } },
      { label: 'RSI', source: 'rsi', chartType: 'line', yAxis: 'right', color: '#a78bfa', gridIndex: 1, params: { period: 14 } },
      { label: 'Volume', source: 'volume', chartType: 'bar', yAxis: 'right', color: '#60a5fa', gridIndex: 1 },
    ],
  },
  {
    id: 'compression',
    name: 'Compression → Expansion',
    description: 'BB squeeze + declining ATR + low volume = breakout imminent',
    icon: 'Zap',
    layers: [
      { label: 'Price (OHLC)', source: 'ohlc', chartType: 'candlestick', yAxis: 'left', color: '#34d399', gridIndex: 0 },
      { label: 'BB Upper', source: 'bollinger_upper', chartType: 'line', yAxis: 'left', color: '#f59e0b', gridIndex: 0, params: { window: 20, multiplier: 2 } },
      { label: 'BB Lower', source: 'bollinger_lower', chartType: 'line', yAxis: 'left', color: '#f59e0b', gridIndex: 0, params: { window: 20, multiplier: 2 } },
      { label: 'BB Width %', source: 'bb_width', chartType: 'line', yAxis: 'right', color: '#fbbf24', gridIndex: 1, params: { window: 20, multiplier: 2 } },
      { label: 'ATR', source: 'atr', chartType: 'line', yAxis: 'right', color: '#a3e635', gridIndex: 1, params: { period: 14 } },
    ],
  },
  {
    id: 'momentum-confirm',
    name: 'Momentum Confirmation',
    description: 'MACD crossover + RSI trending + Stochastic alignment = strong momentum',
    icon: 'Activity',
    layers: [
      { label: 'Price', source: 'price', chartType: 'line', yAxis: 'left', color: '#34d399', gridIndex: 0 },
      { label: 'EMA 12', source: 'ema', chartType: 'line', yAxis: 'left', color: '#f59e0b', gridIndex: 0, params: { window: 12 } },
      { label: 'EMA 26', source: 'ema', chartType: 'line', yAxis: 'left', color: '#ef4444', gridIndex: 0, params: { window: 26 } },
      { label: 'MACD', source: 'macd', chartType: 'line', yAxis: 'right', color: '#ec4899', gridIndex: 1, params: { fast: 12, slow: 26, signal: 9 } },
      { label: 'MACD Histogram', source: 'macd_histogram', chartType: 'bar', yAxis: 'right', color: '#6366f1', gridIndex: 1, params: { fast: 12, slow: 26, signal: 9 } },
      { label: 'RSI', source: 'rsi', chartType: 'line', yAxis: 'right', color: '#a78bfa', gridIndex: 1, params: { period: 14 } },
    ],
  },
  {
    id: 'fear-dip',
    name: 'Fear Dip Buyer',
    description: 'Extreme fear + RSI oversold + deep drawdown = high-conviction dip buy',
    icon: 'ShieldAlert',
    layers: [
      { label: 'Price', source: 'price', chartType: 'line', yAxis: 'left', color: '#34d399', gridIndex: 0 },
      { label: 'SMA 200', source: 'sma', chartType: 'line', yAxis: 'left', color: '#ef4444', gridIndex: 0, params: { window: 200 } },
      { label: 'Drawdown %', source: 'drawdown', chartType: 'area', yAxis: 'right', color: '#ef4444', gridIndex: 0 },
      { label: 'Fear & Greed', source: 'fear_greed', chartType: 'area', yAxis: 'right', color: '#f472b6', gridIndex: 1 },
      { label: 'RSI', source: 'rsi', chartType: 'line', yAxis: 'right', color: '#a78bfa', gridIndex: 1, params: { period: 14 } },
    ],
  },
  {
    id: 'miner-capitulation',
    name: 'Miner Capitulation',
    description: 'Dropping hashrate + falling miner revenue + price decline = miner capitulation (often marks bottom)',
    icon: 'Pickaxe',
    layers: [
      { label: 'Price', source: 'price', chartType: 'line', yAxis: 'left', color: '#34d399', gridIndex: 0 },
      { label: 'SMA 200', source: 'sma', chartType: 'line', yAxis: 'left', color: '#ef4444', gridIndex: 0, params: { window: 200 } },
      { label: 'Hashrate', source: 'hashrate', chartType: 'line', yAxis: 'right', color: '#f97316', gridIndex: 0 },
      { label: 'Miners Revenue ($)', source: 'miners_revenue', chartType: 'area', yAxis: 'right', color: '#fbbf24', gridIndex: 1 },
      { label: 'Drawdown %', source: 'drawdown', chartType: 'area', yAxis: 'right', color: '#ef4444', gridIndex: 1 },
    ],
  },
  {
    id: 'liquidity-wave',
    name: 'Liquidity Wave',
    description: 'Rising stablecoin supply + growing DeFi TVL + volume surge = fresh capital entering crypto',
    icon: 'Waves',
    layers: [
      { label: 'Price', source: 'price', chartType: 'line', yAxis: 'left', color: '#34d399', gridIndex: 0 },
      { label: 'Stablecoin Supply', source: 'stablecoin_mcap', chartType: 'area', yAxis: 'right', color: '#2dd4bf', gridIndex: 0 },
      { label: 'DeFi TVL', source: 'defi_tvl', chartType: 'area', yAxis: 'right', color: '#818cf8', gridIndex: 1 },
      { label: 'Volume', source: 'volume', chartType: 'bar', yAxis: 'right', color: '#60a5fa', gridIndex: 1 },
    ],
  },
  {
    id: 'network-activity',
    name: 'Network Activity Surge',
    description: 'Rising active addresses + growing tx count + volume spike = genuine organic adoption',
    icon: 'Network',
    layers: [
      { label: 'Price', source: 'price', chartType: 'line', yAxis: 'left', color: '#34d399', gridIndex: 0 },
      { label: 'EMA 21', source: 'ema', chartType: 'line', yAxis: 'left', color: '#f59e0b', gridIndex: 0, params: { window: 21 } },
      { label: 'Active Addresses', source: 'active_addresses', chartType: 'bar', yAxis: 'right', color: '#22d3ee', gridIndex: 1 },
      { label: 'Tx Count', source: 'tx_count', chartType: 'bar', yAxis: 'right', color: '#a78bfa', gridIndex: 1 },
      { label: 'Volume', source: 'volume', chartType: 'bar', yAxis: 'right', color: '#60a5fa', gridIndex: 1 },
    ],
  },
];
