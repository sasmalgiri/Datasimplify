-- BYOK (Bring Your Own Keys) Tables Migration
-- Adds support for user-provided API keys and scheduled exports

-- Provider API Keys (encrypted)
CREATE TABLE IF NOT EXISTS provider_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('coingecko', 'binance', 'coinmarketcap', 'messari')),
  encrypted_key TEXT NOT NULL,
  key_hint TEXT, -- Last 4 chars for display
  is_valid BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

-- Report Recipes (saved configurations)
CREATE TABLE IF NOT EXISTS report_recipes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  recipe_json JSONB NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscription State (synced from FastSpring)
-- Note: profiles table already exists with plan column
-- This table adds payment-provider fields for detailed tracking
CREATE TABLE IF NOT EXISTS subscription_state (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'premium')),
  payment_subscription_id TEXT,
  payment_customer_id TEXT,
  payment_provider TEXT DEFAULT 'fastspring',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'cancelled', 'paused', 'trialing')),
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Usage Events (for analytics & rate limiting)
CREATE TABLE IF NOT EXISTS usage_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scheduled Exports (Pro feature)
CREATE TABLE IF NOT EXISTS scheduled_exports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  recipe_id UUID REFERENCES report_recipes(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  cron_expression TEXT NOT NULL, -- e.g., "0 9 * * *" for 9am daily
  timezone TEXT DEFAULT 'UTC',
  delivery_method TEXT DEFAULT 'email' CHECK (delivery_method IN ('email', 'webhook', 'drive')),
  delivery_config JSONB DEFAULT '{}', -- email address, webhook URL, etc.
  is_active BOOLEAN DEFAULT true,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_provider_keys_user ON provider_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_provider_keys_provider ON provider_keys(provider);
CREATE INDEX IF NOT EXISTS idx_report_recipes_user ON report_recipes(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_events_user ON usage_events(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_events_created ON usage_events(created_at);
CREATE INDEX IF NOT EXISTS idx_usage_events_type ON usage_events(event_type);
CREATE INDEX IF NOT EXISTS idx_scheduled_exports_user ON scheduled_exports(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_exports_next_run ON scheduled_exports(next_run_at) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_subscription_state_user ON subscription_state(user_id);

-- Enable Row Level Security
ALTER TABLE provider_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_exports ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own data

-- Provider Keys
DROP POLICY IF EXISTS "Users can view own provider_keys" ON provider_keys;
CREATE POLICY "Users can view own provider_keys"
  ON provider_keys FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own provider_keys" ON provider_keys;
CREATE POLICY "Users can insert own provider_keys"
  ON provider_keys FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own provider_keys" ON provider_keys;
CREATE POLICY "Users can update own provider_keys"
  ON provider_keys FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own provider_keys" ON provider_keys;
CREATE POLICY "Users can delete own provider_keys"
  ON provider_keys FOR DELETE
  USING (auth.uid() = user_id);

-- Report Recipes
DROP POLICY IF EXISTS "Users can view own report_recipes" ON report_recipes;
CREATE POLICY "Users can view own report_recipes"
  ON report_recipes FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own report_recipes" ON report_recipes;
CREATE POLICY "Users can insert own report_recipes"
  ON report_recipes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own report_recipes" ON report_recipes;
CREATE POLICY "Users can update own report_recipes"
  ON report_recipes FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own report_recipes" ON report_recipes;
CREATE POLICY "Users can delete own report_recipes"
  ON report_recipes FOR DELETE
  USING (auth.uid() = user_id);

-- Subscription State (read-only for users, service role can update)
DROP POLICY IF EXISTS "Users can view own subscription_state" ON subscription_state;
CREATE POLICY "Users can view own subscription_state"
  ON subscription_state FOR SELECT
  USING (auth.uid() = user_id);

-- Usage Events (read-only for users)
DROP POLICY IF EXISTS "Users can view own usage_events" ON usage_events;
CREATE POLICY "Users can view own usage_events"
  ON usage_events FOR SELECT
  USING (auth.uid() = user_id);

-- Allow service role to insert usage events (for API logging)
DROP POLICY IF EXISTS "Service can insert usage_events" ON usage_events;
CREATE POLICY "Service can insert usage_events"
  ON usage_events FOR INSERT
  WITH CHECK (true);

-- Scheduled Exports
DROP POLICY IF EXISTS "Users can view own scheduled_exports" ON scheduled_exports;
CREATE POLICY "Users can view own scheduled_exports"
  ON scheduled_exports FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own scheduled_exports" ON scheduled_exports;
CREATE POLICY "Users can insert own scheduled_exports"
  ON scheduled_exports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own scheduled_exports" ON scheduled_exports;
CREATE POLICY "Users can update own scheduled_exports"
  ON scheduled_exports FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own scheduled_exports" ON scheduled_exports;
CREATE POLICY "Users can delete own scheduled_exports"
  ON scheduled_exports FOR DELETE
  USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_provider_keys_updated_at ON provider_keys;
CREATE TRIGGER update_provider_keys_updated_at
  BEFORE UPDATE ON provider_keys
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_report_recipes_updated_at ON report_recipes;
CREATE TRIGGER update_report_recipes_updated_at
  BEFORE UPDATE ON report_recipes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subscription_state_updated_at ON subscription_state;
CREATE TRIGGER update_subscription_state_updated_at
  BEFORE UPDATE ON subscription_state
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_scheduled_exports_updated_at ON scheduled_exports;
CREATE TRIGGER update_scheduled_exports_updated_at
  BEFORE UPDATE ON scheduled_exports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
