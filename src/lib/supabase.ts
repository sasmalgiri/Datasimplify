import 'server-only';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment variables (trim whitespace - common issue when copying to Vercel)
const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();
const supabaseServiceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

// Check if Supabase is configured
function isLikelyUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
}

export const isSupabaseConfigured = !!(
  supabaseUrl &&
  supabaseAnonKey &&
  isLikelyUrl(supabaseUrl)
);

// Create a dummy client or real client based on config
let supabaseInstance: SupabaseClient | null = null;
let supabaseAdminInstance: SupabaseClient | null = null;

if (isSupabaseConfigured) {
  try {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
    supabaseAdminInstance = supabaseServiceKey 
      ? createClient(supabaseUrl, supabaseServiceKey)
      : supabaseInstance;
  } catch (error) {
    console.error('Failed to create Supabase client:', error);
  }
}

// Export clients (may be null if not configured)
export const supabase = supabaseInstance;
export const supabaseAdmin = supabaseAdminInstance;

// Types for our database tables
export interface MarketData {
  id?: string;
  symbol: string;
  name?: string;
  price?: number;
  price_change_24h?: number;
  price_change_percent_24h?: number;
  high_24h?: number;
  low_24h?: number;
  volume_24h?: number;
  quote_volume_24h?: number;
  market_cap?: number;
  circulating_supply?: number;
  max_supply?: number;
  bid_price?: number;
  ask_price?: number;
  spread?: number;
  category?: string;
  image_url?: string;
  updated_at?: string;
}

export interface Kline {
  id?: string;
  symbol: string;
  interval: string;
  open_time: string;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  volume?: number;
  close_time?: string;
  quote_volume?: number;
  trades_count?: number;
}

export interface CoinSentiment {
  id?: string;
  symbol: string;
  sentiment_score?: number;
  sentiment_label?: string;
  social_volume?: number;
  reddit_mentions?: number;
  news_mentions?: number;
  is_trending?: boolean;
  keywords?: string[];
  updated_at?: string;
}

export interface SentimentPost {
  id?: string;
  external_id?: string;
  source: string;
  platform?: string;
  title?: string;
  content?: string;
  url?: string;
  author?: string;
  sentiment_score?: number;
  sentiment_label?: string;
  confidence?: number;
  likes?: number;
  comments?: number;
  coins_mentioned?: string[];
  keywords?: string[];
  posted_at?: string;
}

export interface WhaleTransaction {
  id?: string;
  tx_hash: string;
  blockchain: string;
  from_address?: string;
  from_label?: string;
  to_address?: string;
  to_label?: string;
  amount?: number;
  amount_usd?: number;
  symbol?: string;
  tx_type?: string;
  tx_time?: string;
}

export interface DefiProtocol {
  id?: string;
  name: string;
  symbol?: string;
  chain?: string;
  category?: string;
  tvl?: number;
  tvl_change_24h?: number;
  tvl_change_7d?: number;
  updated_at?: string;
}

// Database types for Supabase
export type Database = {
  public: {
    Tables: {
      market_data: {
        Row: MarketData;
        Insert: MarketData;
        Update: Partial<MarketData>;
      };
      klines: {
        Row: Kline;
        Insert: Kline;
        Update: Partial<Kline>;
      };
      coin_sentiment: {
        Row: CoinSentiment;
        Insert: CoinSentiment;
        Update: Partial<CoinSentiment>;
      };
      sentiment_posts: {
        Row: SentimentPost;
        Insert: SentimentPost;
        Update: Partial<SentimentPost>;
      };
      whale_transactions: {
        Row: WhaleTransaction;
        Insert: WhaleTransaction;
        Update: Partial<WhaleTransaction>;
      };
      defi_protocols: {
        Row: DefiProtocol;
        Insert: DefiProtocol;
        Update: Partial<DefiProtocol>;
      };
    };
  };
};
