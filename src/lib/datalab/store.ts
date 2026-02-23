'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { OverlayLayer, EditHistoryEntry, DataSource } from './types';
import { getPresetById } from './presets';
import { computeSMA, computeEMA, computeRSI } from './calculations';
import { useLiveDashboardStore } from '@/lib/live-dashboard/store';

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

  // Loading
  isLoading: boolean;
  error: string | null;

  // Actions
  loadPreset: (presetId: string) => Promise<void>;
  loadData: () => Promise<void>;
  recalculateLayers: () => void;

  // UI
  showTable: boolean;
  toggleTable: () => void;
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
      resetParameters: () => set({ parameters: {} }),

      normalizeMode: false,
      toggleNormalize: () => set((s) => ({ normalizeMode: !s.normalizeMode })),

      isLoading: false,
      error: null,

      showTable: false,
      toggleTable: () => set((s) => ({ showTable: !s.showTable })),

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
          if (sources.has('price') || sources.has('ohlc') || sources.has('sma') ||
              sources.has('ema') || sources.has('rsi')) {
            endpointsSet.add('ohlc');
          }
          // Real volume needs market_chart (coin_history endpoint)
          if (sources.has('volume')) {
            endpointsSet.add('ohlc');       // for timestamps
            endpointsSet.add('coin_history'); // for real volume
          }
          if (sources.has('fear_greed')) endpointsSet.add('fear_greed');
          if (sources.has('btc_dominance')) endpointsSet.add('global');
          if (sources.has('defi_tvl')) endpointsSet.add('defillama_tvl_history');
          if (sources.has('funding_rate') || sources.has('open_interest')) {
            endpointsSet.add('derivatives');
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
            (ep) => !ep.startsWith('defillama_') && ep !== 'fear_greed',
          );
          if (cgEndpoints.length > 0 && !hasKey) {
            set({
              isLoading: false,
              error: 'CoinGecko API key required. Go to any dashboard, open Settings, and enter your free CoinGecko API key.',
            });
            return;
          }

          await dashStore.fetchData(endpoints, {
            coinId: coin,
            coinIds: [coin],
            days,
            vsCurrency: 'usd',
            // coin_history endpoint uses these param names
            historyCoinId: coin,
            historyDays: days,
            // Fear & Greed: fetch full history matching our time range
            fgLimit: Math.min(days + 10, 365),
          });

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

          const raw: Record<string, (number | null)[]> = {
            price: closes,
            open: opens,
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
            default:
              data = layer.data;
          }

          return { ...layer, data };
        });

        set({ layers: updatedLayers });
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
        showTable: state.showTable,
      }),
    },
  ),
);
