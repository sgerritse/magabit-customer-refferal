-- First, let's see what policies exist and drop them all, then recreate proper ones
DROP POLICY IF EXISTS "Anyone can register new users" ON public.users;
DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
DROP POLICY IF EXISTS "Users can update their own data" ON public.users;
DROP POLICY IF EXISTS "Users can delete their own data" ON public.users;

-- Allow anyone to insert new users (for registration without authentication)
CREATE POLICY "Allow public registration" 
ON public.users 
FOR INSERT 
WITH CHECK (true);

-- Allow reading all users (needed for admin functionality)
CREATE POLICY "Allow reading all users" 
ON public.users 
FOR SELECT 
USING (true);