-- ============================================
-- DATASIMPLIFY - SUPABASE SCHEMA
-- Complete database for caching all API data
-- ============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. MARKET DATA (Updates every 1 minute)
-- ============================================

-- Current prices and market data for all coins
CREATE TABLE market_data (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    symbol VARCHAR(20) NOT NULL,
    name VARCHAR(100),
    
    -- Price data
    price DECIMAL(30, 10),
    price_change_24h DECIMAL(30, 10),
    price_change_percent_24h DECIMAL(10, 4),
    high_24h DECIMAL(30, 10),
    low_24h DECIMAL(30, 10),
    
    -- Volume data
    volume_24h DECIMAL(30, 2),
    quote_volume_24h DECIMAL(30, 2),
    
    -- Market cap (calculated)
    market_cap DECIMAL(30, 2),
    circulating_supply DECIMAL(30, 2),
    max_supply DECIMAL(30, 2),
    
    -- Order book snapshot
    bid_price DECIMAL(30, 10),
    ask_price DECIMAL(30, 10),
    spread DECIMAL(30, 10),
    
    -- Metadata
    category VARCHAR(50),
    image_url TEXT,
    
    -- Timestamps
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(symbol)
);

-- Index for fast queries
CREATE INDEX idx_market_data_symbol ON market_data(symbol);
CREATE INDEX idx_market_data_category ON market_data(category);
CREATE INDEX idx_market_data_market_cap ON market_data(market_cap DESC);

-- ============================================
-- 2. HISTORICAL PRICES (OHLCV - Updates every 5 min)
-- ============================================

CREATE TABLE klines (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    symbol VARCHAR(20) NOT NULL,
    interval VARCHAR(10) NOT NULL, -- 1m, 5m, 15m, 1h, 4h, 1d, 1w, 1M
    
    open_time TIMESTAMP WITH TIME ZONE NOT NULL,
    open DECIMAL(30, 10),
    high DECIMAL(30, 10),
    low DECIMAL(30, 10),
    close DECIMAL(30, 10),
    volume DECIMAL(30, 2),
    close_time TIMESTAMP WITH TIME ZONE,
    quote_volume DECIMAL(30, 2),
    trades_count INTEGER,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(symbol, interval, open_time)
);

-- Indexes for time-series queries
CREATE INDEX idx_klines_symbol_interval ON klines(symbol, interval);
CREATE INDEX idx_klines_open_time ON klines(open_time DESC);
CREATE INDEX idx_klines_lookup ON klines(symbol, interval, open_time DESC);

-- ============================================
-- 3. DEFI DATA (Updates every 10 minutes)
-- ============================================

-- DeFi Protocol TVL
CREATE TABLE defi_protocols (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    symbol VARCHAR(20),
    chain VARCHAR(50),
    category VARCHAR(50),
    
    tvl DECIMAL(30, 2),
    tvl_change_24h DECIMAL(10, 4),
    tvl_change_7d DECIMAL(10, 4),
    
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(name)
);

CREATE INDEX idx_defi_protocols_tvl ON defi_protocols(tvl DESC);
CREATE INDEX idx_defi_protocols_chain ON defi_protocols(chain);

-- DeFi Yields/APY
CREATE TABLE defi_yields (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    protocol VARCHAR(100) NOT NULL,
    chain VARCHAR(50),
    pool_symbol VARCHAR(100),
    
    tvl DECIMAL(30, 2),
    apy DECIMAL(10, 4),
    apy_base DECIMAL(10, 4),
    apy_reward DECIMAL(10, 4),
    
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(protocol, chain, pool_symbol)
);

CREATE INDEX idx_defi_yields_apy ON defi_yields(apy DESC);

-- Chain TVL Rankings
CREATE TABLE chain_tvl (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    chain VARCHAR(50) NOT NULL,
    tvl DECIMAL(30, 2),
    dominance DECIMAL(10, 4),
    
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(chain)
);

-- Stablecoins
CREATE TABLE stablecoins (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    symbol VARCHAR(20),
    chain VARCHAR(50),
    market_cap DECIMAL(30, 2),
    
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(symbol)
);

-- ============================================
-- 4. SENTIMENT DATA (Updates every 15 minutes)
-- ============================================

-- Overall market sentiment
CREATE TABLE market_sentiment (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    
    overall_score INTEGER, -- 0-100
    overall_label VARCHAR(50),
    fear_greed_index INTEGER,
    fear_greed_label VARCHAR(50),
    
    total_posts_analyzed INTEGER,
    confidence DECIMAL(5, 4),
    
    -- Source breakdown (JSON for flexibility)
    by_source JSONB,
    trending_topics TEXT[],
    
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_market_sentiment_time ON market_sentiment(recorded_at DESC);

-- Per-coin sentiment
CREATE TABLE coin_sentiment (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    symbol VARCHAR(20) NOT NULL,
    
    sentiment_score INTEGER, -- -100 to 100
    sentiment_label VARCHAR(50),
    social_volume INTEGER,
    
    reddit_mentions INTEGER,
    news_mentions INTEGER,
    is_trending BOOLEAN DEFAULT FALSE,
    
    keywords TEXT[],
    
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(symbol)
);

CREATE INDEX idx_coin_sentiment_symbol ON coin_sentiment(symbol);
CREATE INDEX idx_coin_sentiment_score ON coin_sentiment(sentiment_score DESC);

-- Individual sentiment posts (for historical analysis)
CREATE TABLE sentiment_posts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    external_id VARCHAR(100), -- Reddit post ID, etc.
    source VARCHAR(50) NOT NULL, -- reddit, cryptopanic, 4chan, rss
    platform VARCHAR(100), -- r/cryptocurrency, CoinTelegraph, etc.
    
    title TEXT,
    content TEXT,
    url TEXT,
    author VARCHAR(100),
    
    sentiment_score DECIMAL(5, 4), -- -1 to 1
    sentiment_label VARCHAR(20),
    confidence DECIMAL(5, 4),
    
    likes INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    
    coins_mentioned TEXT[],
    keywords TEXT[],
    
    posted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(source, external_id)
);

CREATE INDEX idx_sentiment_posts_source ON sentiment_posts(source);
CREATE INDEX idx_sentiment_posts_coins ON sentiment_posts USING GIN(coins_mentioned);
CREATE INDEX idx_sentiment_posts_time ON sentiment_posts(posted_at DESC);

-- ============================================
-- 5. WHALE DATA (Updates every 5 minutes)
-- ============================================

-- Large transactions
CREATE TABLE whale_transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tx_hash VARCHAR(100) NOT NULL,
    blockchain VARCHAR(20) NOT NULL,
    
    from_address VARCHAR(100),
    from_label VARCHAR(100),
    to_address VARCHAR(100),
    to_label VARCHAR(100),
    
    amount DECIMAL(30, 10),
    amount_usd DECIMAL(30, 2),
    symbol VARCHAR(20),
    
    tx_type VARCHAR(50), -- exchange_inflow, exchange_outflow, whale_transfer
    
    tx_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(tx_hash)
);

CREATE INDEX idx_whale_tx_blockchain ON whale_transactions(blockchain);
CREATE INDEX idx_whale_tx_type ON whale_transactions(tx_type);
CREATE INDEX idx_whale_tx_time ON whale_transactions(tx_time DESC);
CREATE INDEX idx_whale_tx_amount ON whale_transactions(amount_usd DESC);

-- Exchange balances (tracked over time)
CREATE TABLE exchange_balances (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    exchange VARCHAR(50) NOT NULL,
    wallet_address VARCHAR(100),
    
    balance DECIMAL(30, 10),
    balance_usd DECIMAL(30, 2),
    symbol VARCHAR(20) DEFAULT 'ETH',
    
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_exchange_balances_exchange ON exchange_balances(exchange);
CREATE INDEX idx_exchange_balances_time ON exchange_balances(recorded_at DESC);

-- Exchange flows summary
CREATE TABLE exchange_flows (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    exchange VARCHAR(50) NOT NULL,
    
    inflow_24h DECIMAL(30, 10),
    outflow_24h DECIMAL(30, 10),
    net_flow_24h DECIMAL(30, 10),
    
    inflow_usd_24h DECIMAL(30, 2),
    outflow_usd_24h DECIMAL(30, 2),
    net_flow_usd_24h DECIMAL(30, 2),
    
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(exchange)
);

-- ============================================
-- 6. ON-CHAIN METRICS (Updates every 10 minutes)
-- ============================================

-- Bitcoin on-chain stats
CREATE TABLE bitcoin_stats (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    
    hash_rate DECIMAL(30, 2),
    difficulty DECIMAL(30, 2),
    block_height INTEGER,
    avg_block_time DECIMAL(10, 4),
    unconfirmed_txs INTEGER,
    mempool_size BIGINT,
    
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_bitcoin_stats_time ON bitcoin_stats(recorded_at DESC);

-- Ethereum gas prices
CREATE TABLE eth_gas_prices (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    
    slow_gwei DECIMAL(20, 4),
    standard_gwei DECIMAL(20, 4),
    fast_gwei DECIMAL(20, 4),
    base_fee_gwei DECIMAL(20, 4),
    
    block_number BIGINT,
    
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_eth_gas_time ON eth_gas_prices(recorded_at DESC);

-- Fear & Greed Index (daily)
CREATE TABLE fear_greed_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    
    value INTEGER,
    label VARCHAR(50),
    
    recorded_at DATE NOT NULL,
    
    UNIQUE(recorded_at)
);

-- ============================================
-- 7. USER DATA
-- ============================================

-- User profiles (extends Supabase auth)
CREATE TABLE user_profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email VARCHAR(255),
    
    subscription_tier VARCHAR(20) DEFAULT 'free', -- free, starter, pro, business
    downloads_this_month INTEGER DEFAULT 0,
    downloads_limit INTEGER DEFAULT 5,
    
    preferences JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Download history
CREATE TABLE download_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(id),
    
    category VARCHAR(50) NOT NULL,
    format VARCHAR(10) NOT NULL, -- xlsx, csv, json
    filters JSONB,
    row_count INTEGER,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_download_history_user ON download_history(user_id);
CREATE INDEX idx_download_history_time ON download_history(created_at DESC);

-- ============================================
-- 8. SYNC MANAGEMENT
-- ============================================

-- Track data sync status
CREATE TABLE sync_log (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    
    data_type VARCHAR(50) NOT NULL, -- market_data, sentiment, whales, etc.
    status VARCHAR(20) NOT NULL, -- success, failed, running
    
    records_synced INTEGER DEFAULT 0,
    error_message TEXT,
    
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_sync_log_type ON sync_log(data_type);
CREATE INDEX idx_sync_log_time ON sync_log(started_at DESC);

-- ============================================
-- 9. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on user tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE download_history ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can view own profile"
    ON user_profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON user_profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can view own downloads"
    ON download_history FOR SELECT
    USING (auth.uid() = user_id);

-- Public data is readable by everyone
-- (market_data, klines, sentiment, etc. don't need RLS)

-- ============================================
-- 10. HELPER FUNCTIONS
-- ============================================

-- Get latest market data for a coin
CREATE OR REPLACE FUNCTION get_coin_data(coin_symbol VARCHAR)
RETURNS TABLE (
    symbol VARCHAR,
    price DECIMAL,
    price_change_24h DECIMAL,
    volume_24h DECIMAL,
    market_cap DECIMAL,
    sentiment_score INTEGER,
    is_trending BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.symbol,
        m.price,
        m.price_change_percent_24h,
        m.quote_volume_24h,
        m.market_cap,
        COALESCE(s.sentiment_score, 0),
        COALESCE(s.is_trending, FALSE)
    FROM market_data m
    LEFT JOIN coin_sentiment s ON m.symbol = s.symbol
    WHERE m.symbol = coin_symbol;
END;
$$ LANGUAGE plpgsql;

-- Get market overview with sentiment
CREATE OR REPLACE FUNCTION get_market_overview(limit_count INTEGER DEFAULT 100)
RETURNS TABLE (
    symbol VARCHAR,
    name VARCHAR,
    price DECIMAL,
    price_change_24h DECIMAL,
    volume_24h DECIMAL,
    market_cap DECIMAL,
    sentiment_score INTEGER,
    sentiment_label VARCHAR,
    is_trending BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.symbol,
        m.name,
        m.price,
        m.price_change_percent_24h,
        m.quote_volume_24h,
        m.market_cap,
        COALESCE(s.sentiment_score, 0),
        COALESCE(s.sentiment_label, 'neutral'),
        COALESCE(s.is_trending, FALSE)
    FROM market_data m
    LEFT JOIN coin_sentiment s ON m.symbol = s.symbol
    ORDER BY m.market_cap DESC NULLS LAST
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Reset monthly download counts (run via cron)
CREATE OR REPLACE FUNCTION reset_monthly_downloads()
RETURNS void AS $$
BEGIN
    UPDATE user_profiles SET downloads_this_month = 0;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 11. VIEWS FOR COMMON QUERIES
-- ============================================

-- Latest sentiment summary
CREATE VIEW v_sentiment_summary AS
SELECT 
    ms.overall_score,
    ms.overall_label,
    ms.fear_greed_index,
    ms.fear_greed_label,
    ms.total_posts_analyzed,
    ms.recorded_at,
    (SELECT COUNT(*) FROM coin_sentiment WHERE sentiment_score > 20) as bullish_coins,
    (SELECT COUNT(*) FROM coin_sentiment WHERE sentiment_score < -20) as bearish_coins
FROM market_sentiment ms
ORDER BY ms.recorded_at DESC
LIMIT 1;

-- Top gainers with sentiment
CREATE VIEW v_top_gainers AS
SELECT 
    m.symbol,
    m.name,
    m.price,
    m.price_change_percent_24h,
    m.quote_volume_24h,
    COALESCE(s.sentiment_score, 0) as sentiment,
    COALESCE(s.is_trending, FALSE) as trending
FROM market_data m
LEFT JOIN coin_sentiment s ON m.symbol = s.symbol
WHERE m.price_change_percent_24h > 0
ORDER BY m.price_change_percent_24h DESC
LIMIT 20;

-- Latest whale activity
CREATE VIEW v_recent_whales AS
SELECT 
    tx_hash,
    blockchain,
    from_label,
    to_label,
    amount,
    symbol,
    amount_usd,
    tx_type,
    tx_time
FROM whale_transactions
ORDER BY tx_time DESC
LIMIT 50;

-- ============================================
-- DONE! Schema ready for production.
-- ============================================
