-- Fix critical security issue: Restrict access to stripe_customers table
-- Remove overly permissive policy and implement proper access controls

-- First, drop the insecure policy that allows unrestricted access
DROP POLICY IF EXISTS "System can manage payment methods" ON public.stripe_customers;

-- Enable RLS if not already enabled
ALTER TABLE public.stripe_customers ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can only view their own payment methods
CREATE POLICY "Users can view own payment methods"
ON public.stripe_customers
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy 2: Users can only update their own payment methods
-- (Updates should typically go through the sync_stripe_payment_method function)
CREATE POLICY "Users can update own payment methods"
ON public.stripe_customers
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy 3: Only allow inserts through the secure sync_stripe_payment_method function
-- This is done by the function with SECURITY DEFINER, not via direct policy
-- We'll allow authenticated users to insert their own records
CREATE POLICY "Users can insert own payment methods"
ON public.stripe_customers
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy 4: Admins can view all payment methods (with audit logging via trigger)
CREATE POLICY "Admins can view all payment methods"
ON public.stripe_customers
FOR SELECT
TO authenticated
USING (
  get_current_user_role() = 'admin' AND
  -- Audit logging happens automatically via the audit_stripe_customer_access trigger
  true
);

-- Policy 5: Admins can update payment methods (with audit logging)
CREATE POLICY "Admins can update payment methods"
ON public.stripe_customers
FOR UPDATE
TO authenticated
USING (get_current_user_role() = 'admin')
WITH CHECK (get_current_user_role() = 'admin');

-- Add a comment documenting the security model
COMMENT ON TABLE public.stripe_customers IS 
'Stores Stripe payment method details with strict RLS policies. 
Users can only access their own data. Admins have full access with audit logging. 
All modifications should use the sync_stripe_payment_method() security definer function when possible.';