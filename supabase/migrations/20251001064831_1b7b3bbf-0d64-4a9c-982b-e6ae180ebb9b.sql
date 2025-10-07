-- Drop the existing update policy
DROP POLICY IF EXISTS "Admins can update welcome video settings" ON public.welcome_video_settings;

-- Create a new simpler update policy for admins
CREATE POLICY "Admins can update welcome video settings" 
ON public.welcome_video_settings 
FOR UPDATE 
USING (get_current_user_role() = 'admin')
WITH CHECK (true);