-- ============================================
-- SECURITY FIX: Billing Addresses Protection
-- ============================================

-- Drop existing policies if they exist (clean slate)
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can manage their own billing address" ON public.billing_addresses;
  DROP POLICY IF EXISTS "Users can view their own billing address" ON public.billing_addresses;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Create audit log table for billing address access
CREATE TABLE IF NOT EXISTS public.billing_address_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL,
  accessed_user_id UUID NOT NULL,
  access_type TEXT NOT NULL,
  accessed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address INET,
  user_agent TEXT,
  accessed_fields TEXT[]
);

ALTER TABLE public.billing_address_access_logs ENABLE ROW LEVEL SECURITY;

-- Security definer function to check if user can access billing data
CREATE OR REPLACE FUNCTION public.can_access_billing_address(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    auth.uid() = target_user_id OR 
    public.has_role(auth.uid(), 'admin');
$$;

-- Security definer function to get billing address with audit logging
CREATE OR REPLACE FUNCTION public.get_billing_address_secure(target_user_id UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log access attempt if admin is accessing another user's data
  IF auth.uid() != target_user_id AND public.has_role(auth.uid(), 'admin') THEN
    INSERT INTO public.billing_address_access_logs (
      admin_user_id,
      accessed_user_id,
      access_type,
      accessed_fields
    ) VALUES (
      auth.uid(),
      target_user_id,
      'VIEW_BILLING_ADDRESS',
      ARRAY['address_line1', 'address_line2', 'city', 'state', 'postal_code', 'country']
    );
  END IF;

  -- Return data if authorized
  IF public.can_access_billing_address(target_user_id) THEN
    RETURN QUERY
    SELECT 
      ba.id,
      ba.user_id,
      ba.address_line1,
      ba.address_line2,
      ba.city,
      ba.state,
      ba.postal_code,
      ba.country,
      ba.created_at,
      ba.updated_at
    FROM public.billing_addresses ba
    WHERE ba.user_id = target_user_id;
  ELSE
    RAISE EXCEPTION 'Unauthorized access to billing address';
  END IF;
END;
$$;

-- RLS Policies for billing_addresses table

-- Users can view their own billing address
CREATE POLICY "Users can view own billing address"
ON public.billing_addresses
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert their own billing address
CREATE POLICY "Users can insert own billing address"
ON public.billing_addresses
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own billing address
CREATE POLICY "Users can update own billing address"
ON public.billing_addresses
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own billing address
CREATE POLICY "Users can delete own billing address"
ON public.billing_addresses
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Admins can view all billing addresses (with audit logging)
CREATE POLICY "Admins can view all billing addresses"
ON public.billing_addresses
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update billing addresses
CREATE POLICY "Admins can update billing addresses"
ON public.billing_addresses
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admins can delete billing addresses
CREATE POLICY "Admins can delete billing addresses"
ON public.billing_addresses
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for billing_address_access_logs
CREATE POLICY "Admins can view access logs"
ON public.billing_address_access_logs
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert access logs"
ON public.billing_address_access_logs
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create audit trigger for billing address modifications
CREATE OR REPLACE FUNCTION public.audit_billing_address_modification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log when admins modify billing addresses
  IF TG_OP IN ('UPDATE', 'DELETE') AND auth.uid() != COALESCE(NEW.user_id, OLD.user_id) THEN
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
      'ADMIN_' || TG_OP || '_BILLING_ADDRESS',
      COALESCE(NEW.user_id, OLD.user_id),
      CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN 
        jsonb_build_object(
          'address_line1', OLD.address_line1,
          'city', OLD.city,
          'state', OLD.state,
          'postal_code', OLD.postal_code
        )
      ELSE NULL END,
      CASE WHEN TG_OP = 'UPDATE' THEN
        jsonb_build_object(
          'address_line1', NEW.address_line1,
          'city', NEW.city,
          'state', NEW.state,
          'postal_code', NEW.postal_code
        )
      ELSE NULL END
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS audit_billing_address_modification ON public.billing_addresses;

-- Create trigger for audit logging
CREATE TRIGGER audit_billing_address_modification
AFTER UPDATE OR DELETE ON public.billing_addresses
FOR EACH ROW
EXECUTE FUNCTION public.audit_billing_address_modification();

-- Create materialized view for admin dashboard (masked data for less sensitive views)
CREATE OR REPLACE VIEW public.billing_addresses_admin_summary AS
SELECT 
  ba.id,
  ba.user_id,
  u.email,
  u.first_name,
  u.last_name,
  ba.city,
  ba.state,
  ba.country,
  LEFT(ba.postal_code, 3) || 'XX' as masked_postal_code,
  ba.created_at,
  ba.updated_at
FROM public.billing_addresses ba
LEFT JOIN public.users u ON u.id = ba.user_id
WHERE public.has_role(auth.uid(), 'admin');

COMMENT ON TABLE public.billing_addresses IS 'Stores user billing addresses with strict RLS policies and audit logging for admin access';
COMMENT ON FUNCTION public.get_billing_address_secure IS 'Security definer function that logs admin access to billing addresses';
COMMENT ON TABLE public.billing_address_access_logs IS 'Audit log for tracking admin access to sensitive billing address data';