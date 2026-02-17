-- ============================================
-- CRYPTOREPORTKIT — FULL SUPABASE DIAGNOSTIC
-- Run in: Supabase Dashboard > SQL Editor > New Query
-- Copy the ENTIRE script, paste, click RUN
-- Share the output so we know exactly what to fix
-- ============================================

-- ─── 1. ALL TABLES IN PUBLIC SCHEMA ───
SELECT '=== 1. PUBLIC TABLES ===' AS section;
SELECT
  table_name,
  (SELECT count(*) FROM information_schema.columns c
   WHERE c.table_schema = 'public' AND c.table_name = t.table_name) AS column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- ─── 2. USER_PROFILES TABLE — COLUMNS ───
SELECT '=== 2. USER_PROFILES COLUMNS ===' AS section;
SELECT
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'user_profiles'
ORDER BY ordinal_position;

-- ─── 3. USER_PROFILES — ROW COUNT & SAMPLE ───
SELECT '=== 3. USER_PROFILES ROW COUNT ===' AS section;
SELECT count(*) AS total_profiles FROM public.user_profiles;

SELECT '=== 3b. USER_PROFILES SAMPLE (no emails) ===' AS section;
SELECT
  id,
  subscription_tier,
  downloads_this_month,
  downloads_limit,
  created_at
FROM public.user_profiles
ORDER BY created_at DESC
LIMIT 5;

-- ─── 4. RLS STATUS ───
SELECT '=== 4. RLS STATUS (all public tables) ===' AS section;
SELECT
  schemaname,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- ─── 5. RLS POLICIES ON USER_PROFILES ───
SELECT '=== 5. RLS POLICIES ON USER_PROFILES ===' AS section;
SELECT
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'user_profiles'
ORDER BY policyname;

-- ─── 6. TRIGGERS ON AUTH.USERS ───
SELECT '=== 6. TRIGGERS ON AUTH.USERS ===' AS section;
SELECT
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
  AND event_object_table = 'users'
ORDER BY trigger_name;

-- ─── 7. HANDLE_NEW_USER FUNCTION EXISTS? ───
SELECT '=== 7. HANDLE_NEW_USER FUNCTION ===' AS section;
SELECT
  routine_name,
  routine_type,
  security_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'handle_new_user';

-- ─── 8. ALL FUNCTIONS IN PUBLIC SCHEMA ───
SELECT '=== 8. ALL PUBLIC FUNCTIONS ===' AS section;
SELECT
  routine_name,
  routine_type,
  security_type
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;

-- ─── 9. TABLE GRANTS ON USER_PROFILES ───
SELECT '=== 9. GRANTS ON USER_PROFILES ===' AS section;
SELECT
  grantee,
  privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'public'
  AND table_name = 'user_profiles'
ORDER BY grantee, privilege_type;

-- ─── 10. CHECK FOR MISSING COLUMNS (what code expects) ───
SELECT '=== 10. MISSING COLUMNS CHECK ===' AS section;
SELECT
  col AS expected_column,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'user_profiles'
        AND column_name = col
    ) THEN 'EXISTS'
    ELSE 'MISSING'
  END AS status
FROM unnest(ARRAY[
  'id', 'email', 'subscription_tier', 'subscription_status',
  'downloads_this_month', 'downloads_limit',
  'payment_customer_id', 'payment_subscription_id', 'payment_provider',
  'created_at', 'updated_at'
]) AS col;

-- ─── 11. OTHER KEY TABLES — EXISTENCE CHECK ───
SELECT '=== 11. EXPECTED TABLES CHECK ===' AS section;
SELECT
  tbl AS expected_table,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = tbl
    ) THEN 'EXISTS'
    ELSE 'MISSING'
  END AS status
FROM unnest(ARRAY[
  'user_profiles', 'provider_keys', 'price_alerts',
  'usage_events', 'report_recipes', 'scheduled_exports',
  'feedback', 'template_requests', 'template_request_votes',
  'security_events', 'download_history',
  'market_data', 'klines', 'coin_sentiment',
  'sentiment_posts', 'whale_transactions', 'defi_protocols'
]) AS tbl;

-- ─── 12. AUTH USERS COUNT ───
SELECT '=== 12. AUTH USERS COUNT ===' AS section;
SELECT count(*) AS total_auth_users FROM auth.users;

-- ─── 13. ORPHANED AUTH USERS (no profile) ───
SELECT '=== 13. ORPHANED AUTH USERS (have auth but no profile) ===' AS section;
SELECT count(*) AS orphaned_users
FROM auth.users u
LEFT JOIN public.user_profiles p ON u.id = p.id
WHERE p.id IS NULL;

-- ─── 14. INDEXES ON USER_PROFILES ───
SELECT '=== 14. INDEXES ON USER_PROFILES ===' AS section;
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'user_profiles';

-- ─── 15. STORAGE BUCKETS ───
SELECT '=== 15. STORAGE BUCKETS ===' AS section;
SELECT id, name, public, created_at
FROM storage.buckets
ORDER BY name;

SELECT '=== DIAGNOSTIC COMPLETE ===' AS section;
