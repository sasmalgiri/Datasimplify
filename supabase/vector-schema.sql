-- ============================================
-- DATASIMPLIFY - VECTOR DATABASE SCHEMA
-- For RAG (Retrieval Augmented Generation)
-- ============================================

-- Enable pgvector extension (FREE in Supabase!)
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================
-- 1. HIERARCHICAL DATA CATEGORIES
-- ============================================

-- Define the tree structure for organizing data
CREATE TABLE data_categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    parent_id UUID REFERENCES data_categories(id),
    description TEXT,
    level INTEGER DEFAULT 0, -- 0=root, 1=category, 2=subcategory, 3=item
    path TEXT, -- Full path like 'market/bitcoin/price'
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast tree traversal
CREATE INDEX idx_categories_parent ON data_categories(parent_id);
CREATE INDEX idx_categories_path ON data_categories(path);
CREATE INDEX idx_categories_slug ON data_categories(slug);

-- Insert hierarchical structure
INSERT INTO data_categories (name, slug, parent_id, level, path, description) VALUES
-- Root
('Crypto Data', 'root', NULL, 0, '', 'Root of all crypto data'),

-- Level 1: Main categories
('Market Data', 'market', (SELECT id FROM data_categories WHERE slug = 'root'), 1, 'market', 'Price, volume, market cap data'),
('DeFi Data', 'defi', (SELECT id FROM data_categories WHERE slug = 'root'), 1, 'defi', 'DeFi protocols, yields, TVL'),
('Sentiment Data', 'sentiment', (SELECT id FROM data_categories WHERE slug = 'root'), 1, 'sentiment', 'Social media, news sentiment'),
('On-Chain Data', 'onchain', (SELECT id FROM data_categories WHERE slug = 'root'), 1, 'onchain', 'Blockchain metrics, whale activity'),

-- Level 2: Subcategories
('Bitcoin', 'bitcoin', (SELECT id FROM data_categories WHERE slug = 'market'), 2, 'market/bitcoin', 'Bitcoin market data'),
('Ethereum', 'ethereum', (SELECT id FROM data_categories WHERE slug = 'market'), 2, 'market/ethereum', 'Ethereum market data'),
('Altcoins', 'altcoins', (SELECT id FROM data_categories WHERE slug = 'market'), 2, 'market/altcoins', 'Other cryptocurrencies'),

('Protocols', 'protocols', (SELECT id FROM data_categories WHERE slug = 'defi'), 2, 'defi/protocols', 'DeFi protocol TVL'),
('Yields', 'yields', (SELECT id FROM data_categories WHERE slug = 'defi'), 2, 'defi/yields', 'Yield farming APY'),
('Stablecoins', 'stablecoins', (SELECT id FROM data_categories WHERE slug = 'defi'), 2, 'defi/stablecoins', 'Stablecoin data'),

('Reddit', 'reddit', (SELECT id FROM data_categories WHERE slug = 'sentiment'), 2, 'sentiment/reddit', 'Reddit posts and comments'),
('News', 'news', (SELECT id FROM data_categories WHERE slug = 'sentiment'), 2, 'sentiment/news', 'News articles'),
('Social', 'social', (SELECT id FROM data_categories WHERE slug = 'sentiment'), 2, 'sentiment/social', 'Aggregated social sentiment'),

('Whales', 'whales', (SELECT id FROM data_categories WHERE slug = 'onchain'), 2, 'onchain/whales', 'Large transactions'),
('Exchange Flows', 'flows', (SELECT id FROM data_categories WHERE slug = 'onchain'), 2, 'onchain/flows', 'Exchange inflow/outflow'),
('Network Stats', 'network', (SELECT id FROM data_categories WHERE slug = 'onchain'), 2, 'onchain/network', 'Network metrics');

-- ============================================
-- 2. DOCUMENT CHUNKS (The core RAG table)
-- ============================================

-- Store all data as chunks with embeddings
CREATE TABLE document_chunks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    
    -- Hierarchical organization
    category_id UUID REFERENCES data_categories(id),
    category_path TEXT, -- Denormalized for fast queries
    
    -- Content
    content TEXT NOT NULL, -- The actual text content
    content_type VARCHAR(50), -- 'market_summary', 'news_article', 'reddit_post', etc.
    
    -- Metadata for filtering
    coin_symbol VARCHAR(20), -- BTC, ETH, etc.
    source VARCHAR(100), -- 'binance', 'reddit', 'coingecko', etc.
    source_url TEXT,
    
    -- Temporal data
    data_date DATE, -- For time-based filtering
    data_timestamp TIMESTAMP WITH TIME ZONE,
    
    -- Vector embedding (1536 dimensions for OpenAI, 4096 for Llama)
    -- Using 1024 as a good middle ground for Ollama models
    embedding vector(1024),
    
    -- AI-generated metadata
    ai_summary TEXT, -- AI-generated summary
    ai_sentiment DECIMAL(5, 4), -- AI-analyzed sentiment (-1 to 1)
    ai_sentiment_label VARCHAR(20),
    ai_topics TEXT[], -- AI-extracted topics
    ai_entities TEXT[], -- AI-extracted entities (coins, people, companies)
    
    -- Quality metrics
    confidence DECIMAL(5, 4),
    relevance_score DECIMAL(5, 4),
    
    -- Standard fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- HNSW index for fast similarity search (this is the magic!)
-- HNSW = Hierarchical Navigable Small World
CREATE INDEX idx_chunks_embedding ON document_chunks 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Regular indexes for filtering
CREATE INDEX idx_chunks_category ON document_chunks(category_id);
CREATE INDEX idx_chunks_category_path ON document_chunks(category_path);
CREATE INDEX idx_chunks_coin ON document_chunks(coin_symbol);
CREATE INDEX idx_chunks_date ON document_chunks(data_date DESC);
CREATE INDEX idx_chunks_source ON document_chunks(source);
CREATE INDEX idx_chunks_content_type ON document_chunks(content_type);
CREATE INDEX idx_chunks_sentiment ON document_chunks(ai_sentiment);

-- Full text search index
CREATE INDEX idx_chunks_content_fts ON document_chunks 
USING gin(to_tsvector('english', content));

-- ============================================
-- 3. DAILY SUMMARIES (Pre-computed embeddings)
-- ============================================

-- Store daily AI-generated summaries for each category
CREATE TABLE daily_summaries (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    
    summary_date DATE NOT NULL,
    category_id UUID REFERENCES data_categories(id),
    category_path TEXT,
    coin_symbol VARCHAR(20), -- NULL for category-level summaries
    
    -- Content
    title TEXT,
    summary TEXT NOT NULL,
    key_points TEXT[], -- Bullet points
    
    -- Metrics for that day
    metrics JSONB, -- {price_change: 5.2, volume: 1000000, sentiment: 0.7}
    
    -- Vector embedding
    embedding vector(1024),
    
    -- AI analysis
    ai_sentiment DECIMAL(5, 4),
    ai_sentiment_label VARCHAR(20),
    ai_outlook VARCHAR(20), -- 'bullish', 'bearish', 'neutral'
    ai_confidence DECIMAL(5, 4),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(summary_date, category_path, coin_symbol)
);

-- HNSW index for summaries
CREATE INDEX idx_summaries_embedding ON daily_summaries 
USING hnsw (embedding vector_cosine_ops);

CREATE INDEX idx_summaries_date ON daily_summaries(summary_date DESC);
CREATE INDEX idx_summaries_coin ON daily_summaries(coin_symbol);

-- ============================================
-- 4. CONVERSATION MEMORY (For chat context)
-- ============================================

CREATE TABLE chat_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(id),
    title TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE chat_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
    
    role VARCHAR(20) NOT NULL, -- 'user', 'assistant', 'system'
    content TEXT NOT NULL,
    
    -- Vector for semantic search in chat history
    embedding vector(1024),
    
    -- Retrieved context used for this response
    retrieved_chunks UUID[], -- References to document_chunks
    
    -- Metadata
    tokens_used INTEGER,
    model_used VARCHAR(50),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_messages_session ON chat_messages(session_id);
CREATE INDEX idx_messages_embedding ON chat_messages 
USING hnsw (embedding vector_cosine_ops);

-- ============================================
-- 5. SEARCH FUNCTIONS
-- ============================================

-- Semantic search function (the core RAG retrieval)
CREATE OR REPLACE FUNCTION search_similar_chunks(
    query_embedding vector(1024),
    match_count INTEGER DEFAULT 10,
    category_filter TEXT DEFAULT NULL,
    coin_filter VARCHAR(20) DEFAULT NULL,
    date_from DATE DEFAULT NULL,
    date_to DATE DEFAULT NULL,
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
    ai_summary TEXT,
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
        dc.ai_summary,
        (1 - (dc.embedding <=> query_embedding))::DECIMAL as similarity
    FROM document_chunks dc
    WHERE 
        (category_filter IS NULL OR dc.category_path LIKE category_filter || '%')
        AND (coin_filter IS NULL OR dc.coin_symbol = coin_filter)
        AND (date_from IS NULL OR dc.data_date >= date_from)
        AND (date_to IS NULL OR dc.data_date <= date_to)
        AND (1 - (dc.embedding <=> query_embedding)) >= min_similarity
    ORDER BY dc.embedding <=> query_embedding
    LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

-- Search daily summaries
CREATE OR REPLACE FUNCTION search_summaries(
    query_embedding vector(1024),
    match_count INTEGER DEFAULT 5,
    days_back INTEGER DEFAULT 30,
    coin_filter VARCHAR(20) DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    summary_date DATE,
    category_path TEXT,
    coin_symbol VARCHAR(20),
    title TEXT,
    summary TEXT,
    key_points TEXT[],
    ai_sentiment DECIMAL,
    ai_outlook VARCHAR(20),
    similarity DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ds.id,
        ds.summary_date,
        ds.category_path,
        ds.coin_symbol,
        ds.title,
        ds.summary,
        ds.key_points,
        ds.ai_sentiment,
        ds.ai_outlook,
        (1 - (ds.embedding <=> query_embedding))::DECIMAL as similarity
    FROM daily_summaries ds
    WHERE 
        ds.summary_date >= CURRENT_DATE - days_back
        AND (coin_filter IS NULL OR ds.coin_symbol = coin_filter)
    ORDER BY ds.embedding <=> query_embedding
    LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

-- Hybrid search (semantic + keyword)
CREATE OR REPLACE FUNCTION hybrid_search(
    query_embedding vector(1024),
    query_text TEXT,
    match_count INTEGER DEFAULT 10,
    semantic_weight DECIMAL DEFAULT 0.7
)
RETURNS TABLE (
    id UUID,
    content TEXT,
    category_path TEXT,
    coin_symbol VARCHAR(20),
    combined_score DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    WITH semantic AS (
        SELECT 
            dc.id,
            (1 - (dc.embedding <=> query_embedding)) as score
        FROM document_chunks dc
        ORDER BY dc.embedding <=> query_embedding
        LIMIT match_count * 2
    ),
    keyword AS (
        SELECT 
            dc.id,
            ts_rank(to_tsvector('english', dc.content), plainto_tsquery('english', query_text)) as score
        FROM document_chunks dc
        WHERE to_tsvector('english', dc.content) @@ plainto_tsquery('english', query_text)
        LIMIT match_count * 2
    ),
    combined AS (
        SELECT 
            COALESCE(s.id, k.id) as id,
            (COALESCE(s.score, 0) * semantic_weight + COALESCE(k.score, 0) * (1 - semantic_weight)) as score
        FROM semantic s
        FULL OUTER JOIN keyword k ON s.id = k.id
    )
    SELECT 
        c.id,
        dc.content,
        dc.category_path,
        dc.coin_symbol,
        c.score as combined_score
    FROM combined c
    JOIN document_chunks dc ON dc.id = c.id
    ORDER BY c.score DESC
    LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 6. AGGREGATION VIEWS
-- ============================================

-- Latest sentiment by coin
CREATE VIEW v_coin_sentiment_latest AS
SELECT DISTINCT ON (coin_symbol)
    coin_symbol,
    ai_sentiment,
    ai_sentiment_label,
    data_date,
    content_type
FROM document_chunks
WHERE coin_symbol IS NOT NULL
  AND ai_sentiment IS NOT NULL
ORDER BY coin_symbol, data_timestamp DESC;

-- Category statistics
CREATE VIEW v_category_stats AS
SELECT 
    dc.category_path,
    COUNT(*) as chunk_count,
    AVG(dc.ai_sentiment) as avg_sentiment,
    COUNT(DISTINCT dc.coin_symbol) as unique_coins,
    MAX(dc.data_timestamp) as latest_update
FROM data_categories cat
LEFT JOIN document_chunks dc ON dc.category_id = cat.id
GROUP BY dc.category_path;

-- ============================================
-- 7. MAINTENANCE FUNCTIONS
-- ============================================

-- Clean old chunks (keep last 90 days by default)
CREATE OR REPLACE FUNCTION cleanup_old_chunks(days_to_keep INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM document_chunks
    WHERE data_date < CURRENT_DATE - days_to_keep;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Update category paths (for consistency)
CREATE OR REPLACE FUNCTION update_category_paths()
RETURNS void AS $$
BEGIN
    UPDATE document_chunks dc
    SET category_path = cat.path
    FROM data_categories cat
    WHERE dc.category_id = cat.id
      AND (dc.category_path IS NULL OR dc.category_path != cat.path);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- DONE! Vector database ready for RAG.
-- ============================================
