-- ============================================
-- SECURITY FIX: Phase 1 - RLS Policy Hardening
-- ============================================

-- 1. Fix email_sequence_progress table
--    Remove overly permissive SELECT policy that allows public access
DROP POLICY IF EXISTS "System can manage sequence progress" ON public.email_sequence_progress;

-- Add restricted policies for edge functions using service role
-- Edge functions with service_role_key will bypass RLS, so we don't need an explicit policy for them
-- This ensures only authenticated edge functions (not public users) can manage sequence progress

-- Keep existing user and admin policies intact (they're already secure)


-- 2. Fix plans_page_settings table  
--    Restrict public SELECT to authenticated users only
DROP POLICY IF EXISTS "Anyone can view enabled plans page settings" ON public.plans_page_settings;

CREATE POLICY "Authenticated users can view plans page settings"
  ON public.plans_page_settings
  FOR SELECT
  USING (auth.uid() IS NOT NULL);


-- 3. Set up encryption key age monitoring alert
-- Create a function to check if encryption key rotation is overdue
CREATE OR REPLACE FUNCTION public.check_encryption_key_rotation_alert()
RETURNS TABLE(
  alert_message text,
  key_age_days integer,
  requires_rotation boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_key_age integer;
  v_requires_rotation boolean;
BEGIN
  -- Get current key age
  SELECT public.get_encryption_key_age() INTO v_key_age;
  
  -- Check if rotation is needed (365 days = 1 year)
  v_requires_rotation := v_key_age > 365;
  
  RETURN QUERY SELECT
    CASE 
      WHEN v_key_age > 365 THEN 
        '🚨 CRITICAL: Encryption key is ' || v_key_age || ' days old and requires rotation!'
      WHEN v_key_age > 330 THEN
        '⚠️ WARNING: Encryption key is ' || v_key_age || ' days old. Rotation due soon.'
      ELSE
        '✅ OK: Encryption key age is ' || v_key_age || ' days. Next rotation due in ' || (365 - v_key_age) || ' days.'
    END as alert_message,
    v_key_age as key_age_days,
    v_requires_rotation as requires_rotation;
END;
$$;

-- Add comment for documentation
COMMENT ON FUNCTION public.check_encryption_key_rotation_alert() IS 
'Checks encryption key age and returns alert status. Keys should be rotated annually (365 days). 
Run this periodically via security-monitor edge function or manual queries.';