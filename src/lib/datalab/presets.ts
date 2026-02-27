import type { OverlayPreset, ZoneRule } from './types';

export const OVERLAY_PRESETS: OverlayPreset[] = [
  {
    id: 'confluence-zones',
    name: 'Confluence Zones',
    description: 'RSI oversold + price at MA support + volume spike = high-probability entry',
    icon: 'Target',
    defaultCoin: 'bitcoin',
    defaultDays: 90,
    endpoints: ['ohlc', 'coin_history'],
    parameterDefs: [
      { key: 'sma_short', label: 'SMA Short', min: 5, max: 50, step: 1, defaultValue: 20, layerSource: 'sma' },
      { key: 'sma_mid', label: 'SMA Mid', min: 20, max: 100, step: 5, defaultValue: 50, layerSource: 'sma' },
      { key: 'sma_long', label: 'SMA Long', min: 50, max: 300, step: 10, defaultValue: 200, layerSource: 'sma' },
      { key: 'rsi_period', label: 'RSI Period', min: 5, max: 30, step: 1, defaultValue: 14, layerSource: 'rsi' },
    ],
    layers: [
      { label: 'Price (OHLC)', source: 'ohlc', chartType: 'candlestick', yAxis: 'left', color: '#34d399', visible: true, gridIndex: 0 },
      { label: 'SMA 20', source: 'sma', chartType: 'line', yAxis: 'left', color: '#f59e0b', visible: true, gridIndex: 0, params: { window: 20 } },
      { label: 'SMA 50', source: 'sma', chartType: 'line', yAxis: 'left', color: '#60a5fa', visible: true, gridIndex: 0, params: { window: 50 } },
      { label: 'SMA 200', source: 'sma', chartType: 'line', yAxis: 'left', color: '#ef4444', visible: true, gridIndex: 0, params: { window: 200 } },
      { label: 'RSI', source: 'rsi', chartType: 'line', yAxis: 'right', color: '#a78bfa', visible: true, gridIndex: 1, params: { period: 14 } },
      { label: 'Volume', source: 'volume', chartType: 'bar', yAxis: 'right', color: '#60a5fa', visible: true, gridIndex: 1 },
    ],
    zones: [
      { source: 'rsi', condition: 'below', threshold: 30, color: '#34d399', opacity: 0.08, label: 'Oversold' },
      { source: 'rsi', condition: 'above', threshold: 70, color: '#ef4444', opacity: 0.08, label: 'Overbought' },
    ],
  },

  {
    id: 'smart-money',
    name: 'Smart Money Tracker',
    description: 'Exchange outflows + flat price = smart money accumulation signal',
    icon: 'Brain',
    defaultCoin: 'bitcoin',
    defaultDays: 30,
    endpoints: ['ohlc', 'coin_history'],
    parameterDefs: [
      { key: 'sma_window', label: 'Price SMA', min: 5, max: 50, step: 1, defaultValue: 7, layerSource: 'sma' },
    ],
    layers: [
      { label: 'Price', source: 'price', chartType: 'line', yAxis: 'left', color: '#34d399', visible: true, gridIndex: 0 },
      { label: 'Price SMA 7', source: 'sma', chartType: 'line', yAxis: 'left', color: '#f59e0b', visible: true, gridIndex: 0, params: { window: 7 } },
      { label: 'Volume', source: 'volume', chartType: 'bar', yAxis: 'right', color: '#60a5fa', visible: true, gridIndex: 1 },
    ],
  },

  {
    id: 'derivatives-pressure',
    name: 'Derivatives Pressure',
    description: 'Extreme funding rate + high open interest = liquidation cascade risk',
    icon: 'Gauge',
    defaultCoin: 'bitcoin',
    defaultDays: 30,
    endpoints: ['ohlc', 'coin_history', 'derivatives'],
    parameterDefs: [
      { key: 'sma_window', label: 'Price SMA', min: 5, max: 50, step: 1, defaultValue: 14, layerSource: 'sma' },
    ],
    layers: [
      { label: 'Price', source: 'price', chartType: 'line', yAxis: 'left', color: '#34d399', visible: true, gridIndex: 0 },
      { label: 'Price SMA', source: 'sma', chartType: 'line', yAxis: 'left', color: '#f59e0b', visible: true, gridIndex: 0, params: { window: 14 } },
      { label: 'Funding Rate (now)', source: 'funding_rate', chartType: 'bar', yAxis: 'right', color: '#2dd4bf', visible: true, gridIndex: 1 },
      { label: 'Volume', source: 'volume', chartType: 'bar', yAxis: 'right', color: '#60a5fa', visible: true, gridIndex: 1 },
    ],
  },

  {
    id: 'market-rotation',
    name: 'Market Rotation',
    description: 'BTC dominance drop + greed rising = altseason entry signal',
    icon: 'RefreshCw',
    defaultCoin: 'bitcoin',
    defaultDays: 90,
    endpoints: ['ohlc', 'coin_history', 'global', 'fear_greed'],
    parameterDefs: [],
    layers: [
      { label: 'BTC Price', source: 'price', chartType: 'line', yAxis: 'left', color: '#34d399', visible: true, gridIndex: 0 },
      { label: 'BTC Dominance % (now)', source: 'btc_dominance', chartType: 'line', yAxis: 'right', color: '#fbbf24', visible: true, gridIndex: 0 },
      { label: 'Fear & Greed', source: 'fear_greed', chartType: 'area', yAxis: 'right', color: '#f472b6', visible: true, gridIndex: 1 },
    ],
  },

  {
    id: 'defi-value',
    name: 'DeFi Value Play',
    description: 'DeFi TVL growing faster than ETH price = undervalued ecosystem',
    icon: 'Layers',
    defaultCoin: 'ethereum',
    defaultDays: 90,
    endpoints: ['ohlc', 'coin_history', 'defillama_tvl_history'],
    parameterDefs: [
      { key: 'sma_window', label: 'Price SMA', min: 5, max: 50, step: 1, defaultValue: 14, layerSource: 'sma' },
    ],
    layers: [
      { label: 'ETH Price', source: 'price', chartType: 'line', yAxis: 'left', color: '#60a5fa', visible: true, gridIndex: 0 },
      { label: 'ETH SMA', source: 'sma', chartType: 'line', yAxis: 'left', color: '#f59e0b', visible: true, gridIndex: 0, params: { window: 14 } },
      { label: 'DeFi TVL', source: 'defi_tvl', chartType: 'area', yAxis: 'right', color: '#818cf8', visible: true, gridIndex: 0 },
      { label: 'Volume', source: 'volume', chartType: 'bar', yAxis: 'right', color: '#34d399', visible: true, gridIndex: 1 },
    ],
  },

  {
    id: 'volatility-squeeze',
    name: 'Volatility Squeeze',
    description: 'Bollinger Band squeeze + low ATR = explosive move imminent',
    icon: 'Activity',
    defaultCoin: 'bitcoin',
    defaultDays: 90,
    endpoints: ['ohlc', 'coin_history'],
    parameterDefs: [
      { key: 'bb_period', label: 'BB Period', min: 5, max: 50, step: 1, defaultValue: 20, layerSource: 'bollinger_upper' },
      { key: 'bb_mult', label: 'BB Mult', min: 1, max: 4, step: 0.5, defaultValue: 2, layerSource: 'bollinger_upper' },
      { key: 'atr_period', label: 'ATR Period', min: 5, max: 30, step: 1, defaultValue: 14, layerSource: 'atr' },
    ],
    layers: [
      { label: 'Price (OHLC)', source: 'ohlc', chartType: 'candlestick', yAxis: 'left', color: '#34d399', visible: true, gridIndex: 0 },
      { label: 'BB Upper', source: 'bollinger_upper', chartType: 'line', yAxis: 'left', color: '#f59e0b', visible: true, gridIndex: 0, params: { window: 20, multiplier: 2 } },
      { label: 'SMA 20', source: 'sma', chartType: 'line', yAxis: 'left', color: '#60a5fa', visible: true, gridIndex: 0, params: { window: 20 } },
      { label: 'BB Lower', source: 'bollinger_lower', chartType: 'line', yAxis: 'left', color: '#f59e0b', visible: true, gridIndex: 0, params: { window: 20, multiplier: 2 } },
      { label: 'ATR', source: 'atr', chartType: 'line', yAxis: 'right', color: '#a3e635', visible: true, gridIndex: 1, params: { period: 14 } },
      { label: 'Volume', source: 'volume', chartType: 'bar', yAxis: 'right', color: '#60a5fa', visible: true, gridIndex: 1 },
    ],
    zones: [
      { source: 'bb_width', condition: 'below', threshold: 10, color: '#fbbf24', opacity: 0.08, label: 'Squeeze' },
    ],
  },

  {
    id: 'momentum-divergence',
    name: 'Momentum Divergence',
    description: 'Price at high but MACD declining = reversal warning',
    icon: 'TrendingUp',
    defaultCoin: 'bitcoin',
    defaultDays: 90,
    endpoints: ['ohlc'],
    parameterDefs: [
      { key: 'macd_fast', label: 'MACD Fast', min: 5, max: 20, step: 1, defaultValue: 12, layerSource: 'macd' },
      { key: 'macd_slow', label: 'MACD Slow', min: 15, max: 50, step: 1, defaultValue: 26, layerSource: 'macd' },
      { key: 'macd_signal_period', label: 'Signal', min: 3, max: 15, step: 1, defaultValue: 9, layerSource: 'macd' },
    ],
    layers: [
      { label: 'Price (OHLC)', source: 'ohlc', chartType: 'candlestick', yAxis: 'left', color: '#34d399', visible: true, gridIndex: 0 },
      { label: 'MACD', source: 'macd', chartType: 'line', yAxis: 'right', color: '#ec4899', visible: true, gridIndex: 1, params: { fast: 12, slow: 26, signal: 9 } },
      { label: 'Signal', source: 'macd_signal', chartType: 'line', yAxis: 'right', color: '#f97316', visible: true, gridIndex: 1, params: { fast: 12, slow: 26, signal: 9 } },
      { label: 'Histogram', source: 'macd_histogram', chartType: 'bar', yAxis: 'right', color: '#6366f1', visible: true, gridIndex: 1, params: { fast: 12, slow: 26, signal: 9 } },
    ],
  },

  {
    id: 'trend-strength',
    name: 'Trend Strength',
    description: 'EMA alignment + Stochastic crossover = strong trend confirmation',
    icon: 'Zap',
    defaultCoin: 'bitcoin',
    defaultDays: 90,
    endpoints: ['ohlc', 'coin_history'],
    parameterDefs: [
      { key: 'stoch_k', label: 'Stoch K', min: 5, max: 30, step: 1, defaultValue: 14, layerSource: 'stochastic_k' },
      { key: 'stoch_d', label: 'Stoch D', min: 1, max: 10, step: 1, defaultValue: 3, layerSource: 'stochastic_d' },
      { key: 'stoch_smooth', label: 'Smooth', min: 1, max: 5, step: 1, defaultValue: 3, layerSource: 'stochastic_k' },
    ],
    layers: [
      { label: 'Price (OHLC)', source: 'ohlc', chartType: 'candlestick', yAxis: 'left', color: '#34d399', visible: true, gridIndex: 0 },
      { label: 'EMA 12', source: 'ema', chartType: 'line', yAxis: 'left', color: '#f59e0b', visible: true, gridIndex: 0, params: { window: 12 } },
      { label: 'EMA 26', source: 'ema', chartType: 'line', yAxis: 'left', color: '#ef4444', visible: true, gridIndex: 0, params: { window: 26 } },
      { label: 'Stochastic %K', source: 'stochastic_k', chartType: 'line', yAxis: 'right', color: '#06b6d4', visible: true, gridIndex: 1, params: { kPeriod: 14, dPeriod: 3, smooth: 3 } },
      { label: 'Stochastic %D', source: 'stochastic_d', chartType: 'line', yAxis: 'right', color: '#f472b6', visible: true, gridIndex: 1, params: { kPeriod: 14, dPeriod: 3, smooth: 3 } },
      { label: 'Volume', source: 'volume', chartType: 'bar', yAxis: 'right', color: '#60a5fa', visible: true, gridIndex: 1 },
    ],
  },
  // ── New presets: cover all missing analytical angles ──

  {
    id: 'sentiment-contrarian',
    name: 'Sentiment Contrarian',
    description: 'Extreme fear + RSI oversold = contrarian buy; extreme greed + overbought = distribution warning',
    icon: 'HeartPulse',
    defaultCoin: 'bitcoin',
    defaultDays: 365,
    endpoints: ['ohlc', 'coin_history', 'fear_greed'],
    parameterDefs: [
      { key: 'rsi_period', label: 'RSI Period', min: 5, max: 30, step: 1, defaultValue: 14, layerSource: 'rsi' },
      { key: 'sma_window', label: 'Price SMA', min: 20, max: 200, step: 10, defaultValue: 50, layerSource: 'sma' },
    ],
    layers: [
      { label: 'Price', source: 'price', chartType: 'line', yAxis: 'left', color: '#34d399', visible: true, gridIndex: 0 },
      { label: 'SMA 50', source: 'sma', chartType: 'line', yAxis: 'left', color: '#f59e0b', visible: true, gridIndex: 0, params: { window: 50 } },
      { label: 'Fear & Greed', source: 'fear_greed', chartType: 'area', yAxis: 'right', color: '#f472b6', visible: true, gridIndex: 0 },
      { label: 'RSI', source: 'rsi', chartType: 'line', yAxis: 'right', color: '#a78bfa', visible: true, gridIndex: 1, params: { period: 14 } },
      { label: 'Volume', source: 'volume', chartType: 'bar', yAxis: 'right', color: '#60a5fa', visible: true, gridIndex: 1 },
    ],
    zones: [
      { source: 'fear_greed', condition: 'below', threshold: 20, color: '#34d399', opacity: 0.08, label: 'Extreme Fear' },
      { source: 'fear_greed', condition: 'above', threshold: 80, color: '#ef4444', opacity: 0.08, label: 'Extreme Greed' },
    ],
  },

  {
    id: 'risk-regime',
    name: 'Risk Regime',
    description: 'Rolling volatility + drawdown depth = risk-on vs risk-off regime classification',
    icon: 'ShieldAlert',
    defaultCoin: 'bitcoin',
    defaultDays: 365,
    endpoints: ['ohlc', 'coin_history'],
    parameterDefs: [
      { key: 'vol_window', label: 'Vol Window', min: 7, max: 90, step: 7, defaultValue: 30, layerSource: 'rolling_volatility' },
      { key: 'bb_period', label: 'BB Period', min: 10, max: 50, step: 5, defaultValue: 20, layerSource: 'bb_width' },
    ],
    layers: [
      { label: 'Price', source: 'price', chartType: 'line', yAxis: 'left', color: '#34d399', visible: true, gridIndex: 0 },
      { label: 'SMA 50', source: 'sma', chartType: 'line', yAxis: 'left', color: '#f59e0b', visible: true, gridIndex: 0, params: { window: 50 } },
      { label: 'Drawdown %', source: 'drawdown', chartType: 'area', yAxis: 'right', color: '#ef4444', visible: true, gridIndex: 0 },
      { label: 'Rolling Volatility', source: 'rolling_volatility', chartType: 'line', yAxis: 'right', color: '#f97316', visible: true, gridIndex: 1, params: { window: 30 } },
      { label: 'BB Width %', source: 'bb_width', chartType: 'line', yAxis: 'right', color: '#a78bfa', visible: true, gridIndex: 1, params: { window: 20, multiplier: 2 } },
    ],
    zones: [
      { source: 'drawdown', condition: 'below', threshold: -20, color: '#ef4444', opacity: 0.08, label: 'Deep Drawdown' },
    ],
  },

  {
    id: 'dca-accumulator',
    name: 'DCA Accumulator',
    description: 'Price below 200-SMA + extreme fear + deep drawdown = optimal DCA accumulation zones',
    icon: 'PiggyBank',
    defaultCoin: 'bitcoin',
    defaultDays: 730,
    endpoints: ['ohlc', 'coin_history', 'fear_greed'],
    parameterDefs: [
      { key: 'sma_long', label: 'SMA Long', min: 100, max: 300, step: 10, defaultValue: 200, layerSource: 'sma' },
    ],
    layers: [
      { label: 'Price', source: 'price', chartType: 'line', yAxis: 'left', color: '#34d399', visible: true, gridIndex: 0 },
      { label: 'SMA 200', source: 'sma', chartType: 'line', yAxis: 'left', color: '#ef4444', visible: true, gridIndex: 0, params: { window: 200 } },
      { label: 'Drawdown %', source: 'drawdown', chartType: 'area', yAxis: 'right', color: '#f97316', visible: true, gridIndex: 0 },
      { label: 'Fear & Greed', source: 'fear_greed', chartType: 'area', yAxis: 'right', color: '#f472b6', visible: true, gridIndex: 1 },
      { label: 'Volume', source: 'volume', chartType: 'bar', yAxis: 'right', color: '#60a5fa', visible: true, gridIndex: 1 },
    ],
  },

  {
    id: 'mean-reversion',
    name: 'Mean Reversion',
    description: 'BB touch + RSI extreme + Stochastic confirm = high-probability reversion to mean entry',
    icon: 'Undo2',
    defaultCoin: 'bitcoin',
    defaultDays: 90,
    endpoints: ['ohlc', 'coin_history'],
    parameterDefs: [
      { key: 'bb_period', label: 'BB Period', min: 10, max: 50, step: 1, defaultValue: 20, layerSource: 'bollinger_upper' },
      { key: 'bb_mult', label: 'BB Mult', min: 1, max: 4, step: 0.5, defaultValue: 2, layerSource: 'bollinger_upper' },
      { key: 'rsi_period', label: 'RSI Period', min: 5, max: 30, step: 1, defaultValue: 14, layerSource: 'rsi' },
      { key: 'stoch_k', label: 'Stoch K', min: 5, max: 30, step: 1, defaultValue: 14, layerSource: 'stochastic_k' },
    ],
    layers: [
      { label: 'Price (OHLC)', source: 'ohlc', chartType: 'candlestick', yAxis: 'left', color: '#34d399', visible: true, gridIndex: 0 },
      { label: 'BB Upper', source: 'bollinger_upper', chartType: 'line', yAxis: 'left', color: '#f59e0b', visible: true, gridIndex: 0, params: { window: 20, multiplier: 2 } },
      { label: 'SMA 20', source: 'sma', chartType: 'line', yAxis: 'left', color: '#60a5fa', visible: true, gridIndex: 0, params: { window: 20 } },
      { label: 'BB Lower', source: 'bollinger_lower', chartType: 'line', yAxis: 'left', color: '#f59e0b', visible: true, gridIndex: 0, params: { window: 20, multiplier: 2 } },
      { label: 'RSI', source: 'rsi', chartType: 'line', yAxis: 'right', color: '#a78bfa', visible: true, gridIndex: 1, params: { period: 14 } },
      { label: 'Stochastic %K', source: 'stochastic_k', chartType: 'line', yAxis: 'right', color: '#06b6d4', visible: true, gridIndex: 1, params: { kPeriod: 14, dPeriod: 3, smooth: 3 } },
    ],
  },

  {
    id: 'market-cycle',
    name: 'Market Cycle',
    description: 'SMA 50/200 cross + market cap trend + DeFi TVL = macro cycle phase identification',
    icon: 'Orbit',
    defaultCoin: 'bitcoin',
    defaultDays: 730,
    endpoints: ['ohlc', 'coin_history', 'defillama_tvl_history'],
    parameterDefs: [
      { key: 'sma_short', label: 'SMA Fast', min: 20, max: 100, step: 5, defaultValue: 50, layerSource: 'sma' },
      { key: 'sma_long', label: 'SMA Slow', min: 100, max: 300, step: 10, defaultValue: 200, layerSource: 'sma' },
    ],
    layers: [
      { label: 'Price', source: 'price', chartType: 'line', yAxis: 'left', color: '#34d399', visible: true, gridIndex: 0 },
      { label: 'SMA 50', source: 'sma', chartType: 'line', yAxis: 'left', color: '#f59e0b', visible: true, gridIndex: 0, params: { window: 50 } },
      { label: 'SMA 200', source: 'sma', chartType: 'line', yAxis: 'left', color: '#ef4444', visible: true, gridIndex: 0, params: { window: 200 } },
      { label: 'Market Cap', source: 'market_cap', chartType: 'area', yAxis: 'right', color: '#818cf8', visible: true, gridIndex: 0 },
      { label: 'DeFi TVL', source: 'defi_tvl', chartType: 'area', yAxis: 'right', color: '#2dd4bf', visible: true, gridIndex: 1 },
      { label: 'Volume', source: 'volume', chartType: 'bar', yAxis: 'right', color: '#60a5fa', visible: true, gridIndex: 1 },
    ],
  },

  {
    id: 'funding-arbitrage',
    name: 'Funding Arbitrage',
    description: 'Extreme funding rate + RSI divergence = leveraged position opportunity or liquidation warning',
    icon: 'Scale',
    defaultCoin: 'bitcoin',
    defaultDays: 30,
    endpoints: ['ohlc', 'coin_history', 'derivatives'],
    parameterDefs: [
      { key: 'rsi_period', label: 'RSI Period', min: 5, max: 30, step: 1, defaultValue: 14, layerSource: 'rsi' },
      { key: 'ema_window', label: 'EMA', min: 5, max: 50, step: 1, defaultValue: 21, layerSource: 'ema' },
    ],
    layers: [
      { label: 'Price (OHLC)', source: 'ohlc', chartType: 'candlestick', yAxis: 'left', color: '#34d399', visible: true, gridIndex: 0 },
      { label: 'EMA 21', source: 'ema', chartType: 'line', yAxis: 'left', color: '#f59e0b', visible: true, gridIndex: 0, params: { window: 21 } },
      { label: 'Funding Rate (now)', source: 'funding_rate', chartType: 'bar', yAxis: 'right', color: '#2dd4bf', visible: true, gridIndex: 1 },
      { label: 'RSI', source: 'rsi', chartType: 'line', yAxis: 'right', color: '#a78bfa', visible: true, gridIndex: 1, params: { period: 14 } },
      { label: 'Volume', source: 'volume', chartType: 'bar', yAxis: 'right', color: '#60a5fa', visible: true, gridIndex: 1 },
    ],
  },

  {
    id: 'volume-profile',
    name: 'Volume Profile',
    description: 'Volume ratio vs average + daily returns = accumulation, distribution, or exhaustion detection',
    icon: 'BarChart3',
    defaultCoin: 'bitcoin',
    defaultDays: 90,
    endpoints: ['ohlc', 'coin_history'],
    parameterDefs: [
      { key: 'vol_sma', label: 'Vol SMA', min: 5, max: 50, step: 1, defaultValue: 20, layerSource: 'volume_sma' },
      { key: 'ema_window', label: 'EMA', min: 5, max: 50, step: 1, defaultValue: 20, layerSource: 'ema' },
    ],
    layers: [
      { label: 'Price (OHLC)', source: 'ohlc', chartType: 'candlestick', yAxis: 'left', color: '#34d399', visible: true, gridIndex: 0 },
      { label: 'EMA 20', source: 'ema', chartType: 'line', yAxis: 'left', color: '#f59e0b', visible: true, gridIndex: 0, params: { window: 20 } },
      { label: 'Volume', source: 'volume', chartType: 'bar', yAxis: 'right', color: '#60a5fa', visible: true, gridIndex: 1 },
      { label: 'Vol SMA 20', source: 'volume_sma', chartType: 'line', yAxis: 'right', color: '#38bdf8', visible: true, gridIndex: 1, params: { window: 20 } },
      { label: 'Volume Ratio', source: 'volume_ratio', chartType: 'bar', yAxis: 'right', color: '#c084fc', visible: true, gridIndex: 1, params: { window: 20 } },
      { label: 'Daily Return %', source: 'daily_return', chartType: 'bar', yAxis: 'right', color: '#fb7185', visible: true, gridIndex: 1 },
    ],
  },

  {
    id: 'multi-timeframe',
    name: 'Multi-Timeframe',
    description: 'EMA 9 + SMA 21 + SMA 50 alignment + RSI + ATR = multi-timeframe trend confirmation',
    icon: 'Layers3',
    defaultCoin: 'bitcoin',
    defaultDays: 180,
    endpoints: ['ohlc', 'coin_history'],
    parameterDefs: [
      { key: 'ema_fast', label: 'EMA Fast', min: 5, max: 20, step: 1, defaultValue: 9, layerSource: 'ema' },
      { key: 'sma_mid', label: 'SMA Mid', min: 15, max: 50, step: 1, defaultValue: 21, layerSource: 'sma' },
      { key: 'sma_slow', label: 'SMA Slow', min: 30, max: 100, step: 5, defaultValue: 50, layerSource: 'sma' },
      { key: 'rsi_period', label: 'RSI Period', min: 5, max: 30, step: 1, defaultValue: 14, layerSource: 'rsi' },
      { key: 'atr_period', label: 'ATR Period', min: 5, max: 30, step: 1, defaultValue: 14, layerSource: 'atr' },
    ],
    layers: [
      { label: 'Price (OHLC)', source: 'ohlc', chartType: 'candlestick', yAxis: 'left', color: '#34d399', visible: true, gridIndex: 0 },
      { label: 'EMA 9', source: 'ema', chartType: 'line', yAxis: 'left', color: '#f59e0b', visible: true, gridIndex: 0, params: { window: 9 } },
      { label: 'SMA 21', source: 'sma', chartType: 'line', yAxis: 'left', color: '#60a5fa', visible: true, gridIndex: 0, params: { window: 21 } },
      { label: 'SMA 50', source: 'sma', chartType: 'line', yAxis: 'left', color: '#ef4444', visible: true, gridIndex: 0, params: { window: 50 } },
      { label: 'RSI', source: 'rsi', chartType: 'line', yAxis: 'right', color: '#a78bfa', visible: true, gridIndex: 1, params: { period: 14 } },
      { label: 'ATR', source: 'atr', chartType: 'line', yAxis: 'right', color: '#a3e635', visible: true, gridIndex: 1, params: { period: 14 } },
    ],
  },
];

/** Preset categories for organized toolbar UI */
export const PRESET_CATEGORIES: { label: string; presetIds: string[] }[] = [
  { label: 'Trend & Entry', presetIds: ['confluence-zones', 'trend-strength', 'mean-reversion', 'multi-timeframe'] },
  { label: 'Momentum & Volatility', presetIds: ['momentum-divergence', 'volatility-squeeze', 'volume-profile', 'risk-regime'] },
  { label: 'Sentiment & Macro', presetIds: ['sentiment-contrarian', 'market-rotation', 'market-cycle', 'dca-accumulator'] },
  { label: 'Derivatives & DeFi', presetIds: ['derivatives-pressure', 'funding-arbitrage', 'smart-money', 'defi-value'] },
];

export function getPresetById(id: string): OverlayPreset | undefined {
  return OVERLAY_PRESETS.find((p) => p.id === id);
}
