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

export interface DefiGlobalData {
  defi_market_cap: string;
  eth_market_cap: string;
  defi_to_eth_ratio: string;
  trading_volume_24h: string;
  defi_dominance: string;
  top_coin_name: string;
  top_coin_defi_dominance: number;
}

export interface DerivativeTicker {
  market: string;
  symbol: string;
  price: string;
  price_percentage_change_24h: number;
  contract_type: string;
  funding_rate: number;
  open_interest: number;
  volume_24h: number;
}

export interface DerivativesExchange {
  name: string;
  id: string;
  open_interest_btc: number;
  trade_volume_24h_btc: string;
  number_of_perpetual_pairs: number;
  number_of_futures_pairs: number;
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
  defiGlobal: DefiGlobalData | null;
  derivatives: DerivativeTicker[] | null;
  derivativesExchanges: DerivativesExchange[] | null;
}

export type ChartHeight = 'compact' | 'normal' | 'tall';
export type ColorTheme = 'emerald' | 'blue' | 'purple' | 'amber' | 'rose';
export type TableDensity = 'compact' | 'normal' | 'comfortable';
export type ChartStyle = 'smooth' | 'sharp';

export interface DashboardCustomization {
  coinId: string;        // Primary coin override (empty = use definition default)
  coinIds: string[];     // Comparison coins override (empty = use definition default)
  days: number;          // Timeframe override (0 = use definition default)
  vsCurrency: string;    // Currency for prices (default 'usd')
  perPage: number;       // Coins per page (default 100)
  sortOrder: string;     // Sort order for markets (default 'market_cap_desc')
  chartHeight: ChartHeight;
  dataLimit: number;     // 0 = use widget default
  colorTheme: ColorTheme;
  showAnimations: boolean;
  tableDensity: TableDensity;
  chartStyle: ChartStyle;
}

export interface ApiUsageStats {
  apiCallsPerRefresh: number;
  totalApiCalls: number;
  sessionStartTime: number;
  refreshCount: number;
}

/** Number of widgets shown by default before user customizes */
export const DEFAULT_VISIBLE_WIDGET_COUNT = 4;

const DEFAULT_CUSTOMIZATION: DashboardCustomization = {
  coinId: '',
  coinIds: [],
  days: 0,
  vsCurrency: 'usd',
  perPage: 100,
  sortOrder: 'market_cap_desc',
  chartHeight: 'normal',
  dataLimit: 0,
  colorTheme: 'emerald',
  showAnimations: true,
  tableDensity: 'normal',
  chartStyle: 'smooth',
};

/** Calculate CoinGecko API calls for a dashboard definition */
export function calculateApiCallsForDefinition(
  requiredEndpoints: string[],
  params?: { coinIds?: string[] },
): number {
  let calls = 0;
  for (const ep of requiredEndpoints) {
    if (ep === 'fear_greed') continue; // External API, not counted
    if (ep === 'ohlc_multi') {
      calls += params?.coinIds ? Math.min(params.coinIds.length, 5) : 2;
    } else {
      calls += 1;
    }
  }
  return calls;
}

const DEFAULT_API_USAGE: ApiUsageStats = {
  apiCallsPerRefresh: 0,
  totalApiCalls: 0,
  sessionStartTime: Date.now(),
  refreshCount: 0,
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

  autoRefreshInterval: number; // 0 = off, 60/120/300 seconds
  setAutoRefreshInterval: (interval: number) => void;

  // Per-dashboard enabled widgets (keyed by slug). Empty array = use defaults (first 4).
  enabledWidgets: Record<string, string[]>;
  setEnabledWidgets: (slug: string, widgetIds: string[]) => void;

  apiUsage: ApiUsageStats;
  incrementApiCalls: (count: number) => void;
  resetApiUsage: () => void;

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
  defiGlobal: null,
  derivatives: null,
  derivativesExchanges: null,
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

      autoRefreshInterval: 0,
      setAutoRefreshInterval: (interval) => set({ autoRefreshInterval: interval }),

      enabledWidgets: {},
      setEnabledWidgets: (slug, widgetIds) => set((state) => ({
        enabledWidgets: { ...state.enabledWidgets, [slug]: widgetIds },
      })),

      apiUsage: DEFAULT_API_USAGE,
      incrementApiCalls: (count) => set((state) => ({
        apiUsage: {
          ...state.apiUsage,
          totalApiCalls: state.apiUsage.totalApiCalls + count,
          refreshCount: state.apiUsage.refreshCount + 1,
          apiCallsPerRefresh: count,
        },
      })),
      resetApiUsage: () => set({ apiUsage: { ...DEFAULT_API_USAGE, sessionStartTime: Date.now() } }),

      fetchData: async (endpoints, params) => {
        const { apiKey } = get();
        if (!apiKey) {
          set({ error: 'No API key provided' });
          return;
        }

        const callCount = calculateApiCallsForDefinition(endpoints, params);
        get().incrementApiCalls(callCount);

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
              defiGlobal: result.defiGlobal ?? currentData.defiGlobal,
              derivatives: result.derivatives ?? currentData.derivatives,
              derivativesExchanges: result.derivativesExchanges ?? currentData.derivativesExchanges,
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
        autoRefreshInterval: state.autoRefreshInterval,
        customization: state.customization,
        enabledWidgets: state.enabledWidgets,
      }),
    },
  ),
);
