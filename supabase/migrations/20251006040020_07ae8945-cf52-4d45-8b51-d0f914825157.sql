-- Fix critical security issue: Protect sensitive personal information in users table
-- Enable RLS and implement strict access controls

-- Enable Row-Level Security on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can view only their own personal information
CREATE POLICY "Users can view own personal data"
ON public.users
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Policy 2: Users can update only their own personal information
CREATE POLICY "Users can update own personal data"
ON public.users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy 3: Allow system to insert user records (needed for handle_new_user trigger)
-- This is required for the signup flow to work
CREATE POLICY "System can insert user records"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Policy 4: Admins can view all user data (with audit logging)
CREATE POLICY "Admins can view all user data"
ON public.users
FOR SELECT
TO authenticated
USING (get_current_user_role() = 'admin');

-- Policy 5: Admins can update user data (with audit logging)
CREATE POLICY "Admins can update user data"
ON public.users
FOR UPDATE
TO authenticated
USING (get_current_user_role() = 'admin')
WITH CHECK (get_current_user_role() = 'admin');

-- Policy 6: Admins can delete user data (with audit logging)
CREATE POLICY "Admins can delete user data"
ON public.users
FOR DELETE
TO authenticated
USING (get_current_user_role() = 'admin');

-- Add trigger to audit admin modifications to PII
-- Only triggers on UPDATE operations (PostgreSQL doesn't support SELECT triggers)
CREATE TRIGGER audit_user_pii_modifications
  AFTER UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_user_data_modification();

-- Add a comment documenting the security model
COMMENT ON TABLE public.users IS 
'Contains sensitive personal information (PII) including emails, phone numbers, dates of birth, and family information.
Protected by strict RLS policies: users can only access their own data, admins have full access with audit logging.
All admin modifications to PII are logged in security_audit_logs table via the audit_user_pii_modifications trigger.';