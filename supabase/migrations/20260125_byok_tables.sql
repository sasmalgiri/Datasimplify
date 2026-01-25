-- ============================================
-- BYOK (Bring Your Own Keys) Database Schema
-- ============================================
-- This migration creates tables for the BYOK system:
-- - provider_keys: Encrypted API keys from users
-- - scheduled_exports: Scheduled Excel report generation
-- - subscription_state: Paddle subscription sync

-- ============================================
-- Provider API Keys (Encrypted)
-- ============================================
CREATE TABLE IF NOT EXISTS provider_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('coingecko', 'binance', 'coinmarketcap')),
  encrypted_key TEXT NOT NULL,
  key_hint TEXT, -- Last 4 chars for display (e.g., "••••Ab3d")
  is_valid BOOLEAN DEFAULT true,
  last_validated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

-- Index for fast user lookups
CREATE INDEX IF NOT EXISTS idx_provider_keys_user ON provider_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_provider_keys_provider ON provider_keys(provider);

-- ============================================
-- Report Recipes (Saved Configurations)
-- ============================================
CREATE TABLE IF NOT EXISTS report_recipes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  recipe_json JSONB NOT NULL, -- Full UserTemplateConfig
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_report_recipes_user ON report_recipes(user_id);

-- ============================================
-- Subscription State (Paddle Sync)
-- ============================================
-- Note: profiles table already exists with plan column
-- This table adds Paddle-specific subscription fields
CREATE TABLE IF NOT EXISTS subscription_state (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'premium')),
  paddle_subscription_id TEXT,
  paddle_customer_id TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'cancelled', 'paused', 'trialing')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscription_state_user ON subscription_state(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_state_paddle_sub ON subscription_state(paddle_subscription_id);

-- ============================================
-- Usage Events (Analytics & Rate Limiting)
-- ============================================
CREATE TABLE IF NOT EXISTS usage_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL, -- 'api_price', 'api_ohlcv', 'template_download', etc.
  metadata JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_usage_events_user ON usage_events(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_events_type ON usage_events(event_type);
CREATE INDEX IF NOT EXISTS idx_usage_events_created ON usage_events(created_at DESC);

-- ============================================
-- Scheduled Exports (Pro Feature)
-- ============================================
CREATE TABLE IF NOT EXISTS scheduled_exports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  recipe_id UUID REFERENCES report_recipes(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  cron_expression TEXT NOT NULL, -- e.g., "0 9 * * *" for 9am daily
  timezone TEXT DEFAULT 'UTC',
  delivery_method TEXT DEFAULT 'email' CHECK (delivery_method IN ('email', 'webhook', 'drive')),
  delivery_config JSONB DEFAULT '{}', -- { email: "user@example.com" } or { webhookUrl: "..." }
  is_active BOOLEAN DEFAULT true,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  last_error TEXT,
  run_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scheduled_exports_user ON scheduled_exports(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_exports_next_run ON scheduled_exports(next_run_at) WHERE is_active = true;

-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS on all tables
ALTER TABLE provider_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_exports ENABLE ROW LEVEL SECURITY;

-- Provider Keys: Users can only manage their own keys
CREATE POLICY "Users can manage own provider_keys"
  ON provider_keys FOR ALL
  USING (auth.uid() = user_id);

-- Report Recipes: Users can only manage their own recipes
CREATE POLICY "Users can manage own report_recipes"
  ON report_recipes FOR ALL
  USING (auth.uid() = user_id);

-- Subscription State: Users can view their own subscription
CREATE POLICY "Users can view own subscription_state"
  ON subscription_state FOR SELECT
  USING (auth.uid() = user_id);

-- Usage Events: Users can view their own events
CREATE POLICY "Users can view own usage_events"
  ON usage_events FOR SELECT
  USING (auth.uid() = user_id);

-- Scheduled Exports: Users can manage their own schedules
CREATE POLICY "Users can manage own scheduled_exports"
  ON scheduled_exports FOR ALL
  USING (auth.uid() = user_id);

-- ============================================
-- Functions for Maintenance
-- ============================================

-- Function to calculate next run time for scheduled exports
CREATE OR REPLACE FUNCTION calculate_next_run(cron_expr TEXT, tz TEXT DEFAULT 'UTC')
RETURNS TIMESTAMPTZ AS $$
BEGIN
  -- This is a placeholder - in production, use a cron parser library
  -- For now, we'll implement simple daily schedules in the application layer
  RETURN NOW() + INTERVAL '1 day';
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup old usage events (keep last 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_usage_events()
RETURNS void AS $$
BEGIN
  DELETE FROM usage_events
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Default Data
-- ============================================

-- Insert default free plan limits for existing users who don't have subscription_state
INSERT INTO subscription_state (user_id, plan, status)
SELECT
  id,
  COALESCE(plan, 'free'),
  'active'
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM subscription_state)
ON CONFLICT (user_id) DO NOTHING;

-- ============================================
-- Grants
-- ============================================

-- Grant access to authenticated users
GRANT ALL ON provider_keys TO authenticated;
GRANT ALL ON report_recipes TO authenticated;
GRANT SELECT ON subscription_state TO authenticated;
GRANT SELECT ON usage_events TO authenticated;
GRANT ALL ON scheduled_exports TO authenticated;

-- Grant service role full access for cron jobs
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

COMMENT ON TABLE provider_keys IS 'Encrypted API keys from data providers (CoinGecko, Binance, etc.) - BYOK model';
COMMENT ON TABLE report_recipes IS 'Saved Excel template configurations for quick regeneration';
COMMENT ON TABLE subscription_state IS 'Paddle subscription sync and plan entitlements';
COMMENT ON TABLE usage_events IS 'API usage tracking for rate limiting and analytics';
COMMENT ON TABLE scheduled_exports IS 'Scheduled Excel report generation and delivery (Pro feature)';
