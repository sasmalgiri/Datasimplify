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

-- 2. RENAME STRIPE/PADDLE COLUMNS TO GENERIC PAYMENT COLUMNS
-- (We use FastSpring — column names should be provider-agnostic)
DO $$
BEGIN
  -- Rename stripe_customer_id → payment_customer_id
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'stripe_customer_id'
  ) THEN
    ALTER TABLE public.user_profiles RENAME COLUMN stripe_customer_id TO payment_customer_id;
  ELSIF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'payment_customer_id'
  ) THEN
    ALTER TABLE public.user_profiles ADD COLUMN payment_customer_id TEXT DEFAULT NULL;
  END IF;

  -- Rename stripe_subscription_id → payment_subscription_id
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'stripe_subscription_id'
  ) THEN
    ALTER TABLE public.user_profiles RENAME COLUMN stripe_subscription_id TO payment_subscription_id;
  ELSIF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'payment_subscription_id'
  ) THEN
    ALTER TABLE public.user_profiles ADD COLUMN payment_subscription_id TEXT DEFAULT NULL;
  END IF;

  -- Add payment_provider column (e.g. 'fastspring')
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'payment_provider'
  ) THEN
    ALTER TABLE public.user_profiles ADD COLUMN payment_provider TEXT DEFAULT NULL;
  END IF;
END $$;

-- Also fix subscriptions table if it has paddle-specific columns
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'subscriptions' AND column_name = 'paddle_subscription_id'
  ) THEN
    ALTER TABLE public.subscriptions RENAME COLUMN paddle_subscription_id TO payment_subscription_id;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'subscriptions' AND column_name = 'paddle_customer_id'
  ) THEN
    ALTER TABLE public.subscriptions RENAME COLUMN paddle_customer_id TO payment_customer_id;
  END IF;
END $$;

-- Also fix subscription_state table if it has paddle-specific columns
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'subscription_state' AND column_name = 'paddle_subscription_id'
  ) THEN
    ALTER TABLE public.subscription_state RENAME COLUMN paddle_subscription_id TO payment_subscription_id;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'subscription_state' AND column_name = 'paddle_customer_id'
  ) THEN
    ALTER TABLE public.subscription_state RENAME COLUMN paddle_customer_id TO payment_customer_id;
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
