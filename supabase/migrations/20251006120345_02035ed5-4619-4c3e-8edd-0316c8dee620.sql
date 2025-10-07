-- Phase 2: Fix RLS Security Issues (Corrected)
-- Addressing security scan findings

-- 1. Fix users table RLS - prevent lateral data access
DROP POLICY IF EXISTS "Deny anonymous access to users" ON public.users;
DROP POLICY IF EXISTS "Users can only view own data" ON public.users;
DROP POLICY IF EXISTS "Users can only update own data" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can update all users" ON public.users;

-- Create stricter policies for users table
CREATE POLICY "Users can only view own data"
ON public.users FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can only update own data"
ON public.users FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all users"
ON public.users FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all users"
ON public.users FOR UPDATE
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- 2. Fix stripe_customers table RLS - add default deny
DROP POLICY IF EXISTS "Deny anonymous access" ON public.stripe_customers;
DROP POLICY IF EXISTS "Users can only view own payment data" ON public.stripe_customers;
DROP POLICY IF EXISTS "Users can only update own payment data" ON public.stripe_customers;
DROP POLICY IF EXISTS "Admins can view all payment data" ON public.stripe_customers;

-- Create explicit policies for stripe_customers
CREATE POLICY "Users can only view own payment data"
ON public.stripe_customers FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can only update own payment data"
ON public.stripe_customers FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all payment data"
ON public.stripe_customers FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- 3. Enhance answer_logs privacy validation
-- Add trigger to ensure privacy field is properly validated
CREATE OR REPLACE FUNCTION public.prevent_privacy_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Prevent changing privacy from private to public if not owner
  IF OLD.privacy = 'private' AND NEW.privacy = 'public' THEN
    IF auth.uid() != NEW.user_id THEN
      RAISE EXCEPTION 'Cannot change privacy of another users content';
    END IF;
    
    -- Log the privacy change
    INSERT INTO public.security_audit_logs (
      user_id,
      admin_user_id,
      action,
      target_user_id,
      old_values,
      new_values
    ) VALUES (
      auth.uid(),
      auth.uid(),
      'PRIVACY_CHANGE_ANSWER_LOG',
      NEW.user_id,
      jsonb_build_object('privacy', OLD.privacy),
      jsonb_build_object('privacy', NEW.privacy)
    );
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_prevent_privacy_change ON public.answer_logs;
CREATE TRIGGER trigger_prevent_privacy_change
  BEFORE UPDATE ON public.answer_logs
  FOR EACH ROW
  WHEN (OLD.privacy IS DISTINCT FROM NEW.privacy)
  EXECUTE FUNCTION public.prevent_privacy_change();

-- 4. Add profiles table protection against enumeration
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Rate-limited profile viewing" ON public.profiles;

-- Create rate-limited profile viewing function
CREATE OR REPLACE FUNCTION public.check_profile_access(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rate_limit JSONB;
BEGIN
  -- Allow own profile
  IF auth.uid() = target_user_id THEN
    RETURN true;
  END IF;
  
  -- Allow admins
  IF has_role(auth.uid(), 'admin') THEN
    RETURN true;
  END IF;
  
  -- For authenticated users viewing other profiles, check rate limit
  IF auth.uid() IS NOT NULL THEN
    v_rate_limit := public.check_rate_limit(auth.uid(), inet_client_addr());
    
    IF (v_rate_limit->>'allowed')::boolean = false THEN
      RAISE EXCEPTION 'Rate limit exceeded. Please try again later.';
    END IF;
  END IF;
  
  RETURN true;
END;
$$;

CREATE POLICY "Rate-limited profile viewing"
ON public.profiles FOR SELECT
USING (public.check_profile_access(user_id));

-- 5. Add community_posts auto-moderation
CREATE OR REPLACE FUNCTION public.auto_moderate_post()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Auto-approve posts from admins
  IF has_role(NEW.user_id, 'admin') THEN
    NEW.moderation_status := 'approved';
    NEW.is_moderated := true;
  ELSE
    -- Set to pending for regular users
    NEW.moderation_status := 'pending';
    NEW.is_moderated := false;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_auto_moderate_post ON public.community_posts;
CREATE TRIGGER trigger_auto_moderate_post
  BEFORE INSERT ON public.community_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_moderate_post();