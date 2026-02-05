-- ============================================
-- DATASIMPLIFY - COMPLETE DATABASE SCHEMA
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================
-- 1. USER PROFILES (extends Supabase auth.users)
-- ============================================

CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    
    -- Subscription
    subscription_tier VARCHAR(20) DEFAULT 'free' CHECK (subscription_tier IN ('free', 'starter', 'pro', 'business')),
    downloads_this_month INTEGER DEFAULT 0,
    downloads_limit INTEGER DEFAULT 5,
    
    -- Stripe
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, subscription_tier, downloads_limit)
    VALUES (NEW.id, NEW.email, 'free', 5);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 2. DOWNLOAD HISTORY
-- ============================================

CREATE TABLE IF NOT EXISTS download_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    
    category VARCHAR(100) NOT NULL,
    format VARCHAR(20) NOT NULL,
    filters JSONB DEFAULT '{}',
    row_count INTEGER,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE download_history ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own downloads" ON download_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own downloads" ON download_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Index
CREATE INDEX idx_downloads_user ON download_history(user_id);
CREATE INDEX idx_downloads_created ON download_history(created_at DESC);

-- ============================================
-- 2B. PRODUCT ENTITLEMENTS (Monetization)
-- ============================================

CREATE TABLE IF NOT EXISTS product_entitlements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
    product_key VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked', 'expired')),
    source VARCHAR(30) NOT NULL DEFAULT 'manual' CHECK (source IN ('fastspring', 'manual', 'admin')),
    external_order_id TEXT,
    external_customer_email TEXT,
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, product_key)
);

ALTER TABLE product_entitlements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own entitlements" ON product_entitlements
    FOR SELECT USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_entitlements_user ON product_entitlements(user_id);
CREATE INDEX IF NOT EXISTS idx_entitlements_product ON product_entitlements(product_key);

CREATE TABLE IF NOT EXISTS template_releases (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    slug VARCHAR(120) NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT,
    required_product_key VARCHAR(100),
    storage_bucket VARCHAR(80) NOT NULL DEFAULT 'crk-downloads',
    storage_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    content_type VARCHAR(120) NOT NULL DEFAULT 'application/zip',
    version VARCHAR(30) NOT NULL,
    is_latest BOOLEAN NOT NULL DEFAULT FALSE,
    published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_template_releases_product ON template_releases(required_product_key);
CREATE INDEX IF NOT EXISTS idx_template_releases_latest ON template_releases(is_latest);

CREATE TABLE IF NOT EXISTS purchase_events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    provider VARCHAR(30) NOT NULL DEFAULT 'fastspring',
    event_type VARCHAR(120),
    external_order_id TEXT,
    external_customer_email TEXT,
    product_key VARCHAR(100),
    raw_payload JSONB,
    received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pending_entitlements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    purchaser_email TEXT NOT NULL,
    product_key VARCHAR(100) NOT NULL,
    external_order_id TEXT,
    provider VARCHAR(30) NOT NULL DEFAULT 'fastspring',
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'claimed', 'revoked')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    claimed_at TIMESTAMP WITH TIME ZONE,
    claimed_by_user_id UUID
);

CREATE INDEX IF NOT EXISTS idx_pending_entitlements_email ON pending_entitlements(purchaser_email);
CREATE INDEX IF NOT EXISTS idx_pending_entitlements_status ON pending_entitlements(status);

-- ============================================
-- 3. MARKET DATA CACHE
-- ============================================

CREATE TABLE IF NOT EXISTS market_data (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    symbol VARCHAR(20) NOT NULL,
    name VARCHAR(100),
    
    -- Price data
    price DECIMAL(20, 8),
    price_change_24h DECIMAL(20, 8),
    price_change_percent_24h DECIMAL(10, 4),
    
    -- Volume
    volume_24h DECIMAL(30, 8),
    quote_volume_24h DECIMAL(30, 8),
    
    -- Market
    market_cap DECIMAL(30, 2),
    market_cap_rank INTEGER,
    
    -- Supply
    circulating_supply DECIMAL(30, 8),
    total_supply DECIMAL(30, 8),
    max_supply DECIMAL(30, 8),
    
    -- Metadata
    category VARCHAR(50),
    image_url TEXT,
    
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(symbol)
);

CREATE INDEX idx_market_symbol ON market_data(symbol);
CREATE INDEX idx_market_rank ON market_data(market_cap_rank);
CREATE INDEX idx_market_category ON market_data(category);

-- ============================================
-- 4. SENTIMENT DATA
-- ============================================

CREATE TABLE IF NOT EXISTS market_sentiment (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    
    overall_score DECIMAL(5, 4),
    overall_label VARCHAR(20),
    
    -- Source breakdown
    reddit_score DECIMAL(5, 4),
    news_score DECIMAL(5, 4),
    social_score DECIMAL(5, 4),
    
    -- Metrics
    total_posts_analyzed INTEGER,
    bullish_count INTEGER,
    bearish_count INTEGER,
    neutral_count INTEGER,
    
    -- Fear & Greed
    fear_greed_value INTEGER,
    fear_greed_label VARCHAR(20),
    
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS coin_sentiment (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    symbol VARCHAR(20) NOT NULL,
    
    sentiment_score DECIMAL(5, 4),
    sentiment_label VARCHAR(20),
    mention_count INTEGER,
    
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(symbol)
);

CREATE INDEX idx_coin_sentiment_symbol ON coin_sentiment(symbol);

-- ============================================
-- 5. DEFI DATA
-- ============================================

CREATE TABLE IF NOT EXISTS defi_protocols (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    
    protocol_id VARCHAR(100) NOT NULL,
    name VARCHAR(100),
    symbol VARCHAR(20),
    
    tvl DECIMAL(30, 2),
    tvl_change_24h DECIMAL(10, 4),
    tvl_change_7d DECIMAL(10, 4),
    
    chain VARCHAR(50),
    category VARCHAR(50),
    
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(protocol_id)
);

CREATE TABLE IF NOT EXISTS defi_yields (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    
    pool_id VARCHAR(200) NOT NULL,
    protocol VARCHAR(100),
    chain VARCHAR(50),
    symbol VARCHAR(100),
    
    apy DECIMAL(10, 4),
    tvl DECIMAL(30, 2),
    
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(pool_id)
);

-- ============================================
-- 6. WHALE TRACKING
-- ============================================

CREATE TABLE IF NOT EXISTS whale_transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    
    tx_hash VARCHAR(100) NOT NULL,
    blockchain VARCHAR(20),
    
    amount DECIMAL(30, 8),
    amount_usd DECIMAL(20, 2),
    
    from_address VARCHAR(100),
    to_address VARCHAR(100),
    from_label VARCHAR(100),
    to_label VARCHAR(100),
    
    tx_type VARCHAR(50),
    
    timestamp TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(tx_hash)
);

CREATE INDEX idx_whale_blockchain ON whale_transactions(blockchain);
CREATE INDEX idx_whale_timestamp ON whale_transactions(timestamp DESC);
CREATE INDEX idx_whale_type ON whale_transactions(tx_type);

-- ============================================
-- 7. VECTOR EMBEDDINGS (for RAG)
-- ============================================

CREATE TABLE IF NOT EXISTS data_categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    parent_id UUID REFERENCES data_categories(id),
    description TEXT,
    level INTEGER DEFAULT 0,
    path TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS document_chunks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    
    category_id UUID REFERENCES data_categories(id),
    category_path TEXT,
    
    content TEXT NOT NULL,
    content_type VARCHAR(50),
    
    coin_symbol VARCHAR(20),
    source VARCHAR(100),
    source_url TEXT,
    
    data_date DATE,
    data_timestamp TIMESTAMP WITH TIME ZONE,
    
    -- Vector embedding (1024 dimensions)
    embedding vector(1024),
    
    -- AI analysis
    ai_summary TEXT,
    ai_sentiment DECIMAL(5, 4),
    ai_sentiment_label VARCHAR(20),
    ai_topics TEXT[],
    ai_entities TEXT[],
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- HNSW index for fast similarity search
CREATE INDEX IF NOT EXISTS idx_chunks_embedding ON document_chunks 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

CREATE INDEX idx_chunks_category ON document_chunks(category_path);
CREATE INDEX idx_chunks_coin ON document_chunks(coin_symbol);
CREATE INDEX idx_chunks_date ON document_chunks(data_date DESC);

-- ============================================
-- 8. SYNC LOG
-- ============================================

CREATE TABLE IF NOT EXISTS sync_log (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    
    sync_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'running',
    records_synced INTEGER DEFAULT 0,
    error_message TEXT,
    
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_sync_type ON sync_log(sync_type);
CREATE INDEX idx_sync_started ON sync_log(started_at DESC);

-- ============================================
-- 9. HELPER FUNCTIONS
-- ============================================

-- Reset monthly downloads (run via cron on 1st of month)
CREATE OR REPLACE FUNCTION reset_monthly_downloads()
RETURNS void AS $$
BEGIN
    UPDATE user_profiles SET downloads_this_month = 0;
END;
$$ LANGUAGE plpgsql;

-- Get download limit for tier
CREATE OR REPLACE FUNCTION get_download_limit(tier VARCHAR)
RETURNS INTEGER AS $$
BEGIN
    RETURN CASE tier
        WHEN 'free' THEN 5
        WHEN 'starter' THEN 50
        WHEN 'pro' THEN 999999
        WHEN 'business' THEN 999999
        ELSE 5
    END;
END;
$$ LANGUAGE plpgsql;

-- Semantic search function
CREATE OR REPLACE FUNCTION search_similar_chunks(
    query_embedding vector(1024),
    match_count INTEGER DEFAULT 10,
    category_filter TEXT DEFAULT NULL,
    coin_filter VARCHAR(20) DEFAULT NULL,
    min_similarity DECIMAL DEFAULT 0.5
)
RETURNS TABLE (
    id UUID,
    content TEXT,
    content_type VARCHAR(50),
    category_path TEXT,
    coin_symbol VARCHAR(20),
    source VARCHAR(100),
    data_date DATE,
    ai_sentiment DECIMAL,
    similarity DECIMAL
) AS $$
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
        (1 - (dc.embedding <=> query_embedding))::DECIMAL as similarity
    FROM document_chunks dc
    WHERE 
        (category_filter IS NULL OR dc.category_path LIKE category_filter || '%')
        AND (coin_filter IS NULL OR dc.coin_symbol = coin_filter)
        AND (1 - (dc.embedding <=> query_embedding)) >= min_similarity
    ORDER BY dc.embedding <=> query_embedding
    LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 10. INSERT DEFAULT DATA CATEGORIES
-- ============================================

INSERT INTO data_categories (name, slug, level, path, description) VALUES
('Crypto Data', 'root', 0, '', 'Root of all crypto data'),
('Market Data', 'market', 1, 'market', 'Price, volume, market cap data'),
('DeFi Data', 'defi', 1, 'defi', 'DeFi protocols, yields, TVL'),
('Sentiment Data', 'sentiment', 1, 'sentiment', 'Social media, news sentiment'),
('On-Chain Data', 'onchain', 1, 'onchain', 'Blockchain metrics, whale activity')
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- DONE! Database ready for DataSimplify.
-- ============================================
