-- Add admin policy for viewing all users in admin panel
CREATE POLICY "Admins can view all users" 
ON public.users 
FOR SELECT 
USING (true);

-- Add admin policy for managing all users
CREATE POLICY "Admins can manage all users" 
ON public.users 
FOR ALL 
USING (true);