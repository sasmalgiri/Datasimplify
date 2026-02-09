-- Price Alerts table (if not already created via full-schema.sql)
CREATE TABLE IF NOT EXISTS price_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    coin_id TEXT NOT NULL,
    alert_type TEXT NOT NULL CHECK (alert_type IN ('above', 'below')),
    threshold DECIMAL(20, 8) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    triggered_at TIMESTAMP WITH TIME ZONE,
    notification_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS policies for price_alerts
ALTER TABLE price_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own alerts" ON price_alerts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own alerts" ON price_alerts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own alerts" ON price_alerts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own alerts" ON price_alerts
    FOR DELETE USING (auth.uid() = user_id);

-- Index for alert check queries
CREATE INDEX IF NOT EXISTS idx_price_alerts_active ON price_alerts (is_active, triggered_at)
    WHERE is_active = TRUE AND triggered_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_price_alerts_user ON price_alerts (user_id, is_active);
