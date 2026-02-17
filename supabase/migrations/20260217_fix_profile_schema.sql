-- ============================================
-- FIX: User Profiles Schema Alignment
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- Date: 2026-02-17
-- ============================================

-- 1. Add subscription_status column if it doesn't exist
-- (Used by entitlements system for paused/cancelled/active tracking)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'user_profiles'
      AND column_name = 'subscription_status'
  ) THEN
    ALTER TABLE public.user_profiles
      ADD COLUMN subscription_status TEXT DEFAULT NULL;
    RAISE NOTICE 'Added subscription_status column';
  ELSE
    RAISE NOTICE 'subscription_status column already exists';
  END IF;
END $$;

-- 2. Fix downloads_limit default from 5 to 30 (matches PLAN_LIMITS in code)
ALTER TABLE public.user_profiles
  ALTER COLUMN downloads_limit SET DEFAULT 30;

-- 3. Update existing free-tier users who still have the old limit of 5
UPDATE public.user_profiles
SET downloads_limit = 30
WHERE subscription_tier = 'free'
  AND downloads_limit = 5;

-- 4. Update the trigger function to use correct limit (30 not 5)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.user_profiles (
        id,
        email,
        subscription_tier,
        downloads_this_month,
        downloads_limit,
        created_at,
        updated_at
    )
    VALUES (
        NEW.id,
        NEW.email,
        'free',
        0,
        30,
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        updated_at = NOW();

    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Could not create user profile for %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Verify the fix
SELECT
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'user_profiles'
ORDER BY ordinal_position;
