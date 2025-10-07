-- Stage 1 (Revised): Add missing RLS policies to users table
-- Only adding policies that don't already exist

-- Enable RLS on users table (if not already enabled)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies to ensure consistency
DROP POLICY IF EXISTS "Users can view own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "Users can insert own data" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can update all users" ON public.users;
DROP POLICY IF EXISTS "Admins can delete users" ON public.users;
DROP POLICY IF EXISTS "Deny public access to users" ON public.users;

-- Policy: Users can view their own data
CREATE POLICY "Users can view own data"
ON public.users
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Policy: Users can update their own data
CREATE POLICY "Users can update own data"
ON public.users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy: Users can insert their own data
CREATE POLICY "Users can insert own data"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Policy: Admins can view all user data
CREATE POLICY "Admins can view all users"
ON public.users
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Policy: Admins can update all user data
CREATE POLICY "Admins can update all users"
ON public.users
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Policy: Admins can delete users
CREATE POLICY "Admins can delete users"
ON public.users
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Deny all public access explicitly
CREATE POLICY "Deny public access to users"
ON public.users
FOR ALL
TO anon
USING (false);

COMMENT ON TABLE public.users IS 'User personal information table - Protected by RLS. Contains both plaintext (for auth compatibility) and encrypted PII fields. Admin access is audit-logged via triggers.';