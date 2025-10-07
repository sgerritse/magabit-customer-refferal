-- Temporarily update RLS policies for testing without authentication
-- This allows the temporary user ID system to work

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own points" ON public.user_points;
DROP POLICY IF EXISTS "Users can insert their own points" ON public.user_points;
DROP POLICY IF EXISTS "Users can view their own badges" ON public.user_badges;
DROP POLICY IF EXISTS "Users can insert their own badges" ON public.user_badges;

-- Create temporary policies that work with our localStorage user_id system
-- Note: In production, you should replace this with proper auth.uid() policies

CREATE POLICY "Allow all operations on user_points for testing" 
ON public.user_points 
FOR ALL 
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow all operations on user_badges for testing" 
ON public.user_badges 
FOR ALL 
USING (true)
WITH CHECK (true);