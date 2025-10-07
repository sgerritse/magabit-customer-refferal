-- Phase 1 Critical Security Fixes
-- Fix 1: Mark deprecated profiles.role column
COMMENT ON COLUMN public.profiles.role IS 'DEPRECATED: This column is no longer used. User roles are now stored in the user_roles table for better security. DO NOT USE THIS COLUMN. It will be removed in a future migration after observation period.';

-- Fix 2: Add index to improve has_role performance and reduce connection pool strain
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id_role ON public.user_roles(user_id, role);

-- Fix 3: Add connection pool monitoring function
CREATE OR REPLACE FUNCTION public.get_db_connection_stats()
RETURNS TABLE(
  max_connections integer,
  current_connections integer,
  available_connections integer
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    (SELECT setting::integer FROM pg_settings WHERE name = 'max_connections') as max_connections,
    (SELECT count(*)::integer FROM pg_stat_activity WHERE datname = current_database()) as current_connections,
    (SELECT setting::integer FROM pg_settings WHERE name = 'max_connections') - 
    (SELECT count(*)::integer FROM pg_stat_activity WHERE datname = current_database()) as available_connections;
$$;

-- Fix 4: Add audit log for role checks to detect privilege escalation attempts
CREATE TABLE IF NOT EXISTS public.role_check_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  checked_role app_role NOT NULL,
  result boolean NOT NULL,
  function_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.role_check_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view role check audit"
ON public.role_check_audit
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert role check audit"
ON public.role_check_audit
FOR INSERT
WITH CHECK (true);

-- Add index for audit queries
CREATE INDEX IF NOT EXISTS idx_role_check_audit_user_id ON public.role_check_audit(user_id);
CREATE INDEX IF NOT EXISTS idx_role_check_audit_created_at ON public.role_check_audit(created_at DESC);