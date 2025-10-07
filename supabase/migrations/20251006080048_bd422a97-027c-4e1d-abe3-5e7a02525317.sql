-- Phase 1: Consolidate users table RLS policies (17 → 8)
-- This migration drops all existing redundant policies and creates a clean, consistent set

-- Drop all 17 existing policies
DROP POLICY IF EXISTS "Admins can delete any user" ON public.users;
DROP POLICY IF EXISTS "Admins can delete users" ON public.users;
DROP POLICY IF EXISTS "Admins can insert users" ON public.users;
DROP POLICY IF EXISTS "Admins can manage all users" ON public.users;
DROP POLICY IF EXISTS "Admins can update any user" ON public.users;
DROP POLICY IF EXISTS "Admins can update users" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can view decrypted users" ON public.users;
DROP POLICY IF EXISTS "Deny public access to users" ON public.users;
DROP POLICY IF EXISTS "Users can insert own record" ON public.users;
DROP POLICY IF EXISTS "Users can read own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own record" ON public.users;
DROP POLICY IF EXISTS "Users can view own data" ON public.users;
DROP POLICY IF EXISTS "Users can view own record" ON public.users;
DROP POLICY IF EXISTS "allow_authenticated_insert_users" ON public.users;
DROP POLICY IF EXISTS "allow_authenticated_update_users" ON public.users;

-- Create 8 consolidated policies with consistent patterns
-- All admin checks use: has_role(auth.uid(), 'admin'::app_role)
-- All user checks use: auth.uid() = id

-- 1. Deny Anonymous Access (ALL operations) - RESTRICTIVE
CREATE POLICY "Deny anonymous access to users"
ON public.users
AS RESTRICTIVE
FOR ALL
TO anon
USING (false);

-- 2. Users: View Own Data (SELECT)
CREATE POLICY "Users can view own data"
ON public.users
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- 3. Users: Create Own Record (INSERT)
CREATE POLICY "Users can create own record"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- 4. Users: Update Own Data (UPDATE)
CREATE POLICY "Users can update own data"
ON public.users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 5. Admins: View All Users (SELECT)
CREATE POLICY "Admins can view all users"
ON public.users
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- 6. Admins: Insert Users (INSERT)
CREATE POLICY "Admins can insert users"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 7. Admins: Update Users (UPDATE)
CREATE POLICY "Admins can update users"
ON public.users
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 8. Admins: Delete Users (DELETE)
CREATE POLICY "Admins can delete users"
ON public.users
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));