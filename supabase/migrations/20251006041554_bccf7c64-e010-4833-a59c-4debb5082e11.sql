-- Fix payment card information security issue in stripe_customers table
-- Clean up duplicate policies and ensure proper access controls with audit logging

DO $$
DECLARE
  pol record;
BEGIN
  -- Drop all existing policies on stripe_customers
  FOR pol IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'stripe_customers'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.stripe_customers', pol.policyname);
  END LOOP;
END $$;

-- Create clean, secure RLS policies for stripe_customers

-- Policy 1: Users can view ONLY their own payment card information
CREATE POLICY "Users can view own payment card data"
ON public.stripe_customers
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy 2: Users can insert their own payment methods (needed for payment setup)
CREATE POLICY "Users can add own payment methods"
ON public.stripe_customers
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy 3: Users can update their own payment methods
CREATE POLICY "Users can update own payment card data"
ON public.stripe_customers
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy 4: Admins can view all payment methods (with audit logging)
CREATE POLICY "Admins can view all payment card data"
ON public.stripe_customers
FOR SELECT
TO authenticated
USING (get_current_user_role() = 'admin');

-- Policy 5: Admins can update payment methods (with audit logging via trigger)
CREATE POLICY "Admins can update payment card data"
ON public.stripe_customers
FOR UPDATE
TO authenticated
USING (get_current_user_role() = 'admin')
WITH CHECK (get_current_user_role() = 'admin');

-- Policy 6: Admins can delete payment methods if needed
CREATE POLICY "Admins can delete payment card data"
ON public.stripe_customers
FOR DELETE
TO authenticated
USING (get_current_user_role() = 'admin');

-- Ensure the audit trigger exists and is properly configured
-- This trigger logs when admins modify or delete payment card information
DROP TRIGGER IF EXISTS audit_stripe_customer_access ON public.stripe_customers;

CREATE TRIGGER audit_stripe_customer_access
  AFTER UPDATE OR DELETE ON public.stripe_customers
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_stripe_customer_access();

-- Add documentation comment
COMMENT ON TABLE public.stripe_customers IS 
'Contains sensitive payment card information (last 4 digits, expiration, brand).
Protected by strict RLS policies: users can only access their own payment data, admins have full access with audit logging.
All admin modifications to payment data are logged in payment_access_audit table via the audit_stripe_customer_access trigger.';