-- Security Events Table
-- Logs all security-related events for monitoring and abuse detection

CREATE TABLE IF NOT EXISTS security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  email TEXT,
  user_id UUID,
  details JSONB DEFAULT '{}',
  severity TEXT DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON security_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_ip ON security_events(ip_address);
CREATE INDEX IF NOT EXISTS idx_security_events_email ON security_events(email);
CREATE INDEX IF NOT EXISTS idx_security_events_type ON security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON security_events(severity);

-- Composite index for abuse detection queries
CREATE INDEX IF NOT EXISTS idx_security_events_ip_type_time
  ON security_events(ip_address, event_type, created_at DESC);

-- Function to get top IPs by event count (for abuse detection)
CREATE OR REPLACE FUNCTION get_top_ips_by_events(since_time TIMESTAMPTZ, limit_count INT)
RETURNS TABLE(ip TEXT, count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ip_address AS ip,
    COUNT(*) AS count
  FROM security_events
  WHERE created_at >= since_time
    AND ip_address IS NOT NULL
  GROUP BY ip_address
  ORDER BY count DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Auto-cleanup: Delete events older than 90 days
-- Run this periodically via Supabase scheduled function or cron
CREATE OR REPLACE FUNCTION cleanup_old_security_events()
RETURNS void AS $$
BEGIN
  DELETE FROM security_events
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Row Level Security
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;

-- Only service role can access security events (not public)
CREATE POLICY "Service role only" ON security_events
  FOR ALL
  USING (false)
  WITH CHECK (false);

-- Grant insert to service role (for logging from API)
-- Note: Service role bypasses RLS by default

COMMENT ON TABLE security_events IS 'Security audit log for monitoring and abuse detection';
COMMENT ON COLUMN security_events.event_type IS 'Type of security event (registration_attempt, download_blocked, etc.)';
COMMENT ON COLUMN security_events.severity IS 'Event severity: low, medium, high, critical';
COMMENT ON COLUMN security_events.details IS 'Additional JSON details about the event';
