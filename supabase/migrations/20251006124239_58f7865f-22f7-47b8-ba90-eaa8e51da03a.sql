-- =====================================================
-- CRITICAL SECURITY FIXES
-- Addresses: Public Profile Enumeration, Missing Deny Policies
-- =====================================================

-- 1. FIX PUBLIC PROFILE ACCESS (CRITICAL)
-- Remove the rate-limited public viewing policy that allows unauthenticated access
DROP POLICY IF EXISTS "Rate-limited profile viewing" ON public.profiles;

-- Add new authenticated-only profile viewing policy with rate limiting
CREATE POLICY "Authenticated users can view profiles with rate limit"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL AND 
  public.check_profile_access(id)
);

-- 2. ADD EXPLICIT DENY POLICIES FOR SENSITIVE TABLES

-- Users table - deny all unauthenticated access
CREATE POLICY "Deny unauthenticated access to users"
ON public.users
FOR ALL
TO anon
USING (false);

-- Stripe customers - deny all unauthenticated access
CREATE POLICY "Deny unauthenticated access to stripe_customers"
ON public.stripe_customers
FOR ALL
TO anon
USING (false);

-- Billing addresses - deny all unauthenticated access
CREATE POLICY "Deny unauthenticated access to billing_addresses"
ON public.billing_addresses
FOR ALL
TO anon
USING (false);

-- Tax documents - deny all unauthenticated access
CREATE POLICY "Deny unauthenticated access to tax_documents"
ON public.tax_documents
FOR ALL
TO anon
USING (false);

-- Ambassador payout methods - deny all unauthenticated access
CREATE POLICY "Deny unauthenticated access to payout_methods"
ON public.ambassador_payout_methods
FOR ALL
TO anon
USING (false);

-- User roles - deny all unauthenticated access
CREATE POLICY "Deny unauthenticated access to user_roles"
ON public.user_roles
FOR ALL
TO anon
USING (false);

-- Profiles - deny all unauthenticated access except what's explicitly allowed
CREATE POLICY "Deny unauthenticated modifications to profiles"
ON public.profiles
FOR ALL
TO anon
USING (false);

-- 3. ADD DOCUMENTATION COMMENTS
COMMENT ON POLICY "Authenticated users can view profiles with rate limit" ON public.profiles 
IS 'Requires authentication and rate limiting to prevent profile enumeration. Replaces public access policy.';

COMMENT ON POLICY "Deny unauthenticated access to users" ON public.users
IS 'Explicit deny policy to prevent any unauthenticated access to user PII.';

COMMENT ON POLICY "Deny unauthenticated access to stripe_customers" ON public.stripe_customers
IS 'Explicit deny policy to prevent any unauthenticated access to payment data.';

COMMENT ON POLICY "Deny unauthenticated access to billing_addresses" ON public.billing_addresses
IS 'Explicit deny policy to prevent any unauthenticated access to billing information.';

COMMENT ON POLICY "Deny unauthenticated access to tax_documents" ON public.tax_documents
IS 'Explicit deny policy to prevent any unauthenticated access to tax documents.';

COMMENT ON POLICY "Deny unauthenticated access to payout_methods" ON public.ambassador_payout_methods
IS 'Explicit deny policy to prevent any unauthenticated access to payout methods.';