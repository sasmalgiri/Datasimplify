-- ============================================
-- DAILY SUMMARIES TABLE
-- AI-generated daily market summaries
-- ============================================
-- Run this in Supabase SQL Editor
-- Rolling 7-day retention (cleaned by dbCleanup.ts)

-- Create table for daily AI summaries
CREATE TABLE IF NOT EXISTS daily_summaries (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

    -- Date and category
    summary_date DATE NOT NULL,
    category TEXT NOT NULL, -- 'market', 'defi', 'whales', 'sentiment'

    -- AI-generated content
    summary TEXT NOT NULL,
    key_points TEXT[], -- Array of bullet points

    -- Sentiment analysis
    sentiment_score DECIMAL(5, 4), -- -1 to 1
    sentiment_label TEXT, -- 'bullish', 'bearish', 'neutral'

    -- Optional metrics snapshot
    metrics JSONB DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Ensure one summary per category per day
    UNIQUE(summary_date, category)
);

-- Index for fast queries
CREATE INDEX IF NOT EXISTS idx_daily_summaries_date
ON daily_summaries(summary_date DESC);

CREATE INDEX IF NOT EXISTS idx_daily_summaries_category
ON daily_summaries(category);

-- View for latest summaries (one per category)
CREATE OR REPLACE VIEW v_latest_summaries AS
SELECT DISTINCT ON (category)
    id,
    summary_date,
    category,
    summary,
    key_points,
    sentiment_score,
    sentiment_label,
    metrics,
    created_at
FROM daily_summaries
ORDER BY category, summary_date DESC;

-- Function to clean old summaries (called by sync cleanup)
CREATE OR REPLACE FUNCTION cleanup_old_summaries(days_to_keep INTEGER DEFAULT 7)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM daily_summaries
    WHERE summary_date < CURRENT_DATE - days_to_keep;

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions (adjust as needed)
-- ALTER TABLE daily_summaries ENABLE ROW LEVEL SECURITY;

-- ============================================
-- DONE! Run this SQL in Supabase Dashboard
-- ============================================
