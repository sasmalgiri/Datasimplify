'use client';

import { useState, useRef, useEffect, type ReactNode } from 'react';
import {
  Target, Brain, Gauge, RefreshCw, Layers,
  Activity, TrendingUp, Zap,
  Trash2, Plus, Camera, FlaskConical,
  RotateCcw, Table2, Maximize2, Undo2,
  Loader2, Search, ChevronDown, Download, Share2, Check,
  Pencil, Minus, TrendingDown, X,
  HeartPulse, ShieldAlert, PiggyBank,
  Orbit, Scale, BarChart3, Layers3,
  Radar, MapPin, Combine, BookOpen, Sliders, Calendar,
  Type, AlertTriangle, BarChart2, Code,
} from 'lucide-react';
import { generateCSV, downloadCSV } from '@/lib/datalab/csvExport';
import { buildShareURL } from '@/lib/datalab/urlState';
import { validateFormula } from '@/lib/datalab/formulaEngine';
import { useDataLabStore, BTC_ONLY_SOURCES } from '@/lib/datalab/store';
import { OVERLAY_PRESETS, PRESET_CATEGORIES } from '@/lib/datalab/presets';
import { DATA_SOURCE_OPTIONS } from '@/lib/datalab/types';
import type { ParameterDef } from '@/lib/datalab/types';
import { isFeatureAvailable, isPresetAllowed, getFilteredDataSources, getFilteredDrawingTools } from '@/lib/datalab/modeConfig';
import { ModeToggle } from './toolbar/ModeToggle';
import { DataQualityBar } from './toolbar/DataQualityBar';
import { AutoRefreshIndicator } from './toolbar/AutoRefreshIndicator';
import { DRAWING_CLICK_COUNT, type DrawingType } from '@/lib/datalab/drawingTypes';
import { inferLayerParamKey, inferTargetSources } from '@/lib/datalab/parameterBinding';
import { POWER_COMBOS } from '@/lib/datalab/powerCombos';
import { REGIME_COLORS, REGIME_LABELS, type MarketRegime } from '@/lib/datalab/regimeDetection';
import { EVENT_CATEGORY_LABELS, type EventCategory } from '@/lib/datalab/eventMarkers';
import { computeSignalReliability, LOOKFORWARD_DAYS, LOOKFORWARD_LABELS, type SignalResult } from '@/lib/datalab/signalReliability';
import { computeSMA, computeRSI, computeMACD, computeBollingerBands } from '@/lib/datalab/calculations';
import { exportToPineScript, exportToPython } from '@/lib/datalab/codeExport';
import { CommandPalette } from './CommandPalette';
import { KeyboardShortcutHandler } from './KeyboardShortcutHandler';
import { AnnotationsTimeline } from './toolbar/AnnotationsTimeline';
import { NaturalLanguageBar } from './NaturalLanguageBar';
import { LiquidationHeatmap } from './LiquidationHeatmap';
import { DataLabBacktester } from './DataLabBacktester';
import { WhaleWalletPanel } from './WhaleWalletPanel';
import { MultiChartLayout } from './MultiChartLayout';
import { AlertWebhookPanel } from './AlertWebhookPanel';

// ─── Dark-theme hover tooltip ──────────────────────────────────────
function Tip({ children, text, position = 'bottom' }: {
  children: ReactNode;
  text: string;
  position?: 'top' | 'bottom';
}) {
  const [show, setShow] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => { timer.current = setTimeout(() => setShow(true), 200); }}
      onMouseLeave={() => { if (timer.current) clearTimeout(timer.current); setShow(false); }}
    >
      {children}
      {show && text && (
        <span className={`absolute z-[100] ${
          position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'
        } left-1/2 -translate-x-1/2 px-3 py-2 text-[11px] leading-relaxed text-gray-200 bg-gray-900 border border-white/[0.1] rounded-lg shadow-xl max-w-sm whitespace-normal pointer-events-none`}>
          {text}
        </span>
      )}
    </span>
  );
}

// ─── Icon map ──────────────────────────────────────────────────────
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Target, Brain, Gauge, RefreshCw, Layers,
  Activity, TrendingUp, Zap,
  HeartPulse, ShieldAlert, PiggyBank, Undo2,
  Orbit, Scale, BarChart3, Layers3, TrendingDown,
};

// ─── Preset tooltip text ───────────────────────────────────────────
const PRESET_META: Record<string, { short: string; tip: string }> = {
  'confluence-zones': {
    short: 'Confluence',
    tip: 'Confluence Zones: RSI oversold + price at MA support + volume spike = high-probability entry.\nLoads: Candlestick, SMA 20/50/200, RSI, Volume',
  },
  'smart-money': {
    short: 'Smart Money',
    tip: 'Smart Money Tracker: Exchange outflows + flat price = smart money accumulation signal.\nLoads: Price, SMA 7, Volume',
  },
  'derivatives-pressure': {
    short: 'Derivatives',
    tip: 'Derivatives Pressure: Extreme funding rate + high open interest = liquidation cascade risk.\nLoads: Price, SMA, Funding Rate, Volume',
  },
  'market-rotation': {
    short: 'Rotation',
    tip: 'Market Rotation: BTC dominance drop + greed rising = altseason entry signal.\nLoads: BTC Price, Dominance %, Fear & Greed',
  },
  'defi-value': {
    short: 'DeFi Value',
    tip: 'DeFi Value Play: DeFi TVL growing faster than ETH price = undervalued ecosystem.\nLoads: ETH Price, SMA, DeFi TVL, Volume',
  },
  'volatility-squeeze': {
    short: 'Vol Squeeze',
    tip: 'Volatility Squeeze: Bollinger Bands narrowing + low ATR = explosive breakout imminent.\nLoads: Candlestick, BB Upper/Lower, SMA 20, ATR, Volume',
  },
  'momentum-divergence': {
    short: 'Momentum',
    tip: 'Momentum Divergence: Price at highs but MACD declining = potential reversal warning.\nLoads: Candlestick, MACD Line, Signal, Histogram',
  },
  'trend-strength': {
    short: 'Trend',
    tip: 'Trend Strength: EMA 12/26 alignment + Stochastic crossover = strong trend confirmation.\nLoads: Candlestick, EMA 12/26, Stochastic %K/%D, Volume',
  },
  'sentiment-contrarian': {
    short: 'Sentiment',
    tip: 'Sentiment Contrarian: Extreme fear + RSI oversold + price at MA support = high-probability bounce.\nLoads: Price, SMA 50, Fear & Greed, RSI, Volume',
  },
  'risk-regime': {
    short: 'Risk',
    tip: 'Risk Regime: Drawdown depth + rising volatility + BB expansion = risk-off environment.\nLoads: Price, SMA 50, Drawdown %, Rolling Volatility, BB Width',
  },
  'dca-accumulator': {
    short: 'DCA',
    tip: 'DCA Accumulator: Deep drawdown + extreme fear + price below 200 SMA = optimal accumulation zone.\nLoads: Price, SMA 200, Drawdown %, Fear & Greed, Volume',
  },
  'mean-reversion': {
    short: 'Mean Rev',
    tip: 'Mean Reversion: Price at Bollinger extremes + RSI/Stochastic divergence = snap-back trade.\nLoads: Candlestick, BB Upper/Lower, SMA 20, RSI, Stochastic %K',
  },
  'market-cycle': {
    short: 'Cycle',
    tip: 'Market Cycle: SMA 50/200 crossovers (golden/death cross) + market cap trend = macro phase.\nLoads: Price, SMA 50/200, Market Cap, DeFi TVL, Volume',
  },
  'funding-arbitrage': {
    short: 'Funding',
    tip: 'Funding Arbitrage: Extreme funding rate + RSI divergence = opportunity to fade the crowd.\nLoads: Candlestick, EMA 21, Funding Rate, RSI, Volume',
  },
  'volume-profile': {
    short: 'Volume',
    tip: 'Volume Profile: Volume spikes vs SMA + relative volume ratio = institutional interest detection.\nLoads: Candlestick, EMA 20, Volume, Vol SMA, Vol Ratio, Daily Return',
  },
  'multi-timeframe': {
    short: 'Multi-TF',
    tip: 'Multi-Timeframe: EMA 9 + SMA 21/50 alignment + RSI + ATR = trend confirmation across timeframes.\nLoads: Candlestick, EMA 9, SMA 21/50, RSI, ATR',
  },
  // Simple mode presets
  'simple-price-trends': {
    short: 'Trends',
    tip: 'Price Trends: See where the price is heading with 50-day and 200-day moving averages.\nLoads: Price, MA 50, MA 200',
  },
  'simple-market-mood': {
    short: 'Mood',
    tip: 'Market Mood: Price + Fear & Greed Index — see when the crowd is greedy or fearful.\nLoads: Price, Fear & Greed',
  },
  'simple-value-zones': {
    short: 'Value',
    tip: 'Value Zones: RSI shows when price is oversold (cheap) or overbought (expensive).\nLoads: Price, RSI, Volume',
  },
  'simple-volume-watch': {
    short: 'Volume',
    tip: 'Volume Watch: Candlesticks with volume — spot big buying/selling days at a glance.\nLoads: Candlestick, Volume, Volume Ratio',
  },
  'simple-risk-check': {
    short: 'Risk',
    tip: 'Risk Check: Track drawdowns and volatility to understand current risk levels.\nLoads: Price, Drawdown %, Volatility',
  },
};

// ─── Data source tooltips ──────────────────────────────────────────
const SOURCE_TIPS: Record<string, string> = {
  price: 'Closing price line chart from OHLC data',
  volume: 'Total trading volume in USD',
  ohlc: 'Candlestick chart — Open / High / Low / Close',
  sma: 'Simple Moving Average — smooths price over N periods',
  ema: 'Exponential Moving Average — weighted toward recent prices',
  rsi: 'Relative Strength Index — momentum oscillator (0-100). <30 oversold, >70 overbought',
  fear_greed: 'Fear & Greed Index — market sentiment from Alternative.me (0-100)',
  btc_dominance: 'BTC market cap as % of total crypto market (current snapshot)',
  funding_rate: 'Perpetual futures funding rate across exchanges (current snapshot)',
  defi_tvl: 'Total Value Locked across all DeFi protocols (DeFiLlama)',
  macd: 'MACD Line — difference between fast and slow EMA. Crosses above signal = bullish',
  macd_signal: 'MACD Signal Line — EMA of the MACD line. Crossovers indicate momentum shifts',
  macd_histogram: 'MACD Histogram — visual gap between MACD and signal. Growing bars = strengthening trend',
  bollinger_upper: 'Bollinger Upper Band — SMA + 2x standard deviation. Price touching = potentially overbought',
  bollinger_lower: 'Bollinger Lower Band — SMA - 2x standard deviation. Price touching = potentially oversold',
  stochastic_k: 'Stochastic %K — momentum oscillator (0-100). <20 oversold, >80 overbought',
  stochastic_d: 'Stochastic %D — smoothed %K signal line. %K crossing above %D = bullish signal',
  atr: 'Average True Range — measures volatility in price terms. Low ATR = quiet market, high ATR = volatile',
  bb_width: 'Bollinger Band Width % — measures squeeze/expansion. Narrow = breakout imminent, wide = volatile',
  volume_sma: 'Volume SMA — moving average of volume. Compare against raw volume to spot unusual activity',
  volume_ratio: 'Volume Ratio — current volume / SMA. >1.5x = high interest, <0.5x = low interest',
  daily_return: 'Daily Return % — percentage change from previous close. Tracks daily momentum',
  drawdown: 'Drawdown % — decline from rolling all-time high. Shows risk severity and recovery progress',
  market_cap: 'Market Cap — total market capitalization from CoinGecko. Tracks overall value trend',
  rolling_volatility: 'Rolling Volatility — annualized standard deviation of daily returns. Higher = more risk',
  rsi_sma: 'RSI Smoothed — SMA of RSI values. Reduces noise for cleaner overbought/oversold signals',
};

// ─── Parameter tooltips ────────────────────────────────────────────
const PARAM_TIPS: Record<string, string> = {
  sma_short: 'Short-term moving average window — averages the last N prices',
  sma_mid: 'Mid-term moving average window — averages the last N prices',
  sma_long: 'Long-term moving average window — averages the last N prices',
  sma_window: 'Moving average window — averages the last N closing prices to smooth trends',
  rsi_period: 'RSI period — measures momentum; <30 = oversold, >70 = overbought',
  macd_fast: 'MACD fast EMA period — shorter period reacts faster to price changes',
  macd_slow: 'MACD slow EMA period — longer period smooths out noise',
  macd_signal_period: 'MACD signal line period — EMA of the MACD for crossover signals',
  bb_period: 'Bollinger Band period — number of bars for the moving average center line',
  bb_mult: 'Bollinger Band multiplier — standard deviations from center (2 = ~95% of price action)',
  stoch_k: 'Stochastic %K lookback — higher = smoother, lower = more responsive',
  stoch_d: 'Stochastic %D smoothing — signal line averaging period',
  stoch_smooth: 'Stochastic smoothing — applied to raw %K before %D calculation',
  atr_period: 'ATR period — number of bars to average true range over',
  vol_window: 'Volatility window — number of daily returns used for annualized volatility',
  vol_sma: 'Volume SMA window — moving average period for volume smoothing',
  ema_fast: 'Fast EMA period — shorter period for quick trend detection',
  rsi_sma_window: 'RSI smoothing window — SMA period applied to RSI for noise reduction',
};

// ─── Time range options ────────────────────────────────────────────
const TIME_RANGES = [
  { label: '7d', value: 7 },
  { label: '30d', value: 30 },
  { label: '90d', value: 90 },
  { label: '1y', value: 365 },
  { label: '2y', value: 730 },
];

// ─── Coin search cache + popular coins ──────────────────────────────
interface CoinSearchResult {
  id: string;
  symbol: string;
  name: string;
  thumb?: string;
  rank?: number | null;
}

const coinSearchCache = new Map<string, CoinSearchResult[]>();

const POPULAR_COINS: CoinSearchResult[] = [
  { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' },
  { id: 'ethereum', symbol: 'ETH', name: 'Ethereum' },
  { id: 'solana', symbol: 'SOL', name: 'Solana' },
  { id: 'binancecoin', symbol: 'BNB', name: 'BNB' },
  { id: 'ripple', symbol: 'XRP', name: 'XRP' },
  { id: 'cardano', symbol: 'ADA', name: 'Cardano' },
  { id: 'dogecoin', symbol: 'DOGE', name: 'Dogecoin' },
  { id: 'polkadot', symbol: 'DOT', name: 'Polkadot' },
  { id: 'avalanche-2', symbol: 'AVAX', name: 'Avalanche' },
  { id: 'chainlink', symbol: 'LINK', name: 'Chainlink' },
  { id: 'tron', symbol: 'TRX', name: 'TRON' },
  { id: 'uniswap', symbol: 'UNI', name: 'Uniswap' },
];

// ─── Main Component ────────────────────────────────────────────────
interface DataLabToolbarProps {
  onScreenshot?: () => void;
}

export function DataLabToolbar({ onScreenshot }: DataLabToolbarProps) {
  const {
    coin, days, activePreset, layers, parameters, normalizeMode, logScale, vsCurrency,
    showTable, editHistory, timestamps, editedCells, rawData,
    drawings, activeDrawingTool,
    showRegimes, showEvents, eventCategories, customEvents,
    whatIfActive, whatIfParam, whatIfDelta,
    labNotes,
    dataLabMode,
    showDivergences, divergenceSignals, toggleDivergences,
    detectedPatterns, showPatterns, togglePatterns,
    detectedAnomalies, showAnomalies, toggleAnomalies,
    showAnnotationsTimeline,
    setCoin, setDays, loadPreset, loadData, recalculateLayers,
    toggleLayer, removeLayer, addLayer, setParameter,
    toggleNormalize, toggleLogScale, toggleTable,
    setVsCurrency, resetEdits, resetParameters, undoLastEdit,
    setActiveDrawingTool, clearDrawings, addFormulaLayer,
    toggleRegimes, toggleEvents, setEventCategories,
    addCustomEvent, removeCustomEvent,
    setWhatIf, clearWhatIf,
    addLabNote, removeLabNote,
  } = useDataLabStore();

  // Mode-aware filtering
  const feat = (f: keyof import('@/lib/datalab/types').ModeFeatures) => isFeatureAvailable(dataLabMode, f);
  const filteredDataSources = getFilteredDataSources(dataLabMode);
  const filteredDrawingTools = getFilteredDrawingTools(dataLabMode);

  const [showAddLayer, setShowAddLayer] = useState(false);
  const [showAllPresets, setShowAllPresets] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showDrawTools, setShowDrawTools] = useState(false);
  const drawDropRef = useRef<HTMLDivElement>(null);
  const [showFormulaModal, setShowFormulaModal] = useState(false);
  const [formulaInput, setFormulaInput] = useState('');
  const [formulaLabel, setFormulaLabel] = useState('');
  const [formulaError, setFormulaError] = useState<string | null>(null);
  const presetsDropRef = useRef<HTMLDivElement>(null);
  const [coinInput, setCoinInput] = useState(coin);
  const [showCoinDrop, setShowCoinDrop] = useState(false);
  const [coinResults, setCoinResults] = useState<CoinSearchResult[]>([]);
  const [isSearchingCoin, setIsSearchingCoin] = useState(false);
  const coinDropRef = useRef<HTMLDivElement>(null);
  const coinSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // New feature state
  const [showCombosDrop, setShowCombosDrop] = useState(false);
  const combosDropRef = useRef<HTMLDivElement>(null);
  const [showEventsDrop, setShowEventsDrop] = useState(false);
  const eventsDropRef = useRef<HTMLDivElement>(null);
  const [showLabNotebook, setShowLabNotebook] = useState(false);
  const [noteHypothesis, setNoteHypothesis] = useState('');
  const [noteEvidence, setNoteEvidence] = useState('');

  // What-If simulator
  const [showWhatIf, setShowWhatIf] = useState(false);
  const [whatIfLocalDelta, setWhatIfLocalDelta] = useState(0);
  const [whatIfLocalParam, setWhatIfLocalParam] = useState('');

  // Indicator search filter
  const [layerSearch, setLayerSearch] = useState('');

  // Custom event form
  const [customEventDate, setCustomEventDate] = useState('');
  const [customEventLabel, setCustomEventLabel] = useState('');

  // Signal reliability heatmap
  const [showSignalHeatmap, setShowSignalHeatmap] = useState(false);
  const [signalResults, setSignalResults] = useState<SignalResult[]>([]);

  // Command palette
  const [showCommandPalette, setShowCommandPalette] = useState(false);

  // Code export dropdown
  const [showCodeExport, setShowCodeExport] = useState(false);
  const codeExportRef = useRef<HTMLDivElement>(null);

  // Advanced mode panels
  const [showBacktester, setShowBacktester] = useState(false);
  const [showLiquidation, setShowLiquidation] = useState(false);
  const [showWhalePanel, setShowWhalePanel] = useState(false);
  const [showMultiChart, setShowMultiChart] = useState(false);
  const [showAlertWebhook, setShowAlertWebhook] = useState(false);

  // Debounce timer for parameter changes
  const paramDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync coinInput when store coin changes
  useEffect(() => { setCoinInput(coin); }, [coin]);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (coinDropRef.current && !coinDropRef.current.contains(e.target as Node)) {
        setShowCoinDrop(false);
      }
      if (presetsDropRef.current && !presetsDropRef.current.contains(e.target as Node)) {
        setShowAllPresets(false);
      }
      if (drawDropRef.current && !drawDropRef.current.contains(e.target as Node)) {
        setShowDrawTools(false);
      }
      if (combosDropRef.current && !combosDropRef.current.contains(e.target as Node)) {
        setShowCombosDrop(false);
      }
      if (eventsDropRef.current && !eventsDropRef.current.contains(e.target as Node)) {
        setShowEventsDrop(false);
      }
      if (codeExportRef.current && !codeExportRef.current.contains(e.target as Node)) {
        setShowCodeExport(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // ESC key closes all dropdowns
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowAllPresets(false);
        setShowAddLayer(false);
        setShowDrawTools(false);
        setShowCombosDrop(false);
        setShowEventsDrop(false);
        setShowCoinDrop(false);
        setShowCodeExport(false);
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, []);

  // Compute signal reliability when heatmap panel opened
  useEffect(() => {
    if (!showSignalHeatmap || !rawData.price || rawData.price.length === 0) return;
    const closes = rawData.price as number[];
    const rsi = computeRSI(closes, 14);
    const macd = computeMACD(closes, 12, 26, 9);
    const bb = computeBollingerBands(closes, 20, 2);
    const sma50 = computeSMA(closes, 50);
    const sma200 = computeSMA(closes, 200);
    const vol = rawData.volume ?? [];
    const volNums = vol.map((v) => v ?? 0);
    const volSma = computeSMA(volNums, 20);
    const results = computeSignalReliability({
      closes,
      rsi,
      macdLine: macd.macd,
      macdSignal: macd.signal,
      bbUpper: bb.upper,
      bbLower: bb.lower,
      sma50,
      sma200,
      volume: vol,
      volumeSma: volSma,
    });
    setSignalResults(results);
  }, [showSignalHeatmap, rawData]);

  // Debounced CoinGecko search
  useEffect(() => {
    if (coinSearchTimer.current) clearTimeout(coinSearchTimer.current);
    const q = coinInput.trim().toLowerCase();
    if (q.length < 2) {
      setCoinResults([]);
      setIsSearchingCoin(false);
      return;
    }
    if (coinSearchCache.has(q)) {
      setCoinResults(coinSearchCache.get(q)!);
      return;
    }
    setIsSearchingCoin(true);
    coinSearchTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(q)}`,
        );
        if (!res.ok) throw new Error('Search failed');
        const data = await res.json();
        const coins: CoinSearchResult[] = (data.coins || []).slice(0, 20).map((c: any) => ({
          id: c.id,
          symbol: (c.symbol || '').toUpperCase(),
          name: c.name || '',
          thumb: c.thumb,
          rank: c.market_cap_rank || null,
        }));
        coinSearchCache.set(q, coins);
        setCoinResults(coins);
      } catch {
        setCoinResults([]);
      } finally {
        setIsSearchingCoin(false);
      }
    }, 350);
    return () => { if (coinSearchTimer.current) clearTimeout(coinSearchTimer.current); };
  }, [coinInput]);

  const selectCoin = async (coinId: string) => {
    setCoinInput(coinId);
    setShowCoinDrop(false);
    if (coinId !== coin) {
      useDataLabStore.setState({ coin: coinId });
      await loadData();
    }
  };

  const preset = activePreset
    ? OVERLAY_PRESETS.find((p) => p.id === activePreset)
    : null;
  const paramDefs: ParameterDef[] = preset?.parameterDefs ?? [];

  const handleCoinChange = async () => {
    const trimmed = coinInput.trim().toLowerCase();
    if (trimmed && trimmed !== coin) {
      useDataLabStore.setState({ coin: trimmed });
      await loadData();
    }
  };

  const handleDaysChange = async (d: number) => {
    setDays(d);
    await loadData();
  };

  const handleParamChange = (pd: ParameterDef, delta: number) => {
    const current = parameters[pd.key] ?? pd.defaultValue;
    const newVal = Math.max(pd.min, Math.min(pd.max, current + delta * pd.step));
    setParameter(pd.key, newVal);

    const areClose = (a: number, b: number) => Math.abs(a - b) < 1e-9;
    const paramKey = inferLayerParamKey(pd.key);
    const targetSources = inferTargetSources(pd);

    const { layers: currentLayers } = useDataLabStore.getState();
    const updated = currentLayers.map((l) => {
      if (!targetSources.includes(l.source)) return l;
      const existing = l.params?.[paramKey];
      if (existing == null) return l;
      if (!areClose(existing, current)) return l;
      return { ...l, params: { ...(l.params || {}), [paramKey]: newVal } };
    });
    useDataLabStore.setState({ layers: updated });

    // Debounce recalculation
    if (paramDebounceRef.current) clearTimeout(paramDebounceRef.current);
    paramDebounceRef.current = setTimeout(() => {
      recalculateLayers();
    }, 150);
  };

  const loadPowerCombo = async (comboId: string) => {
    const combo = POWER_COMBOS.find((c) => c.id === comboId);
    if (!combo) return;

    for (const layer of combo.layers) {
      const alreadyExists = layers.some(
        (l) => l.source === layer.source && l.chartType === layer.chartType,
      );
      if (!alreadyExists) {
        useDataLabStore.getState().addLayer({
          label: layer.label,
          source: layer.source,
          chartType: layer.chartType,
          yAxis: layer.yAxis,
          color: layer.color,
          visible: true,
          gridIndex: layer.gridIndex,
          params: layer.params,
        });
      }
    }
    recalculateLayers();
    setShowCombosDrop(false);
  };

  const blurActiveEditable = () => {
    if (typeof document === 'undefined') return;
    const active = document.activeElement as HTMLElement | null;
    if (active && (active as any).isContentEditable) {
      active.blur();
    }
  };

  const chipActive = 'bg-emerald-400/20 text-emerald-400 border border-emerald-400/30';
  const chipInactive = 'bg-white/[0.04] text-gray-400 border border-white/[0.06] hover:bg-white/[0.08] hover:text-white';

  return (
    <div className="border-b border-white/[0.06] bg-white/[0.02]">
      {/* ── Row 1: Title + Presets + Coin + Time + Screenshot ────── */}
      <div className="px-4 py-2 flex items-center gap-2 flex-wrap max-w-[1800px] mx-auto">
        <div className="flex items-center gap-2 mr-1">
          <FlaskConical className="w-4 h-4 text-emerald-400" />
          <span className="text-sm font-bold text-white">DataLab</span>
        </div>

        <ModeToggle />

        <div className="w-px h-5 bg-white/[0.08]" />

        {/* Preset Chips */}
        <div className="flex items-center gap-1">
          {(() => {
            const topIds = (PRESET_CATEGORIES[0]?.presetIds ?? []).filter((id) => isPresetAllowed(dataLabMode, id)).slice(0, 4);
            const shown = activePreset && !topIds.includes(activePreset) && isPresetAllowed(dataLabMode, activePreset)
              ? [activePreset, ...topIds.slice(0, 3)]
              : topIds;
            return shown.map((pId) => {
              const p = OVERLAY_PRESETS.find((pr) => pr.id === pId);
              if (!p) return null;
              const Icon = ICON_MAP[p.icon];
              const isActive = activePreset === p.id;
              const meta = PRESET_META[p.id];
              return (
                <Tip key={p.id} text={meta?.tip ?? p.description}>
                  <button
                    type="button"
                    onClick={() => loadPreset(p.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition ${
                      isActive ? chipActive : chipInactive
                    }`}
                  >
                    {Icon && <Icon className="w-3 h-3" />}
                    {meta?.short ?? p.name}
                  </button>
                </Tip>
              );
            });
          })()}

          <div className="relative" ref={presetsDropRef}>
            <button
              type="button"
              onClick={() => setShowAllPresets(!showAllPresets)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition ${chipInactive}`}
            >
              All Strategies
              <ChevronDown className={`w-3 h-3 transition-transform ${showAllPresets ? 'rotate-180' : ''}`} />
            </button>

            {showAllPresets && (
              <div className="absolute top-full left-0 mt-1 z-50 bg-gray-900 border border-white/[0.1] rounded-lg shadow-xl p-3 min-w-[480px]">
                <div className="grid grid-cols-2 gap-3">
                  {PRESET_CATEGORIES.map((cat) => {
                    const allowedIds = cat.presetIds.filter((id) => isPresetAllowed(dataLabMode, id));
                    if (allowedIds.length === 0) return null;
                    return (
                    <div key={cat.label}>
                      <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 px-1">
                        {cat.label}
                      </div>
                      {allowedIds.map((pId) => {
                        const p = OVERLAY_PRESETS.find((pr) => pr.id === pId);
                        if (!p) return null;
                        const Icon = ICON_MAP[p.icon];
                        const isActive = activePreset === p.id;
                        const meta = PRESET_META[p.id];
                        return (
                          <Tip key={p.id} text={meta?.tip ?? p.description} position="top">
                            <button
                              type="button"
                              onClick={() => { loadPreset(p.id); setShowAllPresets(false); }}
                              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[11px] font-medium transition mb-0.5 ${
                                isActive ? chipActive : 'text-gray-400 hover:bg-white/[0.06] hover:text-white'
                              }`}
                            >
                              {Icon && <Icon className="w-3.5 h-3.5 flex-shrink-0" />}
                              <span>{meta?.short ?? p.name}</span>
                            </button>
                          </Tip>
                        );
                      })}
                    </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="w-px h-5 bg-white/[0.08]" />

        {/* Coin Search */}
        <div className="relative" ref={coinDropRef}>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500 pointer-events-none" />
            <input
              type="text"
              value={coinInput}
              onChange={(e) => { setCoinInput(e.target.value); if (!showCoinDrop) setShowCoinDrop(true); }}
              onFocus={() => setShowCoinDrop(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { handleCoinChange(); setShowCoinDrop(false); }
                if (e.key === 'Escape') setShowCoinDrop(false);
              }}
              className="w-36 bg-white/[0.04] border border-white/[0.1] text-white text-xs pl-6 pr-2.5 py-1 rounded-lg focus:outline-none focus:border-emerald-400/40"
              placeholder="Search coin..."
            />
          </div>

          {showCoinDrop && (
            <div className="absolute top-full left-0 mt-1 z-50 bg-gray-900 border border-white/[0.1] rounded-lg shadow-xl w-64 max-h-72 overflow-y-auto">
              {isSearchingCoin && (
                <div className="flex items-center gap-2 px-3 py-2 text-gray-400 text-[11px]">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Searching CoinGecko...
                </div>
              )}

              {coinResults.length > 0 ? (
                <div className="p-1">
                  {coinResults.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => selectCoin(c.id)}
                      className={`w-full text-left px-2.5 py-1.5 text-[11px] rounded transition flex items-center gap-2 ${
                        c.id === coin
                          ? 'bg-emerald-400/15 text-emerald-400'
                          : 'text-gray-300 hover:bg-white/[0.06] hover:text-white'
                      }`}
                    >
                      {c.thumb && (
                        <img src={c.thumb} alt={`${c.symbol} logo`} className="w-4 h-4 rounded-full flex-shrink-0" />
                      )}
                      <span className="font-medium">{c.symbol}</span>
                      <span className="text-gray-500 truncate">{c.name}</span>
                      {c.rank && (
                        <span className="text-gray-600 text-[10px] ml-auto flex-shrink-0">#{c.rank}</span>
                      )}
                    </button>
                  ))}
                </div>
              ) : coinInput.trim().length < 2 && !isSearchingCoin ? (
                <div className="p-1">
                  <div className="px-2.5 py-1 text-[10px] text-gray-500 uppercase tracking-wider">Popular Coins</div>
                  {POPULAR_COINS.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => selectCoin(c.id)}
                      className={`w-full text-left px-2.5 py-1.5 text-[11px] rounded transition flex items-center gap-2 ${
                        c.id === coin
                          ? 'bg-emerald-400/15 text-emerald-400'
                          : 'text-gray-300 hover:bg-white/[0.06] hover:text-white'
                      }`}
                    >
                      <span className="font-medium w-10">{c.symbol}</span>
                      <span className="text-gray-500">{c.name}</span>
                    </button>
                  ))}
                </div>
              ) : !isSearchingCoin && coinInput.trim().length >= 2 ? (
                <div className="px-3 py-3 text-[11px] text-gray-500 text-center">
                  No coins found — try a different search
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Time Range Chips */}
        <Tip text="Select the time range for historical data">
          <div className="flex gap-0.5">
            {TIME_RANGES.map((tr) => (
              <button
                key={tr.value}
                type="button"
                onClick={() => handleDaysChange(tr.value)}
                className={`px-2 py-1 text-[10px] font-medium rounded-md transition ${
                  days === tr.value ? chipActive : chipInactive
                }`}
              >
                {tr.label}
              </button>
            ))}
          </div>
        </Tip>

        <div className="flex-1">
          {/* Natural Language Query Bar (advanced mode) */}
          {feat('naturalLanguageQuery') && <NaturalLanguageBar />}
        </div>

        {/* Currency Selector */}
        <Tip text="Change the quote currency for price data">
          <select
            aria-label="Quote currency"
            value={vsCurrency}
            onChange={async (e) => {
              setVsCurrency(e.target.value);
              await loadData();
            }}
            className="bg-white/[0.04] border border-white/[0.06] text-gray-300 text-[11px] px-2 py-1 rounded-lg focus:outline-none focus:border-emerald-400/40 cursor-pointer"
          >
            <option value="usd">USD ($)</option>
            <option value="eur">EUR (&#8364;)</option>
            <option value="gbp">GBP (&#163;)</option>
            <option value="jpy">JPY (&#165;)</option>
            <option value="inr">INR (&#8377;)</option>
            <option value="btc">BTC (&#8383;)</option>
            <option value="eth">ETH (&#926;)</option>
          </select>
        </Tip>

        {/* Auto-Refresh */}
        <AutoRefreshIndicator />

        {/* CSV Download */}
        <Tip text="Download visible chart data as CSV">
          <button
            type="button"
            onClick={() => {
              const csv = generateCSV(timestamps, layers, editedCells);
              if (csv) downloadCSV(csv, `datalab-${coin}-${days}d.csv`);
            }}
            disabled={timestamps.length === 0}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-white/[0.04] border border-white/[0.06] rounded-lg text-xs text-gray-400 hover:text-white hover:bg-white/[0.08] transition disabled:opacity-30"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">CSV</span>
          </button>
        </Tip>

        {/* Share URL */}
        <Tip text="Copy shareable link with current chart state">
          <button
            type="button"
            onClick={() => {
              const url = buildShareURL({
                coin, days, preset: activePreset ?? undefined,
                vsCurrency, logScale, normalizeMode, params: parameters,
              });
              navigator.clipboard.writeText(url).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              });
            }}
            disabled={!activePreset}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-white/[0.04] border border-white/[0.06] rounded-lg text-xs text-gray-400 hover:text-white hover:bg-white/[0.08] transition disabled:opacity-30"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copied ? 'Copied!' : 'Share'}</span>
          </button>
        </Tip>

        {/* Screenshot */}
        {onScreenshot && (
          <Tip text="Download the current chart as a PNG image">
            <button
              type="button"
              onClick={onScreenshot}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-white/[0.04] border border-white/[0.06] rounded-lg text-xs text-gray-400 hover:text-white hover:bg-white/[0.08] transition"
            >
              <Camera className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Screenshot</span>
            </button>
          </Tip>
        )}

        {/* Code Export (intermediate+) */}
        {feat('pineScriptExport') && (
          <div className="relative" ref={codeExportRef}>
            <Tip text="Export current chart setup to Pine Script or Python code">
              <button
                type="button"
                onClick={() => setShowCodeExport(!showCodeExport)}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-white/[0.04] border border-white/[0.06] rounded-lg text-xs text-gray-400 hover:text-white hover:bg-white/[0.08] transition"
              >
                <Code className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Export</span>
              </button>
            </Tip>

            {showCodeExport && (
              <div className="absolute top-full right-0 mt-1 z-50 bg-gray-900 border border-white/[0.1] rounded-lg p-1.5 shadow-xl min-w-[180px]">
                <button type="button"
                  onClick={() => {
                    const code = exportToPineScript(layers, coin);
                    navigator.clipboard.writeText(code);
                    setShowCodeExport(false);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-[11px] text-gray-400 hover:bg-white/[0.06] hover:text-white transition">
                  Pine Script v5
                </button>
                <button type="button"
                  onClick={() => {
                    const code = exportToPython(layers, coin, days);
                    navigator.clipboard.writeText(code);
                    setShowCodeExport(false);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-[11px] text-gray-400 hover:bg-white/[0.06] hover:text-white transition">
                  Python (pandas + plotly)
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Keyboard shortcuts + command palette (intermediate+) */}
      {feat('keyboardShortcuts') && (
        <KeyboardShortcutHandler onOpenCommandPalette={() => setShowCommandPalette(true)} />
      )}
      {feat('commandPalette') && (
        <CommandPalette open={showCommandPalette} onClose={() => setShowCommandPalette(false)} />
      )}

      {/* ── BTC-only source guard warning ─────────────────────────── */}
      {coin !== 'bitcoin' && layers.some((l) => BTC_ONLY_SOURCES.has(l.source)) && (
        <div className="px-4 py-1.5 flex items-center gap-2 border-t border-amber-500/20 bg-amber-500/[0.05] max-w-[1800px] mx-auto">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
          <span className="text-[11px] text-amber-400">
            On-chain layers ({layers.filter((l) => BTC_ONLY_SOURCES.has(l.source)).map((l) => l.label).join(', ')}) only work for Bitcoin.
            Switch to BTC or remove them for accurate data.
          </span>
        </div>
      )}

      {/* ── Data Quality Warnings (simple + intermediate modes) ──── */}
      <DataQualityBar />

      {/* ── Row 2: Layers + Params + Toggles ─────────────────────── */}
      <div className="px-4 py-1.5 flex items-center gap-2 flex-wrap border-t border-white/[0.04] max-w-[1800px] mx-auto">
        {/* Layer Chips */}
        <div className="flex items-center gap-1 flex-wrap">
          {layers.map((layer) => (
            <Tip key={layer.id} text={`${layer.label} — ${layer.chartType} on ${layer.yAxis} axis. Click to toggle visibility.`}>
              <button
                type="button"
                onClick={() => toggleLayer(layer.id)}
                className={`group flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium transition border ${
                  layer.visible
                    ? 'bg-white/[0.04] text-gray-300 border-white/[0.06] hover:border-white/[0.12]'
                    : 'bg-white/[0.02] text-gray-600 border-white/[0.04] line-through'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: layer.visible ? layer.color : '#555' }} />
                <span className="truncate max-w-[72px]">{layer.label}</span>
                <Trash2
                  className="w-2.5 h-2.5 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer ml-0.5"
                  onClick={(e) => { e.stopPropagation(); removeLayer(layer.id); }}
                />
              </button>
            </Tip>
          ))}

          {/* Add Layer */}
          <div className="relative">
            <Tip text="Add a new data layer to the chart">
              <button
                type="button"
                onClick={() => setShowAddLayer(!showAddLayer)}
                className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 hover:bg-emerald-400/20 transition"
              >
                <Plus className="w-3 h-3" />
                Add
              </button>
            </Tip>

            {showAddLayer && (
              <div className="absolute top-full left-0 mt-1 z-50 bg-gray-900 border border-white/[0.1] rounded-lg shadow-xl min-w-[260px] max-h-96 flex flex-col">
                <div className="p-1.5 border-b border-white/[0.06]">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500 pointer-events-none" />
                    <input
                      type="text"
                      value={layerSearch}
                      onChange={(e) => setLayerSearch(e.target.value)}
                      placeholder="Filter indicators..."
                      className="w-full bg-white/[0.04] border border-white/[0.1] text-white text-[10px] pl-6 pr-2 py-1 rounded-md focus:outline-none focus:border-emerald-400/40"
                      autoFocus
                    />
                  </div>
                </div>
                <div className="p-1.5 overflow-y-auto flex-1">
                {filteredDataSources.filter((opt) => {
                  if (!layerSearch.trim()) return true;
                  const q = layerSearch.toLowerCase();
                  return opt.label.toLowerCase().includes(q) || opt.source.toLowerCase().includes(q);
                }).map((opt) => {
                  const alreadyAdded = layers.some((l) => l.source === opt.source && l.chartType === opt.chartType);
                  return (
                    <Tip key={`${opt.source}-${opt.chartType}`} text={SOURCE_TIPS[opt.source] ?? ''} position="top">
                      <button
                        type="button"
                        disabled={alreadyAdded}
                        onClick={() => {
                          addLayer({
                            label: opt.label,
                            source: opt.source,
                            chartType: opt.chartType,
                            yAxis: opt.yAxis,
                            color: opt.color,
                            visible: true,
                            gridIndex: opt.gridIndex,
                          });
                          setShowAddLayer(false);
                          recalculateLayers();
                        }}
                        className={`w-full text-left px-2 py-1 text-[10px] rounded transition flex items-center gap-1.5 ${
                          alreadyAdded
                            ? 'text-gray-600 cursor-not-allowed'
                            : 'text-gray-400 hover:bg-white/[0.06] hover:text-white'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: opt.color }} />
                        {opt.label}
                      </button>
                    </Tip>
                  );
                })}
                </div>
              </div>
            )}
          </div>

          {/* Formula Layer (intermediate+) */}
          {feat('formulaEngine') && (
            <Tip text="Add a custom formula layer (e.g. price / sma(200))">
              <button
                type="button"
                onClick={() => setShowFormulaModal(true)}
                className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium text-cyan-400 bg-cyan-400/10 border border-cyan-400/20 hover:bg-cyan-400/20 transition"
              >
                f(x)
              </button>
            </Tip>
          )}

          {/* Power Combos (intermediate+) */}
          {feat('powerCombos') && (
            <div className="relative" ref={combosDropRef}>
              <Tip text="Quick-add pre-built layer combinations for specific market conditions">
                <button
                  type="button"
                  onClick={() => setShowCombosDrop(!showCombosDrop)}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium text-amber-400 bg-amber-400/10 border border-amber-400/20 hover:bg-amber-400/20 transition"
                >
                  <Combine className="w-3 h-3" />
                  Combos
                </button>
              </Tip>

              {showCombosDrop && (
                <div className="absolute top-full left-0 mt-1 z-50 bg-gray-900 border border-white/[0.1] rounded-lg p-1.5 shadow-xl min-w-[280px]">
                  {POWER_COMBOS.map((combo) => {
                    const Icon = ICON_MAP[combo.icon];
                    return (
                      <button
                        key={combo.id}
                        type="button"
                        onClick={() => loadPowerCombo(combo.id)}
                        className="w-full text-left px-2.5 py-2 rounded-lg text-[11px] transition hover:bg-white/[0.06] mb-0.5"
                      >
                        <div className="flex items-center gap-2 text-gray-300 font-medium">
                          {Icon && <Icon className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />}
                          {combo.name}
                        </div>
                        <p className="text-[10px] text-gray-500 mt-0.5 ml-5">{combo.description}</p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="w-px h-4 bg-white/[0.08]" />

        {/* Param Controls */}
        {paramDefs.length > 0 && (
          <>
            <div className="flex items-center gap-2">
              {paramDefs.map((pd) => {
                const value = parameters[pd.key] ?? pd.defaultValue;
                return (
                  <Tip key={pd.key} text={PARAM_TIPS[pd.key] ?? pd.label}>
                    <div className="flex items-center gap-0.5 text-[10px]">
                      <span className="text-gray-500">{pd.label}:</span>
                      <button
                        type="button"
                        title={`Decrease ${pd.label}`}
                        onClick={() => handleParamChange(pd, -1)}
                        className="text-gray-500 hover:text-white transition px-1 py-0.5 rounded hover:bg-white/[0.06]"
                      >
                        -
                      </button>
                      <span className="text-emerald-400 font-mono w-7 text-center">{value}</span>
                      <button
                        type="button"
                        title={`Increase ${pd.label}`}
                        onClick={() => handleParamChange(pd, 1)}
                        className="text-gray-500 hover:text-white transition px-1 py-0.5 rounded hover:bg-white/[0.06]"
                      >
                        +
                      </button>
                    </div>
                  </Tip>
                );
              })}
              <Tip text="Reset preset state (layers + parameters + edits)">
                <button
                  type="button"
                  title="Reset Preset"
                  onClick={() => { resetParameters(); }}
                  className="text-gray-600 hover:text-gray-400 transition p-0.5"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              </Tip>
            </div>
            <div className="w-px h-4 bg-white/[0.08]" />
          </>
        )}

        {/* Toggle Buttons */}
        <div className="flex items-center gap-1">
          {feat('logScale') && (
            <Tip text="Switch price axis to logarithmic scale">
              <button type="button" title="Log Scale" onClick={toggleLogScale}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition ${logScale ? chipActive : chipInactive}`}>
                LOG
              </button>
            </Tip>
          )}

          {feat('normalizeMode') && (
            <Tip text="Rebase all series to 100 at start for easy comparison">
              <button type="button" title="Normalize (Base 100)" onClick={toggleNormalize}
                className={`p-1.5 rounded-lg transition ${normalizeMode ? chipActive : chipInactive}`}>
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </Tip>
          )}

          {feat('dataTable') && (
            <Tip text="Show/hide the editable data table panel">
              <button type="button" title="Data Table" onClick={toggleTable}
                className={`p-1.5 rounded-lg transition ${showTable ? chipActive : chipInactive}`}>
                <Table2 className="w-3.5 h-3.5" />
              </button>
            </Tip>
          )}

          {feat('regimeDetection') && (
            <Tip text="Auto-detect market regimes (trend/chop/high-vol/risk-off)">
              <button type="button" title="Regime Detection" onClick={toggleRegimes}
                className={`p-1.5 rounded-lg transition ${showRegimes ? chipActive : chipInactive}`}>
                <Radar className="w-3.5 h-3.5" />
              </button>
            </Tip>
          )}

          {/* Auto-Divergence Detection (intermediate+) */}
          {feat('autoDivergence') && (
            <Tip text="Detect bullish/bearish divergences between price and RSI/MACD">
              <button type="button" title="Divergence Detection" onClick={toggleDivergences}
                className={`flex items-center gap-1 p-1.5 rounded-lg transition ${showDivergences ? chipActive : chipInactive}`}>
                <Activity className="w-3.5 h-3.5" />
                {divergenceSignals.length > 0 && (
                  <span className="bg-emerald-400/20 text-emerald-400 text-[9px] px-1 rounded-full">{divergenceSignals.length}</span>
                )}
              </button>
            </Tip>
          )}

          {/* Chart Pattern Recognition (advanced) */}
          {feat('chartPatterns') && (
            <Tip text="Detect chart patterns: H&S, double top/bottom, wedges">
              <button type="button" title="Chart Patterns" onClick={togglePatterns}
                className={`flex items-center gap-1 p-1.5 rounded-lg transition ${showPatterns ? chipActive : chipInactive}`}>
                <Target className="w-3.5 h-3.5" />
                {detectedPatterns.length > 0 && (
                  <span className="bg-purple-400/20 text-purple-400 text-[9px] px-1 rounded-full">{detectedPatterns.length}</span>
                )}
              </button>
            </Tip>
          )}

          {/* AI Anomaly Detection (advanced) */}
          {feat('aiAnomalyDetection') && (
            <Tip text="Detect anomalies: volume spikes, volatility, price gaps">
              <button type="button" title="Anomaly Detection" onClick={toggleAnomalies}
                className={`flex items-center gap-1 p-1.5 rounded-lg transition ${showAnomalies ? chipActive : chipInactive}`}>
                <AlertTriangle className="w-3.5 h-3.5" />
                {detectedAnomalies.length > 0 && (
                  <span className="bg-amber-400/20 text-amber-400 text-[9px] px-1 rounded-full">{detectedAnomalies.length}</span>
                )}
              </button>
            </Tip>
          )}

          {/* Event Markers (intermediate+) */}
          {feat('eventMarkers') && (
          <div className="relative" ref={eventsDropRef}>
            <Tip text="Show key market events as vertical markers">
              <button type="button" title="Event Markers"
                onClick={() => {
                  if (!showEvents) { toggleEvents(); }
                  else { setShowEventsDrop(!showEventsDrop); }
                }}
                onContextMenu={(e) => { e.preventDefault(); setShowEventsDrop(!showEventsDrop); }}
                className={`p-1.5 rounded-lg transition ${showEvents ? chipActive : chipInactive}`}>
                <Calendar className="w-3.5 h-3.5" />
              </button>
            </Tip>

            {showEventsDrop && (
              <div className="absolute top-full right-0 mt-1 z-50 bg-gray-900 border border-white/[0.1] rounded-lg p-2 shadow-xl min-w-[180px]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-gray-500 font-semibold uppercase">Event Categories</span>
                  <button type="button" title="Toggle events"
                    onClick={() => { toggleEvents(); setShowEventsDrop(false); }}
                    className="text-[10px] text-gray-500 hover:text-red-400">
                    {showEvents ? 'Hide All' : 'Show All'}
                  </button>
                </div>
                {(['halving', 'etf', 'crash', 'regulation', 'macro', 'upgrade', 'custom'] as EventCategory[]).map((cat) => {
                  const isChecked = eventCategories.includes(cat);
                  return (
                    <label key={cat} className="flex items-center gap-2 px-1 py-1 text-[11px] text-gray-400 hover:text-white cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          const newCats = isChecked
                            ? eventCategories.filter((c) => c !== cat)
                            : [...eventCategories, cat];
                          setEventCategories(newCats);
                          if (!showEvents) toggleEvents();
                        }}
                        className="rounded border-gray-600 bg-transparent text-emerald-400 focus:ring-0 w-3 h-3"
                      />
                      {EVENT_CATEGORY_LABELS[cat]}
                      {cat === 'custom' && customEvents.length > 0 && (
                        <span className="text-[9px] text-emerald-400 ml-auto">{customEvents.length}</span>
                      )}
                    </label>
                  );
                })}

                {/* Custom event form */}
                <div className="border-t border-white/[0.06] mt-1.5 pt-1.5">
                  <span className="text-[10px] text-gray-500 font-semibold uppercase px-1">Add Custom Event</span>
                  <div className="flex flex-col gap-1 mt-1">
                    <input
                      type="date"
                      title="Event date"
                      value={customEventDate}
                      onChange={(e) => setCustomEventDate(e.target.value)}
                      className="bg-white/[0.04] border border-white/[0.1] text-white text-[10px] px-2 py-1 rounded focus:outline-none focus:border-emerald-400/40"
                    />
                    <input
                      type="text"
                      value={customEventLabel}
                      onChange={(e) => setCustomEventLabel(e.target.value)}
                      placeholder="Event label..."
                      className="bg-white/[0.04] border border-white/[0.1] text-white text-[10px] px-2 py-1 rounded focus:outline-none focus:border-emerald-400/40"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && customEventDate && customEventLabel.trim()) {
                          addCustomEvent({
                            date: new Date(customEventDate).getTime(),
                            label: customEventLabel.trim(),
                            category: 'custom',
                            description: customEventLabel.trim(),
                          });
                          setCustomEventDate('');
                          setCustomEventLabel('');
                          if (!showEvents) toggleEvents();
                          if (!eventCategories.includes('custom')) {
                            setEventCategories([...eventCategories, 'custom']);
                          }
                        }
                      }}
                    />
                    <button
                      type="button"
                      disabled={!customEventDate || !customEventLabel.trim()}
                      onClick={() => {
                        addCustomEvent({
                          date: new Date(customEventDate).getTime(),
                          label: customEventLabel.trim(),
                          category: 'custom',
                          description: customEventLabel.trim(),
                        });
                        setCustomEventDate('');
                        setCustomEventLabel('');
                        if (!showEvents) toggleEvents();
                        if (!eventCategories.includes('custom')) {
                          setEventCategories([...eventCategories, 'custom']);
                        }
                      }}
                      className="text-[10px] text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded px-2 py-1 hover:bg-emerald-400/20 transition disabled:opacity-30"
                    >
                      + Add Event
                    </button>
                  </div>

                  {/* List custom events with delete */}
                  {customEvents.length > 0 && (
                    <div className="mt-1.5 space-y-0.5 max-h-24 overflow-y-auto">
                      {customEvents.map((evt) => (
                        <div key={evt.date} className="flex items-center gap-1 text-[10px] text-gray-400 px-1">
                          <span className="text-gray-500">{new Date(evt.date).toLocaleDateString()}</span>
                          <span className="truncate flex-1">{evt.label}</span>
                          <button type="button" title="Remove event" onClick={() => removeCustomEvent(evt.date)}
                            className="text-gray-600 hover:text-red-400 flex-shrink-0">
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          )}

          <Tip text="Revert all edited data points back to original values">
            <button type="button" title="Reset All Edits"
              onClick={() => { blurActiveEditable(); setTimeout(() => resetEdits(), 0); }}
              className={`p-1.5 rounded-lg transition ${chipInactive}`}>
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </Tip>

          <Tip text="Undo the last data edit">
            <button type="button" title="Undo"
              onClick={() => { blurActiveEditable(); setTimeout(() => undoLastEdit(), 0); }}
              disabled={editHistory.length === 0}
              className={`p-1.5 rounded-lg transition ${chipInactive} disabled:opacity-30`}>
              <Undo2 className="w-3.5 h-3.5" />
            </button>
          </Tip>
        </div>

        <div className="w-px h-4 bg-white/[0.08]" />

        {/* Drawing Tools */}
        <div className="relative" ref={drawDropRef}>
          <Tip text="Draw on chart: horizontal lines, trendlines, fibonacci retracement">
            <button type="button"
              onClick={() => setShowDrawTools(!showDrawTools)}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition ${
                activeDrawingTool ? chipActive : chipInactive
              }`}>
              <Pencil className="w-3 h-3" />
              Draw
              {drawings.length > 0 && (
                <span className="bg-emerald-400/20 text-emerald-400 text-[9px] px-1 rounded-full">{drawings.length}</span>
              )}
            </button>
          </Tip>

          {showDrawTools && (
            <div className="absolute top-full left-0 mt-1 z-50 bg-gray-900 border border-white/[0.1] rounded-lg p-1.5 shadow-xl min-w-[180px]">
              {filteredDrawingTools.map((tool) => {
                const TOOL_LABELS: Record<DrawingType, string> = {
                  hline: 'Horizontal Line', trendline: 'Trendline', fibonacci: 'Fibonacci',
                  text: 'Text Note', pitchfork: 'Pitchfork', regression_channel: 'Regression Channel',
                  measurement: 'Measurement',
                };
                const TOOL_ICONS: Record<DrawingType, React.ComponentType<{ className?: string }>> = {
                  hline: Minus, trendline: TrendingDown, fibonacci: BarChart3,
                  text: Type, pitchfork: Activity, regression_channel: TrendingUp,
                  measurement: Maximize2,
                };
                const Icon = TOOL_ICONS[tool];
                const clicks = DRAWING_CLICK_COUNT[tool];
                return (
                  <button key={tool} type="button"
                    onClick={() => { setActiveDrawingTool(activeDrawingTool === tool ? null : tool); setShowDrawTools(false); }}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-[11px] transition ${
                      activeDrawingTool === tool ? 'bg-emerald-400/15 text-emerald-400' : 'text-gray-400 hover:bg-white/[0.06] hover:text-white'
                    }`}>
                    <Icon className="w-3.5 h-3.5" /> {TOOL_LABELS[tool]}
                    <span className="text-gray-600 text-[9px] ml-auto">{clicks} click{clicks > 1 ? 's' : ''}</span>
                  </button>
                );
              })}
              {drawings.length > 0 && (
                <>
                  <div className="border-t border-white/[0.06] my-1" />
                  <button type="button"
                    onClick={() => { clearDrawings(); setShowDrawTools(false); }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-[11px] text-red-400 hover:bg-red-400/10 transition">
                    <X className="w-3.5 h-3.5" /> Clear All ({drawings.length})
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {activeDrawingTool && (
          <span className="text-[10px] text-emerald-400 flex items-center gap-1">
            Click chart to place {activeDrawingTool === 'hline' ? 'line' : activeDrawingTool} (ESC to cancel)
            <button type="button" title="Cancel drawing" onClick={() => setActiveDrawingTool(null)}
              className="text-gray-500 hover:text-white">
              <X className="w-3 h-3" />
            </button>
          </span>
        )}

        <div className="w-px h-4 bg-white/[0.08]" />

        {/* Lab Notebook (intermediate+) */}
        {feat('labNotebook') && (
          <Tip text="Research notebook: record hypotheses and track outcomes">
            <button type="button"
              onClick={() => setShowLabNotebook(!showLabNotebook)}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition ${
                showLabNotebook ? 'bg-purple-400/20 text-purple-400 border border-purple-400/30' : chipInactive
              }`}>
              <BookOpen className="w-3 h-3" />
              Lab Notes
              {labNotes.length > 0 && (
                <span className="bg-purple-400/20 text-purple-400 text-[9px] px-1 rounded-full">{labNotes.length}</span>
              )}
            </button>
          </Tip>
        )}

        {/* What-If Simulator (intermediate+) */}
        {feat('whatIfSimulator') && (
          <Tip text="Simulate parameter changes: adjust indicators and see impact on chart">
            <button type="button"
              onClick={() => setShowWhatIf(!showWhatIf)}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition ${
                showWhatIf ? 'bg-orange-400/20 text-orange-400 border border-orange-400/30' : chipInactive
              }`}>
              <Sliders className="w-3 h-3" />
              What-If
            </button>
          </Tip>
        )}

        {/* Signal Reliability Heatmap (intermediate+) */}
        {feat('signalReliability') && (
          <Tip text="View historical hit-rate of common trading signals on current data">
            <button type="button"
              onClick={() => setShowSignalHeatmap(!showSignalHeatmap)}
              disabled={!rawData.price || rawData.price.length === 0}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition ${
                showSignalHeatmap ? 'bg-rose-400/20 text-rose-400 border border-rose-400/30' : chipInactive
              } disabled:opacity-30`}>
              <BarChart2 className="w-3 h-3" />
              Signals
            </button>
          </Tip>
        )}

        {/* Annotations Timeline (intermediate+) */}
        {feat('annotationsTimeline') && (
          <Tip text="View all annotations (drawings, events, notes) in a timeline">
            <button type="button"
              onClick={() => useDataLabStore.setState({ showAnnotationsTimeline: !showAnnotationsTimeline })}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition ${
                showAnnotationsTimeline ? 'bg-cyan-400/20 text-cyan-400 border border-cyan-400/30' : chipInactive
              }`}>
              <MapPin className="w-3 h-3" />
              Timeline
            </button>
          </Tip>
        )}

        {/* Strategy Backtester (advanced) */}
        {feat('strategyBacktester') && (
          <Tip text="Run strategy backtests on current data">
            <button type="button"
              onClick={() => setShowBacktester(!showBacktester)}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition ${
                showBacktester ? 'bg-blue-400/20 text-blue-400 border border-blue-400/30' : chipInactive
              }`}>
              <TrendingUp className="w-3 h-3" />
              Backtest
            </button>
          </Tip>
        )}

        {/* Liquidation Heatmap (advanced) */}
        {feat('liquidationHeatmap') && (
          <Tip text="View estimated liquidation levels at common leverage ratios">
            <button type="button"
              onClick={() => setShowLiquidation(!showLiquidation)}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition ${
                showLiquidation ? 'bg-orange-400/20 text-orange-400 border border-orange-400/30' : chipInactive
              }`}>
              <Layers className="w-3 h-3" />
              Liquidation
            </button>
          </Tip>
        )}

        {/* Multi-Chart (advanced) */}
        {feat('multiChart') && (
          <Tip text="Compare multiple coins side-by-side">
            <button type="button"
              onClick={() => setShowMultiChart(!showMultiChart)}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition ${
                showMultiChart ? 'bg-cyan-400/20 text-cyan-400 border border-cyan-400/30' : chipInactive
              }`}>
              <Combine className="w-3 h-3" />
              Multi-Chart
            </button>
          </Tip>
        )}

        {/* Alert Webhooks (advanced) */}
        {feat('alertWebhooks') && (
          <Tip text="Set up price alerts with webhook notifications">
            <button type="button"
              onClick={() => setShowAlertWebhook(!showAlertWebhook)}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition ${
                showAlertWebhook ? 'bg-amber-400/20 text-amber-400 border border-amber-400/30' : chipInactive
              }`}>
              <Radar className="w-3 h-3" />
              Alerts
            </button>
          </Tip>
        )}

        {/* Whale Wallet Tracking (advanced) */}
        {feat('whaleWalletTracking') && (
          <Tip text="Track large whale transactions and exchange flows">
            <button type="button"
              onClick={() => setShowWhalePanel(!showWhalePanel)}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition ${
                showWhalePanel ? 'bg-blue-400/20 text-blue-400 border border-blue-400/30' : chipInactive
              }`}>
              <Scale className="w-3 h-3" />
              Whales
            </button>
          </Tip>
        )}
      </div>

      {/* ── Row 3 (conditional): Regime Legend ──────────────────────── */}
      {showRegimes && (
        <div className="px-4 py-1 flex items-center gap-3 border-t border-white/[0.04] max-w-[1800px] mx-auto">
          <span className="text-[10px] text-gray-500 font-medium">Regimes:</span>
          {(['trend', 'chop', 'high-vol', 'risk-off'] as MarketRegime[]).map((r) => (
            <span key={r} className="flex items-center gap-1 text-[10px]">
              <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: REGIME_COLORS[r], opacity: 0.7 }} />
              <span style={{ color: REGIME_COLORS[r] }}>{REGIME_LABELS[r]}</span>
            </span>
          ))}
          <span className="text-[9px] text-gray-600 ml-2">
            Based on BB width, rolling vol, drawdown, SMA 50
          </span>
        </div>
      )}

      {/* ── Annotations Timeline Panel ──────────────────────────────── */}
      <AnnotationsTimeline />

      {/* ── Lab Notebook Panel ──────────────────────────────────────── */}
      {showLabNotebook && (
        <div className="border-t border-white/[0.04] bg-white/[0.01] max-w-[1800px] mx-auto">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-semibold text-white flex items-center gap-2">
                <BookOpen className="w-3.5 h-3.5 text-purple-400" />
                Lab Notebook
              </h4>
              <button type="button" title="Close notebook" onClick={() => setShowLabNotebook(false)}
                className="text-gray-500 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex gap-2 mb-3">
              <input type="text" value={noteHypothesis} onChange={(e) => setNoteHypothesis(e.target.value)}
                placeholder="Hypothesis: e.g. RSI < 30 + Fear < 20 = bounce within 7 days"
                className="flex-1 bg-white/[0.04] border border-white/[0.1] text-white text-[11px] px-3 py-1.5 rounded-lg focus:outline-none focus:border-purple-400/40" />
              <input type="text" value={noteEvidence} onChange={(e) => setNoteEvidence(e.target.value)}
                placeholder="Evidence / observations"
                className="flex-1 bg-white/[0.04] border border-white/[0.1] text-white text-[11px] px-3 py-1.5 rounded-lg focus:outline-none focus:border-purple-400/40" />
              <button type="button"
                onClick={() => {
                  if (!noteHypothesis.trim()) return;
                  addLabNote({
                    hypothesis: noteHypothesis,
                    evidence: noteEvidence,
                    verdict: 'pending',
                    presetId: activePreset,
                    coin,
                    days,
                  });
                  setNoteHypothesis('');
                  setNoteEvidence('');
                }}
                disabled={!noteHypothesis.trim()}
                className="px-3 py-1.5 bg-purple-500 hover:bg-purple-600 text-white text-[11px] font-medium rounded-lg transition disabled:opacity-30">
                Add
              </button>
            </div>

            {labNotes.length === 0 ? (
              <p className="text-[11px] text-gray-600 text-center py-2">
                No notes yet. Record hypotheses and track outcomes as you analyze.
              </p>
            ) : (
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {labNotes.map((note) => (
                  <div key={note.id} className="flex items-start gap-2 bg-white/[0.02] border border-white/[0.04] rounded-lg px-3 py-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                          note.verdict === 'confirmed' ? 'bg-emerald-400/20 text-emerald-400'
                          : note.verdict === 'rejected' ? 'bg-red-400/20 text-red-400'
                          : 'bg-amber-400/20 text-amber-400'
                        }`}>
                          {note.verdict.toUpperCase()}
                        </span>
                        <span className="text-[10px] text-gray-500">{note.coin} &middot; {note.days}d</span>
                        <span className="text-[10px] text-gray-600">{new Date(note.timestamp).toLocaleDateString()}</span>
                      </div>
                      <p className="text-[11px] text-gray-300 mt-1">{note.hypothesis}</p>
                      {note.evidence && (
                        <p className="text-[10px] text-gray-500 mt-0.5">{note.evidence}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button type="button" title="Mark confirmed"
                        onClick={() => {
                          const updated = labNotes.map((n) =>
                            n.id === note.id ? { ...n, verdict: 'confirmed' as const } : n,
                          );
                          useDataLabStore.setState({ labNotes: updated });
                        }}
                        className="text-[9px] text-gray-500 hover:text-emerald-400 px-1">
                        &#10003;
                      </button>
                      <button type="button" title="Mark rejected"
                        onClick={() => {
                          const updated = labNotes.map((n) =>
                            n.id === note.id ? { ...n, verdict: 'rejected' as const } : n,
                          );
                          useDataLabStore.setState({ labNotes: updated });
                        }}
                        className="text-[9px] text-gray-500 hover:text-red-400 px-1">
                        &#10007;
                      </button>
                      <button type="button" title="Delete note" onClick={() => removeLabNote(note.id)}
                        className="text-gray-600 hover:text-red-400 transition">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── What-If Simulator Panel ──────────────────────────────── */}
      {showWhatIf && (
        <div className="border-t border-white/[0.04] bg-white/[0.01] max-w-[1800px] mx-auto">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-semibold text-white flex items-center gap-2">
                <Sliders className="w-3.5 h-3.5 text-orange-400" />
                What-If Simulator
              </h4>
              <button type="button" title="Close what-if panel" onClick={() => { setShowWhatIf(false); clearWhatIf(); }}
                className="text-gray-500 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {paramDefs.length === 0 ? (
              <p className="text-[11px] text-gray-600 text-center py-2">
                Load a preset with adjustable parameters to use the What-If simulator.
              </p>
            ) : (
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-gray-500">Parameter:</span>
                  <select
                    title="Select parameter to simulate"
                    value={whatIfLocalParam || (paramDefs[0]?.key ?? '')}
                    onChange={(e) => setWhatIfLocalParam(e.target.value)}
                    className="bg-white/[0.04] border border-white/[0.06] text-gray-300 text-[11px] px-2 py-1 rounded-lg focus:outline-none focus:border-orange-400/40"
                  >
                    {paramDefs.map((pd) => (
                      <option key={pd.key} value={pd.key}>{pd.label}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                  <span className="text-[11px] text-gray-500">Delta:</span>
                  <input
                    type="range"
                    title="Parameter delta percentage"
                    min={-50}
                    max={50}
                    step={5}
                    value={whatIfLocalDelta}
                    onChange={(e) => setWhatIfLocalDelta(Number(e.target.value))}
                    className="flex-1 accent-orange-400 h-1"
                  />
                  <span className={`text-[11px] font-mono w-12 text-center ${
                    whatIfLocalDelta > 0 ? 'text-emerald-400' : whatIfLocalDelta < 0 ? 'text-red-400' : 'text-gray-400'
                  }`}>
                    {whatIfLocalDelta > 0 ? '+' : ''}{whatIfLocalDelta}%
                  </span>
                </div>

                {(() => {
                  const paramKey = whatIfLocalParam || (paramDefs[0]?.key ?? '');
                  const pd = paramDefs.find((p) => p.key === paramKey);
                  const currentVal = pd ? (parameters[pd.key] ?? pd.defaultValue) : 0;
                  const newVal = Math.round(currentVal * (1 + whatIfLocalDelta / 100));
                  return (
                    <span className="text-[11px] text-gray-400">
                      {currentVal} <span className="text-gray-600">&rarr;</span>{' '}
                      <span className="text-orange-400 font-medium">{newVal}</span>
                    </span>
                  );
                })()}

                <button
                  type="button"
                  disabled={whatIfLocalDelta === 0}
                  onClick={() => {
                    const paramKey = whatIfLocalParam || (paramDefs[0]?.key ?? '');
                    const pd = paramDefs.find((p) => p.key === paramKey);
                    if (!pd) return;
                    const currentVal = parameters[pd.key] ?? pd.defaultValue;
                    const newVal = Math.max(pd.min, Math.min(pd.max, Math.round(currentVal * (1 + whatIfLocalDelta / 100))));
                    setParameter(pd.key, newVal);
                    setWhatIf(pd.key, whatIfLocalDelta);
                    recalculateLayers();
                  }}
                  className="px-3 py-1 bg-orange-500 hover:bg-orange-600 text-white text-[11px] font-medium rounded-lg transition disabled:opacity-30"
                >
                  Apply
                </button>

                {whatIfActive && (
                  <button
                    type="button"
                    onClick={() => {
                      clearWhatIf();
                      resetParameters();
                      setWhatIfLocalDelta(0);
                    }}
                    className="px-3 py-1 bg-white/[0.04] border border-white/[0.06] text-gray-400 text-[11px] rounded-lg hover:text-white transition"
                  >
                    Reset
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Signal Reliability Heatmap Panel ──────────────────────── */}
      {showSignalHeatmap && (
        <div className="border-t border-white/[0.04] bg-white/[0.01] max-w-[1800px] mx-auto">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-semibold text-white flex items-center gap-2">
                <BarChart2 className="w-3.5 h-3.5 text-rose-400" />
                Signal Reliability Heatmap
                <span className="text-[10px] text-gray-500 font-normal ml-2">
                  {coin} &middot; {days}d &middot; {signalResults.reduce((s, r) => s + r.occurrences, 0)} total signals
                </span>
              </h4>
              <button type="button" title="Close heatmap" onClick={() => setShowSignalHeatmap(false)}
                className="text-gray-500 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {signalResults.length === 0 ? (
              <p className="text-[11px] text-gray-600 text-center py-2">
                No signal data available. Load a preset with price data first.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-[10px]">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      <th className="text-left text-gray-500 font-medium py-1 px-2 w-36">Signal</th>
                      <th className="text-center text-gray-500 font-medium py-1 px-2 w-12">#</th>
                      {LOOKFORWARD_DAYS.map((d) => (
                        <th key={d} className="text-center text-gray-500 font-medium py-1 px-2 w-16">
                          {LOOKFORWARD_LABELS[d]}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {signalResults.map((sig) => (
                      <tr key={sig.name} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                        <td className="py-1.5 px-2">
                          <Tip text={sig.description} position="top">
                            <span className="text-gray-300 cursor-help">{sig.name}</span>
                          </Tip>
                        </td>
                        <td className="text-center text-gray-500 py-1.5 px-2">{sig.occurrences}</td>
                        {LOOKFORWARD_DAYS.map((d) => {
                          const rate = sig.hitRates[d] ?? 0;
                          const pct = Math.round(rate * 100);
                          const bg = rate >= 0.65 ? 'bg-emerald-400/20 text-emerald-400'
                            : rate >= 0.5 ? 'bg-amber-400/15 text-amber-400'
                            : rate >= 0.35 ? 'bg-orange-400/15 text-orange-400'
                            : 'bg-red-400/15 text-red-400';
                          return (
                            <td key={d} className="text-center py-1.5 px-2">
                              {sig.occurrences > 0 ? (
                                <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${bg}`}>
                                  {pct}%
                                </span>
                              ) : (
                                <span className="text-gray-600">—</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="text-[9px] text-gray-600 mt-2">
                  Hit rate = % of signal occurrences followed by price moving in expected direction within N days.
                  Green ≥65%, Yellow ≥50%, Orange ≥35%, Red &lt;35%.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Strategy Backtester Panel ──────────────────────────── */}
      {feat('strategyBacktester') && (
        <DataLabBacktester show={showBacktester} onClose={() => setShowBacktester(false)} />
      )}

      {/* ── Liquidation Heatmap Panel ──────────────────────────── */}
      {feat('liquidationHeatmap') && (
        <LiquidationHeatmap show={showLiquidation} onClose={() => setShowLiquidation(false)} />
      )}

      {/* ── Multi-Chart Layout Panel ──────────────────────────── */}
      {feat('multiChart') && (
        <MultiChartLayout show={showMultiChart} onClose={() => setShowMultiChart(false)} />
      )}

      {/* ── Alert Webhook Panel ──────────────────────────────── */}
      {feat('alertWebhooks') && (
        <AlertWebhookPanel show={showAlertWebhook} onClose={() => setShowAlertWebhook(false)} />
      )}

      {/* ── Whale Wallet Panel ───────────────────────────────── */}
      {feat('whaleWalletTracking') && (
        <WhaleWalletPanel show={showWhalePanel} onClose={() => setShowWhalePanel(false)} />
      )}

      {/* Formula Builder Modal */}
      {showFormulaModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-900 border border-white/[0.1] rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold text-sm flex items-center gap-2">
                <span className="text-cyan-400 font-mono text-lg">f(x)</span>
                Custom Formula
              </h3>
              <button type="button" title="Close formula modal"
                onClick={() => { setShowFormulaModal(false); setFormulaError(null); }}
                className="text-gray-500 hover:text-white transition">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] text-gray-500 mb-1 block">Formula Expression</label>
                <input type="text" value={formulaInput}
                  onChange={(e) => { setFormulaInput(e.target.value); setFormulaError(null); }}
                  placeholder="e.g. price / sma(200)"
                  className="w-full bg-white/[0.04] border border-white/[0.1] text-white text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-cyan-400/40 font-mono"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const err = validateFormula(formulaInput);
                      if (err) { setFormulaError(err); return; }
                      addFormulaLayer(formulaInput, formulaLabel);
                      setShowFormulaModal(false);
                      setFormulaInput(''); setFormulaLabel(''); setFormulaError(null);
                    }
                    if (e.key === 'Escape') { setShowFormulaModal(false); setFormulaError(null); }
                  }}
                />
                {formulaError && <p className="text-red-400 text-[10px] mt-1">{formulaError}</p>}
              </div>

              <div>
                <label className="text-[11px] text-gray-500 mb-1 block">Label (optional)</label>
                <input type="text" value={formulaLabel} onChange={(e) => setFormulaLabel(e.target.value)}
                  placeholder="e.g. Price/SMA Ratio"
                  className="w-full bg-white/[0.04] border border-white/[0.1] text-white text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-cyan-400/40" />
              </div>

              <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-3">
                <p className="text-[10px] text-gray-500 font-medium mb-2">Available References</p>
                <div className="flex flex-wrap gap-1.5">
                  {['price', 'volume', 'sma(N)', 'ema(N)', 'rsi(N)'].map((ref) => (
                    <span key={ref} className="text-[10px] font-mono text-cyan-400 bg-cyan-400/10 px-1.5 py-0.5 rounded">{ref}</span>
                  ))}
                  {['+', '-', '*', '/', '(', ')'].map((op) => (
                    <span key={op} className="text-[10px] font-mono text-gray-400 bg-white/[0.04] px-1.5 py-0.5 rounded">{op}</span>
                  ))}
                </div>
                <div className="mt-2 space-y-1">
                  <p className="text-[10px] text-gray-600">Examples:</p>
                  {['price / sma(200)', 'rsi(14) - 50', '(price - ema(20)) / ema(20) * 100'].map((ex) => (
                    <button key={ex} type="button" onClick={() => setFormulaInput(ex)}
                      className="block text-[10px] font-mono text-gray-500 hover:text-cyan-400 transition cursor-pointer">
                      {ex}
                    </button>
                  ))}
                </div>
              </div>

              <button type="button"
                onClick={() => {
                  if (!formulaInput.trim()) return;
                  const err = validateFormula(formulaInput);
                  if (err) { setFormulaError(err); return; }
                  addFormulaLayer(formulaInput, formulaLabel);
                  setShowFormulaModal(false);
                  setFormulaInput(''); setFormulaLabel(''); setFormulaError(null);
                }}
                className="w-full py-2 bg-cyan-500 hover:bg-cyan-600 text-white text-sm font-medium rounded-lg transition">
                Add Formula Layer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
