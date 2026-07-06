-- Razorpay recurring subscriptions: columns used by the webhook + checkout.
-- Safe to run multiple times.
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS razorpay_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS razorpay_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ;

-- Lets the webhook map a Razorpay subscription back to a user quickly.
CREATE INDEX IF NOT EXISTS idx_user_profiles_razorpay_subscription_id
  ON public.user_profiles (razorpay_subscription_id);
