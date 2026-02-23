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

// ── DeFi Llama types ──
export interface DefiProtocol {
  rank: number;
  name: string;
  slug: string;
  symbol: string;
  tvl: number;
  change_1h: number;
  change_1d: number;
  change_7d: number;
  category: string;
  chains: string[];
  logo: string;
  mcap: number;
}

export interface DefiChain {
  rank: number;
  name: string;
  tvl: number;
  tokenSymbol: string;
  gecko_id: string;
}

export interface DefiYield {
  pool: string;
  project: string;
  chain: string;
  symbol: string;
  tvlUsd: number;
  apy: number;
  apyBase: number;
  apyReward: number;
  stablecoin: boolean;
}

export interface DefiStablecoin {
  rank: number;
  name: string;
  symbol: string;
  pegType: string;
  circulating: number;
  chains: string[];
  price: number;
  gecko_id: string;
}

// ── DeFi Llama protocol-specific types ──
export interface DefiProtocolDetail {
  name: string;
  slug: string;
  tvl: number;
  chainTvls: Record<string, number>;
  tvlHistory: { date: number; tvl: number }[];
  chains: string[];
  category: string;
  url: string;
  logo: string;
  description: string;
  symbol: string;
  mcap: number;
}

export interface DefiDexItem {
  rank: number;
  name: string;
  slug: string;
  totalVolume24h: number;
  totalVolume7d: number;
  change_1d: number;
  change_7d: number;
  chains: string[];
  logo: string;
}

export interface DefiFeeItem {
  rank: number;
  name: string;
  slug: string;
  total24h: number;
  total7d: number;
  total30d: number;
  change_1d: number;
  chains: string[];
  logo: string;
  category: string;
}

// ── Alchemy wallet types ──
export interface WalletBalances {
  address: string;
  ethBalance: number;
  tokens: { contractAddress: string; balance: string }[];
}

export interface WalletTransfer {
  hash: string;
  from: string;
  to: string;
  value: number;
  asset: string;
  category: string;
  blockNum: string;
  direction: 'in' | 'out';
}

export interface WalletTransfers {
  address: string;
  transfers: WalletTransfer[];
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
  // DeFi Llama data (no key needed)
  defiProtocols: DefiProtocol[] | null;
  defiChains: DefiChain[] | null;
  defiYields: DefiYield[] | null;
  defiStablecoins: DefiStablecoin[] | null;
  // DeFi Llama protocol-specific data (no key needed)
  defiProtocolDetail: DefiProtocolDetail | null;
  defiDexOverview: DefiDexItem[] | null;
  defiFeeOverview: DefiFeeItem[] | null;
  // DeFi Llama historical TVL (daily time series)
  defiTvlHistory: { date: number; tvl: number }[] | null;
  // Alchemy wallet data (BYOK)
  walletBalances: WalletBalances | null;
  walletTransfers: WalletTransfers | null;
}

export type ChartHeight = 'compact' | 'normal' | 'tall';
export type ColorTheme = 'emerald' | 'blue' | 'purple' | 'amber' | 'rose';
export type TableDensity = 'compact' | 'normal' | 'comfortable';
export type ChartStyle = 'smooth' | 'sharp';
export type SiteTheme = 'dark' | 'light-blue';

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
    // External & free APIs don't count toward CoinGecko usage
    if (ep === 'fear_greed') continue;
    if (ep.startsWith('defillama_')) continue;
    if (ep.startsWith('alchemy_')) continue;
    if (ep === 'ohlc_multi') {
      calls += params?.coinIds ? Math.min(params.coinIds.length, 5) : 2;
    } else {
      calls += 1;
    }
  }
  return calls;
}

/** Check if all endpoints are key-free (DeFi Llama only, no CoinGecko key needed) */
export function isKeyFreeEndpoints(endpoints: string[]): boolean {
  const KEY_FREE = new Set(['defillama_protocols', 'defillama_chains', 'defillama_yields', 'defillama_stablecoins', 'defillama_protocol_tvl', 'defillama_dex_overview', 'defillama_fees_overview', 'defillama_tvl_history', 'fear_greed']);
  return endpoints.every((ep) => KEY_FREE.has(ep));
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

  // Alchemy BYOK
  alchemyKey: string | null;
  walletAddress: string | null;
  alchemyChain: string;
  setAlchemyKey: (key: string) => void;
  setWalletAddress: (address: string) => void;
  setAlchemyChain: (chain: string) => void;
  clearAlchemyKey: () => void;

  data: DashboardData;
  isLoading: boolean;
  error: string | null;
  lastFetched: number | null;

  customization: DashboardCustomization;
  setCustomization: (updates: Partial<DashboardCustomization>) => void;
  resetCustomization: () => void;

  siteTheme: SiteTheme;
  setSiteTheme: (theme: SiteTheme) => void;

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
  defiProtocols: null,
  defiChains: null,
  defiYields: null,
  defiStablecoins: null,
  defiProtocolDetail: null,
  defiDexOverview: null,
  defiFeeOverview: null,
  defiTvlHistory: null,
  walletBalances: null,
  walletTransfers: null,
};

export const useLiveDashboardStore = create<LiveDashboardStore>()(
  persist(
    (set, get) => ({
      apiKey: null,
      keyType: null,
      setApiKey: (key, type) => set({ apiKey: key, keyType: type }),
      clearApiKey: () => set({ apiKey: null, keyType: null, data: emptyData, lastFetched: null }),

      alchemyKey: null,
      walletAddress: null,
      alchemyChain: 'eth-mainnet',
      setAlchemyKey: (key) => set({ alchemyKey: key }),
      setWalletAddress: (address) => set({ walletAddress: address }),
      setAlchemyChain: (chain) => set({ alchemyChain: chain }),
      clearAlchemyKey: () => set({ alchemyKey: null, walletAddress: null, alchemyChain: 'eth-mainnet', data: { ...emptyData, walletBalances: null, walletTransfers: null } }),

      data: emptyData,
      isLoading: false,
      error: null,
      lastFetched: null,

      customization: DEFAULT_CUSTOMIZATION,
      setCustomization: (updates) => set((state) => ({
        customization: { ...state.customization, ...updates },
      })),
      resetCustomization: () => set({ customization: DEFAULT_CUSTOMIZATION }),

      siteTheme: 'dark' as SiteTheme,
      setSiteTheme: (theme) => set({ siteTheme: theme }),

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
        const { apiKey, alchemyKey, walletAddress, alchemyChain } = get();
        const keyFree = isKeyFreeEndpoints(endpoints);

        // Only require CoinGecko key if non-key-free endpoints are present
        if (!keyFree && !apiKey) {
          set({ error: 'No API key provided' });
          return;
        }

        const callCount = calculateApiCallsForDefinition(endpoints, params);
        if (callCount > 0) get().incrementApiCalls(callCount);

        set({ isLoading: true, error: null });

        try {
          const res = await fetch('/api/live-dashboard/data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              apiKey: apiKey || undefined,
              alchemyKey: alchemyKey || undefined,
              walletAddress: walletAddress || undefined,
              alchemyChain: alchemyChain || 'eth-mainnet',
              endpoints,
              params,
            }),
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
              // DeFi Llama
              defiProtocols: result.defiProtocols ?? currentData.defiProtocols,
              defiChains: result.defiChains ?? currentData.defiChains,
              defiYields: result.defiYields ?? currentData.defiYields,
              defiStablecoins: result.defiStablecoins ?? currentData.defiStablecoins,
              defiProtocolDetail: result.defiProtocolDetail ?? currentData.defiProtocolDetail,
              defiDexOverview: result.defiDexOverview ?? currentData.defiDexOverview,
              defiFeeOverview: result.defiFeeOverview ?? currentData.defiFeeOverview,
              defiTvlHistory: result.defiTvlHistory ?? currentData.defiTvlHistory,
              // Alchemy
              walletBalances: result.walletBalances ?? currentData.walletBalances,
              walletTransfers: result.walletTransfers ?? currentData.walletTransfers,
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
        alchemyKey: state.alchemyKey,
        walletAddress: state.walletAddress,
        alchemyChain: state.alchemyChain,
        autoRefreshInterval: state.autoRefreshInterval,
        customization: state.customization,
        siteTheme: state.siteTheme,
        enabledWidgets: state.enabledWidgets,
      }),
    },
  ),
);
