-- Seed: Template releases (downloads catalog)
-- Upload files into Supabase Storage bucket `crk-downloads` first, then run these inserts.
--
-- Suggested storage paths:
-- - power-query/free/PowerQuery_Free.pq
-- - power-query/pro/PowerQuery_Pro.pq

-- Mark all previous releases as not-latest (optional)
-- UPDATE template_releases SET is_latest = false;

INSERT INTO template_releases (
  slug,
  title,
  description,
  required_product_key,
  storage_bucket,
  storage_path,
  file_name,
  content_type,
  version,
  is_latest
) VALUES
(
  'power-query-free',
  'Power Query (Free)',
  'Top 10 coins starter query (BYOK).',
  NULL,
  'crk-downloads',
  'power-query/free/PowerQuery_Free.pq',
  'PowerQuery_Free.pq',
  'text/plain',
  '1.0.0',
  true
),
(
  'power-query-pro',
  'Power Query (Pro)',
  'Top 100 coins + pro workflows (BYOK).',
  'power_query_pro',
  'crk-downloads',
  'power-query/pro/PowerQuery_Pro.pq',
  'PowerQuery_Pro.pq',
  'text/plain',
  '1.0.0',
  true
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  required_product_key = EXCLUDED.required_product_key,
  storage_bucket = EXCLUDED.storage_bucket,
  storage_path = EXCLUDED.storage_path,
  file_name = EXCLUDED.file_name,
  content_type = EXCLUDED.content_type,
  version = EXCLUDED.version,
  is_latest = EXCLUDED.is_latest,
  published_at = NOW();
