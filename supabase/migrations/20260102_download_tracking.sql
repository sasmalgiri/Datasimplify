-- Download tracking tables for email-based and anonymous downloads
-- Keeps server routes truthful: downloads are logged in Supabase when configured.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Simple free-user table used by the email capture flow (no Supabase auth required)
CREATE TABLE IF NOT EXISTS free_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  downloads_this_month INTEGER DEFAULT 0,
  total_downloads INTEGER DEFAULT 0,
  last_download_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_free_users_email ON free_users(email);

-- Email-based download log (used by /api/user/track-download)
CREATE TABLE IF NOT EXISTS download_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_email TEXT NOT NULL,
  download_type TEXT,
  file_name TEXT,
  downloaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_download_logs_email ON download_logs(user_email);
CREATE INDEX IF NOT EXISTS idx_download_logs_time ON download_logs(downloaded_at DESC);

-- Universal download event log (covers /api/download and other server-side exports)
CREATE TABLE IF NOT EXISTS download_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  user_email TEXT,
  category TEXT NOT NULL,
  format TEXT NOT NULL,
  file_name TEXT,
  row_count INTEGER,
  filters JSONB,
  ip TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_download_events_time ON download_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_download_events_category ON download_events(category);
CREATE INDEX IF NOT EXISTS idx_download_events_user_id ON download_events(user_id);
CREATE INDEX IF NOT EXISTS idx_download_events_user_email ON download_events(user_email);
