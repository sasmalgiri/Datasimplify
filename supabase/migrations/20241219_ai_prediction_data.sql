-- ============================================
-- AI PREDICTION DATA ARCHITECTURE
-- Migration: 20241219_ai_prediction_data.sql
-- ============================================
-- Creates timestamp-based tables for:
-- 1. Prediction snapshots (all input data + predictions)
-- 2. Wallet profiles (significant impact wallets)
-- 3. Wallet transactions (historical activity)
-- 4. Sentiment profiles (multi-dimensional sentiment)
-- 5. News/policy events (government policies, regulations)
-- 6. Adoption metrics (public understanding, usefulness)
-- 7. Training data (combined dataset for AI)
-- ============================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. PREDICTION SNAPSHOTS
-- Main prediction data with all inputs
-- ============================================
CREATE TABLE IF NOT EXISTS prediction_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  coin_id TEXT NOT NULL,

  -- Market Data
  price DECIMAL,
  price_change_24h DECIMAL,
  price_change_7d DECIMAL,
  price_change_30d DECIMAL,
  volume_24h DECIMAL,
  market_cap DECIMAL,
  high_24h DECIMAL,
  low_24h DECIMAL,

  -- Technical Indicators
  rsi_14 DECIMAL,
  macd_signal TEXT, -- 'bullish_cross', 'bearish_cross', 'neutral'
  ma_50_position TEXT, -- 'above', 'below', 'near'
  ma_200_position TEXT, -- 'above', 'below', 'near'
  bollinger_position TEXT, -- 'upper', 'middle', 'lower'
  volume_trend TEXT, -- 'increasing', 'decreasing', 'stable'

  -- Sentiment Scores
  fear_greed_index INTEGER,
  fear_greed_label TEXT,
  social_sentiment_score DECIMAL,
  news_sentiment_score DECIMAL,

  -- On-Chain Data
  exchange_netflow TEXT, -- 'inflow', 'outflow', 'neutral'
  whale_activity TEXT, -- 'buying', 'selling', 'neutral'
  active_addresses_trend TEXT, -- 'increasing', 'decreasing', 'stable'
  large_transactions_count INTEGER,

  -- Macro Environment
  vix DECIMAL,
  dxy DECIMAL,
  fed_funds_rate DECIMAL,
  treasury_10y DECIMAL,
  risk_environment TEXT, -- 'risk_on', 'risk_off', 'neutral'
  sp500_change DECIMAL,
  nasdaq_change DECIMAL,

  -- Derivatives
  btc_funding_rate DECIMAL,
  eth_funding_rate DECIMAL,
  btc_open_interest DECIMAL,
  eth_open_interest DECIMAL,
  open_interest_change DECIMAL,
  liquidations_24h DECIMAL,
  funding_heat_level TEXT, -- 'extreme_long', 'high_long', 'neutral', 'high_short', 'extreme_short'

  -- AI Prediction Output
  prediction TEXT, -- 'BULLISH', 'BEARISH', 'NEUTRAL'
  confidence INTEGER, -- 0-100
  risk_level TEXT, -- 'LOW', 'MEDIUM', 'HIGH', 'EXTREME'
  technical_score INTEGER,
  sentiment_score INTEGER,
  onchain_score INTEGER,
  macro_score INTEGER,
  overall_score INTEGER,
  reasons JSONB, -- Array of reason strings
  signals JSONB, -- Full signal details

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_snapshot UNIQUE (timestamp, coin_id)
);

CREATE INDEX idx_snapshots_timestamp ON prediction_snapshots(timestamp);
CREATE INDEX idx_snapshots_coin ON prediction_snapshots(coin_id);
CREATE INDEX idx_snapshots_prediction ON prediction_snapshots(prediction);
CREATE INDEX idx_snapshots_coin_time ON prediction_snapshots(coin_id, timestamp DESC);

-- ============================================
-- 2. WALLET PROFILES
-- Significant wallet tracking
-- ============================================
CREATE TABLE IF NOT EXISTS wallet_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  address TEXT NOT NULL,
  blockchain TEXT NOT NULL,

  -- Classification
  wallet_type TEXT NOT NULL DEFAULT 'unknown', -- 'whale', 'exchange', 'fund', 'miner', 'protocol', 'smart_money', 'unknown'
  label TEXT,
  known_entity TEXT, -- 'Binance', 'Coinbase', 'BlackRock', etc.
  entity_category TEXT, -- 'exchange', 'institutional', 'defi_protocol', 'cex_whale', 'retail_whale'

  -- Impact Metrics
  impact_score DECIMAL DEFAULT 0, -- 0-100 scale
  historical_accuracy DECIMAL DEFAULT 50, -- How accurate their trades predict price (0-100)
  total_volume_30d DECIMAL DEFAULT 0,
  avg_trade_size DECIMAL DEFAULT 0,
  profit_loss_ratio DECIMAL, -- Wins vs losses

  -- Activity Profile
  trade_frequency TEXT DEFAULT 'low', -- 'high', 'medium', 'low'
  avg_hold_duration TEXT, -- 'short' (<1 week), 'medium' (1-4 weeks), 'long' (>4 weeks)
  preferred_coins JSONB, -- Array of most traded coins
  last_activity TIMESTAMPTZ,
  transaction_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,

  -- Signal Quality
  signal_reliability TEXT DEFAULT 'unknown', -- 'high', 'medium', 'low', 'unknown'
  contrarian_indicator BOOLEAN DEFAULT false, -- True if often wrong (useful for inverse signal)

  -- Metadata
  first_seen TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,

  CONSTRAINT unique_wallet UNIQUE (address, blockchain)
);

CREATE INDEX idx_wallets_impact ON wallet_profiles(impact_score DESC);
CREATE INDEX idx_wallets_type ON wallet_profiles(wallet_type);
CREATE INDEX idx_wallets_entity ON wallet_profiles(known_entity);
CREATE INDEX idx_wallets_blockchain ON wallet_profiles(blockchain);
CREATE INDEX idx_wallets_active ON wallet_profiles(is_active) WHERE is_active = true;

-- ============================================
-- 3. WALLET TRANSACTIONS
-- Historical wallet activity
-- ============================================
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  wallet_id UUID REFERENCES wallet_profiles(id) ON DELETE CASCADE,

  tx_hash TEXT NOT NULL,
  blockchain TEXT NOT NULL,
  direction TEXT, -- 'buy', 'sell', 'transfer_in', 'transfer_out'

  amount DECIMAL,
  amount_usd DECIMAL,
  coin_symbol TEXT,
  coin_id TEXT,

  -- Context at time of transaction
  price_at_tx DECIMAL,
  market_cap_at_tx DECIMAL,
  fear_greed_at_tx INTEGER,

  -- Outcome tracking (filled in later)
  price_1h_after DECIMAL,
  price_4h_after DECIMAL,
  price_24h_after DECIMAL,
  price_7d_after DECIMAL,

  -- Calculated impact
  direction_1h TEXT, -- 'up', 'down', 'flat'
  direction_24h TEXT,
  direction_7d TEXT,
  was_profitable BOOLEAN,
  profit_pct DECIMAL,
  impact_on_price DECIMAL, -- % price moved after tx

  -- Metadata
  from_address TEXT,
  to_address TEXT,
  is_exchange_related BOOLEAN DEFAULT false,
  exchange_name TEXT,

  CONSTRAINT unique_tx UNIQUE (tx_hash, wallet_id)
);

CREATE INDEX idx_wallet_tx_time ON wallet_transactions(timestamp DESC);
CREATE INDEX idx_wallet_tx_wallet ON wallet_transactions(wallet_id);
CREATE INDEX idx_wallet_tx_coin ON wallet_transactions(coin_symbol);
CREATE INDEX idx_wallet_tx_direction ON wallet_transactions(direction);

-- ============================================
-- 4. SENTIMENT PROFILES
-- Multi-dimensional sentiment tracking
-- ============================================
CREATE TABLE IF NOT EXISTS sentiment_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Category of sentiment
  category TEXT NOT NULL, -- 'market', 'technology', 'regulation', 'adoption', 'security', 'coin_specific'
  subcategory TEXT, -- e.g., 'defi', 'nft', 'etf', 'cbdc', 'layer2', 'staking'
  coin_symbol TEXT, -- Optional: specific coin if coin_specific

  -- Sentiment Scores (-100 to +100)
  overall_score INTEGER,
  weighted_score DECIMAL, -- Score weighted by engagement

  -- Source Breakdown
  reddit_score INTEGER,
  reddit_volume INTEGER,
  twitter_score INTEGER,
  twitter_volume INTEGER,
  news_score INTEGER,
  news_volume INTEGER,
  youtube_score INTEGER,
  youtube_volume INTEGER,
  telegram_score INTEGER,
  telegram_volume INTEGER,
  discord_score INTEGER,
  discord_volume INTEGER,

  -- Volume Metrics
  total_mention_count INTEGER,
  unique_authors INTEGER,
  engagement_score DECIMAL, -- Likes, comments, shares weighted
  viral_coefficient DECIMAL, -- How fast spreading
  reach_estimate DECIMAL, -- Estimated total reach

  -- Trending Analysis
  is_trending BOOLEAN DEFAULT false,
  trend_direction TEXT, -- 'rising', 'falling', 'stable', 'spike', 'crash'
  trend_velocity DECIMAL, -- Rate of change
  trend_duration_hours INTEGER, -- How long trending

  -- Sentiment Breakdown
  bullish_pct DECIMAL,
  bearish_pct DECIMAL,
  neutral_pct DECIMAL,

  -- Key Content
  top_keywords JSONB, -- [{keyword: string, count: number}]
  notable_posts JSONB, -- Top posts by engagement
  influential_authors JSONB, -- High-impact posters

  -- Comparison to baseline
  vs_7d_avg DECIMAL, -- % change vs 7d average
  vs_30d_avg DECIMAL, -- % change vs 30d average

  CONSTRAINT unique_sentiment UNIQUE (timestamp, category, subcategory, coin_symbol)
);

CREATE INDEX idx_sentiment_time ON sentiment_profiles(timestamp DESC);
CREATE INDEX idx_sentiment_category ON sentiment_profiles(category);
CREATE INDEX idx_sentiment_coin ON sentiment_profiles(coin_symbol) WHERE coin_symbol IS NOT NULL;
CREATE INDEX idx_sentiment_trending ON sentiment_profiles(is_trending) WHERE is_trending = true;

-- ============================================
-- 5. NEWS & POLICY EVENTS
-- Government policies, regulations, major news
-- ============================================
CREATE TABLE IF NOT EXISTS news_policy_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  event_date DATE,
  event_time TIME,

  -- Event Classification
  event_type TEXT NOT NULL, -- 'regulation', 'legislation', 'enforcement', 'statement', 'news', 'etf', 'corporate', 'hack', 'partnership'
  source_type TEXT, -- 'government', 'central_bank', 'regulator', 'media', 'company', 'exchange', 'protocol'

  -- Geography
  country TEXT,
  region TEXT, -- 'north_america', 'europe', 'asia', 'latin_america', 'middle_east', 'africa', 'global'
  jurisdiction TEXT, -- Specific regulatory body

  -- Event Details
  title TEXT NOT NULL,
  summary TEXT,
  full_content TEXT,
  source_name TEXT,
  source_url TEXT,
  author TEXT,

  -- Impact Assessment
  impact_level TEXT, -- 'critical', 'high', 'medium', 'low', 'negligible'
  sentiment_direction TEXT, -- 'positive', 'negative', 'neutral', 'mixed'
  sentiment_impact INTEGER, -- -100 to +100

  -- Affected Assets
  affected_coins JSONB, -- ['BTC', 'ETH', 'USDT']
  affected_sectors JSONB, -- ['defi', 'stablecoin', 'exchange', 'mining']
  affected_entities JSONB, -- ['Binance', 'Coinbase']
  primary_coin TEXT, -- Main coin affected

  -- Price Impact Tracking (filled in over time)
  btc_price_at_event DECIMAL,
  btc_price_1h_after DECIMAL,
  btc_price_24h_after DECIMAL,
  btc_price_7d_after DECIMAL,
  btc_actual_impact_pct DECIMAL,

  -- For coin-specific events
  coin_price_at_event DECIMAL,
  coin_price_24h_after DECIMAL,
  coin_actual_impact_pct DECIMAL,

  -- AI Analysis
  ai_summary TEXT,
  ai_sentiment_score INTEGER,
  ai_importance_score INTEGER, -- 0-100
  ai_predicted_impact TEXT, -- 'bullish', 'bearish', 'neutral'
  ai_confidence INTEGER, -- 0-100
  ai_key_points JSONB, -- Array of key takeaways

  -- Metadata
  is_verified BOOLEAN DEFAULT false,
  verification_source TEXT,
  related_events JSONB, -- UUIDs of related events
  tags JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_news_time ON news_policy_events(timestamp DESC);
CREATE INDEX idx_news_type ON news_policy_events(event_type);
CREATE INDEX idx_news_impact ON news_policy_events(impact_level);
CREATE INDEX idx_news_region ON news_policy_events(region);
CREATE INDEX idx_news_coin ON news_policy_events(primary_coin) WHERE primary_coin IS NOT NULL;

-- ============================================
-- 6. ADOPTION METRICS
-- Public understanding, usefulness perception
-- ============================================
CREATE TABLE IF NOT EXISTS adoption_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Search Interest (relative to peak)
  google_trends_btc INTEGER, -- 0-100
  google_trends_eth INTEGER,
  google_trends_crypto INTEGER,
  google_trends_defi INTEGER,
  google_trends_nft INTEGER,
  google_trends_web3 INTEGER,

  -- Wallet Activity
  btc_active_addresses INTEGER,
  eth_active_addresses INTEGER,
  new_btc_wallets INTEGER,
  new_eth_wallets INTEGER,
  total_crypto_wallets DECIMAL,

  -- Transaction Activity
  btc_tx_count INTEGER,
  eth_tx_count INTEGER,
  total_tx_volume_usd DECIMAL,
  avg_tx_value_usd DECIMAL,

  -- Retail Sentiment
  retail_buy_pressure DECIMAL, -- Derived from exchange data
  retail_sell_pressure DECIMAL,
  retail_net_flow DECIMAL,
  retail_sentiment_score INTEGER, -- -100 to +100

  -- Exchange Activity
  total_exchange_users_estimate DECIMAL,
  new_exchange_signups_estimate DECIMAL,
  exchange_volume_retail DECIMAL,
  exchange_volume_institutional DECIMAL,

  -- Institutional Activity
  etf_inflows_daily DECIMAL,
  etf_total_aum DECIMAL,
  institutional_holdings_change DECIMAL,
  corporate_btc_purchases DECIMAL,
  corporate_announcements INTEGER,

  -- Developer Activity
  github_crypto_commits INTEGER,
  github_defi_commits INTEGER,
  new_smart_contracts_eth INTEGER,
  new_dapps_launched INTEGER,
  developer_sentiment INTEGER,
  stack_overflow_questions INTEGER,

  -- Education/Understanding Metrics
  crypto_education_searches INTEGER,
  how_to_buy_btc_searches INTEGER,
  how_to_buy_eth_searches INTEGER,
  crypto_scam_searches INTEGER,
  crypto_tutorial_views INTEGER,

  -- Payment Adoption
  merchant_crypto_payments DECIMAL,
  lightning_network_capacity DECIMAL,
  stablecoin_transfer_volume DECIMAL,
  cross_border_payments DECIMAL,

  -- DeFi Adoption
  defi_unique_users INTEGER,
  defi_tvl DECIMAL,
  dex_volume DECIMAL,
  lending_volume DECIMAL,

  -- NFT/Gaming Adoption
  nft_unique_buyers INTEGER,
  nft_volume DECIMAL,
  gaming_dau INTEGER,

  -- Overall Scores
  adoption_index INTEGER, -- Composite 0-100
  understanding_index INTEGER, -- How well public understands
  usefulness_perception INTEGER, -- Perceived utility
  mainstream_readiness INTEGER, -- Ready for mass adoption?

  CONSTRAINT unique_adoption UNIQUE (timestamp)
);

CREATE INDEX idx_adoption_time ON adoption_metrics(timestamp DESC);
CREATE INDEX idx_adoption_index ON adoption_metrics(adoption_index);

-- ============================================
-- 7. PREDICTION TRAINING DATA
-- Combined dataset for AI model training
-- ============================================
CREATE TABLE IF NOT EXISTS prediction_training_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Snapshot Reference
  snapshot_id UUID REFERENCES prediction_snapshots(id) ON DELETE CASCADE,
  coin_id TEXT NOT NULL,
  snapshot_timestamp TIMESTAMPTZ NOT NULL,

  -- All Input Features (Flattened JSON for ML)
  features JSONB NOT NULL,

  -- Feature Categories (for selective training)
  technical_features JSONB,
  sentiment_features JSONB,
  onchain_features JSONB,
  macro_features JSONB,
  derivatives_features JSONB,
  wallet_features JSONB, -- Aggregated whale signals
  news_features JSONB, -- Recent news sentiment

  -- Target Variables (What we're predicting)
  price_at_snapshot DECIMAL,
  price_1h_later DECIMAL,
  price_4h_later DECIMAL,
  price_24h_later DECIMAL,
  price_7d_later DECIMAL,
  price_30d_later DECIMAL,

  -- Actual Direction (filled in later)
  actual_direction_1h TEXT, -- 'up', 'down', 'flat'
  actual_direction_4h TEXT,
  actual_direction_24h TEXT,
  actual_direction_7d TEXT,
  actual_direction_30d TEXT,

  -- Actual Change Percentages
  actual_change_pct_1h DECIMAL,
  actual_change_pct_4h DECIMAL,
  actual_change_pct_24h DECIMAL,
  actual_change_pct_7d DECIMAL,
  actual_change_pct_30d DECIMAL,

  -- Volatility (for risk assessment)
  volatility_1h DECIMAL,
  volatility_24h DECIMAL,
  volatility_7d DECIMAL,
  max_drawdown_7d DECIMAL,
  max_gain_7d DECIMAL,

  -- Prediction Performance (backfilled)
  predicted_direction TEXT, -- What we predicted
  predicted_confidence INTEGER,
  prediction_was_correct_1h BOOLEAN,
  prediction_was_correct_24h BOOLEAN,
  prediction_was_correct_7d BOOLEAN,
  prediction_error_pct DECIMAL,

  -- Quality Flags
  data_quality_score INTEGER, -- 0-100, how complete the features are
  is_valid_for_training BOOLEAN DEFAULT true,
  exclusion_reason TEXT,

  CONSTRAINT unique_training UNIQUE (snapshot_timestamp, coin_id)
);

CREATE INDEX idx_training_time ON prediction_training_data(snapshot_timestamp DESC);
CREATE INDEX idx_training_coin ON prediction_training_data(coin_id);
CREATE INDEX idx_training_valid ON prediction_training_data(is_valid_for_training) WHERE is_valid_for_training = true;
CREATE INDEX idx_training_quality ON prediction_training_data(data_quality_score);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to get latest snapshot for a coin
CREATE OR REPLACE FUNCTION get_latest_snapshot(p_coin_id TEXT)
RETURNS prediction_snapshots AS $$
  SELECT * FROM prediction_snapshots
  WHERE coin_id = p_coin_id
  ORDER BY timestamp DESC
  LIMIT 1;
$$ LANGUAGE SQL;

-- Function to calculate wallet impact score
CREATE OR REPLACE FUNCTION calculate_wallet_impact(
  p_accuracy DECIMAL,
  p_volume DECIMAL,
  p_trade_count INTEGER
) RETURNS DECIMAL AS $$
DECLARE
  v_impact DECIMAL;
BEGIN
  -- Impact = accuracy * log(volume) * sqrt(trade_count)
  -- Normalized to 0-100
  v_impact := (p_accuracy / 100) * (LN(GREATEST(p_volume, 1)) / 20) * SQRT(GREATEST(p_trade_count, 1));
  RETURN LEAST(100, GREATEST(0, v_impact * 10));
END;
$$ LANGUAGE plpgsql;

-- Function to get aggregated wallet signals for a coin
CREATE OR REPLACE FUNCTION get_wallet_signals(p_coin_symbol TEXT, p_hours INTEGER DEFAULT 24)
RETURNS TABLE (
  buy_volume DECIMAL,
  sell_volume DECIMAL,
  net_flow DECIMAL,
  whale_sentiment TEXT,
  top_wallets_buying INTEGER,
  top_wallets_selling INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH recent_txs AS (
    SELECT
      wt.direction,
      wt.amount_usd,
      wp.impact_score
    FROM wallet_transactions wt
    JOIN wallet_profiles wp ON wt.wallet_id = wp.id
    WHERE wt.coin_symbol = p_coin_symbol
      AND wt.timestamp > NOW() - (p_hours || ' hours')::INTERVAL
      AND wp.impact_score >= 50
  )
  SELECT
    COALESCE(SUM(CASE WHEN direction = 'buy' THEN amount_usd ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN direction = 'sell' THEN amount_usd ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN direction = 'buy' THEN amount_usd ELSE -amount_usd END), 0),
    CASE
      WHEN SUM(CASE WHEN direction = 'buy' THEN 1 ELSE -1 END) > 2 THEN 'bullish'
      WHEN SUM(CASE WHEN direction = 'buy' THEN 1 ELSE -1 END) < -2 THEN 'bearish'
      ELSE 'neutral'
    END,
    COUNT(*) FILTER (WHERE direction = 'buy')::INTEGER,
    COUNT(*) FILTER (WHERE direction = 'sell')::INTEGER
  FROM recent_txs;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE prediction_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sentiment_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_policy_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE adoption_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE prediction_training_data ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access (adjust as needed)
CREATE POLICY "Allow public read on prediction_snapshots" ON prediction_snapshots FOR SELECT USING (true);
CREATE POLICY "Allow public read on wallet_profiles" ON wallet_profiles FOR SELECT USING (true);
CREATE POLICY "Allow public read on wallet_transactions" ON wallet_transactions FOR SELECT USING (true);
CREATE POLICY "Allow public read on sentiment_profiles" ON sentiment_profiles FOR SELECT USING (true);
CREATE POLICY "Allow public read on news_policy_events" ON news_policy_events FOR SELECT USING (true);
CREATE POLICY "Allow public read on adoption_metrics" ON adoption_metrics FOR SELECT USING (true);
CREATE POLICY "Allow public read on prediction_training_data" ON prediction_training_data FOR SELECT USING (true);

-- Service role has full access (for ingestion)
CREATE POLICY "Service role full access on prediction_snapshots" ON prediction_snapshots FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access on wallet_profiles" ON wallet_profiles FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access on wallet_transactions" ON wallet_transactions FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access on sentiment_profiles" ON sentiment_profiles FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access on news_policy_events" ON news_policy_events FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access on adoption_metrics" ON adoption_metrics FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access on prediction_training_data" ON prediction_training_data FOR ALL USING (auth.role() = 'service_role');

-- ============================================
-- SEED DATA
-- ============================================
-- Intentionally omitted. The app should not ship static or example “known wallets” lists.
-- If you want enrichment labels, ingest them from a real upstream data source.

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE prediction_snapshots IS 'Stores all prediction inputs and outputs with timestamps for historical analysis';
COMMENT ON TABLE wallet_profiles IS 'Profiles of significant wallets (whales, exchanges, funds) with impact scoring';
COMMENT ON TABLE wallet_transactions IS 'Historical transaction data for tracked wallets';
COMMENT ON TABLE sentiment_profiles IS 'Multi-dimensional sentiment data across sources and categories';
COMMENT ON TABLE news_policy_events IS 'News and government policy events with impact tracking';
COMMENT ON TABLE adoption_metrics IS 'Crypto adoption and public understanding metrics';
COMMENT ON TABLE prediction_training_data IS 'Combined dataset for AI model training with actual outcomes';
