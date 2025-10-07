-- 1) Create a minimal profiles table to store roles (admin/user)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user','admin')),
  display_name text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Ensure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Basic owner policies for profiles
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Timestamp trigger for profiles
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 2) Create a security definer function to fetch the current user's role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COALESCE((SELECT role FROM public.profiles WHERE user_id = auth.uid()), 'user')::text;
$$;

GRANT EXECUTE ON FUNCTION public.get_current_user_role() TO anon, authenticated;

-- 3) Tighten users table RLS policies
-- Remove overly-permissive policies if present
DROP POLICY IF EXISTS "Allow reading all users" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can manage all users" ON public.users;

-- Users can read their own row
CREATE POLICY "Users can view their own user row"
ON public.users
FOR SELECT
USING (auth.uid()::text = id::text);

-- Admins can read all rows
CREATE POLICY "Admins can view all users"
ON public.users
FOR SELECT
USING (public.get_current_user_role() = 'admin');

-- Users can update their own row
CREATE POLICY "Users can update their own user row"
ON public.users
FOR UPDATE
USING (auth.uid()::text = id::text)
WITH CHECK (auth.uid()::text = id::text);

-- Admins can update any row
CREATE POLICY "Admins can update any user"
ON public.users
FOR UPDATE
USING (public.get_current_user_role() = 'admin')
WITH CHECK (public.get_current_user_role() = 'admin');

-- Admins can delete any row
CREATE POLICY "Admins can delete any user"
ON public.users
FOR DELETE
USING (public.get_current_user_role() = 'admin');
