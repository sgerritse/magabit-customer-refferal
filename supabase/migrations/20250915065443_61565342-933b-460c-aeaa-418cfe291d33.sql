-- Secure user_badges and user_points tables with proper RLS policies

-- Ensure RLS is enabled on both tables
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;

-- Drop overly-permissive testing policies if they exist
DROP POLICY IF EXISTS "Allow all operations on user_badges for testing" ON public.user_badges;
DROP POLICY IF EXISTS "Allow all operations on user_points for testing" ON public.user_points;

-- Create least-privilege policies for user_badges
CREATE POLICY "Users can view their own badges"
ON public.user_badges
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own badges"
ON public.user_badges
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own badges"
ON public.user_badges
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own badges"
ON public.user_badges
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Create least-privilege policies for user_points
CREATE POLICY "Users can view their own points"
ON public.user_points
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own points"
ON public.user_points
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own points"
ON public.user_points
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own points"
ON public.user_points
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Helpful indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON public.user_badges (user_id);
CREATE INDEX IF NOT EXISTS idx_user_points_user_id ON public.user_points (user_id);
