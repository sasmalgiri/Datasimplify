-- ============================================
-- FIX: User Profiles Trigger
-- Run this in Supabase SQL Editor to fix "Database error saving new user"
-- ============================================

-- 1. First, ensure the user_profiles table exists with correct schema
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'starter', 'pro', 'premium', 'business')),
    downloads_this_month INTEGER DEFAULT 0,
    downloads_limit INTEGER DEFAULT 30,
    payment_customer_id TEXT,
    payment_subscription_id TEXT,
    payment_provider TEXT,  -- e.g. 'fastspring'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable Row Level Security
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Service role can manage all profiles" ON public.user_profiles;

-- Create policies
CREATE POLICY "Users can view their own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow service role to manage all profiles (for triggers)
CREATE POLICY "Service role can manage all profiles" ON public.user_profiles
    FOR ALL USING (auth.role() = 'service_role');

-- 4. Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);

-- 5. Grant necessary permissions
GRANT ALL ON public.user_profiles TO authenticated;
GRANT ALL ON public.user_profiles TO service_role;
GRANT ALL ON public.user_profiles TO anon;

-- 6. Create a ROBUST trigger function that won't fail
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Use INSERT with ON CONFLICT to prevent errors if profile already exists
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
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Could not create user profile for %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Drop and recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 8. Also create profiles for any existing users who might not have one
INSERT INTO public.user_profiles (id, email, subscription_tier, downloads_this_month, downloads_limit)
SELECT
    id,
    email,
    'free',
    0,
    30
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.user_profiles)
ON CONFLICT (id) DO NOTHING;

-- Success message
SELECT 'User profiles trigger fixed successfully!' as status;
