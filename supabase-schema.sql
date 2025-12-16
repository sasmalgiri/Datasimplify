-- ============================================
-- DATASIMPLIFY - SUPABASE DATABASE SCHEMA
-- ============================================
-- Run this in Supabase SQL Editor to create all tables

-- 1. MARKET DATA TABLE (Current prices, updated frequently)
CREATE TABLE IF NOT EXISTS market_data (
  id SERIAL PRIMARY KEY,
  symbol VARCHAR(20) NOT NULL,
  name VARCHAR(100),
  image TEXT,
  category VARCHAR(50),
  
  -- Price Data
  price DECIMAL(30, 10),
  price_change_24h DECIMAL(30, 10),
  price_change_percent_24h DECIMAL(10, 4),
  open_24h DECIMAL(30, 10),
  high_24h DECIMAL(30, 10),
  low_24h DECIMAL(30, 10),
  
  -- Volume
  volume_24h DECIMAL(30, 2),
  quote_volume_24h DECIMAL(30, 2),
  trades_24h INTEGER,
  
  -- Market Cap
  market_cap DECIMAL(30, 2),
  circulating_supply DECIMAL(30, 2),
  max_supply DECIMAL(30, 2),
  
  -- Order Book
  bid_price DECIMAL(30, 10),
  ask_price DECIMAL(30, 10),
  spread DECIMAL(20, 10),
  spread_percent DECIMAL(10, 6),
  
  -- VWAP
  vwap DECIMAL(30, 10),
  
  -- Timestamps
  data_timestamp TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(symbol)
);

-- Index for fast queries
CREATE INDEX idx_market_data_symbol ON market_data(symbol);
CREATE INDEX idx_market_data_category ON market_data(category);
CREATE INDEX idx_market_data_market_cap ON market_data(market_cap DESC);

-- 2. HISTORICAL KLINES (OHLCV Data)
CREATE TABLE IF NOT EXISTS klines (
  id SERIAL PRIMARY KEY,
  symbol VARCHAR(20) NOT NULL,
  interval VARCHAR(10) NOT NULL, -- 1m, 5m, 15m, 1h, 4h, 1d, 1w
  
  open_time TIMESTAMPTZ NOT NULL,
  open_price DECIMAL(30, 10),
  high_price DECIMAL(30, 10),
  low_price DECIMAL(30, 10),
  close_price DECIMAL(30, 10),
  volume DECIMAL(30, 2),
  close_time TIMESTAMPTZ,
  quote_volume DECIMAL(30, 2),
  trades INTEGER,
  taker_buy_base_volume DECIMAL(30, 2),
  taker_buy_quote_volume DECIMAL(30, 2),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(symbol, interval, open_time)
);

-- Indexes for klines
CREATE INDEX idx_klines_symbol ON klines(symbol);
CREATE INDEX idx_klines_interval ON klines(interval);
CREATE INDEX idx_klines_time ON klines(open_time DESC);
CREATE INDEX idx_klines_composite ON klines(symbol, interval, open_time DESC);

-- 3. ORDER BOOK SNAPSHOTS
CREATE TABLE IF NOT EXISTS order_book (
  id SERIAL PRIMARY KEY,
  symbol VARCHAR(20) NOT NULL,
  
  -- Top bids/asks as JSON arrays
  bids JSONB, -- [[price, qty], ...]
  asks JSONB,
  
  bid_total DECIMAL(30, 2), -- Sum of bid quantities
  ask_total DECIMAL(30, 2), -- Sum of ask quantities
  
  last_update_id BIGINT,
  captured_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_order_book_symbol ON order_book(symbol);
CREATE INDEX idx_order_book_time ON order_book(captured_at DESC);

-- 4. RECENT TRADES
CREATE TABLE IF NOT EXISTS trades (
  id SERIAL PRIMARY KEY,
  symbol VARCHAR(20) NOT NULL,
  trade_id BIGINT NOT NULL,
  price DECIMAL(30, 10),
  quantity DECIMAL(30, 10),
  quote_quantity DECIMAL(30, 10),
  trade_time TIMESTAMPTZ,
  is_buyer_maker BOOLEAN,
  
  UNIQUE(symbol, trade_id)
);

CREATE INDEX idx_trades_symbol ON trades(symbol);
CREATE INDEX idx_trades_time ON trades(trade_time DESC);

-- 5. USER DOWNLOADS (Track usage)
CREATE TABLE IF NOT EXISTS downloads (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  
  -- What was downloaded
  data_type VARCHAR(50), -- market_data, klines, order_book, trades
  symbols TEXT[], -- Array of symbols included
  parameters JSONB, -- Any filters/options used
  
  -- File info
  file_format VARCHAR(10), -- xlsx, csv
  row_count INTEGER,
  file_size_bytes INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_downloads_user ON downloads(user_id);
CREATE INDEX idx_downloads_time ON downloads(created_at DESC);

-- 6. USERS TABLE (Extended profile)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email VARCHAR(255),
  
  -- Subscription
  subscription_tier VARCHAR(20) DEFAULT 'free', -- free, starter, pro, business
  downloads_this_month INTEGER DEFAULT 0,
  downloads_reset_at TIMESTAMPTZ,
  
  -- Stripe
  stripe_customer_id VARCHAR(100),
  stripe_subscription_id VARCHAR(100),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. DATA SYNC LOG (Track when data was last fetched)
CREATE TABLE IF NOT EXISTS sync_log (
  id SERIAL PRIMARY KEY,
  data_type VARCHAR(50),
  symbols_count INTEGER,
  rows_updated INTEGER,
  duration_ms INTEGER,
  status VARCHAR(20), -- success, partial, failed
  error_message TEXT,
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to get download limits by tier
CREATE OR REPLACE FUNCTION get_download_limit(tier VARCHAR)
RETURNS INTEGER AS $$
BEGIN
  RETURN CASE tier
    WHEN 'free' THEN 5
    WHEN 'starter' THEN 50
    WHEN 'pro' THEN 1000
    WHEN 'business' THEN 10000
    ELSE 5
  END;
END;
$$ LANGUAGE plpgsql;

-- Function to check if user can download
CREATE OR REPLACE FUNCTION can_user_download(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_tier VARCHAR;
  v_downloads INTEGER;
  v_limit INTEGER;
  v_reset_at TIMESTAMPTZ;
BEGIN
  SELECT subscription_tier, downloads_this_month, downloads_reset_at
  INTO v_tier, v_downloads, v_reset_at
  FROM user_profiles
  WHERE id = p_user_id;
  
  -- Reset monthly count if needed
  IF v_reset_at IS NULL OR v_reset_at < date_trunc('month', NOW()) THEN
    UPDATE user_profiles
    SET downloads_this_month = 0,
        downloads_reset_at = date_trunc('month', NOW())
    WHERE id = p_user_id;
    v_downloads := 0;
  END IF;
  
  v_limit := get_download_limit(v_tier);
  
  RETURN v_downloads < v_limit;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE downloads ENABLE ROW LEVEL SECURITY;

-- Users can only see their own profile
CREATE POLICY user_profiles_policy ON user_profiles
  FOR ALL USING (auth.uid() = id);

-- Users can only see their own downloads
CREATE POLICY downloads_policy ON downloads
  FOR ALL USING (auth.uid() = user_id);

-- Market data is public (read-only)
ALTER TABLE market_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY market_data_read ON market_data
  FOR SELECT USING (true);

-- Klines are public (read-only)
ALTER TABLE klines ENABLE ROW LEVEL SECURITY;
CREATE POLICY klines_read ON klines
  FOR SELECT USING (true);
