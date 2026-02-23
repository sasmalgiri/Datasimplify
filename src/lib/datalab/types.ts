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
  | 'normalized'
  // User-edited / ratio
  | 'ratio'
  | 'custom';

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
  { source: 'fear_greed', label: 'Fear & Greed Index', chartType: 'area', yAxis: 'right', gridIndex: 0, color: '#f472b6', endpoints: ['fear_greed'] },
  { source: 'btc_dominance', label: 'BTC Dominance % (Current)', chartType: 'line', yAxis: 'right', gridIndex: 0, color: '#fbbf24', endpoints: ['global'] },
  { source: 'funding_rate', label: 'Funding Rate (Current)', chartType: 'bar', yAxis: 'right', gridIndex: 1, color: '#2dd4bf', endpoints: ['derivatives'] },
  { source: 'defi_tvl', label: 'DeFi TVL', chartType: 'area', yAxis: 'right', gridIndex: 0, color: '#818cf8', endpoints: ['defillama_tvl_history'] },
];
