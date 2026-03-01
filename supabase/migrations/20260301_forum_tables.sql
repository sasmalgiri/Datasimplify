-- ============================================================
-- Forum tables for Community Forum feature
-- Run in Supabase SQL Editor to create tables, indexes,
-- triggers, RPC function, and RLS policies.
-- ============================================================

-- 1. forum_threads
CREATE TABLE IF NOT EXISTS forum_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  likes INTEGER NOT NULL DEFAULT 0,
  dislikes INTEGER NOT NULL DEFAULT 0,
  reply_count INTEGER NOT NULL DEFAULT 0,
  view_count INTEGER NOT NULL DEFAULT 0,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  is_locked BOOLEAN NOT NULL DEFAULT false,
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_forum_threads_category
  ON forum_threads(category, is_pinned DESC, last_activity_at DESC);
CREATE INDEX IF NOT EXISTS idx_forum_threads_user
  ON forum_threads(user_id);
CREATE INDEX IF NOT EXISTS idx_forum_threads_created
  ON forum_threads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_forum_threads_activity
  ON forum_threads(last_activity_at DESC);

ALTER TABLE forum_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read forum threads"
  ON forum_threads FOR SELECT USING (true);
CREATE POLICY "Authenticated users create threads"
  ON forum_threads FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own threads"
  ON forum_threads FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Service role full access forum threads"
  ON forum_threads FOR ALL USING (auth.role() = 'service_role');

-- 2. forum_replies
CREATE TABLE IF NOT EXISTS forum_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES forum_threads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  likes INTEGER NOT NULL DEFAULT 0,
  dislikes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_forum_replies_thread
  ON forum_replies(thread_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_forum_replies_user
  ON forum_replies(user_id);

ALTER TABLE forum_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read forum replies"
  ON forum_replies FOR SELECT USING (true);
CREATE POLICY "Authenticated users create replies"
  ON forum_replies FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own replies"
  ON forum_replies FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Service role full access forum replies"
  ON forum_replies FOR ALL USING (auth.role() = 'service_role');

-- 3. forum_thread_votes (unified for threads + replies)
CREATE TABLE IF NOT EXISTS forum_thread_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  thread_id UUID REFERENCES forum_threads(id) ON DELETE CASCADE,
  reply_id UUID REFERENCES forum_replies(id) ON DELETE CASCADE,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('like', 'dislike')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT vote_target_check CHECK (
    (thread_id IS NOT NULL AND reply_id IS NULL) OR
    (thread_id IS NULL AND reply_id IS NOT NULL)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_forum_votes_unique_thread
  ON forum_thread_votes(user_id, thread_id) WHERE thread_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_forum_votes_unique_reply
  ON forum_thread_votes(user_id, reply_id) WHERE reply_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_forum_votes_thread
  ON forum_thread_votes(thread_id) WHERE thread_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_forum_votes_reply
  ON forum_thread_votes(reply_id) WHERE reply_id IS NOT NULL;

ALTER TABLE forum_thread_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read forum votes"
  ON forum_thread_votes FOR SELECT USING (true);
CREATE POLICY "Authenticated users create votes"
  ON forum_thread_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own votes"
  ON forum_thread_votes FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users update own votes"
  ON forum_thread_votes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Service role full access forum votes"
  ON forum_thread_votes FOR ALL USING (auth.role() = 'service_role');

-- 4. Trigger: auto-update reply_count + last_activity_at
CREATE OR REPLACE FUNCTION update_thread_on_reply()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE forum_threads
    SET reply_count = reply_count + 1,
        last_activity_at = NEW.created_at,
        updated_at = now()
    WHERE id = NEW.thread_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE forum_threads
    SET reply_count = GREATEST(0, reply_count - 1),
        updated_at = now()
    WHERE id = OLD.thread_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_thread_on_reply
  AFTER INSERT OR DELETE ON forum_replies
  FOR EACH ROW
  EXECUTE FUNCTION update_thread_on_reply();

-- 5. Trigger: auto-update vote counts
CREATE OR REPLACE FUNCTION update_forum_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF COALESCE(NEW.thread_id, OLD.thread_id) IS NOT NULL THEN
    UPDATE forum_threads SET
      likes = (SELECT COUNT(*) FROM forum_thread_votes
               WHERE thread_id = COALESCE(NEW.thread_id, OLD.thread_id) AND vote_type = 'like'),
      dislikes = (SELECT COUNT(*) FROM forum_thread_votes
                  WHERE thread_id = COALESCE(NEW.thread_id, OLD.thread_id) AND vote_type = 'dislike')
    WHERE id = COALESCE(NEW.thread_id, OLD.thread_id);
  END IF;

  IF COALESCE(NEW.reply_id, OLD.reply_id) IS NOT NULL THEN
    UPDATE forum_replies SET
      likes = (SELECT COUNT(*) FROM forum_thread_votes
               WHERE reply_id = COALESCE(NEW.reply_id, OLD.reply_id) AND vote_type = 'like'),
      dislikes = (SELECT COUNT(*) FROM forum_thread_votes
                  WHERE reply_id = COALESCE(NEW.reply_id, OLD.reply_id) AND vote_type = 'dislike')
    WHERE id = COALESCE(NEW.reply_id, OLD.reply_id);
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_forum_vote_counts
  AFTER INSERT OR UPDATE OR DELETE ON forum_thread_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_forum_vote_counts();

-- 6. RPC: atomic view count increment
CREATE OR REPLACE FUNCTION increment_thread_views(p_thread_id UUID)
RETURNS void AS $$
  UPDATE forum_threads
  SET view_count = view_count + 1
  WHERE id = p_thread_id;
$$ LANGUAGE SQL SECURITY DEFINER;
