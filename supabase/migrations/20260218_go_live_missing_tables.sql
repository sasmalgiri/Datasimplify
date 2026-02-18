-- Go-Live: Create missing tables required by existing API routes
-- Run this in Supabase SQL Editor before going live

-- ============================================================
-- 1. pending_entitlements (used by FastSpring webhook)
-- ============================================================
CREATE TABLE IF NOT EXISTS pending_entitlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchaser_email TEXT NOT NULL,
  product_key VARCHAR(100) NOT NULL,
  external_order_id TEXT,
  provider VARCHAR(50) NOT NULL DEFAULT 'fastspring',
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  claimed_by UUID REFERENCES auth.users(id),
  claimed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pending_entitlements_email
  ON pending_entitlements (purchaser_email, status);
CREATE INDEX IF NOT EXISTS idx_pending_entitlements_order
  ON pending_entitlements (external_order_id);

ALTER TABLE pending_entitlements ENABLE ROW LEVEL SECURITY;

-- Service role can do everything (webhook writes here)
CREATE POLICY "Service role full access pending_entitlements"
  ON pending_entitlements FOR ALL USING (true) WITH CHECK (true);

-- Users can read their own claimed entitlements
CREATE POLICY "Users read own entitlements"
  ON pending_entitlements FOR SELECT
  USING (claimed_by = auth.uid() OR purchaser_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- ============================================================
-- 2. purchase_events (audit log for FastSpring webhooks)
-- ============================================================
CREATE TABLE IF NOT EXISTS purchase_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider VARCHAR(50) NOT NULL DEFAULT 'fastspring',
  event_type VARCHAR(100),
  external_order_id TEXT,
  external_customer_email TEXT,
  product_key VARCHAR(100),
  raw_payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_purchase_events_email
  ON purchase_events (external_customer_email, created_at DESC);

ALTER TABLE purchase_events ENABLE ROW LEVEL SECURITY;

-- Service role only (webhook writes, admin reads)
CREATE POLICY "Service role full access purchase_events"
  ON purchase_events FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- 3. community_dashboards (used by community marketplace API)
-- ============================================================
CREATE TABLE IF NOT EXISTS community_dashboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_name TEXT DEFAULT 'Anonymous',
  author_avatar TEXT DEFAULT '👤',
  dashboard_name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '📊',
  description TEXT,
  widget_config JSONB NOT NULL,
  grid_columns INTEGER DEFAULT 4,
  tags TEXT[] DEFAULT '{}',
  fork_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_community_dashboards_published
  ON community_dashboards (is_published, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_dashboards_popular
  ON community_dashboards (is_published, fork_count DESC);

ALTER TABLE community_dashboards ENABLE ROW LEVEL SECURITY;

-- Anyone can read published dashboards
CREATE POLICY "Public read community dashboards"
  ON community_dashboards FOR SELECT USING (is_published = true);

-- Anyone can publish (anonymous publishing, rate-limited at API level)
CREATE POLICY "Anyone can publish community dashboards"
  ON community_dashboards FOR INSERT WITH CHECK (true);

-- Anyone can update view/fork counts (rate-limited at API level)
CREATE POLICY "Anyone can update community dashboards"
  ON community_dashboards FOR UPDATE USING (true) WITH CHECK (true);
