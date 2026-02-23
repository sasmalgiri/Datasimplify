import type { OverlayPreset } from './types';

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
];

export function getPresetById(id: string): OverlayPreset | undefined {
  return OVERLAY_PRESETS.find((p) => p.id === id);
}
