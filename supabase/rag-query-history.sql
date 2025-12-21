-- ============================================
-- RAG QUERY HISTORY TABLE
-- Track user queries for personalization & analytics
-- ============================================
-- Run this in Supabase SQL Editor
-- Rolling 30-day retention (cleaned by dbCleanup.ts)

-- Create table for query history
CREATE TABLE IF NOT EXISTS rag_query_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

    -- User info (optional - for personalization)
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id TEXT, -- For anonymous session tracking

    -- Query details
    query TEXT NOT NULL,
    query_type TEXT, -- 'general', 'comparison', 'scenario', 'prediction', 'education'

    -- Response metadata
    data_used TEXT[], -- Array of data sources used
    confidence TEXT, -- 'high', 'medium', 'low'
    user_level TEXT, -- 'beginner', 'intermediate', 'pro'
    tokens_used INTEGER,

    -- Coins mentioned
    coins_mentioned TEXT[],

    -- User feedback
    was_helpful BOOLEAN,
    feedback_text TEXT,

    -- Context at query time
    market_session TEXT, -- 'us_hours', 'asian_session', etc.
    fear_greed_at_query INTEGER,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    response_time_ms INTEGER
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_rag_history_user_id
ON rag_query_history(user_id);

CREATE INDEX IF NOT EXISTS idx_rag_history_created_at
ON rag_query_history(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_rag_history_query_type
ON rag_query_history(query_type);

CREATE INDEX IF NOT EXISTS idx_rag_history_session
ON rag_query_history(session_id);

-- View for user's recent queries
CREATE OR REPLACE VIEW v_user_recent_queries AS
SELECT
    user_id,
    query,
    query_type,
    confidence,
    was_helpful,
    created_at
FROM rag_query_history
WHERE created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;

-- View for popular queries (for suggestions)
CREATE OR REPLACE VIEW v_popular_queries AS
SELECT
    query_type,
    coins_mentioned,
    COUNT(*) as query_count,
    AVG(CASE WHEN was_helpful THEN 1 ELSE 0 END) as helpfulness_rate
FROM rag_query_history
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY query_type, coins_mentioned
HAVING COUNT(*) >= 5
ORDER BY query_count DESC;

-- Function to clean old history (called by sync cleanup)
CREATE OR REPLACE FUNCTION cleanup_old_rag_history(days_to_keep INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM rag_query_history
    WHERE created_at < NOW() - (days_to_keep || ' days')::INTERVAL;

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's frequently asked topics
CREATE OR REPLACE FUNCTION get_user_topics(p_user_id UUID, p_days INTEGER DEFAULT 30)
RETURNS TABLE(
    topic TEXT,
    query_count BIGINT,
    last_asked TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        unnest(coins_mentioned) as topic,
        COUNT(*) as query_count,
        MAX(created_at) as last_asked
    FROM rag_query_history
    WHERE user_id = p_user_id
      AND created_at > NOW() - (p_days || ' days')::INTERVAL
    GROUP BY unnest(coins_mentioned)
    ORDER BY query_count DESC
    LIMIT 10;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies (if needed)
-- ALTER TABLE rag_query_history ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Users can view own history" ON rag_query_history
--     FOR SELECT USING (auth.uid() = user_id);
-- CREATE POLICY "Users can insert own history" ON rag_query_history
--     FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- DONE! Run this SQL in Supabase Dashboard
-- ============================================
