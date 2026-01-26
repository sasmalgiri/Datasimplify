// Crypto coin data types

export interface CoinMarketData {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  fully_diluted_valuation: number | null;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  price_change_percentage_7d?: number;
  price_change_percentage_30d?: number;
  market_cap_change_24h: number;
  market_cap_change_percentage_24h: number;
  circulating_supply: number;
  total_supply: number | null;
  max_supply: number | null;
  ath: number;
  ath_change_percentage: number;
  ath_date: string;
  atl: number;
  atl_change_percentage: number;
  atl_date: string;
  last_updated: string;
}

export interface CoinDetail extends CoinMarketData {
  description?: string;
  homepage?: string;
  blockchain_site?: string[];
  categories?: string[];
  genesis_date?: string;
}

export interface PriceHistory {
  timestamp: number;
  price: number;
  volume?: number;
  market_cap?: number;
}


export interface ComparisonData {
  coins: CoinMarketData[];
  metrics: {
    name: string;
    key: keyof CoinMarketData;
    format: 'currency' | 'percent' | 'number' | 'date';
  }[];
}

export interface ExportOptions {
  format: 'xlsx' | 'csv';
  coins: CoinMarketData[];
  filename?: string;
  includeCharts?: boolean;
}

export interface TemplateConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'market' | 'defi' | 'portfolio' | 'custom';
  coins?: string[]; // coin IDs to include
  coinCount?: number; // or top N coins
  filters?: {
    minMarketCap?: number;
    maxMarketCap?: number;
    categories?: string[];
  };
  metrics: (keyof CoinMarketData)[];
}

export interface UserDownload {
  id: string;
  user_id: string;
  template_name: string;
  coins_count: number;
  created_at: string;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  tier: 'free' | 'pro' | 'premium';
  status: 'active' | 'canceled' | 'past_due';
  current_period_end?: string;
}

export interface SubscriptionTier {
  id: 'free' | 'pro' | 'premium';
  name: string;
  price: number;
  downloads_per_month: number;
  features: string[];
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

export interface SearchResult {
  id: string;
  name: string;
  symbol: string;
  market_cap_rank: number | null;
  thumb: string;
  large: string;
}
