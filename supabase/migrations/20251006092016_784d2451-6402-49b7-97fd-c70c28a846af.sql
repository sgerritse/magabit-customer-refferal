-- =====================================================
-- PRIORITY 1: CRITICAL - Clean Up Users Table RLS Policies
-- =====================================================
-- Remove 12 duplicate policies and consolidate to 7 essential policies

-- Step 1: Drop all existing policies on users table
DROP POLICY IF EXISTS "Users can view own data" ON public.users;
DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
DROP POLICY IF EXISTS "Admins can view all user data" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Users can insert own data" ON public.users;
DROP POLICY IF EXISTS "Users can create own record" ON public.users;
DROP POLICY IF EXISTS "Users can create their own record" ON public.users;
DROP POLICY IF EXISTS "System can insert user records" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own personal data" ON public.users;
DROP POLICY IF EXISTS "Users can update their own data" ON public.users;
DROP POLICY IF EXISTS "Admins can update users" ON public.users;
DROP POLICY IF EXISTS "Admins can update user data" ON public.users;
DROP POLICY IF EXISTS "Admins can update all users" ON public.users;
DROP POLICY IF EXISTS "Admins can delete users" ON public.users;
DROP POLICY IF EXISTS "Admins can delete user data" ON public.users;
DROP POLICY IF EXISTS "Admins can insert users" ON public.users;
DROP POLICY IF EXISTS "Deny anonymous access to users" ON public.users;

-- Step 2: Create 7 essential policies with clear purposes

-- Policy 1: Users can view their own data only
CREATE POLICY "Users can view own data"
ON public.users
FOR SELECT
USING (auth.uid() = id);

-- Policy 2: Admins can view all users (for user management)
CREATE POLICY "Admins can view all users"
ON public.users
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Policy 3: Users can insert their own data during registration
CREATE POLICY "Users can insert own data"
ON public.users
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Policy 4: Users can update their own data only
CREATE POLICY "Users can update own data"
ON public.users
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy 5: Admins can update all users (for admin management)
CREATE POLICY "Admins can update all users"
ON public.users
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Policy 6: Admins can delete users (for account management)
CREATE POLICY "Admins can delete users"
ON public.users
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Policy 7: Restrictive policy to deny all anonymous access
CREATE POLICY "Deny anonymous access to users"
ON public.users
AS RESTRICTIVE
FOR ALL
USING (auth.uid() IS NOT NULL);