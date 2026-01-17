-- ============================================
-- FEEDBACK & TEMPLATE REQUESTS TABLES
-- ============================================
-- Migration for page feedback widget, template requests, and roadmap voting

-- 1. PAGE FEEDBACK TABLE
-- Stores "Was this helpful?" feedback from users
CREATE TABLE IF NOT EXISTS page_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Page info
  page_path TEXT NOT NULL,
  page_title TEXT,

  -- Feedback
  helpful BOOLEAN NOT NULL,
  reason TEXT, -- missing_metric, need_template, confusing, other
  message TEXT, -- Optional additional details (max 400 chars)

  -- Tracking
  ip TEXT,
  user_agent TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_page_feedback_page ON page_feedback(page_path);
CREATE INDEX IF NOT EXISTS idx_page_feedback_helpful ON page_feedback(helpful);
CREATE INDEX IF NOT EXISTS idx_page_feedback_created ON page_feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_feedback_reason ON page_feedback(reason) WHERE reason IS NOT NULL;

-- Enable RLS
ALTER TABLE page_feedback ENABLE ROW LEVEL SECURITY;

-- Anyone can insert feedback (anonymous allowed)
CREATE POLICY page_feedback_insert ON page_feedback
  FOR INSERT WITH CHECK (true);

-- Only admin can read (via service role key)
CREATE POLICY page_feedback_select ON page_feedback
  FOR SELECT USING (false);


-- 2. TEMPLATE REQUESTS TABLE
-- Stores requests for new Excel Report Kits
CREATE TABLE IF NOT EXISTS template_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Request info
  page_path TEXT,
  page_title TEXT,
  coins TEXT[], -- Array of coins mentioned
  report_type TEXT NOT NULL, -- watchlist, screener, correlation, etc.
  timeframe TEXT DEFAULT '1d', -- 1h, 4h, 1d, 1w, 1m
  purpose TEXT NOT NULL, -- research, tracking, study, reporting
  details TEXT, -- Additional details (max 400 chars)

  -- Voting
  votes_count INTEGER DEFAULT 1,

  -- Status for roadmap
  status TEXT DEFAULT 'pending', -- pending, planned, building, shipped

  -- Tracking
  ip TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_template_requests_status ON template_requests(status);
CREATE INDEX IF NOT EXISTS idx_template_requests_votes ON template_requests(votes_count DESC);
CREATE INDEX IF NOT EXISTS idx_template_requests_created ON template_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_template_requests_report_type ON template_requests(report_type);

-- Enable RLS
ALTER TABLE template_requests ENABLE ROW LEVEL SECURITY;

-- Anyone can insert requests
CREATE POLICY template_requests_insert ON template_requests
  FOR INSERT WITH CHECK (true);

-- Public can read requests (for roadmap page)
CREATE POLICY template_requests_select ON template_requests
  FOR SELECT USING (true);


-- 3. TEMPLATE REQUEST VOTES TABLE
-- Tracks who voted for what (prevents duplicate votes)
CREATE TABLE IF NOT EXISTS template_request_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES template_requests(id) ON DELETE CASCADE,

  -- Voter identification (IP for anonymous, user_id if logged in)
  ip TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint: one vote per IP or user per request
  UNIQUE(request_id, ip)
);

-- Index for checking existing votes
CREATE INDEX IF NOT EXISTS idx_template_request_votes_request ON template_request_votes(request_id);
CREATE INDEX IF NOT EXISTS idx_template_request_votes_ip ON template_request_votes(ip);

-- Enable RLS
ALTER TABLE template_request_votes ENABLE ROW LEVEL SECURITY;

-- Anyone can insert votes
CREATE POLICY template_request_votes_insert ON template_request_votes
  FOR INSERT WITH CHECK (true);

-- Only check own votes
CREATE POLICY template_request_votes_select ON template_request_votes
  FOR SELECT USING (true);


-- 4. RATE LIMITING TABLE
-- Tracks API request counts per IP for rate limiting
CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT NOW(),

  -- Unique per IP + endpoint combination
  UNIQUE(ip, endpoint)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_rate_limits_lookup ON rate_limits(ip, endpoint);

-- Enable RLS
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Allow all operations (server-side only via service role)
CREATE POLICY rate_limits_all ON rate_limits
  FOR ALL USING (true) WITH CHECK (true);


-- 5. FUNCTION: Increment vote count
CREATE OR REPLACE FUNCTION increment_template_request_votes()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE template_requests
  SET votes_count = votes_count + 1,
      updated_at = NOW()
  WHERE id = NEW.request_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for vote count
DROP TRIGGER IF EXISTS tr_increment_votes ON template_request_votes;
CREATE TRIGGER tr_increment_votes
AFTER INSERT ON template_request_votes
FOR EACH ROW EXECUTE FUNCTION increment_template_request_votes();


-- 6. FUNCTION: Check rate limit
-- Returns true if under limit, false if over limit
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_ip TEXT,
  p_endpoint TEXT,
  p_max_requests INTEGER DEFAULT 3,
  p_window_hours INTEGER DEFAULT 24
)
RETURNS BOOLEAN AS $$
DECLARE
  v_record rate_limits%ROWTYPE;
  v_window_start TIMESTAMPTZ;
BEGIN
  v_window_start := NOW() - (p_window_hours || ' hours')::INTERVAL;

  -- Get or create rate limit record
  SELECT * INTO v_record
  FROM rate_limits
  WHERE ip = p_ip AND endpoint = p_endpoint;

  IF NOT FOUND THEN
    -- First request, create record
    INSERT INTO rate_limits (ip, endpoint, request_count, window_start)
    VALUES (p_ip, p_endpoint, 1, NOW());
    RETURN true;
  END IF;

  -- Check if window has expired
  IF v_record.window_start < v_window_start THEN
    -- Reset window
    UPDATE rate_limits
    SET request_count = 1, window_start = NOW()
    WHERE ip = p_ip AND endpoint = p_endpoint;
    RETURN true;
  END IF;

  -- Check if under limit
  IF v_record.request_count >= p_max_requests THEN
    RETURN false;
  END IF;

  -- Increment count
  UPDATE rate_limits
  SET request_count = request_count + 1
  WHERE ip = p_ip AND endpoint = p_endpoint;

  RETURN true;
END;
$$ LANGUAGE plpgsql;
