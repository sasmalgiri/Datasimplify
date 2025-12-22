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

-- ============================================
-- PREDICTION CACHE TABLE
-- ============================================
-- Stores AI predictions for coins (10 min TTL in code)

CREATE TABLE IF NOT EXISTS prediction_cache (
  id SERIAL PRIMARY KEY,
  coin_id VARCHAR(100) NOT NULL UNIQUE,
  coin_name VARCHAR(200),
  prediction VARCHAR(20) NOT NULL, -- BULLISH, BEARISH, NEUTRAL
  confidence INTEGER NOT NULL,
  risk_level VARCHAR(20) NOT NULL, -- LOW, MEDIUM, HIGH, EXTREME
  reasons JSONB DEFAULT '[]'::jsonb,
  technical_score INTEGER,
  sentiment_score INTEGER,
  onchain_score INTEGER,
  macro_score INTEGER,
  overall_score INTEGER,
  market_data JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX idx_prediction_cache_coin_id ON prediction_cache(coin_id);
CREATE INDEX idx_prediction_cache_updated ON prediction_cache(updated_at);

-- Enable RLS (public read)
ALTER TABLE prediction_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY prediction_cache_read ON prediction_cache
  FOR SELECT USING (true);
CREATE POLICY prediction_cache_insert ON prediction_cache
  FOR INSERT WITH CHECK (true);
CREATE POLICY prediction_cache_update ON prediction_cache
  FOR UPDATE USING (true);

-- ============================================
-- COIN MARKET DATA CACHE TABLE
-- ============================================
-- Stores CoinGecko market data to avoid rate limits (5 min TTL in code)

CREATE TABLE IF NOT EXISTS coin_market_cache (
  id SERIAL PRIMARY KEY,
  coin_id VARCHAR(100) NOT NULL UNIQUE,
  price DECIMAL(30, 10),
  price_change_24h DECIMAL(10, 4),
  price_change_7d DECIMAL(10, 4),
  price_change_30d DECIMAL(10, 4),
  volume_24h DECIMAL(30, 2),
  market_cap DECIMAL(30, 2),
  high_24h DECIMAL(30, 10),
  low_24h DECIMAL(30, 10),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX idx_coin_market_cache_coin_id ON coin_market_cache(coin_id);
CREATE INDEX idx_coin_market_cache_updated ON coin_market_cache(updated_at);

-- Enable RLS (public read/write for server)
ALTER TABLE coin_market_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY coin_market_cache_read ON coin_market_cache
  FOR SELECT USING (true);
CREATE POLICY coin_market_cache_insert ON coin_market_cache
  FOR INSERT WITH CHECK (true);
CREATE POLICY coin_market_cache_update ON coin_market_cache
  FOR UPDATE USING (true);

-- ============================================
-- FEAR & GREED INDEX HISTORY
-- ============================================
CREATE TABLE IF NOT EXISTS fear_greed_history (
  id SERIAL PRIMARY KEY,
  value INTEGER NOT NULL,
  value_classification VARCHAR(50),
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(recorded_at::date)
);

CREATE INDEX idx_fear_greed_time ON fear_greed_history(recorded_at DESC);
ALTER TABLE fear_greed_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY fgh_all ON fear_greed_history FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- DEFI PROTOCOLS (DeFi Llama)
-- ============================================
CREATE TABLE IF NOT EXISTS defi_protocols (
  id SERIAL PRIMARY KEY,
  protocol_id VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(200),
  symbol VARCHAR(20),
  chain VARCHAR(50),
  category VARCHAR(100),
  tvl DECIMAL(30, 2),
  tvl_change_24h DECIMAL(10, 4),
  tvl_change_7d DECIMAL(10, 4),
  mcap_tvl DECIMAL(10, 4),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_defi_protocols_tvl ON defi_protocols(tvl DESC);
ALTER TABLE defi_protocols ENABLE ROW LEVEL SECURITY;
CREATE POLICY dp_all ON defi_protocols FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- DEFI YIELDS (Yield Farming)
-- ============================================
CREATE TABLE IF NOT EXISTS defi_yields (
  id SERIAL PRIMARY KEY,
  pool_id VARCHAR(200) NOT NULL UNIQUE,
  chain VARCHAR(50),
  project VARCHAR(100),
  symbol VARCHAR(100),
  tvl_usd DECIMAL(30, 2),
  apy DECIMAL(20, 6),
  apy_base DECIMAL(20, 6),
  apy_reward DECIMAL(20, 6),
  il_risk VARCHAR(20),
  stable_coin BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_defi_yields_apy ON defi_yields(apy DESC);
ALTER TABLE defi_yields ENABLE ROW LEVEL SECURITY;
CREATE POLICY dy_all ON defi_yields FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- CHAIN TVL
-- ============================================
CREATE TABLE IF NOT EXISTS chain_tvl (
  id SERIAL PRIMARY KEY,
  chain VARCHAR(50) NOT NULL UNIQUE,
  tvl DECIMAL(30, 2),
  tvl_change_24h DECIMAL(10, 4),
  tvl_change_7d DECIMAL(10, 4),
  protocols_count INTEGER,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE chain_tvl ENABLE ROW LEVEL SECURITY;
CREATE POLICY ct_all ON chain_tvl FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- STABLECOINS DATA
-- ============================================
CREATE TABLE IF NOT EXISTS stablecoins (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  symbol VARCHAR(20) NOT NULL UNIQUE,
  peg_type VARCHAR(20), -- USD, EUR, etc
  circulating DECIMAL(30, 2),
  price DECIMAL(20, 10),
  chains JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE stablecoins ENABLE ROW LEVEL SECURITY;
CREATE POLICY sc_all ON stablecoins FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- MARKET SENTIMENT (Aggregated)
-- ============================================
CREATE TABLE IF NOT EXISTS market_sentiment (
  id SERIAL PRIMARY KEY,
  overall_score DECIMAL(5, 2), -- 0-100
  bullish_percent DECIMAL(5, 2),
  bearish_percent DECIMAL(5, 2),
  neutral_percent DECIMAL(5, 2),
  social_volume INTEGER,
  news_volume INTEGER,
  trending_coins JSONB,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_market_sentiment_time ON market_sentiment(recorded_at DESC);
ALTER TABLE market_sentiment ENABLE ROW LEVEL SECURITY;
CREATE POLICY ms_all ON market_sentiment FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- COIN SENTIMENT (Per coin)
-- ============================================
CREATE TABLE IF NOT EXISTS coin_sentiment (
  id SERIAL PRIMARY KEY,
  coin_id VARCHAR(100) NOT NULL UNIQUE,
  sentiment_score DECIMAL(5, 2),
  sentiment_label VARCHAR(20), -- bullish, bearish, neutral
  social_volume INTEGER,
  reddit_mentions INTEGER,
  twitter_mentions INTEGER,
  news_mentions INTEGER,
  is_trending BOOLEAN DEFAULT false,
  keywords JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_coin_sentiment_coin ON coin_sentiment(coin_id);
ALTER TABLE coin_sentiment ENABLE ROW LEVEL SECURITY;
CREATE POLICY cs_all ON coin_sentiment FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- SENTIMENT POSTS (News/Social)
-- ============================================
CREATE TABLE IF NOT EXISTS sentiment_posts (
  id SERIAL PRIMARY KEY,
  external_id VARCHAR(200),
  source VARCHAR(50), -- reddit, twitter, cryptopanic, etc
  platform VARCHAR(50),
  title TEXT,
  content TEXT,
  url TEXT,
  author VARCHAR(200),
  sentiment_score DECIMAL(5, 2),
  sentiment_label VARCHAR(20),
  confidence DECIMAL(5, 2),
  likes INTEGER,
  comments INTEGER,
  coins_mentioned JSONB,
  keywords JSONB,
  posted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(source, external_id)
);

CREATE INDEX idx_sentiment_posts_time ON sentiment_posts(posted_at DESC);
CREATE INDEX idx_sentiment_posts_source ON sentiment_posts(source);
ALTER TABLE sentiment_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY sp_all ON sentiment_posts FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- WHALE TRANSACTIONS
-- ============================================
CREATE TABLE IF NOT EXISTS whale_transactions (
  id SERIAL PRIMARY KEY,
  tx_hash VARCHAR(200) NOT NULL,
  blockchain VARCHAR(50),
  from_address VARCHAR(200),
  from_label VARCHAR(200),
  to_address VARCHAR(200),
  to_label VARCHAR(200),
  amount DECIMAL(30, 10),
  amount_usd DECIMAL(30, 2),
  symbol VARCHAR(20),
  tx_type VARCHAR(50), -- exchange_deposit, exchange_withdrawal, unknown
  tx_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tx_hash)
);

CREATE INDEX idx_whale_tx_time ON whale_transactions(tx_time DESC);
CREATE INDEX idx_whale_tx_type ON whale_transactions(tx_type);
ALTER TABLE whale_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY wt_all ON whale_transactions FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- EXCHANGE FLOWS
-- ============================================
CREATE TABLE IF NOT EXISTS exchange_flows (
  id SERIAL PRIMARY KEY,
  exchange VARCHAR(100) NOT NULL,
  symbol VARCHAR(20) NOT NULL,
  inflow_24h DECIMAL(30, 2),
  outflow_24h DECIMAL(30, 2),
  netflow_24h DECIMAL(30, 2),
  reserve DECIMAL(30, 2),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(exchange, symbol)
);

ALTER TABLE exchange_flows ENABLE ROW LEVEL SECURITY;
CREATE POLICY ef_all ON exchange_flows FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- EXCHANGE BALANCES (Historical)
-- ============================================
CREATE TABLE IF NOT EXISTS exchange_balances (
  id SERIAL PRIMARY KEY,
  exchange VARCHAR(100) NOT NULL,
  symbol VARCHAR(20) NOT NULL,
  balance DECIMAL(30, 10),
  balance_usd DECIMAL(30, 2),
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_exchange_balances_time ON exchange_balances(recorded_at DESC);
ALTER TABLE exchange_balances ENABLE ROW LEVEL SECURITY;
CREATE POLICY eb_all ON exchange_balances FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- BITCOIN STATS (On-chain)
-- ============================================
CREATE TABLE IF NOT EXISTS bitcoin_stats (
  id SERIAL PRIMARY KEY,
  hash_rate DECIMAL(30, 2),
  difficulty DECIMAL(30, 2),
  blocks_mined_24h INTEGER,
  avg_block_time DECIMAL(10, 2),
  mempool_size INTEGER,
  mempool_bytes BIGINT,
  avg_fee_sat_vb DECIMAL(10, 2),
  total_btc DECIMAL(20, 8),
  market_price_usd DECIMAL(20, 2),
  miners_revenue_usd DECIMAL(20, 2),
  active_addresses INTEGER,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bitcoin_stats_time ON bitcoin_stats(recorded_at DESC);
ALTER TABLE bitcoin_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY bs_all ON bitcoin_stats FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- ETH GAS PRICES
-- ============================================
CREATE TABLE IF NOT EXISTS eth_gas_prices (
  id SERIAL PRIMARY KEY,
  slow DECIMAL(10, 2),
  standard DECIMAL(10, 2),
  fast DECIMAL(10, 2),
  instant DECIMAL(10, 2),
  base_fee DECIMAL(10, 2),
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_eth_gas_time ON eth_gas_prices(recorded_at DESC);
ALTER TABLE eth_gas_prices ENABLE ROW LEVEL SECURITY;
CREATE POLICY egp_all ON eth_gas_prices FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- DERIVATIVES CACHE (Binance Futures)
-- ============================================
CREATE TABLE IF NOT EXISTS derivatives_cache (
  id SERIAL PRIMARY KEY,
  symbol VARCHAR(20) NOT NULL UNIQUE,
  open_interest DECIMAL(30, 2),
  open_interest_change_24h DECIMAL(10, 4),
  funding_rate DECIMAL(20, 10),
  long_short_ratio DECIMAL(10, 4),
  volume_24h DECIMAL(30, 2),
  liquidations_24h DECIMAL(30, 2),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE derivatives_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY dc_all ON derivatives_cache FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- MACRO DATA CACHE (Economic Indicators)
-- ============================================
CREATE TABLE IF NOT EXISTS macro_data_cache (
  id SERIAL PRIMARY KEY,
  indicator VARCHAR(50) NOT NULL UNIQUE,
  value DECIMAL(20, 6),
  previous_value DECIMAL(20, 6),
  change DECIMAL(10, 4),
  source VARCHAR(50),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE macro_data_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY mdc_all ON macro_data_cache FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- TOKEN UNLOCKS (Upcoming unlocks)
-- ============================================
CREATE TABLE IF NOT EXISTS token_unlocks (
  id SERIAL PRIMARY KEY,
  project VARCHAR(200) NOT NULL,
  symbol VARCHAR(20),
  unlock_date TIMESTAMPTZ,
  unlock_amount DECIMAL(30, 2),
  unlock_value_usd DECIMAL(30, 2),
  unlock_percent DECIMAL(10, 4),
  category VARCHAR(50),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project, unlock_date)
);

CREATE INDEX idx_token_unlocks_date ON token_unlocks(unlock_date);
ALTER TABLE token_unlocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY tu_all ON token_unlocks FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- COMMUNITY PREDICTIONS TABLES
-- ============================================

-- User prediction submissions
CREATE TABLE IF NOT EXISTS community_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Coin info
  coin_id VARCHAR(100) NOT NULL,
  coin_symbol VARCHAR(20) NOT NULL,
  coin_name VARCHAR(200),

  -- Prediction details
  prediction VARCHAR(20) NOT NULL, -- BULLISH, BEARISH, NEUTRAL
  target_price DECIMAL(30, 10),
  current_price DECIMAL(30, 10),
  timeframe VARCHAR(10) NOT NULL, -- 24h, 7d, 30d
  confidence INTEGER NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
  reasoning TEXT,

  -- Outcome tracking
  outcome VARCHAR(20) DEFAULT 'pending', -- pending, correct, incorrect
  outcome_price DECIMAL(30, 10),
  outcome_at TIMESTAMPTZ,

  -- Engagement
  likes INTEGER DEFAULT 0,
  dislikes INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,

  -- Timestamps
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_community_predictions_user ON community_predictions(user_id);
CREATE INDEX idx_community_predictions_coin ON community_predictions(coin_id);
CREATE INDEX idx_community_predictions_created ON community_predictions(created_at DESC);
CREATE INDEX idx_community_predictions_outcome ON community_predictions(outcome);

ALTER TABLE community_predictions ENABLE ROW LEVEL SECURITY;
CREATE POLICY cp_read ON community_predictions FOR SELECT USING (true);
CREATE POLICY cp_insert ON community_predictions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY cp_update ON community_predictions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY cp_delete ON community_predictions FOR DELETE USING (auth.uid() = user_id);

-- User prediction statistics (leaderboard)
CREATE TABLE IF NOT EXISTS user_prediction_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Profile
  display_name VARCHAR(100),
  avatar_emoji VARCHAR(10) DEFAULT '🎯',

  -- Stats
  total_predictions INTEGER DEFAULT 0,
  correct_predictions INTEGER DEFAULT 0,
  accuracy DECIMAL(5, 2) DEFAULT 0,

  -- Streaks & Points
  current_streak INTEGER DEFAULT 0,
  best_streak INTEGER DEFAULT 0,
  points INTEGER DEFAULT 0,

  -- Rank
  rank INTEGER,

  -- Badges (JSON array of earned badges)
  badges JSONB DEFAULT '[]'::jsonb,

  -- Social
  followers INTEGER DEFAULT 0,
  following INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_prediction_stats_rank ON user_prediction_stats(rank);
CREATE INDEX idx_user_prediction_stats_accuracy ON user_prediction_stats(accuracy DESC);
CREATE INDEX idx_user_prediction_stats_points ON user_prediction_stats(points DESC);

ALTER TABLE user_prediction_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY ups_read ON user_prediction_stats FOR SELECT USING (true);
CREATE POLICY ups_insert ON user_prediction_stats FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY ups_update ON user_prediction_stats FOR UPDATE USING (auth.uid() = user_id);

-- Prediction votes (likes/dislikes)
CREATE TABLE IF NOT EXISTS prediction_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prediction_id UUID NOT NULL REFERENCES community_predictions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vote_type VARCHAR(10) NOT NULL, -- like, dislike
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(prediction_id, user_id)
);

CREATE INDEX idx_prediction_votes_prediction ON prediction_votes(prediction_id);
CREATE INDEX idx_prediction_votes_user ON prediction_votes(user_id);

ALTER TABLE prediction_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY pv_read ON prediction_votes FOR SELECT USING (true);
CREATE POLICY pv_insert ON prediction_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY pv_delete ON prediction_votes FOR DELETE USING (auth.uid() = user_id);

-- Prediction comments
CREATE TABLE IF NOT EXISTS prediction_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prediction_id UUID NOT NULL REFERENCES community_predictions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  likes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_prediction_comments_prediction ON prediction_comments(prediction_id);
CREATE INDEX idx_prediction_comments_created ON prediction_comments(created_at DESC);

ALTER TABLE prediction_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY pc_read ON prediction_comments FOR SELECT USING (true);
CREATE POLICY pc_insert ON prediction_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY pc_update ON prediction_comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY pc_delete ON prediction_comments FOR DELETE USING (auth.uid() = user_id);

-- User follows
CREATE TABLE IF NOT EXISTS user_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

CREATE INDEX idx_user_follows_follower ON user_follows(follower_id);
CREATE INDEX idx_user_follows_following ON user_follows(following_id);

ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY uf_read ON user_follows FOR SELECT USING (true);
CREATE POLICY uf_insert ON user_follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY uf_delete ON user_follows FOR DELETE USING (auth.uid() = follower_id);

-- Prediction contests
CREATE TABLE IF NOT EXISTS prediction_contests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  contest_type VARCHAR(20) NOT NULL, -- weekly, monthly, special
  prize VARCHAR(100),
  prize_amount DECIMAL(20, 2),

  -- Requirements
  min_predictions INTEGER DEFAULT 5,
  allowed_coins JSONB, -- null = all coins allowed

  -- Dates
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,

  -- Status
  status VARCHAR(20) DEFAULT 'upcoming', -- upcoming, active, ended
  participants_count INTEGER DEFAULT 0,

  -- Winners (JSON array of user_ids and ranks)
  winners JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_prediction_contests_status ON prediction_contests(status);
CREATE INDEX idx_prediction_contests_dates ON prediction_contests(starts_at, ends_at);

ALTER TABLE prediction_contests ENABLE ROW LEVEL SECURITY;
CREATE POLICY pct_read ON prediction_contests FOR SELECT USING (true);

-- Contest participants
CREATE TABLE IF NOT EXISTS contest_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id UUID NOT NULL REFERENCES prediction_contests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  predictions_count INTEGER DEFAULT 0,
  correct_count INTEGER DEFAULT 0,
  accuracy DECIMAL(5, 2) DEFAULT 0,
  points INTEGER DEFAULT 0,
  rank INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(contest_id, user_id)
);

CREATE INDEX idx_contest_participants_contest ON contest_participants(contest_id);
CREATE INDEX idx_contest_participants_rank ON contest_participants(contest_id, rank);

ALTER TABLE contest_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY cpt_read ON contest_participants FOR SELECT USING (true);
CREATE POLICY cpt_insert ON contest_participants FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- COMMUNITY FUNCTIONS
-- ============================================

-- Function to update prediction stats after new prediction
CREATE OR REPLACE FUNCTION update_user_prediction_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Upsert user stats
  INSERT INTO user_prediction_stats (user_id, total_predictions)
  VALUES (NEW.user_id, 1)
  ON CONFLICT (user_id) DO UPDATE
  SET total_predictions = user_prediction_stats.total_predictions + 1,
      updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for new predictions
CREATE TRIGGER tr_update_user_stats
AFTER INSERT ON community_predictions
FOR EACH ROW EXECUTE FUNCTION update_user_prediction_stats();

-- Function to update likes/dislikes count
CREATE OR REPLACE FUNCTION update_prediction_votes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.vote_type = 'like' THEN
      UPDATE community_predictions SET likes = likes + 1 WHERE id = NEW.prediction_id;
    ELSE
      UPDATE community_predictions SET dislikes = dislikes + 1 WHERE id = NEW.prediction_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.vote_type = 'like' THEN
      UPDATE community_predictions SET likes = GREATEST(0, likes - 1) WHERE id = OLD.prediction_id;
    ELSE
      UPDATE community_predictions SET dislikes = GREATEST(0, dislikes - 1) WHERE id = OLD.prediction_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_update_votes_count
AFTER INSERT OR DELETE ON prediction_votes
FOR EACH ROW EXECUTE FUNCTION update_prediction_votes_count();

-- Function to update comments count
CREATE OR REPLACE FUNCTION update_prediction_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE community_predictions SET comments_count = comments_count + 1 WHERE id = NEW.prediction_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE community_predictions SET comments_count = GREATEST(0, comments_count - 1) WHERE id = OLD.prediction_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_update_comments_count
AFTER INSERT OR DELETE ON prediction_comments
FOR EACH ROW EXECUTE FUNCTION update_prediction_comments_count();

-- Function to update follower counts
CREATE OR REPLACE FUNCTION update_follower_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE user_prediction_stats SET followers = followers + 1 WHERE user_id = NEW.following_id;
    UPDATE user_prediction_stats SET following = following + 1 WHERE user_id = NEW.follower_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE user_prediction_stats SET followers = GREATEST(0, followers - 1) WHERE user_id = OLD.following_id;
    UPDATE user_prediction_stats SET following = GREATEST(0, following - 1) WHERE user_id = OLD.follower_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_update_follower_counts
AFTER INSERT OR DELETE ON user_follows
FOR EACH ROW EXECUTE FUNCTION update_follower_counts();
