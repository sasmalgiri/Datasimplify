-- ============================================
-- Security hardening
-- 1. Revoke ALL on user_profiles from the anon role.
--    RLS policies already enforce auth.uid() = id, so anon should
--    have no direct grants — defense in depth.
-- 2. Add idempotency index on purchase_events to make webhook
--    redelivery dedup race-free.
-- ============================================

REVOKE ALL ON public.user_profiles FROM anon;
REVOKE ALL ON public.user_profiles FROM PUBLIC;

-- (Re-affirm the grants we DO want, in case prior migrations granted PUBLIC.)
GRANT ALL ON public.user_profiles TO authenticated;
GRANT ALL ON public.user_profiles TO service_role;

-- Idempotency: prevent the same FastSpring event from being processed twice.
-- Partial unique index ignores rows where order_id is null (e.g. malformed payloads).
CREATE UNIQUE INDEX IF NOT EXISTS purchase_events_dedup_idx
  ON public.purchase_events (provider, event_type, external_order_id, external_customer_email)
  WHERE external_order_id IS NOT NULL AND event_type IS NOT NULL;
