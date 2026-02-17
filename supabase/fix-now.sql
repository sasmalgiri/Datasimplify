-- ============================================
-- CRYPTOREPORTKIT — FIX: Create missing profiles + patch schema
-- Run in: Supabase Dashboard > SQL Editor > New Query
-- ============================================

-- 1. CREATE PROFILES FOR ALL ORPHANED USERS (the critical fix)
INSERT INTO public.user_profiles (id, email, subscription_tier, downloads_this_month, downloads_limit, created_at, updated_at)
SELECT
  u.id,
  u.email,
  'free',
  0,
  30,
  NOW(),
  NOW()
FROM auth.users u
LEFT JOIN public.user_profiles p ON u.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- 2. ADD MISSING paddle_customer_id COLUMN
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'paddle_customer_id'
  ) THEN
    ALTER TABLE public.user_profiles ADD COLUMN paddle_customer_id TEXT DEFAULT NULL;
  END IF;
END $$;

-- 3. ADD MISSING EMAIL INDEX
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);

-- 4. RECREATE TRIGGER FUNCTION (fixed version — downloads_limit=30, better error logging)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.user_profiles (
        id, email, subscription_tier, downloads_this_month, downloads_limit, created_at, updated_at
    )
    VALUES (
        NEW.id,
        COALESCE(NEW.email, ''),
        'free',
        0,
        30,
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = COALESCE(EXCLUDED.email, user_profiles.email),
        updated_at = NOW();

    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'handle_new_user FAILED for user %: % (SQLSTATE: %)', NEW.id, SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. VERIFY — should show profiles now
SELECT 'PROFILES BEFORE/AFTER:' AS check,
  (SELECT count(*) FROM auth.users) AS auth_users,
  (SELECT count(*) FROM public.user_profiles) AS profiles,
  (SELECT count(*) FROM auth.users u LEFT JOIN public.user_profiles p ON u.id = p.id WHERE p.id IS NULL) AS orphans;
