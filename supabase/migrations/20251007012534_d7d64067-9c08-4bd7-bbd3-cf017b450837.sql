-- Fix security definer issue by setting the view to security invoker mode
-- This ensures RLS policies are enforced using the querying user's permissions,
-- not the view creator's permissions
ALTER VIEW public.billing_addresses_admin_summary
SET (security_invoker = true);