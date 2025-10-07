-- Drop and recreate the UPDATE policy for admins
DROP POLICY IF EXISTS "Admins can update welcome video settings" ON public.welcome_video_settings;

CREATE POLICY "Admins can update welcome video settings"
ON public.welcome_video_settings
FOR UPDATE
USING (get_current_user_role() = 'admin')
WITH CHECK (true);

-- Add a SELECT policy specifically for admins
DROP POLICY IF EXISTS "Admins can view welcome video settings" ON public.welcome_video_settings;

CREATE POLICY "Admins can view welcome video settings"
ON public.welcome_video_settings
FOR SELECT
USING (get_current_user_role() = 'admin');