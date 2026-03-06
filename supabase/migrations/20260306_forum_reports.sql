-- Forum reports: moderation workflow for community content

CREATE TABLE IF NOT EXISTS forum_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  thread_id UUID REFERENCES forum_threads(id) ON DELETE CASCADE,
  reply_id UUID REFERENCES forum_replies(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (reason IN ('spam', 'scam', 'harassment', 'hate', 'copyright', 'privacy', 'misinformation', 'other')),
  details TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'reviewing', 'resolved', 'dismissed')),
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  review_notes TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT forum_reports_target_check CHECK (
    (thread_id IS NOT NULL AND reply_id IS NULL) OR
    (thread_id IS NULL AND reply_id IS NOT NULL)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_forum_reports_unique_thread
  ON forum_reports(reporter_user_id, thread_id)
  WHERE thread_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_forum_reports_unique_reply
  ON forum_reports(reporter_user_id, reply_id)
  WHERE reply_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_forum_reports_status ON forum_reports(status, created_at DESC);

ALTER TABLE forum_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users create own forum reports"
  ON forum_reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_user_id);

CREATE POLICY "Users read own forum reports"
  ON forum_reports FOR SELECT
  USING (auth.uid() = reporter_user_id);

CREATE POLICY "Service role full access forum reports"
  ON forum_reports FOR ALL
  USING (auth.role() = 'service_role');

CREATE OR REPLACE FUNCTION update_forum_report_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_forum_report_timestamp ON forum_reports;
CREATE TRIGGER set_forum_report_timestamp
  BEFORE UPDATE ON forum_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_forum_report_timestamp();