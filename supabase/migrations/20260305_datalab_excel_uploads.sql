-- DataLab Excel Uploads: stores parsed Excel data uploaded by users
-- Users can download Excel from CRK, customize it, and upload back to display online

CREATE TABLE IF NOT EXISTS datalab_excel_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  sheet_name TEXT NOT NULL,
  columns JSONB NOT NULL DEFAULT '[]',      -- [{key, label, source}]
  data JSONB NOT NULL DEFAULT '[]',         -- [{date, col1, col2, ...}]
  row_count INTEGER NOT NULL DEFAULT 0,
  coin TEXT,                                 -- original coin if from DataLab export
  days INTEGER,                              -- original days range
  preset TEXT,                               -- original preset name
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_excel_uploads_user ON datalab_excel_uploads(user_id);
CREATE INDEX idx_excel_uploads_active ON datalab_excel_uploads(user_id, is_active);

-- RLS
ALTER TABLE datalab_excel_uploads ENABLE ROW LEVEL SECURITY;

-- Users can read their own uploads
CREATE POLICY "Users read own uploads"
  ON datalab_excel_uploads FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own uploads
CREATE POLICY "Users insert own uploads"
  ON datalab_excel_uploads FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own uploads
CREATE POLICY "Users update own uploads"
  ON datalab_excel_uploads FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own uploads
CREATE POLICY "Users delete own uploads"
  ON datalab_excel_uploads FOR DELETE
  USING (auth.uid() = user_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_excel_upload_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_excel_upload_timestamp
  BEFORE UPDATE ON datalab_excel_uploads
  FOR EACH ROW
  EXECUTE FUNCTION update_excel_upload_timestamp();
