-- Template Releases table for downloads page
CREATE TABLE IF NOT EXISTS public.template_releases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  required_product_key TEXT, -- NULL for free releases
  version TEXT NOT NULL,
  is_latest BOOLEAN DEFAULT true,
  published_at TIMESTAMPTZ DEFAULT NOW(),
  file_name TEXT NOT NULL,
  content_type TEXT NOT NULL,
  download_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product Entitlements table (if not exists)
CREATE TABLE IF NOT EXISTS public.product_entitlements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_key TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked')),
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  UNIQUE(user_id, product_key)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_template_releases_slug ON public.template_releases(slug);
CREATE INDEX IF NOT EXISTS idx_template_releases_latest ON public.template_releases(is_latest) WHERE is_latest = true;
CREATE INDEX IF NOT EXISTS idx_product_entitlements_user ON public.product_entitlements(user_id);
CREATE INDEX IF NOT EXISTS idx_product_entitlements_status ON public.product_entitlements(status) WHERE status = 'active';

-- RLS Policies
ALTER TABLE public.template_releases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_entitlements ENABLE ROW LEVEL SECURITY;

-- Everyone can view releases
CREATE POLICY "Anyone can view template releases"
  ON public.template_releases FOR SELECT
  USING (true);

-- Users can only see their own entitlements
CREATE POLICY "Users can view own entitlements"
  ON public.product_entitlements FOR SELECT
  USING (auth.uid() = user_id);

-- Add some sample free releases (optional)
INSERT INTO public.template_releases (slug, title, description, required_product_key, version, file_name, content_type)
VALUES
  ('crypto-dashboard-v1', 'Crypto Dashboard Template', 'Free crypto dashboard with live price tracking', NULL, '1.0.0', 'crypto-dashboard-v1.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'),
  ('bitcoin-tracker-v1', 'Bitcoin Tracker Template', 'Track Bitcoin price and metrics', NULL, '1.0.0', 'bitcoin-tracker-v1.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
ON CONFLICT (slug) DO NOTHING;
