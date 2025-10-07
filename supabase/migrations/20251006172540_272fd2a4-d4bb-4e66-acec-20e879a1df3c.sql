-- =====================================================
-- SECURITY FIXES: System Insertion Policies
-- Restricts system operations to service_role only
-- =====================================================

-- 1. FIX AMBASSADOR_EARNINGS INSERTION POLICY
-- Drop overly permissive policy
DROP POLICY IF EXISTS "System can insert earnings" ON public.ambassador_earnings;

-- Create restrictive service_role-only policy
CREATE POLICY "Service role can insert earnings"
ON public.ambassador_earnings
FOR INSERT
TO service_role
WITH CHECK (true);

-- 2. FIX NOTIFICATION_QUEUE POLICIES
-- Drop overly permissive policies
DROP POLICY IF EXISTS "System can insert notifications" ON public.notification_queue;
DROP POLICY IF EXISTS "System can update notifications" ON public.notification_queue;

-- Create restrictive service_role-only policies
CREATE POLICY "Service role can insert notifications"
ON public.notification_queue
FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "Service role can update notifications"
ON public.notification_queue
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

-- 3. FIX REFERRAL_VISITS INSERTION POLICY (if exists)
DROP POLICY IF EXISTS "System can insert referral visits" ON public.referral_visits;

-- Create restrictive service_role-only policy
CREATE POLICY "Service role can insert referral visits"
ON public.referral_visits
FOR INSERT
TO service_role
WITH CHECK (true);

-- 4. ADD DOCUMENTATION
COMMENT ON POLICY "Service role can insert earnings" ON public.ambassador_earnings
IS 'Restricts earning insertions to service_role only (edge functions). Prevents direct client-side manipulation.';

COMMENT ON POLICY "Service role can insert notifications" ON public.notification_queue
IS 'Restricts notification creation to service_role only. Prevents spam and unauthorized notifications.';

COMMENT ON POLICY "Service role can update notifications" ON public.notification_queue
IS 'Allows service_role to mark notifications as processed. Prevents client-side status manipulation.';

COMMENT ON POLICY "Service role can insert referral visits" ON public.referral_visits
IS 'Restricts visit tracking to service_role only. Prevents referral fraud and fake visit logging.';