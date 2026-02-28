'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { OverlayLayer, EditHistoryEntry, DataSource, DataLabMode, DivergenceSignal, DataQualityWarning, DetectedPattern, Anomaly } from './types';
import type { Drawing, DrawingType } from './drawingTypes';
import type { MarketRegime } from './regimeDetection';
import type { EventCategory, MarketEvent } from './eventMarkers';
import { getPresetById } from './presets';
import {
  computeSMA, computeEMA, computeRSI,
  computeMACD, computeBollingerBands, computeStochastic, computeATR,
  computeBBWidth, computeDailyReturn, computeDrawdown, computeRollingVolatility,
  computeRatio, computeVWAP, computeOBV, computeIchimoku,
  computeADX, computeWilliamsR, computeCCI,
} from './calculations';
import { evaluateFormula } from './formulaEngine';
import { detectRegimes } from './regimeDetection';
import { analyzeDataQuality } from './dataQuality';
import { detectDivergences } from './divergenceDetection';
import { recognizePatterns } from './patternRecognition';
import { detectAnomalies } from './anomalyDetection';
import { useLiveDashboardStore } from '@/lib/live-dashboard/store';

/** Data sources that only work for Bitcoin (Blockchain.com on-chain data) */
export const BTC_ONLY_SOURCES: Set<string> = new Set([
  'hashrate', 'difficulty', 'active_addresses', 'tx_count', 'miners_revenue',
]);

let layerIdCounter = 0;
function nextLayerId(): string {
  return `layer-${++layerIdCounter}-${Date.now()}`;
}

/**
 * Align a time series from one set of timestamps to another using nearest-neighbor.
 * source: [[timestamp_ms, value], ...] — may have different resolution
 * targetTimestamps: the OHLC timestamps (ms) to align to
 * maxGapMs: max allowed gap between source & target (default 3 days)
 */
function alignTimeSeries(
  source: number[][],
  targetTimestamps: number[],
  maxGapMs = 3 * 86400_000,
): (number | null)[] {
  if (source.length === 0) return targetTimestamps.map(() => null);
  const sorted = [...source].sort((a, b) => a[0] - b[0]);
  return targetTimestamps.map((ts) => {
    // Binary search for closest
    let lo = 0;
    let hi = sorted.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (sorted[mid][0] < ts) lo = mid + 1;
      else hi = mid;
    }
    let closest = sorted[lo];
    if (lo > 0) {
      const prev = sorted[lo - 1];
      if (Math.abs(prev[0] - ts) < Math.abs(closest[0] - ts)) {
        closest = prev;
      }
    }
    if (Math.abs(closest[0] - ts) > maxGapMs) return null;
    return closest[1];
  });
}

interface DataLabStore {
  // Config
  coin: string;
  days: number;
  activePreset: string | null;
  setCoin: (coin: string) => void;
  setDays: (days: number) => void;

  // Layers
  layers: OverlayLayer[];
  addLayer: (layer: Omit<OverlayLayer, 'id' | 'data'>) => void;
  removeLayer: (id: string) => void;
  toggleLayer: (id: string) => void;
  setLayers: (layers: OverlayLayer[]) => void;

  // Raw data (keyed by source)
  timestamps: number[];
  rawData: Record<string, (number | null)[]>;
  ohlcRaw: number[][] | null; // [timestamp, open, high, low, close]

  // Editable cells: layerId → { index: value }
  editedCells: Record<string, Record<number, number>>;
  editCell: (layerId: string, index: number, value: number) => void;
  resetEdits: (layerId?: string) => void;
  undoLastEdit: () => void;
  editHistory: EditHistoryEntry[];

  // Parameters (e.g. sma_window → 20)
  parameters: Record<string, number>;
  setParameter: (key: string, value: number) => void;
  resetParameters: () => void;

  // Normalize mode
  normalizeMode: boolean;
  toggleNormalize: () => void;

  // Log scale (for price axes)
  logScale: boolean;
  toggleLogScale: () => void;

  // Currency
  vsCurrency: string;
  setVsCurrency: (currency: string) => void;

  // Loading
  isLoading: boolean;
  error: string | null;

  // Actions
  loadPreset: (presetId: string) => Promise<void>;
  loadData: () => Promise<void>;
  recalculateLayers: () => void;

  // Drawings
  drawings: Drawing[];
  activeDrawingTool: DrawingType | null;
  pendingPoints: { x: number; y: number }[];
  addDrawing: (drawing: Drawing) => void;
  removeDrawing: (id: string) => void;
  clearDrawings: () => void;
  setActiveDrawingTool: (tool: DrawingType | null) => void;
  addPendingPoint: (point: { x: number; y: number }) => void;
  clearPendingPoints: () => void;

  // Formula layers
  addFormulaLayer: (expression: string, label: string) => void;

  // Regime detection
  showRegimes: boolean;
  toggleRegimes: () => void;
  regimes: MarketRegime[];

  // Event markers
  showEvents: boolean;
  toggleEvents: () => void;
  eventCategories: EventCategory[];
  setEventCategories: (cats: EventCategory[]) => void;

  // What-if simulator
  whatIfActive: boolean;
  whatIfParam: string;    // parameter key being simulated
  whatIfDelta: number;    // % change from current value
  setWhatIf: (param: string, delta: number) => void;
  clearWhatIf: () => void;

  // Custom event markers
  customEvents: MarketEvent[];
  addCustomEvent: (event: MarketEvent) => void;
  removeCustomEvent: (date: number) => void;

  // Lab Notebook
  labNotes: LabNote[];
  addLabNote: (note: Omit<LabNote, 'id' | 'timestamp'>) => void;
  removeLabNote: (id: string) => void;

  // UI
  showTable: boolean;
  toggleTable: () => void;

  // Mode system
  dataLabMode: DataLabMode;
  setDataLabMode: (mode: DataLabMode) => void;

  // Divergence detection
  divergenceSignals: DivergenceSignal[];
  showDivergences: boolean;
  toggleDivergences: () => void;

  // Data quality warnings
  dataQualityWarnings: DataQualityWarning[];

  // Auto-refresh
  autoRefreshEnabled: boolean;
  autoRefreshInterval: number;
  toggleAutoRefresh: () => void;
  setAutoRefreshInterval: (ms: number) => void;

  // Multi-chart (advanced)
  multiChartEnabled: boolean;
  chartCount: 2 | 3 | 4;
  activeChartIndex: number;
  toggleMultiChart: () => void;
  setChartCount: (n: 2 | 3 | 4) => void;
  setActiveChartIndex: (i: number) => void;

  // Annotations timeline
  showAnnotationsTimeline: boolean;
  toggleAnnotationsTimeline: () => void;

  // Chart patterns
  detectedPatterns: DetectedPattern[];
  showPatterns: boolean;
  togglePatterns: () => void;

  // AI anomalies
  detectedAnomalies: Anomaly[];
  showAnomalies: boolean;
  toggleAnomalies: () => void;
}

interface LabNote {
  id: string;
  timestamp: number;
  hypothesis: string;
  evidence: string;
  verdict: 'confirmed' | 'rejected' | 'pending';
  presetId: string | null;
  coin: string;
  days: number;
}

export const useDataLabStore = create<DataLabStore>()(
  persist(
    (set, get) => ({
      coin: 'bitcoin',
      days: 90,
      activePreset: null,
      setCoin: (coin) => set({ coin }),
      setDays: (days) => set({ days }),

      layers: [],
      addLayer: (layer) => {
        const id = nextLayerId();
        set((s) => ({
          layers: [...s.layers, { ...layer, id, data: [] }],
        }));
      },
      removeLayer: (id) => set((s) => ({
        layers: s.layers.filter((l) => l.id !== id),
        editedCells: Object.fromEntries(
          Object.entries(s.editedCells).filter(([k]) => k !== id),
        ),
      })),
      toggleLayer: (id) => set((s) => ({
        layers: s.layers.map((l) =>
          l.id === id ? { ...l, visible: !l.visible } : l,
        ),
      })),
      setLayers: (layers) => set({ layers }),

      timestamps: [],
      rawData: {},
      ohlcRaw: null,

      editedCells: {},
      editHistory: [],
      editCell: (layerId, index, value) => {
        const state = get();
        const layer = state.layers.find((l) => l.id === layerId);
        if (!layer) return;
        const oldValue = layer.data[index];
        set((s) => ({
          editedCells: {
            ...s.editedCells,
            [layerId]: {
              ...(s.editedCells[layerId] || {}),
              [index]: value,
            },
          },
          editHistory: [
            ...s.editHistory,
            { layerId, index, oldValue: oldValue as number },
          ],
        }));
      },
      resetEdits: (layerId) => {
        if (layerId) {
          set((s) => ({
            editedCells: Object.fromEntries(
              Object.entries(s.editedCells).filter(([k]) => k !== layerId),
            ),
            editHistory: s.editHistory.filter((e) => e.layerId !== layerId),
          }));
        } else {
          set({ editedCells: {}, editHistory: [] });
        }
      },
      undoLastEdit: () => {
        const { editHistory, editedCells } = get();
        if (editHistory.length === 0) return;
        const last = editHistory[editHistory.length - 1];
        const layerEdits = { ...(editedCells[last.layerId] || {}) };
        delete layerEdits[last.index];
        set({
          editedCells: {
            ...editedCells,
            [last.layerId]: layerEdits,
          },
          editHistory: editHistory.slice(0, -1),
        });
      },

      parameters: {},
      setParameter: (key, value) => set((s) => ({
        parameters: { ...s.parameters, [key]: value },
      })),
      resetParameters: () => {
        const { activePreset } = get();
        if (!activePreset) {
          set({ parameters: {} });
          return;
        }

        const preset = getPresetById(activePreset);
        if (!preset) {
          set({ parameters: {} });
          return;
        }

        // Fully reset the preset state (more reliable than trying to surgically
        // map each parameter back), without refetching.
        const defaultParameters: Record<string, number> = {};
        for (const pd of preset.parameterDefs) {
          defaultParameters[pd.key] = pd.defaultValue;
        }

        const rebuiltLayers: OverlayLayer[] = preset.layers.map((l) => ({
          ...l,
          id: nextLayerId(),
          data: [],
        }));

        // Keep coin/days + raw data as-is (no network), but reset everything else.
        set({
          parameters: defaultParameters,
          layers: rebuiltLayers,
          editedCells: {},
          editHistory: [],
        });

        // Populate derived series from already-loaded rawData/ohlcRaw.
        get().recalculateLayers();
      },

      normalizeMode: false,
      toggleNormalize: () => set((s) => ({ normalizeMode: !s.normalizeMode })),

      logScale: false,
      toggleLogScale: () => set((s) => ({ logScale: !s.logScale })),

      vsCurrency: 'usd',
      setVsCurrency: (currency) => set({ vsCurrency: currency }),

      drawings: [],
      activeDrawingTool: null,
      pendingPoints: [],
      addDrawing: (drawing) => set((s) => ({ drawings: [...s.drawings, drawing] })),
      removeDrawing: (id) => set((s) => ({ drawings: s.drawings.filter((d) => d.id !== id) })),
      clearDrawings: () => set({ drawings: [], pendingPoints: [] }),
      setActiveDrawingTool: (tool) => set({ activeDrawingTool: tool, pendingPoints: [] }),
      addPendingPoint: (point) => set((s) => ({ pendingPoints: [...s.pendingPoints, point] })),
      clearPendingPoints: () => set({ pendingPoints: [] }),

      // Regime detection
      showRegimes: false,
      toggleRegimes: () => set((s) => ({ showRegimes: !s.showRegimes })),
      regimes: [],

      // Event markers
      showEvents: false,
      toggleEvents: () => set((s) => ({ showEvents: !s.showEvents })),
      eventCategories: ['halving', 'etf', 'crash', 'macro', 'regulation', 'upgrade'] as EventCategory[],
      setEventCategories: (cats) => set({ eventCategories: cats }),

      // What-if simulator
      whatIfActive: false,
      whatIfParam: '',
      whatIfDelta: 0,
      setWhatIf: (param, delta) => set({ whatIfActive: true, whatIfParam: param, whatIfDelta: delta }),
      clearWhatIf: () => set({ whatIfActive: false, whatIfParam: '', whatIfDelta: 0 }),

      // Custom event markers
      customEvents: [],
      addCustomEvent: (event) => set((s) => ({
        customEvents: [...s.customEvents, event],
      })),
      removeCustomEvent: (date) => set((s) => ({
        customEvents: s.customEvents.filter((e) => e.date !== date),
      })),

      // Lab Notebook
      labNotes: [],
      addLabNote: (note) => set((s) => ({
        labNotes: [...s.labNotes, {
          ...note,
          id: `note-${Date.now()}`,
          timestamp: Date.now(),
        }],
      })),
      removeLabNote: (id) => set((s) => ({
        labNotes: s.labNotes.filter((n) => n.id !== id),
      })),

      isLoading: false,
      error: null,

      addFormulaLayer: (expression, label) => {
        const id = nextLayerId();
        const FORMULA_COLORS = ['#f472b6', '#22d3ee', '#a3e635', '#fb923c', '#c084fc'];
        const colorIdx = get().layers.filter((l) => l.source === 'formula').length;
        set((s) => ({
          layers: [...s.layers, {
            id,
            label: label || `f(x): ${expression}`,
            source: 'formula' as const,
            chartType: 'line' as const,
            yAxis: 'right' as const,
            color: FORMULA_COLORS[colorIdx % FORMULA_COLORS.length],
            visible: true,
            gridIndex: 0,
            data: [],
            formula: expression,
          }],
        }));
        get().recalculateLayers();
      },

      showTable: false,
      toggleTable: () => set((s) => ({ showTable: !s.showTable })),

      // Mode system
      dataLabMode: 'intermediate' as DataLabMode,
      setDataLabMode: (mode) => set({ dataLabMode: mode }),

      // Divergence detection
      divergenceSignals: [],
      showDivergences: false,
      toggleDivergences: () => set((s) => ({ showDivergences: !s.showDivergences })),

      // Data quality warnings
      dataQualityWarnings: [],

      // Auto-refresh
      autoRefreshEnabled: false,
      autoRefreshInterval: 300_000, // 5 min default
      toggleAutoRefresh: () => set((s) => ({ autoRefreshEnabled: !s.autoRefreshEnabled })),
      setAutoRefreshInterval: (ms) => set({ autoRefreshInterval: ms }),

      // Multi-chart (advanced)
      multiChartEnabled: false,
      chartCount: 2 as 2 | 3 | 4,
      activeChartIndex: 0,
      toggleMultiChart: () => set((s) => ({ multiChartEnabled: !s.multiChartEnabled })),
      setChartCount: (n) => set({ chartCount: n }),
      setActiveChartIndex: (i) => set({ activeChartIndex: i }),

      // Annotations timeline
      showAnnotationsTimeline: false,
      toggleAnnotationsTimeline: () => set((s) => ({ showAnnotationsTimeline: !s.showAnnotationsTimeline })),

      // Chart patterns
      detectedPatterns: [],
      showPatterns: false,
      togglePatterns: () => set((s) => ({ showPatterns: !s.showPatterns })),

      // AI anomalies
      detectedAnomalies: [],
      showAnomalies: false,
      toggleAnomalies: () => set((s) => ({ showAnomalies: !s.showAnomalies })),

      loadPreset: async (presetId) => {
        const preset = getPresetById(presetId);
        if (!preset) return;

        // Set default parameters from preset
        const params: Record<string, number> = {};
        for (const pd of preset.parameterDefs) {
          params[pd.key] = pd.defaultValue;
        }

        // Create layers with IDs
        const layers: OverlayLayer[] = preset.layers.map((l) => ({
          ...l,
          id: nextLayerId(),
          data: [],
        }));

        set({
          coin: preset.defaultCoin,
          days: preset.defaultDays,
          activePreset: presetId,
          layers,
          parameters: params,
          editedCells: {},
          editHistory: [],
          rawData: {},
          ohlcRaw: null,
          timestamps: [],
        });

        // Now fetch data
        await get().loadData();
      },

      loadData: async () => {
        const { coin, days, layers } = get();
        set({ isLoading: true, error: null });

        try {
          // Collect unique endpoints needed based on layer sources
          const endpointsSet = new Set<string>();
          const sources = new Set(layers.map((l) => l.source));

          // Price/OHLC/indicators always need OHLC data
          const ohlcSources: DataSource[] = [
            'price', 'ohlc', 'sma', 'ema', 'rsi',
            'macd', 'macd_signal', 'macd_histogram',
            'bollinger_upper', 'bollinger_lower',
            'stochastic_k', 'stochastic_d', 'atr',
            'bb_width', 'daily_return', 'drawdown',
            'rolling_volatility', 'rsi_sma',
            'vwap', 'obv', 'ichimoku_tenkan', 'ichimoku_kijun',
            'ichimoku_senkou_a', 'ichimoku_senkou_b', 'adx', 'williams_r', 'cci',
          ];
          if (ohlcSources.some((s) => sources.has(s))) {
            endpointsSet.add('ohlc');
          }
          // Real volume needs market_chart (coin_history endpoint)
          if (sources.has('volume') || sources.has('volume_sma') || sources.has('volume_ratio') || sources.has('vwap') || sources.has('obv')) {
            endpointsSet.add('ohlc');       // for timestamps
            endpointsSet.add('coin_history'); // for real volume
          }
          // Market cap needs coin_history endpoint
          if (sources.has('market_cap')) {
            endpointsSet.add('ohlc');       // for timestamps
            endpointsSet.add('coin_history');
          }
          if (sources.has('fear_greed')) endpointsSet.add('fear_greed');
          if (sources.has('btc_dominance')) endpointsSet.add('global');
          if (sources.has('defi_tvl')) endpointsSet.add('defillama_tvl_history');
          if (sources.has('funding_rate') || sources.has('open_interest')) {
            endpointsSet.add('derivatives');
          }
          // On-chain data (Blockchain.com — free, no key)
          const onchainSources: DataSource[] = ['hashrate', 'difficulty', 'active_addresses', 'tx_count', 'miners_revenue'];
          if (onchainSources.some((s) => sources.has(s))) {
            endpointsSet.add('blockchain_onchain');
          }
          // Stablecoin supply (DeFi Llama)
          if (sources.has('stablecoin_mcap')) {
            endpointsSet.add('defillama_stablecoin_history');
          }

          const endpoints = Array.from(endpointsSet);
          if (endpoints.length === 0) {
            set({ isLoading: false });
            return;
          }

          // Fetch via the live dashboard store's fetchData
          const dashStore = useLiveDashboardStore.getState();

          // Check if an API key is available (needed for CoinGecko endpoints)
          const hasKey = !!dashStore.apiKey;
          const cgEndpoints = endpoints.filter(
            (ep) => !ep.startsWith('defillama_') && !ep.startsWith('blockchain_') && ep !== 'fear_greed',
          );
          if (cgEndpoints.length > 0 && !hasKey) {
            set({
              isLoading: false,
              error: 'CoinGecko API key required. Go to any dashboard, open Settings, and enter your free CoinGecko API key.',
            });
            return;
          }

          // Build params — blockchain_onchain needs chart names based on requested sources
          const fetchParams: Record<string, any> = {
            coinId: coin,
            coinIds: [coin],
            days,
            vsCurrency: get().vsCurrency || 'usd',
            historyCoinId: coin,
            historyDays: days,
            fgLimit: Math.min(days + 10, 365),
          };
          if (endpointsSet.has('blockchain_onchain')) {
            const chartMap: Record<string, string> = {
              hashrate: 'hash-rate',
              difficulty: 'difficulty',
              active_addresses: 'n-unique-addresses',
              tx_count: 'n-transactions',
              miners_revenue: 'miners-revenue',
            };
            fetchParams.blockchainCharts = onchainSources
              .filter((s) => sources.has(s))
              .map((s) => chartMap[s])
              .filter(Boolean);
          }

          await dashStore.fetchData(endpoints, fetchParams);

          // Check if dashboard store encountered an error
          const dashError = useLiveDashboardStore.getState().error;
          if (dashError) {
            set({ isLoading: false, error: dashError });
            return;
          }

          // Extract data from dashboard store
          const dashData = useLiveDashboardStore.getState().data;
          const ohlcData = dashData.ohlc?.[coin];

          if (!ohlcData || ohlcData.length === 0) {
            set({
              isLoading: false,
              error: `No OHLC data returned for "${coin}". Check your API key or try a different coin.`,
            });
            return;
          }

          const timestamps = ohlcData.map((d: number[]) => d[0]);
          const closes = ohlcData.map((d: number[]) => d[4]);
          const opens = ohlcData.map((d: number[]) => d[1]);

          const highs = ohlcData.map((d: number[]) => d[2]);
          const lows = ohlcData.map((d: number[]) => d[3]);

          const raw: Record<string, (number | null)[]> = {
            price: closes,
            open: opens,
            high: highs,
            low: lows,
          };

          // ── REAL VOLUME from market_chart (coin_history endpoint) ──
          const marketChart = dashData.coinHistory as {
            prices?: number[][];
            total_volumes?: number[][];
            market_caps?: number[][];
          } | null;
          if (marketChart?.total_volumes && marketChart.total_volumes.length > 0) {
            // total_volumes: [[timestamp_ms, volume], ...]
            // Align to OHLC timestamps using nearest-neighbor
            raw.volume = alignTimeSeries(marketChart.total_volumes, timestamps);
          } else {
            // Fallback: no volume data available
            raw.volume = timestamps.map(() => null);
          }

          // ── Market Cap from coin_history ──
          if (marketChart?.market_caps && marketChart.market_caps.length > 0) {
            raw.market_cap = alignTimeSeries(marketChart.market_caps, timestamps);
          }

          // ── REAL Fear & Greed history ──
          if (dashData.fearGreed && dashData.fearGreed.length > 0) {
            // Convert to [[timestamp_ms, value], ...] for alignment
            const fgPairs: number[][] = dashData.fearGreed.map((fg) => [
              Number(fg.timestamp) * 1000, // API returns seconds, convert to ms
              Number(fg.value),
            ]);
            raw.fear_greed = alignTimeSeries(fgPairs, timestamps, 2 * 86400_000);
          }

          // ── BTC Dominance — current snapshot (honest: single reference value) ──
          if (dashData.global) {
            const btcDom = dashData.global.market_cap_percentage?.btc ?? null;
            if (btcDom != null) {
              // Stored as flat line but chartBuilder renders as reference line
              raw.btc_dominance = timestamps.map(() => btcDom);
              raw._btc_dominance_snapshot = [btcDom] as any; // flag for chartBuilder
            }
          }

          // ── REAL DeFi TVL history from DeFi Llama ──
          if (dashData.defiTvlHistory && dashData.defiTvlHistory.length > 0) {
            // defiTvlHistory: [{ date: unix_seconds, tvl: number }, ...]
            const tvlPairs: number[][] = dashData.defiTvlHistory.map((d) => [
              d.date * 1000, // seconds → ms
              d.tvl,
            ]);
            raw.defi_tvl = alignTimeSeries(tvlPairs, timestamps, 2 * 86400_000);
          }

          // ── Blockchain.com on-chain data ──
          const bcData = dashData.blockchainOnchain as Record<string, { x: number; y: number }[]> | null;
          if (bcData) {
            const bcChartMap: Record<string, string> = {
              'hash-rate': 'hashrate',
              'difficulty': 'difficulty',
              'n-unique-addresses': 'active_addresses',
              'n-transactions': 'tx_count',
              'miners-revenue': 'miners_revenue',
            };
            for (const [chartName, rawKey] of Object.entries(bcChartMap)) {
              if (bcData[chartName] && bcData[chartName].length > 0) {
                const pairs: number[][] = bcData[chartName].map((d) => [d.x * 1000, d.y]);
                raw[rawKey] = alignTimeSeries(pairs, timestamps, 2 * 86400_000);
              }
            }
          }

          // ── Stablecoin supply history (DeFi Llama) ──
          const stablecoinHist = dashData.defiStablecoinHistory as { date: number; totalUSD: number }[] | null;
          if (stablecoinHist && stablecoinHist.length > 0) {
            const scPairs: number[][] = stablecoinHist.map((d) => [d.date * 1000, d.totalUSD]);
            raw.stablecoin_mcap = alignTimeSeries(scPairs, timestamps, 2 * 86400_000);
          }

          // ── Funding Rate — current snapshot (honest: single reference value) ──
          if (dashData.derivatives && dashData.derivatives.length > 0) {
            const btcPerps = dashData.derivatives.filter(
              (d) => d.symbol.toLowerCase().includes('btc') && d.contract_type === 'perpetual',
            );
            const avgFunding = btcPerps.length > 0
              ? btcPerps.reduce((s, d) => s + d.funding_rate, 0) / btcPerps.length
              : 0;
            // Stored as flat line but chartBuilder renders as reference line
            raw.funding_rate = timestamps.map(() => avgFunding * 100);
            raw._funding_rate_snapshot = [avgFunding * 100] as any;
          }

          set({ timestamps, rawData: raw, ohlcRaw: ohlcData });

          // Recalculate derived layers (SMA, EMA, RSI)
          get().recalculateLayers();

          set({ isLoading: false });
        } catch (err: any) {
          set({ isLoading: false, error: err.message || 'Failed to load data' });
        }
      },

      recalculateLayers: () => {
        const { layers, rawData, ohlcRaw, parameters } = get();
        if (!rawData.price || rawData.price.length === 0) return;

        const closes = rawData.price as number[];
        const updatedLayers = layers.map((layer) => {
          let data: (number | null)[] = [];

          switch (layer.source) {
            case 'price':
              data = [...closes];
              break;
            case 'volume':
              data = rawData.volume ? [...rawData.volume] : [];
              break;
            case 'ohlc':
              // OHLC data handled specially by chartBuilder (uses ohlcRaw)
              data = ohlcRaw ? ohlcRaw.map((d) => d[4]) : [];
              break;
            case 'sma': {
              const window = layer.params?.window ?? parameters.sma_short ?? 20;
              data = computeSMA(closes, window);
              break;
            }
            case 'ema': {
              const window = layer.params?.window ?? 20;
              data = computeEMA(closes, window);
              break;
            }
            case 'rsi': {
              const period = layer.params?.period ?? parameters.rsi_period ?? 14;
              data = computeRSI(closes, period);
              break;
            }
            case 'macd':
            case 'macd_signal':
            case 'macd_histogram': {
              const fast = layer.params?.fast ?? parameters.macd_fast ?? 12;
              const slow = layer.params?.slow ?? parameters.macd_slow ?? 26;
              const sig = layer.params?.signal ?? parameters.macd_signal_period ?? 9;
              const result = computeMACD(closes, fast, slow, sig);
              data = layer.source === 'macd' ? result.macd
                : layer.source === 'macd_signal' ? result.signal
                : result.histogram;
              break;
            }
            case 'bollinger_upper':
            case 'bollinger_lower': {
              const bbPeriod = layer.params?.window ?? parameters.bb_period ?? 20;
              const bbMult = layer.params?.multiplier ?? parameters.bb_mult ?? 2;
              const result = computeBollingerBands(closes, bbPeriod, bbMult);
              data = layer.source === 'bollinger_upper' ? result.upper : result.lower;
              break;
            }
            case 'stochastic_k':
            case 'stochastic_d': {
              const sHighs = rawData.high as number[] ?? (ohlcRaw ? ohlcRaw.map((d) => d[2]) : []);
              const sLows = rawData.low as number[] ?? (ohlcRaw ? ohlcRaw.map((d) => d[3]) : []);
              const kP = layer.params?.kPeriod ?? parameters.stoch_k ?? 14;
              const dP = layer.params?.dPeriod ?? parameters.stoch_d ?? 3;
              const sm = layer.params?.smooth ?? parameters.stoch_smooth ?? 3;
              const stochResult = computeStochastic(sHighs, sLows, closes, kP, dP, sm);
              data = layer.source === 'stochastic_k' ? stochResult.k : stochResult.d;
              break;
            }
            case 'atr': {
              const aHighs = rawData.high as number[] ?? (ohlcRaw ? ohlcRaw.map((d) => d[2]) : []);
              const aLows = rawData.low as number[] ?? (ohlcRaw ? ohlcRaw.map((d) => d[3]) : []);
              const atrPeriod = layer.params?.period ?? parameters.atr_period ?? 14;
              data = computeATR(aHighs, aLows, closes, atrPeriod);
              break;
            }
            case 'fear_greed':
              data = rawData.fear_greed ? [...rawData.fear_greed] : [];
              break;
            case 'btc_dominance':
              data = rawData.btc_dominance ? [...rawData.btc_dominance] : [];
              break;
            case 'defi_tvl':
              data = rawData.defi_tvl ? [...rawData.defi_tvl] : [];
              break;
            case 'funding_rate':
              data = rawData.funding_rate ? [...rawData.funding_rate] : [];
              break;
            case 'hashrate':
              data = rawData.hashrate ? [...rawData.hashrate] : [];
              break;
            case 'difficulty':
              data = rawData.difficulty ? [...rawData.difficulty] : [];
              break;
            case 'active_addresses':
              data = rawData.active_addresses ? [...rawData.active_addresses] : [];
              break;
            case 'tx_count':
              data = rawData.tx_count ? [...rawData.tx_count] : [];
              break;
            case 'miners_revenue':
              data = rawData.miners_revenue ? [...rawData.miners_revenue] : [];
              break;
            case 'stablecoin_mcap':
              data = rawData.stablecoin_mcap ? [...rawData.stablecoin_mcap] : [];
              break;
            case 'bb_width': {
              const bbwPeriod = layer.params?.window ?? parameters.bb_period ?? 20;
              const bbwMult = layer.params?.multiplier ?? parameters.bb_mult ?? 2;
              data = computeBBWidth(closes, bbwPeriod, bbwMult);
              break;
            }
            case 'volume_sma': {
              const vol = rawData.volume as number[] ?? [];
              const volWindow = layer.params?.window ?? parameters.vol_sma ?? 20;
              data = vol.length > 0 ? computeSMA(vol.map(v => v ?? 0), volWindow) : [];
              break;
            }
            case 'volume_ratio': {
              const volData = rawData.volume ?? [];
              const vrWindow = layer.params?.window ?? parameters.vol_sma ?? 20;
              const volNums = volData.map(v => v ?? 0);
              const volSma = computeSMA(volNums, vrWindow);
              data = computeRatio(volData, volSma);
              break;
            }
            case 'daily_return':
              data = computeDailyReturn(closes);
              break;
            case 'drawdown':
              data = computeDrawdown(closes);
              break;
            case 'market_cap':
              data = rawData.market_cap ? [...rawData.market_cap] : [];
              break;
            case 'rolling_volatility': {
              const rvWindow = layer.params?.window ?? parameters.vol_window ?? 30;
              data = computeRollingVolatility(closes, rvWindow);
              break;
            }
            case 'rsi_sma': {
              const rsiPeriod = layer.params?.period ?? parameters.rsi_period ?? 14;
              const rsiWindow = layer.params?.window ?? parameters.rsi_sma_window ?? 10;
              const rsiValues = computeRSI(closes, rsiPeriod);
              // SMA of non-null RSI values, then map back
              const rsiNums = rsiValues.map(v => v ?? 0);
              data = computeSMA(rsiNums, rsiWindow);
              // Zero out the leading nulls where RSI itself is null
              for (let i = 0; i < rsiValues.length; i++) {
                if (rsiValues[i] == null) data[i] = null;
              }
              break;
            }
            case 'vwap': {
              const vHighs = rawData.high as number[] ?? (ohlcRaw ? ohlcRaw.map((d) => d[2]) : []);
              const vLows = rawData.low as number[] ?? (ohlcRaw ? ohlcRaw.map((d) => d[3]) : []);
              const vVols = rawData.volume ?? [];
              data = computeVWAP(vHighs, vLows, closes, vVols);
              break;
            }
            case 'obv': {
              const obvVols = rawData.volume ?? [];
              data = computeOBV(closes, obvVols);
              break;
            }
            case 'ichimoku_tenkan':
            case 'ichimoku_kijun':
            case 'ichimoku_senkou_a':
            case 'ichimoku_senkou_b': {
              const iHighs = rawData.high as number[] ?? (ohlcRaw ? ohlcRaw.map((d) => d[2]) : []);
              const iLows = rawData.low as number[] ?? (ohlcRaw ? ohlcRaw.map((d) => d[3]) : []);
              const ich = computeIchimoku(iHighs, iLows, closes);
              data = layer.source === 'ichimoku_tenkan' ? ich.tenkan
                : layer.source === 'ichimoku_kijun' ? ich.kijun
                : layer.source === 'ichimoku_senkou_a' ? ich.senkouA
                : ich.senkouB;
              break;
            }
            case 'adx': {
              const adxHighs = rawData.high as number[] ?? (ohlcRaw ? ohlcRaw.map((d) => d[2]) : []);
              const adxLows = rawData.low as number[] ?? (ohlcRaw ? ohlcRaw.map((d) => d[3]) : []);
              const adxPeriod = layer.params?.period ?? parameters.adx_period ?? 14;
              data = computeADX(adxHighs, adxLows, closes, adxPeriod);
              break;
            }
            case 'williams_r': {
              const wrHighs = rawData.high as number[] ?? (ohlcRaw ? ohlcRaw.map((d) => d[2]) : []);
              const wrLows = rawData.low as number[] ?? (ohlcRaw ? ohlcRaw.map((d) => d[3]) : []);
              const wrPeriod = layer.params?.period ?? parameters.wr_period ?? 14;
              data = computeWilliamsR(wrHighs, wrLows, closes, wrPeriod);
              break;
            }
            case 'cci': {
              const cciHighs = rawData.high as number[] ?? (ohlcRaw ? ohlcRaw.map((d) => d[2]) : []);
              const cciLows = rawData.low as number[] ?? (ohlcRaw ? ohlcRaw.map((d) => d[3]) : []);
              const cciPeriod = layer.params?.period ?? parameters.cci_period ?? 20;
              data = computeCCI(cciHighs, cciLows, closes, cciPeriod);
              break;
            }
            case 'formula': {
              if (layer.formula) {
                try {
                  data = evaluateFormula(layer.formula, {
                    price: closes,
                    volume: rawData.volume ?? [],
                  });
                } catch {
                  data = closes.map(() => null);
                }
              }
              break;
            }
            default:
              data = layer.data;
          }

          return { ...layer, data };
        });

        // Compute regime detection (always computed for chart overlay)
        const sma50 = computeSMA(closes, 50);
        const bbWidth = computeBBWidth(closes, 20, 2);
        const rollingVol = computeRollingVolatility(closes, 30);
        const drawdownArr = computeDrawdown(closes);
        const regimes = detectRegimes({
          closes,
          sma50,
          bbWidth,
          rollingVol,
          drawdown: drawdownArr,
        });

        // Compute divergence signals
        const rsiData = computeRSI(closes, parameters.rsi_period ?? 14);
        const macdData = computeMACD(closes, parameters.macd_fast ?? 12, parameters.macd_slow ?? 26, parameters.macd_signal_period ?? 9);
        const divergenceSignals = detectDivergences(closes, rsiData, macdData.macd);

        // Compute chart patterns
        const detectedPatterns = recognizePatterns(closes);

        // Compute anomalies
        const { timestamps } = get();
        const volumes = rawData.volume as number[] | undefined;
        const detectedAnomalies = detectAnomalies(closes, volumes ?? [], timestamps);

        // Compute data quality warnings
        const dataQualityWarnings = analyzeDataQuality(timestamps, updatedLayers);

        set({ layers: updatedLayers, regimes, divergenceSignals, dataQualityWarnings, detectedPatterns, detectedAnomalies });
      },
    }),
    {
      name: 'crk-datalab',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined' ? sessionStorage : {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        },
      ),
      partialize: (state) => ({
        coin: state.coin,
        days: state.days,
        activePreset: state.activePreset,
        parameters: state.parameters,
        normalizeMode: state.normalizeMode,
        logScale: state.logScale,
        vsCurrency: state.vsCurrency,
        showTable: state.showTable,
        drawings: state.drawings,
        showRegimes: state.showRegimes,
        showEvents: state.showEvents,
        eventCategories: state.eventCategories,
        labNotes: state.labNotes,
        customEvents: state.customEvents,
        dataLabMode: state.dataLabMode,
        autoRefreshEnabled: state.autoRefreshEnabled,
        autoRefreshInterval: state.autoRefreshInterval,
        showDivergences: state.showDivergences,
      }),
    },
  ),
);
