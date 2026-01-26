-- ============================================
-- Add key_type column to provider_keys
-- ============================================
-- This distinguishes between demo and pro API keys
-- for providers like CoinGecko that have different endpoints

ALTER TABLE provider_keys
ADD COLUMN IF NOT EXISTS key_type TEXT DEFAULT 'demo'
CHECK (key_type IN ('demo', 'pro'));

-- Add comment
COMMENT ON COLUMN provider_keys.key_type IS 'Type of API key (demo or pro) - determines which endpoint to use';

-- ============================================
-- Fix usage_events permissions
-- ============================================
-- The original migration only granted SELECT, but API needs to INSERT usage events

-- Grant INSERT permission to authenticated users
GRANT INSERT ON usage_events TO authenticated;

-- Add INSERT policy so users can insert their own events
DROP POLICY IF EXISTS "Users can insert own usage_events" ON usage_events;
CREATE POLICY "Users can insert own usage_events"
  ON usage_events FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
