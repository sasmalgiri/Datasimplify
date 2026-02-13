'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface MarketCoin {
  id: string;
  symbol: string;
  name: string;
  image?: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  price_change_percentage_24h: number;
  price_change_percentage_7d_in_currency?: number;
  total_volume: number;
  high_24h?: number;
  low_24h?: number;
  circulating_supply?: number;
  max_supply?: number;
  ath?: number;
  ath_change_percentage?: number;
  sparkline_in_7d?: { price: number[] };
}

export interface GlobalData {
  total_market_cap: Record<string, number>;
  total_volume: Record<string, number>;
  market_cap_percentage: Record<string, number>;
  market_cap_change_percentage_24h_usd: number;
  active_cryptocurrencies: number;
  markets: number;
}

export interface TrendingCoin {
  item: {
    id: string;
    name: string;
    symbol: string;
    thumb: string;
    small: string;
    market_cap_rank: number;
    data?: {
      price: number;
      price_change_percentage_24h?: { usd?: number };
      market_cap?: string;
    };
  };
}

export interface FearGreedData {
  value: string;
  value_classification: string;
  timestamp: string;
}

export interface DashboardData {
  markets: MarketCoin[] | null;
  global: GlobalData | null;
  trending: TrendingCoin[] | null;
  fearGreed: FearGreedData[] | null;
  categories: any[] | null;
  ohlc: Record<string, number[][]>;
  coinDetail: Record<string, any> | null;
  exchanges: any[] | null;
  coinHistory: Record<string, any> | null;
}

export interface DashboardCustomization {
  coinId: string;        // Primary coin override (empty = use definition default)
  coinIds: string[];     // Comparison coins override (empty = use definition default)
  days: number;          // Timeframe override (0 = use definition default)
}

const DEFAULT_CUSTOMIZATION: DashboardCustomization = {
  coinId: '',
  coinIds: [],
  days: 0,
};

interface LiveDashboardStore {
  apiKey: string | null;
  keyType: 'pro' | 'demo' | null;
  setApiKey: (key: string, type: 'pro' | 'demo') => void;
  clearApiKey: () => void;

  data: DashboardData;
  isLoading: boolean;
  error: string | null;
  lastFetched: number | null;

  customization: DashboardCustomization;
  setCustomization: (updates: Partial<DashboardCustomization>) => void;
  resetCustomization: () => void;

  fetchData: (endpoints: string[], params?: Record<string, any>) => Promise<void>;
  resetData: () => void;
}

const emptyData: DashboardData = {
  markets: null,
  global: null,
  trending: null,
  fearGreed: null,
  categories: null,
  ohlc: {},
  coinDetail: null,
  exchanges: null,
  coinHistory: null,
};

export const useLiveDashboardStore = create<LiveDashboardStore>()(
  persist(
    (set, get) => ({
      apiKey: null,
      keyType: null,
      setApiKey: (key, type) => set({ apiKey: key, keyType: type }),
      clearApiKey: () => set({ apiKey: null, keyType: null, data: emptyData, lastFetched: null }),

      data: emptyData,
      isLoading: false,
      error: null,
      lastFetched: null,

      customization: DEFAULT_CUSTOMIZATION,
      setCustomization: (updates) => set((state) => ({
        customization: { ...state.customization, ...updates },
      })),
      resetCustomization: () => set({ customization: DEFAULT_CUSTOMIZATION }),

      fetchData: async (endpoints, params) => {
        const { apiKey } = get();
        if (!apiKey) {
          set({ error: 'No API key provided' });
          return;
        }

        set({ isLoading: true, error: null });

        try {
          const res = await fetch('/api/live-dashboard/data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ apiKey, endpoints, params }),
          });

          if (!res.ok) {
            const err = await res.json().catch(() => ({ error: 'Request failed' }));
            throw new Error(err.error || `HTTP ${res.status}`);
          }

          const result = await res.json();
          const currentData = get().data;

          set({
            data: {
              markets: result.markets ?? currentData.markets,
              global: result.global ?? currentData.global,
              trending: result.trending ?? currentData.trending,
              fearGreed: result.fearGreed ?? currentData.fearGreed,
              categories: result.categories ?? currentData.categories,
              ohlc: { ...currentData.ohlc, ...(result.ohlc || {}) },
              coinDetail: result.coinDetail ?? currentData.coinDetail,
              exchanges: result.exchanges ?? currentData.exchanges,
              coinHistory: result.coinHistory ?? currentData.coinHistory,
            },
            isLoading: false,
            lastFetched: Date.now(),
          });
        } catch (err: any) {
          set({ isLoading: false, error: err.message || 'Failed to fetch data' });
        }
      },

      resetData: () => set({ data: emptyData, lastFetched: null, error: null }),
    }),
    {
      name: 'crk-live-dashboard',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined' ? sessionStorage : {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        }
      ),
      partialize: (state) => ({
        apiKey: state.apiKey,
        keyType: state.keyType,
      }),
    },
  ),
);
