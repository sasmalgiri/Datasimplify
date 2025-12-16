-- ============================================
-- DATASIMPLIFY COMPLETE DATABASE SCHEMA
-- ============================================
-- This schema includes ALL tables needed for:
-- 1. User management & subscriptions
-- 2. Market data storage
-- 3. RAG/AI vector storage
-- 4. Sentiment & analytics
-- 5. User activity tracking
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ============================================
-- USER & AUTH TABLES
-- ============================================

-- User profiles (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    user_level TEXT DEFAULT 'beginner' CHECK (user_level IN ('beginner', 'intermediate', 'pro')),
    subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'starter', 'pro', 'business', 'enterprise')),
    downloads_this_month INTEGER DEFAULT 0,
    downloads_reset_at TIMESTAMPTZ DEFAULT NOW(),
    preferences JSONB DEFAULT '{"showTooltips": true, "showExplanations": true, "showTrafficLights": true}'::jsonb,
    onboarding_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscriptions (Paddle)
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    paddle_subscription_id TEXT UNIQUE,
    paddle_customer_id TEXT,
    status TEXT DEFAULT 'inactive' CHECK (status IN ('active', 'cancelled', 'paused', 'past_due', 'inactive')),
    tier TEXT NOT NULL,
    price_id TEXT,
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancel_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Download history
CREATE TABLE IF NOT EXISTS downloads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    file_type TEXT NOT NULL,
    template_name TEXT,
    coins TEXT[],
    file_size INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- MARKET DATA TABLES
-- ============================================

-- Real-time market data (updated every 5 min)
CREATE TABLE IF NOT EXISTS market_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    price DECIMAL(20, 8),
    price_change_1h DECIMAL(10, 4),
    price_change_24h DECIMAL(10, 4),
    price_change_7d DECIMAL(10, 4),
    price_change_30d DECIMAL(10, 4),
    market_cap DECIMAL(24, 2),
    volume_24h DECIMAL(24, 2),
    circulating_supply DECIMAL(24, 2),
    total_supply DECIMAL(24, 2),
    max_supply DECIMAL(24, 2),
    ath DECIMAL(20, 8),
    ath_date TIMESTAMPTZ,
    atl DECIMAL(20, 8),
    atl_date TIMESTAMPTZ,
    rank INTEGER,
    fetched_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Historical price data (for charts & backtesting)
CREATE TABLE IF NOT EXISTS price_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    open DECIMAL(20, 8),
    high DECIMAL(20, 8),
    low DECIMAL(20, 8),
    close DECIMAL(20, 8),
    volume DECIMAL(24, 2),
    market_cap DECIMAL(24, 2),
    UNIQUE(symbol, timestamp)
);

-- Global market metrics
CREATE TABLE IF NOT EXISTS global_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    total_market_cap DECIMAL(24, 2),
    total_volume_24h DECIMAL(24, 2),
    btc_dominance DECIMAL(6, 2),
    eth_dominance DECIMAL(6, 2),
    active_cryptocurrencies INTEGER,
    markets INTEGER,
    market_cap_change_24h DECIMAL(10, 4),
    fetched_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SENTIMENT & ANALYTICS TABLES
-- ============================================

-- Fear & Greed Index history
CREATE TABLE IF NOT EXISTS fear_greed_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    value INTEGER NOT NULL CHECK (value >= 0 AND value <= 100),
    classification TEXT NOT NULL,
    timestamp TIMESTAMPTZ UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Social sentiment data
CREATE TABLE IF NOT EXISTS social_sentiment (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol TEXT NOT NULL,
    twitter_followers INTEGER,
    twitter_change_24h DECIMAL(10, 4),
    reddit_subscribers INTEGER,
    reddit_active_users INTEGER,
    telegram_members INTEGER,
    social_score DECIMAL(10, 4),
    social_volume_24h INTEGER,
    sentiment_score DECIMAL(6, 4),
    galaxy_score DECIMAL(10, 4),
    fetched_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(symbol, fetched_at)
);

-- News articles
CREATE TABLE IF NOT EXISTS news_articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    external_id TEXT UNIQUE,
    title TEXT NOT NULL,
    content TEXT,
    summary TEXT,
    source TEXT NOT NULL,
    source_url TEXT,
    published_at TIMESTAMPTZ NOT NULL,
    coins TEXT[],
    sentiment TEXT CHECK (sentiment IN ('positive', 'negative', 'neutral')),
    sentiment_score DECIMAL(6, 4),
    importance TEXT CHECK (importance IN ('high', 'medium', 'low')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- DEFI TABLES
-- ============================================

-- DeFi protocols
CREATE TABLE IF NOT EXISTS defi_protocols (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    chain TEXT,
    tvl DECIMAL(24, 2),
    tvl_change_24h DECIMAL(10, 4),
    tvl_change_7d DECIMAL(10, 4),
    category TEXT,
    chains TEXT[],
    mcap_tvl DECIMAL(10, 4),
    fetched_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chain TVL
CREATE TABLE IF NOT EXISTS chain_tvl (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chain_name TEXT NOT NULL,
    tvl DECIMAL(24, 2),
    fetched_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(chain_name, fetched_at)
);

-- DeFi yields
CREATE TABLE IF NOT EXISTS defi_yields (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pool_id TEXT,
    chain TEXT,
    project TEXT,
    symbol TEXT,
    tvl_usd DECIMAL(24, 2),
    apy DECIMAL(10, 4),
    apy_base DECIMAL(10, 4),
    apy_reward DECIMAL(10, 4),
    il_risk TEXT,
    fetched_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ON-CHAIN DATA TABLES
-- ============================================

-- Whale transactions
CREATE TABLE IF NOT EXISTS whale_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tx_hash TEXT UNIQUE NOT NULL,
    blockchain TEXT NOT NULL,
    from_address TEXT,
    to_address TEXT,
    amount DECIMAL(24, 8),
    amount_usd DECIMAL(24, 2),
    tx_type TEXT CHECK (tx_type IN ('exchange_inflow', 'exchange_outflow', 'whale_transfer', 'unknown')),
    timestamp TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- On-chain metrics
CREATE TABLE IF NOT EXISTS onchain_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol TEXT NOT NULL,
    active_addresses_24h INTEGER,
    transaction_count_24h INTEGER,
    avg_transaction_value DECIMAL(24, 8),
    hash_rate DECIMAL(24, 8),
    difficulty DECIMAL(24, 8),
    block_height INTEGER,
    mempool_size INTEGER,
    fetched_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(symbol, fetched_at)
);

-- ============================================
-- RAG / AI TABLES
-- ============================================

-- Data categories for RAG
CREATE TABLE IF NOT EXISTS data_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    path TEXT UNIQUE NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES data_categories(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default categories
INSERT INTO data_categories (name, path, description) VALUES
    ('Market', 'market', 'Price and market data'),
    ('Sentiment', 'sentiment', 'Social sentiment and fear/greed'),
    ('DeFi', 'defi', 'DeFi protocols and yields'),
    ('On-Chain', 'onchain', 'Blockchain analytics'),
    ('News', 'news', 'Crypto news and articles')
ON CONFLICT (path) DO NOTHING;

-- Document chunks for RAG (with vector embeddings)
CREATE TABLE IF NOT EXISTS document_chunks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID REFERENCES data_categories(id),
    category_path TEXT NOT NULL,
    content TEXT NOT NULL,
    content_type TEXT NOT NULL,
    coin_symbol TEXT,
    source TEXT NOT NULL,
    source_url TEXT,
    data_date DATE NOT NULL,
    data_timestamp TIMESTAMPTZ,
    embedding vector(768),
    ai_sentiment DECIMAL(6, 4),
    ai_sentiment_label TEXT,
    ai_summary TEXT,
    ai_topics TEXT[],
    ai_entities TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily AI summaries
CREATE TABLE IF NOT EXISTS daily_summaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    summary_date DATE NOT NULL,
    category_path TEXT NOT NULL,
    coin_symbol TEXT,
    title TEXT,
    summary TEXT NOT NULL,
    key_points TEXT[],
    embedding vector(768),
    ai_sentiment DECIMAL(6, 4),
    ai_sentiment_label TEXT,
    ai_outlook TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(summary_date, category_path, coin_symbol)
);

-- AI chat history (for learning)
CREATE TABLE IF NOT EXISTS chat_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    session_id TEXT,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    sources JSONB,
    confidence DECIMAL(4, 2),
    tokens_used INTEGER,
    feedback TEXT CHECK (feedback IN ('positive', 'negative', NULL)),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- USER ACTIVITY TABLES
-- ============================================

-- Price alerts
CREATE TABLE IF NOT EXISTS price_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    symbol TEXT NOT NULL,
    alert_type TEXT NOT NULL CHECK (alert_type IN ('above', 'below', 'percent_change', 'volume_spike')),
    target_value DECIMAL(24, 8) NOT NULL,
    current_value DECIMAL(24, 8),
    notification_methods TEXT[] DEFAULT ARRAY['email'],
    is_active BOOLEAN DEFAULT TRUE,
    triggered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User portfolios
CREATE TABLE IF NOT EXISTS portfolios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL DEFAULT 'My Portfolio',
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Portfolio holdings
CREATE TABLE IF NOT EXISTS portfolio_holdings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portfolio_id UUID REFERENCES portfolios(id) ON DELETE CASCADE,
    symbol TEXT NOT NULL,
    amount DECIMAL(24, 8) NOT NULL,
    avg_buy_price DECIMAL(20, 8),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(portfolio_id, symbol)
);

-- User learning progress
CREATE TABLE IF NOT EXISTS learning_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    course_id TEXT NOT NULL,
    lesson_id TEXT NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    score INTEGER,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, course_id, lesson_id)
);

-- ============================================
-- INDEXES
-- ============================================

-- Market data indexes
CREATE INDEX IF NOT EXISTS idx_market_data_symbol ON market_data(symbol);
CREATE INDEX IF NOT EXISTS idx_market_data_rank ON market_data(rank);
CREATE INDEX IF NOT EXISTS idx_price_history_symbol_time ON price_history(symbol, timestamp DESC);

-- Sentiment indexes
CREATE INDEX IF NOT EXISTS idx_fear_greed_timestamp ON fear_greed_history(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_social_sentiment_symbol ON social_sentiment(symbol);
CREATE INDEX IF NOT EXISTS idx_news_published ON news_articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_coins ON news_articles USING gin(coins);

-- DeFi indexes
CREATE INDEX IF NOT EXISTS idx_defi_protocols_tvl ON defi_protocols(tvl DESC);
CREATE INDEX IF NOT EXISTS idx_defi_yields_apy ON defi_yields(apy DESC);

-- RAG indexes
CREATE INDEX IF NOT EXISTS idx_document_chunks_category ON document_chunks(category_path);
CREATE INDEX IF NOT EXISTS idx_document_chunks_coin ON document_chunks(coin_symbol);
CREATE INDEX IF NOT EXISTS idx_document_chunks_date ON document_chunks(data_date DESC);
CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding ON document_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- User indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_downloads_user ON downloads(user_id);
CREATE INDEX IF NOT EXISTS idx_price_alerts_user ON price_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_user ON chat_history(user_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Vector similarity search function
CREATE OR REPLACE FUNCTION search_similar_chunks(
    query_embedding vector(768),
    match_count INT DEFAULT 10,
    category_filter TEXT DEFAULT NULL,
    coin_filter TEXT DEFAULT NULL,
    date_from DATE DEFAULT NULL,
    date_to DATE DEFAULT NULL,
    min_similarity FLOAT DEFAULT 0.5
)
RETURNS TABLE (
    id UUID,
    content TEXT,
    content_type TEXT,
    category_path TEXT,
    coin_symbol TEXT,
    source TEXT,
    data_date DATE,
    ai_sentiment DECIMAL,
    ai_summary TEXT,
    similarity FLOAT
)
LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT 
        dc.id,
        dc.content,
        dc.content_type,
        dc.category_path,
        dc.coin_symbol,
        dc.source,
        dc.data_date,
        dc.ai_sentiment,
        dc.ai_summary,
        1 - (dc.embedding <=> query_embedding) AS similarity
    FROM document_chunks dc
    WHERE 
        (category_filter IS NULL OR dc.category_path LIKE category_filter || '%')
        AND (coin_filter IS NULL OR dc.coin_symbol = coin_filter)
        AND (date_from IS NULL OR dc.data_date >= date_from)
        AND (date_to IS NULL OR dc.data_date <= date_to)
        AND 1 - (dc.embedding <=> query_embedding) >= min_similarity
    ORDER BY dc.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Hybrid search (vector + keyword)
CREATE OR REPLACE FUNCTION hybrid_search(
    query_text TEXT,
    query_embedding vector(768),
    match_count INT DEFAULT 10,
    keyword_weight FLOAT DEFAULT 0.3,
    semantic_weight FLOAT DEFAULT 0.7
)
RETURNS TABLE (
    id UUID,
    content TEXT,
    category_path TEXT,
    coin_symbol TEXT,
    source TEXT,
    combined_score FLOAT
)
LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT 
        dc.id,
        dc.content,
        dc.category_path,
        dc.coin_symbol,
        dc.source,
        (
            keyword_weight * ts_rank(to_tsvector('english', dc.content), plainto_tsquery('english', query_text)) +
            semantic_weight * (1 - (dc.embedding <=> query_embedding))
        ) AS combined_score
    FROM document_chunks dc
    WHERE 
        to_tsvector('english', dc.content) @@ plainto_tsquery('english', query_text)
        OR (1 - (dc.embedding <=> query_embedding)) > 0.5
    ORDER BY combined_score DESC
    LIMIT match_count;
END;
$$;

-- Reset monthly downloads
CREATE OR REPLACE FUNCTION reset_monthly_downloads()
RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
    UPDATE profiles 
    SET 
        downloads_this_month = 0,
        downloads_reset_at = NOW()
    WHERE 
        downloads_reset_at < DATE_TRUNC('month', NOW());
END;
$$;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read/update their own
CREATE POLICY profiles_select ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY profiles_update ON profiles FOR UPDATE USING (auth.uid() = id);

-- Subscriptions: Users can read their own
CREATE POLICY subscriptions_select ON subscriptions FOR SELECT USING (auth.uid() = user_id);

-- Downloads: Users can read/insert their own
CREATE POLICY downloads_select ON downloads FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY downloads_insert ON downloads FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Price alerts: Users manage their own
CREATE POLICY alerts_all ON price_alerts FOR ALL USING (auth.uid() = user_id);

-- Portfolios: Users manage their own
CREATE POLICY portfolios_all ON portfolios FOR ALL USING (auth.uid() = user_id);
CREATE POLICY holdings_all ON portfolio_holdings FOR ALL USING (
    EXISTS (SELECT 1 FROM portfolios WHERE id = portfolio_id AND user_id = auth.uid())
);

-- Learning progress: Users manage their own
CREATE POLICY learning_all ON learning_progress FOR ALL USING (auth.uid() = user_id);

-- Chat history: Users read their own
CREATE POLICY chat_select ON chat_history FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY chat_insert ON chat_history FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Public data (no RLS needed, read by all)
-- market_data, price_history, global_metrics, fear_greed_history, 
-- social_sentiment, news_articles, defi_protocols, chain_tvl, defi_yields,
-- whale_transactions, onchain_metrics, data_categories, document_chunks, daily_summaries

-- ============================================
-- TRIGGERS
-- ============================================

-- Update updated_at on profiles
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER market_data_updated_at
    BEFORE UPDATE ON market_data
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- ============================================
-- SEED DATA
-- ============================================

-- This will be populated by the data ingestion service
-- Run: POST /api/data/sync with { "action": "sync" }

COMMENT ON TABLE market_data IS 'Real-time cryptocurrency market data, updated every 5 minutes';
COMMENT ON TABLE document_chunks IS 'RAG vector store for AI-powered search and chat';
COMMENT ON TABLE fear_greed_history IS 'Historical Fear & Greed Index values';
COMMENT ON TABLE defi_protocols IS 'DeFi protocol TVL and metrics from DeFiLlama';
