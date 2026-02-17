-- ============================================
-- CRYPTOREPORTKIT — SINGLE-QUERY DIAGNOSTIC
-- Outputs everything in ONE result table
-- Run in: Supabase Dashboard > SQL Editor
-- ============================================

WITH
-- 1. Public tables
tbl_list AS (
  SELECT
    '1-TABLES' AS section,
    table_name AS key,
    (SELECT count(*)::text FROM information_schema.columns c
     WHERE c.table_schema = 'public' AND c.table_name = t.table_name) AS value
  FROM information_schema.tables t
  WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
),

-- 2. user_profiles columns
up_cols AS (
  SELECT
    '2-UP_COLUMNS' AS section,
    column_name AS key,
    data_type || ' | default=' || COALESCE(column_default, 'NULL') || ' | nullable=' || is_nullable AS value
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'user_profiles'
),

-- 3. user_profiles row count
up_count AS (
  SELECT '3-UP_COUNT' AS section, 'total_profiles' AS key, count(*)::text AS value
  FROM public.user_profiles
),

-- 4. RLS status
rls_status AS (
  SELECT
    '4-RLS' AS section,
    tablename AS key,
    CASE WHEN rowsecurity THEN 'ENABLED' ELSE 'DISABLED' END AS value
  FROM pg_tables WHERE schemaname = 'public'
),

-- 5. RLS policies on user_profiles
rls_policies AS (
  SELECT
    '5-UP_POLICIES' AS section,
    policyname AS key,
    cmd || ' | roles=' || roles::text || ' | permissive=' || permissive AS value
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'user_profiles'
),

-- 6. Triggers on auth.users
triggers AS (
  SELECT
    '6-AUTH_TRIGGERS' AS section,
    trigger_name AS key,
    event_manipulation || ' ' || action_timing || ' -> ' || action_statement AS value
  FROM information_schema.triggers
  WHERE event_object_schema = 'auth' AND event_object_table = 'users'
),

-- 7. handle_new_user function
fn_check AS (
  SELECT
    '7-FUNCTIONS' AS section,
    routine_name AS key,
    routine_type || ' | security=' || security_type AS value
  FROM information_schema.routines
  WHERE routine_schema = 'public'
),

-- 8. Grants on user_profiles
grants AS (
  SELECT
    '8-UP_GRANTS' AS section,
    grantee AS key,
    string_agg(privilege_type, ', ' ORDER BY privilege_type) AS value
  FROM information_schema.table_privileges
  WHERE table_schema = 'public' AND table_name = 'user_profiles'
  GROUP BY grantee
),

-- 9. Missing columns check
missing_cols AS (
  SELECT
    '9-MISSING_COLS' AS section,
    col AS key,
    CASE
      WHEN EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = col
      ) THEN 'EXISTS'
      ELSE '** MISSING **'
    END AS value
  FROM unnest(ARRAY[
    'id', 'email', 'subscription_tier', 'subscription_status',
    'downloads_this_month', 'downloads_limit',
    'payment_customer_id', 'payment_subscription_id', 'payment_provider',
    'created_at', 'updated_at'
  ]) AS col
),

-- 10. Expected tables check
missing_tables AS (
  SELECT
    '10-MISSING_TABLES' AS section,
    tbl AS key,
    CASE
      WHEN EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = tbl
      ) THEN 'EXISTS'
      ELSE '** MISSING **'
    END AS value
  FROM unnest(ARRAY[
    'user_profiles', 'provider_keys', 'price_alerts',
    'usage_events', 'report_recipes', 'scheduled_exports',
    'feedback', 'template_requests', 'template_request_votes',
    'security_events', 'download_history',
    'market_data', 'klines', 'coin_sentiment',
    'sentiment_posts', 'whale_transactions', 'defi_protocols'
  ]) AS tbl
),

-- 11. Auth users count
auth_count AS (
  SELECT '11-AUTH_COUNT' AS section, 'total_auth_users' AS key, count(*)::text AS value
  FROM auth.users
),

-- 12. Orphaned users
orphans AS (
  SELECT '12-ORPHANS' AS section, 'users_without_profile' AS key, count(*)::text AS value
  FROM auth.users u LEFT JOIN public.user_profiles p ON u.id = p.id
  WHERE p.id IS NULL
),

-- 13. Indexes
idx AS (
  SELECT '13-UP_INDEXES' AS section, indexname AS key, indexdef AS value
  FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'user_profiles'
),

-- 14. Sample profiles (no emails)
samples AS (
  SELECT
    '14-UP_SAMPLES' AS section,
    id::text AS key,
    'tier=' || COALESCE(subscription_tier, 'null')
      || ' | dl_used=' || COALESCE(downloads_this_month::text, '0')
      || ' | dl_limit=' || COALESCE(downloads_limit::text, 'null')
      || ' | created=' || COALESCE(created_at::text, 'null') AS value
  FROM public.user_profiles
  ORDER BY created_at DESC LIMIT 5
)

-- Combine all results
SELECT * FROM tbl_list
UNION ALL SELECT * FROM up_cols
UNION ALL SELECT * FROM up_count
UNION ALL SELECT * FROM rls_status
UNION ALL SELECT * FROM rls_policies
UNION ALL SELECT * FROM triggers
UNION ALL SELECT * FROM fn_check
UNION ALL SELECT * FROM grants
UNION ALL SELECT * FROM missing_cols
UNION ALL SELECT * FROM missing_tables
UNION ALL SELECT * FROM auth_count
UNION ALL SELECT * FROM orphans
UNION ALL SELECT * FROM idx
UNION ALL SELECT * FROM samples
ORDER BY section, key;
