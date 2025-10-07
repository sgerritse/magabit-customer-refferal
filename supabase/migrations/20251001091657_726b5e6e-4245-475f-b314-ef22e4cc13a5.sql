-- Create admin delete policies for user_points and user_badges

CREATE POLICY "Admins can delete any user points"
ON public.user_points
FOR DELETE
USING (get_current_user_role() = 'admin');

CREATE POLICY "Admins can delete any user badges"
ON public.user_badges
FOR DELETE
USING (get_current_user_role() = 'admin');