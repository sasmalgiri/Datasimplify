-- ============================================
-- USER USAGE TRACKING TABLE
-- Track daily token/query usage per user
-- ============================================
-- Run this in Supabase SQL Editor

-- Daily usage table
CREATE TABLE IF NOT EXISTS user_daily_usage (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    tokens_used INTEGER DEFAULT 0,
    queries_count INTEGER DEFAULT 0,
    estimated_cost_usd DECIMAL(10, 6) DEFAULT 0,
    providers JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(user_id, date)
);

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS idx_user_usage_user_date
ON user_daily_usage(user_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_user_usage_date
ON user_daily_usage(date DESC);

-- ============================================
-- PRICE ALERTS TABLE (for chat-generated alerts)
-- ============================================

CREATE TABLE IF NOT EXISTS price_alerts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Alert configuration
    coin_id TEXT NOT NULL,
    coin_symbol TEXT NOT NULL,
    alert_type TEXT NOT NULL, -- 'price_above', 'price_below', 'percent_change', 'volume_spike'
    threshold DECIMAL(20, 8) NOT NULL,
    unit TEXT DEFAULT 'usd', -- 'usd' or 'percent'

    -- Context
    current_price_at_creation DECIMAL(20, 8),

    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    triggered_at TIMESTAMP WITH TIME ZONE,
    triggered_price DECIMAL(20, 8),

    -- Metadata
    created_from TEXT DEFAULT 'manual', -- 'manual', 'chat', 'api'
    original_query TEXT,
    notification_sent BOOLEAN DEFAULT FALSE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for price alerts
CREATE INDEX IF NOT EXISTS idx_alerts_user_id
ON price_alerts(user_id);

CREATE INDEX IF NOT EXISTS idx_alerts_active
ON price_alerts(is_active, coin_symbol);

CREATE INDEX IF NOT EXISTS idx_alerts_coin
ON price_alerts(coin_id, is_active);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to update usage
CREATE OR REPLACE FUNCTION upsert_daily_usage(
    p_user_id UUID,
    p_tokens INTEGER,
    p_provider TEXT
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO user_daily_usage (user_id, date, tokens_used, queries_count, providers)
    VALUES (
        p_user_id,
        CURRENT_DATE,
        p_tokens,
        1,
        jsonb_build_object(p_provider, p_tokens)
    )
    ON CONFLICT (user_id, date)
    DO UPDATE SET
        tokens_used = user_daily_usage.tokens_used + p_tokens,
        queries_count = user_daily_usage.queries_count + 1,
        providers = user_daily_usage.providers ||
            jsonb_build_object(p_provider,
                COALESCE((user_daily_usage.providers->>p_provider)::INTEGER, 0) + p_tokens
            ),
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to get user's monthly usage
CREATE OR REPLACE FUNCTION get_monthly_usage(p_user_id UUID)
RETURNS TABLE(
    total_tokens BIGINT,
    total_queries BIGINT,
    total_cost DECIMAL,
    days_active BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COALESCE(SUM(tokens_used), 0)::BIGINT,
        COALESCE(SUM(queries_count), 0)::BIGINT,
        COALESCE(SUM(estimated_cost_usd), 0),
        COUNT(DISTINCT date)::BIGINT
    FROM user_daily_usage
    WHERE user_id = p_user_id
      AND date >= DATE_TRUNC('month', CURRENT_DATE);
END;
$$ LANGUAGE plpgsql;

-- Function to check active alerts for a coin
CREATE OR REPLACE FUNCTION get_triggered_alerts(
    p_coin_symbol TEXT,
    p_current_price DECIMAL
)
RETURNS TABLE(
    alert_id UUID,
    user_id UUID,
    alert_type TEXT,
    threshold DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        pa.id,
        pa.user_id,
        pa.alert_type,
        pa.threshold
    FROM price_alerts pa
    WHERE pa.is_active = TRUE
      AND pa.coin_symbol = p_coin_symbol
      AND pa.triggered_at IS NULL
      AND (
          (pa.alert_type = 'price_above' AND p_current_price >= pa.threshold)
          OR (pa.alert_type = 'price_below' AND p_current_price <= pa.threshold)
      );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- RLS POLICIES
-- ============================================

-- Enable RLS
ALTER TABLE user_daily_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_alerts ENABLE ROW LEVEL SECURITY;

-- Users can only view their own usage
CREATE POLICY "Users view own usage" ON user_daily_usage
    FOR SELECT USING (auth.uid() = user_id);

-- Users can manage their own alerts
CREATE POLICY "Users view own alerts" ON price_alerts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users create own alerts" ON price_alerts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own alerts" ON price_alerts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users delete own alerts" ON price_alerts
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- DONE!
-- ============================================
