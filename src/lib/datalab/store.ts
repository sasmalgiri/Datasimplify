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
          // Collect unique endpoints needed
          const endpointsSet = new Set<string>();
          for (const layer of layers) {
            const src = layer.source;
            if (src === 'price' || src === 'volume' || src === 'ohlc' || src === 'sma' || src === 'ema' || src === 'rsi') {
              endpointsSet.add('ohlc');
            } else if (src === 'fear_greed') {
              endpointsSet.add('fear_greed');
            } else if (src === 'btc_dominance') {
              endpointsSet.add('global');
            } else if (src === 'defi_tvl') {
              endpointsSet.add('defillama_protocols');
            } else if (src === 'funding_rate' || src === 'open_interest') {
              endpointsSet.add('derivatives');
            }
          }

          const endpoints = Array.from(endpointsSet);
          if (endpoints.length === 0) {
            set({ isLoading: false });
            return;
          }

          // Fetch via the live dashboard store's fetchData
          const dashStore = useLiveDashboardStore.getState();
          await dashStore.fetchData(endpoints, {
            coinIds: [coin],
            days,
          });

          // Extract data from dashboard store
          const dashData = useLiveDashboardStore.getState().data;
          const ohlcData = dashData.ohlc?.[coin];

          if (ohlcData && ohlcData.length > 0) {
            const timestamps = ohlcData.map((d) => d[0]);
            const closes = ohlcData.map((d) => d[4]);
            const opens = ohlcData.map((d) => d[1]);
            const volumes = ohlcData.map((d) => Math.abs(d[4] - d[1]) * 1000);

            const raw: Record<string, (number | null)[]> = {
              price: closes,
              volume: volumes,
              open: opens,
            };

            // Fear & Greed — align to timestamps (use last known value for missing dates)
            if (dashData.fearGreed && dashData.fearGreed.length > 0) {
              const fgMap = new Map<string, number>();
              for (const fg of dashData.fearGreed) {
                const d = new Date(Number(fg.timestamp) * 1000);
                const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
                fgMap.set(key, Number(fg.value));
              }
              const fgAligned: (number | null)[] = timestamps.map((ts) => {
                const d = new Date(ts);
                const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
                return fgMap.get(key) ?? null;
              });
              raw.fear_greed = fgAligned;
            }

            // BTC Dominance — single value (project as flat line)
            if (dashData.global) {
              const btcDom = dashData.global.market_cap_percentage?.btc ?? null;
              if (btcDom != null) {
                raw.btc_dominance = timestamps.map(() => btcDom);
              }
            }

            // DeFi TVL — single total (project as flat line)
            if (dashData.defiProtocols && dashData.defiProtocols.length > 0) {
              const totalTvl = dashData.defiProtocols.reduce((sum, p) => sum + (p.tvl || 0), 0);
              raw.defi_tvl = timestamps.map(() => totalTvl);
            }

            // Funding rate — average across derivatives
            if (dashData.derivatives && dashData.derivatives.length > 0) {
              const btcPerps = dashData.derivatives.filter(
                (d) => d.symbol.toLowerCase().includes('btc') && d.contract_type === 'perpetual',
              );
              const avgFunding = btcPerps.length > 0
                ? btcPerps.reduce((s, d) => s + d.funding_rate, 0) / btcPerps.length
                : 0;
              raw.funding_rate = timestamps.map(() => avgFunding * 100); // as percentage
            }

            set({ timestamps, rawData: raw, ohlcRaw: ohlcData });

            // Recalculate derived layers
            get().recalculateLayers();
          }

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
