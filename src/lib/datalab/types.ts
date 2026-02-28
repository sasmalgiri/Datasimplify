// DataLab: Interactive Data Manipulation + Chart Superimposition

export type ChartType = 'line' | 'bar' | 'area' | 'scatter' | 'candlestick';
export type YAxisSide = 'left' | 'right';

// ── 3-Mode System ──────────────────────────────────────────────────────────

export type DataLabMode = 'simple' | 'intermediate' | 'advanced';

export interface ModeFeatures {
  formulaEngine: boolean;
  powerCombos: boolean;
  regimeDetection: boolean;
  eventMarkers: boolean;
  whatIfSimulator: boolean;
  labNotebook: boolean;
  signalReliability: boolean;
  normalizeMode: boolean;
  logScale: boolean;
  dataTable: boolean;
  // Phase 2: Simple mode features
  dataQualityWarnings: boolean;
  autoRefresh: boolean;
  // Phase 3: Intermediate features
  keyboardShortcuts: boolean;
  commandPalette: boolean;
  autoDivergence: boolean;
  rollingCorrelation: boolean;
  advancedDrawings: boolean;
  annotationsTimeline: boolean;
  tableVirtualization: boolean;
  fullUndoRedo: boolean;
  pineScriptExport: boolean;
  // Phase 4: Advanced features
  multiChart: boolean;
  strategyBacktester: boolean;
  alertWebhooks: boolean;
  chartPatterns: boolean;
  persistentNotebooks: boolean;
  aiAnomalyDetection: boolean;
  naturalLanguageQuery: boolean;
  liquidationHeatmap: boolean;
  whaleWalletTracking: boolean;
}

export interface ModeConfig {
  mode: DataLabMode;
  label: string;
  description: string;
  allowedPresetIds: string[] | 'all';
  allowedDataSources: DataSource[] | 'all';
  allowedDrawingTools: string[] | 'all';
  features: ModeFeatures;
}

// ── Divergence Detection ───────────────────────────────────────────────────

export interface DivergenceSignal {
  type: 'bullish' | 'bearish';
  indicator: 'rsi' | 'macd';
  startIdx: number;
  endIdx: number;
  priceStart: number;
  priceEnd: number;
  indicatorStart: number;
  indicatorEnd: number;
  strength: 'strong' | 'moderate' | 'weak';
}

// ── Data Quality ───────────────────────────────────────────────────────────

export interface DataQualityWarning {
  type: 'stale_data' | 'data_gaps' | 'insufficient_candles' | 'zero_volume' | 'flat_price';
  severity: 'info' | 'warning' | 'error';
  message: string;
  affectedLayer?: string;
}

// ── Anomaly Detection ──────────────────────────────────────────────────────

export interface Anomaly {
  index: number;
  timestamp: number;
  type: 'volume_spike' | 'volatility_spike' | 'price_gap' | 'unusual_candle';
  severity: 'low' | 'medium' | 'high';
  description: string;
  zScore: number;
}

// ── Chart Pattern Recognition ──────────────────────────────────────────────

export type PatternType =
  | 'head_and_shoulders' | 'inverse_head_and_shoulders'
  | 'double_top' | 'double_bottom'
  | 'ascending_wedge' | 'descending_wedge'
  | 'ascending_triangle' | 'descending_triangle'
  | 'cup_and_handle';

export interface DetectedPattern {
  type: PatternType;
  startIdx: number;
  endIdx: number;
  keyPoints: { idx: number; value: number; label: string }[];
  confidence: number;
  implication: 'bullish' | 'bearish';
  targetPrice?: number;
}

// ── Backtest ───────────────────────────────────────────────────────────────

export interface BacktestResult {
  trades: { entryIdx: number; exitIdx: number; returnPct: number }[];
  equity: number[];
  totalReturn: number;
  maxDrawdown: number;
  sharpeRatio: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
}

// ── Undo/Redo ──────────────────────────────────────────────────────────────

export type UndoableActionType =
  | 'cell_edit'
  | 'add_layer'
  | 'remove_layer'
  | 'toggle_layer'
  | 'add_drawing'
  | 'remove_drawing'
  | 'clear_drawings'
  | 'param_change'
  | 'add_note'
  | 'remove_note';

export interface UndoableAction {
  type: UndoableActionType;
  timestamp: number;
  description: string;
  undo: () => void;
  redo: () => void;
}

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
  // Additional indicators
  | 'vwap'
  | 'obv'
  | 'ichimoku_tenkan'
  | 'ichimoku_kijun'
  | 'ichimoku_senkou_a'
  | 'ichimoku_senkou_b'
  | 'adx'
  | 'williams_r'
  | 'cci'
  // On-chain data (Blockchain.com — free, no key)
  | 'hashrate'
  | 'difficulty'
  | 'active_addresses'
  | 'tx_count'
  | 'miners_revenue'
  // Stablecoin supply (DeFi Llama — free)
  | 'stablecoin_mcap'
  // User-edited / ratio
  | 'ratio'
  | 'custom'
  // User formula
  | 'formula'
  // Rolling correlation (intermediate mode)
  | 'rolling_correlation';

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
  { source: 'vwap', label: 'VWAP', chartType: 'line', yAxis: 'left', gridIndex: 0, color: '#e879f9', endpoints: ['ohlc', 'coin_history'] },
  { source: 'obv', label: 'OBV (On-Balance Volume)', chartType: 'line', yAxis: 'right', gridIndex: 1, color: '#38bdf8', endpoints: ['ohlc', 'coin_history'] },
  { source: 'ichimoku_tenkan', label: 'Ichimoku Tenkan', chartType: 'line', yAxis: 'left', gridIndex: 0, color: '#22d3ee', endpoints: ['ohlc'] },
  { source: 'ichimoku_kijun', label: 'Ichimoku Kijun', chartType: 'line', yAxis: 'left', gridIndex: 0, color: '#f472b6', endpoints: ['ohlc'] },
  { source: 'ichimoku_senkou_a', label: 'Ichimoku Senkou A', chartType: 'line', yAxis: 'left', gridIndex: 0, color: '#34d399', endpoints: ['ohlc'] },
  { source: 'ichimoku_senkou_b', label: 'Ichimoku Senkou B', chartType: 'line', yAxis: 'left', gridIndex: 0, color: '#ef4444', endpoints: ['ohlc'] },
  { source: 'adx', label: 'ADX (Trend Strength)', chartType: 'line', yAxis: 'right', gridIndex: 1, color: '#fb923c', endpoints: ['ohlc'] },
  { source: 'williams_r', label: 'Williams %R', chartType: 'line', yAxis: 'right', gridIndex: 1, color: '#c084fc', endpoints: ['ohlc'] },
  { source: 'cci', label: 'CCI', chartType: 'line', yAxis: 'right', gridIndex: 1, color: '#fbbf24', endpoints: ['ohlc'] },
  { source: 'fear_greed', label: 'Fear & Greed Index', chartType: 'area', yAxis: 'right', gridIndex: 0, color: '#f472b6', endpoints: ['fear_greed'] },
  { source: 'btc_dominance', label: 'BTC Dominance % (Current)', chartType: 'line', yAxis: 'right', gridIndex: 0, color: '#fbbf24', endpoints: ['global'] },
  { source: 'funding_rate', label: 'Funding Rate (Current)', chartType: 'bar', yAxis: 'right', gridIndex: 1, color: '#2dd4bf', endpoints: ['derivatives'] },
  { source: 'defi_tvl', label: 'DeFi TVL', chartType: 'area', yAxis: 'right', gridIndex: 0, color: '#818cf8', endpoints: ['defillama_tvl_history'] },
  // On-chain data (free, no API key needed — BTC only)
  { source: 'hashrate', label: 'BTC Hashrate', chartType: 'line', yAxis: 'right', gridIndex: 0, color: '#f97316', endpoints: ['blockchain_onchain'] },
  { source: 'difficulty', label: 'BTC Difficulty', chartType: 'line', yAxis: 'right', gridIndex: 0, color: '#ef4444', endpoints: ['blockchain_onchain'] },
  { source: 'active_addresses', label: 'Active Addresses', chartType: 'bar', yAxis: 'right', gridIndex: 1, color: '#22d3ee', endpoints: ['blockchain_onchain'] },
  { source: 'tx_count', label: 'Transaction Count', chartType: 'bar', yAxis: 'right', gridIndex: 1, color: '#a78bfa', endpoints: ['blockchain_onchain'] },
  { source: 'miners_revenue', label: 'Miners Revenue ($)', chartType: 'area', yAxis: 'right', gridIndex: 1, color: '#fbbf24', endpoints: ['blockchain_onchain'] },
  { source: 'stablecoin_mcap', label: 'Stablecoin Supply', chartType: 'area', yAxis: 'right', gridIndex: 0, color: '#2dd4bf', endpoints: ['defillama_stablecoin_history'] },
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
