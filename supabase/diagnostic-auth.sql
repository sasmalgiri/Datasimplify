-- ============================================================
-- SUPABASE AUTH & SCHEMA DIAGNOSTIC
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. USER_PROFILES TABLE — structure check
-- ────────────────────────────────────────────────────────────
SELECT '=== 1. USER_PROFILES TABLE STRUCTURE ===' AS section;

SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'user_profiles'
ORDER BY ordinal_position;

-- Check if table exists at all
SELECT
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'user_profiles'
  ) THEN 'user_profiles EXISTS'
  ELSE 'user_profiles MISSING — this will break login!'
  END AS user_profiles_status;

-- ────────────────────────────────────────────────────────────
-- 2. RLS STATUS — is it enabled on critical tables?
-- ────────────────────────────────────────────────────────────
SELECT '=== 2. RLS STATUS ON KEY TABLES ===' AS section;

SELECT
  schemaname,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'user_profiles',
    'product_entitlements',
    'download_history',
    'download_events',
    'free_users',
    'provider_keys',
    'price_alerts',
    'security_events',
    'page_feedback',
    'template_requests'
  )
ORDER BY tablename;

-- ────────────────────────────────────────────────────────────
-- 3. RLS POLICIES on user_profiles
-- ────────────────────────────────────────────────────────────
SELECT '=== 3. RLS POLICIES ON USER_PROFILES ===' AS section;

SELECT
  policyname,
  permissive,
  roles,
  cmd,
  qual::text AS using_expr,
  with_check::text AS with_check_expr
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'user_profiles';

-- ────────────────────────────────────────────────────────────
-- 4. ALL RLS POLICIES — full audit
-- ────────────────────────────────────────────────────────────
SELECT '=== 4. ALL RLS POLICIES ===' AS section;

SELECT
  tablename,
  policyname,
  permissive,
  cmd,
  roles
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd;

-- ────────────────────────────────────────────────────────────
-- 5. TRIGGERS — especially handle_new_user
-- ────────────────────────────────────────────────────────────
SELECT '=== 5. ALL TRIGGERS ===' AS section;

SELECT
  trigger_name,
  event_manipulation,
  event_object_schema || '.' || event_object_table AS target_table,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema IN ('public', 'auth')
ORDER BY event_object_table, trigger_name;

-- Check handle_new_user function exists and inspect its body
SELECT '=== 5b. handle_new_user() FUNCTION BODY ===' AS section;

SELECT
  routine_name,
  routine_type,
  data_type AS return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'handle_new_user';

SELECT prosrc AS function_body
FROM pg_proc
WHERE proname = 'handle_new_user';

-- ────────────────────────────────────────────────────────────
-- 6. ORPHANED AUTH USERS — users without profiles
-- ────────────────────────────────────────────────────────────
SELECT '=== 6. ORPHANED AUTH USERS (no profile) ===' AS section;

SELECT
  au.id,
  au.email,
  au.created_at,
  au.email_confirmed_at,
  CASE WHEN up.id IS NULL THEN 'MISSING PROFILE' ELSE 'OK' END AS profile_status
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.id
ORDER BY au.created_at DESC
LIMIT 20;

-- Count totals
SELECT
  (SELECT count(*) FROM auth.users) AS total_auth_users,
  (SELECT count(*) FROM public.user_profiles) AS total_profiles,
  (SELECT count(*)
   FROM auth.users au
   LEFT JOIN public.user_profiles up ON au.id = up.id
   WHERE up.id IS NULL) AS orphaned_users;

-- ────────────────────────────────────────────────────────────
-- 7. PRODUCT_ENTITLEMENTS TABLE — check structure
-- ────────────────────────────────────────────────────────────
SELECT '=== 7. PRODUCT_ENTITLEMENTS STRUCTURE ===' AS section;

SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'product_entitlements'
ORDER BY ordinal_position;

-- ────────────────────────────────────────────────────────────
-- 8. CHECK ALL EXPECTED TABLES EXIST
-- ────────────────────────────────────────────────────────────
SELECT '=== 8. TABLE EXISTENCE CHECK ===' AS section;

WITH expected_tables(tbl) AS (
  VALUES
    ('user_profiles'),
    ('product_entitlements'),
    ('download_history'),
    ('download_events'),
    ('free_users'),
    ('download_logs'),
    ('provider_keys'),
    ('report_recipes'),
    ('subscription_state'),
    ('usage_events'),
    ('scheduled_exports'),
    ('price_alerts'),
    ('security_events'),
    ('page_feedback'),
    ('template_requests'),
    ('template_request_votes'),
    ('template_releases'),
    ('rate_limits'),
    ('market_data'),
    ('klines'),
    ('coin_sentiment'),
    ('market_sentiment'),
    ('fear_greed_history'),
    ('sync_log')
)
SELECT
  e.tbl AS table_name,
  CASE WHEN t.tablename IS NOT NULL THEN 'EXISTS' ELSE 'MISSING' END AS status
FROM expected_tables e
LEFT JOIN pg_tables t
  ON t.schemaname = 'public' AND t.tablename = e.tbl
ORDER BY status DESC, e.tbl;

-- ────────────────────────────────────────────────────────────
-- 9. FOREIGN KEY CONSTRAINTS — check referential integrity
-- ────────────────────────────────────────────────────────────
SELECT '=== 9. FOREIGN KEY CONSTRAINTS ===' AS section;

SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table,
  ccu.column_name AS foreign_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu
  ON tc.constraint_name = ccu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- ────────────────────────────────────────────────────────────
-- 10. INDEXES — performance check on auth-critical tables
-- ────────────────────────────────────────────────────────────
SELECT '=== 10. INDEXES ON AUTH-CRITICAL TABLES ===' AS section;

SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN (
    'user_profiles',
    'product_entitlements',
    'download_history',
    'free_users',
    'provider_keys',
    'price_alerts'
  )
ORDER BY tablename, indexname;

-- ────────────────────────────────────────────────────────────
-- 11. SUPABASE AUTH CONFIG — check email settings
-- ────────────────────────────────────────────────────────────
SELECT '=== 11. AUTH CONFIG ===' AS section;

-- Check if email confirmations are required
SELECT
  au.id,
  au.email,
  au.email_confirmed_at,
  au.created_at,
  CASE
    WHEN au.email_confirmed_at IS NULL THEN 'UNCONFIRMED'
    ELSE 'CONFIRMED'
  END AS email_status,
  au.last_sign_in_at
FROM auth.users au
ORDER BY au.created_at DESC
LIMIT 10;

-- ────────────────────────────────────────────────────────────
-- 12. RECENT SECURITY EVENTS — check for login failures
-- ────────────────────────────────────────────────────────────
SELECT '=== 12. RECENT SECURITY EVENTS ===' AS section;

SELECT *
FROM public.security_events
ORDER BY created_at DESC
LIMIT 20;

-- ────────────────────────────────────────────────────────────
-- 13. USER_PROFILES — verify the specific user from HAR
-- ────────────────────────────────────────────────────────────
SELECT '=== 13. SPECIFIC USER CHECK ===' AS section;

SELECT *
FROM public.user_profiles
WHERE email = 'sasmalshrabani1@gmail.com'
   OR id = '6e1ee6d5-5371-49fc-aad5-a2080ad8a3e1';

-- ────────────────────────────────────────────────────────────
-- 14. FIX: Create missing profiles for orphaned users
--     (uncomment to run)
-- ────────────────────────────────────────────────────────────
SELECT '=== 14. FIX SCRIPT (uncomment to apply) ===' AS section;

/*
-- Create profiles for auth users that don't have one
INSERT INTO public.user_profiles (id, email, subscription_tier, downloads_this_month, downloads_limit, created_at)
SELECT
  au.id,
  au.email,
  'free',
  0,
  30,
  now()
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.id
WHERE up.id IS NULL
ON CONFLICT (id) DO NOTHING;
*/

-- ────────────────────────────────────────────────────────────
-- 15. FIX: Recreate handle_new_user trigger if missing
--     (uncomment to run)
-- ────────────────────────────────────────────────────────────
SELECT '=== 15. TRIGGER FIX (uncomment to apply) ===' AS section;

/*
-- Drop and recreate the trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, subscription_tier, downloads_this_month, downloads_limit, created_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    'free',
    0,
    30,
    now()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'handle_new_user failed for %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
*/

-- ────────────────────────────────────────────────────────────
-- 16. FIX: Ensure RLS policies exist on user_profiles
--     (uncomment to run)
-- ────────────────────────────────────────────────────────────
SELECT '=== 16. RLS POLICY FIX (uncomment to apply) ===' AS section;

/*
-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
CREATE POLICY "Users can view own profile"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can update own profile"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = id);

-- Service role can do everything (needed for trigger + API routes)
DROP POLICY IF EXISTS "Service role full access" ON public.user_profiles;
CREATE POLICY "Service role full access"
  ON public.user_profiles FOR ALL
  USING (auth.role() = 'service_role');
*/
