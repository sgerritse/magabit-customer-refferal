-- ============================================
-- SECURITY FIX: Remove Security Definer View
-- ============================================

-- Drop the billing_addresses_admin_summary view since it uses SECURITY DEFINER functions
-- and is not needed (we have proper RLS policies instead)
DROP VIEW IF EXISTS public.billing_addresses_admin_summary;

-- The view is redundant because:
-- 1. Admins can query billing_addresses table directly with proper RLS policies
-- 2. The get_billing_address_secure() function provides audited access when needed
-- 3. The audit_billing_address_modification trigger logs all admin modifications

COMMENT ON TABLE public.billing_addresses IS 'Stores user billing addresses with strict RLS policies. Admins can query directly - no view needed. Use get_billing_address_secure() function for audited access.';