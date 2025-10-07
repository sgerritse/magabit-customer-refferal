-- Restrict audit log INSERT policy to only system functions and admin operations
-- Replace the overly permissive audit log INSERT policy with a more secure one

DROP POLICY IF EXISTS "Allow system and authenticated users to insert audit logs" ON public.security_audit_logs;

-- Create more restrictive INSERT policy for audit logs
-- Only allow inserts from system functions (SECURITY DEFINER) and admin users
CREATE POLICY "Restrict audit log insertions to system and admins" 
ON public.security_audit_logs 
FOR INSERT 
TO authenticated
WITH CHECK (
  -- Allow if current user is admin
  get_current_user_role() = 'admin' 
  OR 
  -- Allow if being called from a SECURITY DEFINER function (system operations)
  current_setting('role', true) = 'authenticator'
);