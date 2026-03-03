-- ============================================================
-- Blog posts table for AI-generated blog content
-- Run in Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  keywords TEXT[] NOT NULL DEFAULT '{}',
  publish_date DATE NOT NULL DEFAULT CURRENT_DATE,
  updated_date DATE,
  author TEXT NOT NULL DEFAULT 'CryptoReportKit Team',
  category TEXT NOT NULL,
  reading_time_minutes INTEGER NOT NULL DEFAULT 5,
  cover_emoji TEXT NOT NULL DEFAULT '📰',
  excerpt TEXT NOT NULL,
  sections JSONB NOT NULL DEFAULT '[]',
  related_posts TEXT[] DEFAULT '{}',
  cta_href TEXT NOT NULL DEFAULT '/blog',
  cta_label TEXT NOT NULL DEFAULT 'Read More Articles',
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts(category);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published
  ON blog_posts(is_published, publish_date DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_date ON blog_posts(publish_date DESC);

-- RLS
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read published blog posts"
  ON blog_posts FOR SELECT USING (is_published = true);

CREATE POLICY "Service role full access blog posts"
  ON blog_posts FOR ALL USING (auth.role() = 'service_role');

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_blog_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_blog_posts_updated_at
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_blog_posts_updated_at();
