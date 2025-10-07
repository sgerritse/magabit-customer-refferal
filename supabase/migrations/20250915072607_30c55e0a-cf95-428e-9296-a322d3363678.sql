-- Drop the existing admin policy and create proper policies for user registration
DROP POLICY IF EXISTS "Admin users have full access to users" ON public.users;

-- Allow anyone to insert new users (for registration)
CREATE POLICY "Anyone can register new users" 
ON public.users 
FOR INSERT 
WITH CHECK (true);

-- Only authenticated users can view their own data
CREATE POLICY "Users can view their own data" 
ON public.users 
FOR SELECT 
USING (auth.uid()::text = id::text);

-- Only authenticated users can update their own data
CREATE POLICY "Users can update their own data" 
ON public.users 
FOR UPDATE 
USING (auth.uid()::text = id::text);

-- Only authenticated users can delete their own data
CREATE POLICY "Users can delete their own data" 
ON public.users 
FOR DELETE 
USING (auth.uid()::text = id::text);