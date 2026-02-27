// DataLab: Interactive Data Manipulation + Chart Superimposition

export type ChartType = 'line' | 'bar' | 'area' | 'scatter' | 'candlestick';
export type YAxisSide = 'left' | 'right';

export type DataSource =
  // Fetched from CoinGecko
  | 'price'
  | 'volume'
  | 'ohlc'
  // Derivatives
  | 'funding_rate'
  | 'open_interest'
  // Free APIs
  | 'fear_greed'
  | 'btc_dominance'
  | 'defi_tvl'
  // Calculated from price data
  | 'sma'
  | 'ema'
  | 'rsi'
  | 'macd'
  | 'macd_signal'
  | 'macd_histogram'
  | 'bollinger_upper'
  | 'bollinger_lower'
  | 'stochastic_k'
  | 'stochastic_d'
  | 'atr'
  | 'normalized'
  // Derived indicators
  | 'bb_width'
  | 'volume_sma'
  | 'volume_ratio'
  | 'daily_return'
  | 'drawdown'
  | 'market_cap'
  | 'rolling_volatility'
  | 'rsi_sma'
  // User-edited / ratio
  | 'ratio'
  | 'custom'
  // User formula
  | 'formula';

export interface OverlayLayer {
  id: string;
  label: string;
  source: DataSource;
  chartType: ChartType;
  yAxis: YAxisSide;
  color: string;
  visible: boolean;
  gridIndex: number; // 0 = main chart, 1 = bottom sub-grid (volume/RSI)
  data: (number | null)[];
  params?: Record<string, number>; // e.g. { window: 20 } for SMA
  formula?: string; // User-defined formula expression (for source: 'formula')
}

export interface OverlayPreset {
  id: string;
  name: string;
  description: string;
  icon: string;
  layers: Omit<OverlayLayer, 'id' | 'data'>[];
  endpoints: string[];
  defaultCoin: string;
  defaultDays: number;
  parameterDefs: ParameterDef[];
  zones?: ZoneRule[];
}

export interface ParameterDef {
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  unit?: string;
  layerSource: DataSource;
}

export interface EditHistoryEntry {
  layerId: string;
  index: number;
  oldValue: number;
}

/** Zone shading rule: highlights regions where a source crosses a threshold */
export interface ZoneRule {
  source: DataSource;
  condition: 'above' | 'below';
  threshold: number;
  color: string;
  opacity: number;
  label?: string;
}

/** Available data source options for "Add Layer" dropdown */
export const DATA_SOURCE_OPTIONS: {
  source: DataSource;
  label: string;
  chartType: ChartType;
  yAxis: YAxisSide;
  gridIndex: number;
  color: string;
  endpoints: string[];
}[] = [
  { source: 'price', label: 'Price', chartType: 'line', yAxis: 'left', gridIndex: 0, color: '#34d399', endpoints: ['ohlc'] },
  { source: 'volume', label: 'Volume', chartType: 'bar', yAxis: 'right', gridIndex: 1, color: '#60a5fa', endpoints: ['ohlc', 'coin_history'] },
  { source: 'ohlc', label: 'Candlestick (OHLC)', chartType: 'candlestick', yAxis: 'left', gridIndex: 0, color: '#34d399', endpoints: ['ohlc'] },
  { source: 'sma', label: 'SMA (Moving Average)', chartType: 'line', yAxis: 'left', gridIndex: 0, color: '#f59e0b', endpoints: ['ohlc'] },
  { source: 'ema', label: 'EMA (Exponential MA)', chartType: 'line', yAxis: 'left', gridIndex: 0, color: '#fb923c', endpoints: ['ohlc'] },
  { source: 'rsi', label: 'RSI', chartType: 'line', yAxis: 'right', gridIndex: 1, color: '#a78bfa', endpoints: ['ohlc'] },
  { source: 'macd', label: 'MACD Line', chartType: 'line', yAxis: 'right', gridIndex: 1, color: '#ec4899', endpoints: ['ohlc'] },
  { source: 'macd_signal', label: 'MACD Signal', chartType: 'line', yAxis: 'right', gridIndex: 1, color: '#f97316', endpoints: ['ohlc'] },
  { source: 'macd_histogram', label: 'MACD Histogram', chartType: 'bar', yAxis: 'right', gridIndex: 1, color: '#6366f1', endpoints: ['ohlc'] },
  { source: 'bollinger_upper', label: 'Bollinger Upper', chartType: 'line', yAxis: 'left', gridIndex: 0, color: '#f59e0b', endpoints: ['ohlc'] },
  { source: 'bollinger_lower', label: 'Bollinger Lower', chartType: 'line', yAxis: 'left', gridIndex: 0, color: '#f59e0b', endpoints: ['ohlc'] },
  { source: 'stochastic_k', label: 'Stochastic %K', chartType: 'line', yAxis: 'right', gridIndex: 1, color: '#06b6d4', endpoints: ['ohlc'] },
  { source: 'stochastic_d', label: 'Stochastic %D', chartType: 'line', yAxis: 'right', gridIndex: 1, color: '#f472b6', endpoints: ['ohlc'] },
  { source: 'atr', label: 'ATR (Avg True Range)', chartType: 'line', yAxis: 'right', gridIndex: 1, color: '#a3e635', endpoints: ['ohlc'] },
  { source: 'fear_greed', label: 'Fear & Greed Index', chartType: 'area', yAxis: 'right', gridIndex: 0, color: '#f472b6', endpoints: ['fear_greed'] },
  { source: 'btc_dominance', label: 'BTC Dominance % (Current)', chartType: 'line', yAxis: 'right', gridIndex: 0, color: '#fbbf24', endpoints: ['global'] },
  { source: 'funding_rate', label: 'Funding Rate (Current)', chartType: 'bar', yAxis: 'right', gridIndex: 1, color: '#2dd4bf', endpoints: ['derivatives'] },
  { source: 'defi_tvl', label: 'DeFi TVL', chartType: 'area', yAxis: 'right', gridIndex: 0, color: '#818cf8', endpoints: ['defillama_tvl_history'] },
  // Derived indicators
  { source: 'bb_width', label: 'BB Width %', chartType: 'line', yAxis: 'right', gridIndex: 1, color: '#f59e0b', endpoints: ['ohlc'] },
  { source: 'volume_sma', label: 'Volume SMA', chartType: 'line', yAxis: 'right', gridIndex: 1, color: '#38bdf8', endpoints: ['ohlc', 'coin_history'] },
  { source: 'volume_ratio', label: 'Volume Ratio', chartType: 'bar', yAxis: 'right', gridIndex: 1, color: '#c084fc', endpoints: ['ohlc', 'coin_history'] },
  { source: 'daily_return', label: 'Daily Return %', chartType: 'bar', yAxis: 'right', gridIndex: 1, color: '#fb7185', endpoints: ['ohlc'] },
  { source: 'drawdown', label: 'Drawdown %', chartType: 'area', yAxis: 'right', gridIndex: 1, color: '#ef4444', endpoints: ['ohlc'] },
  { source: 'market_cap', label: 'Market Cap', chartType: 'area', yAxis: 'right', gridIndex: 0, color: '#818cf8', endpoints: ['coin_history'] },
  { source: 'rolling_volatility', label: 'Volatility (Ann.)', chartType: 'line', yAxis: 'right', gridIndex: 1, color: '#f97316', endpoints: ['ohlc'] },
  { source: 'rsi_sma', label: 'RSI Smoothed', chartType: 'line', yAxis: 'right', gridIndex: 1, color: '#d946ef', endpoints: ['ohlc'] },
];
