-- Remove the overly permissive public read policy
DROP POLICY IF EXISTS "Allow reading all users" ON public.users;

-- Add a policy that allows users to view only their own data
CREATE POLICY "Users can view their own data" 
ON public.users 
FOR SELECT 
USING (auth.uid()::text = id::text);

-- Add a policy that allows users to update their own data  
CREATE POLICY "Users can update their own data"
ON public.users 
FOR UPDATE 
USING (auth.uid()::text = id::text)
WITH CHECK (auth.uid()::text = id::text);