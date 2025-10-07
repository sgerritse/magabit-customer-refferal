-- Create onboarding_steps table
CREATE TABLE public.onboarding_steps (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL DEFAULT 'CheckCircle',
  step_order integer NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.onboarding_steps ENABLE ROW LEVEL SECURITY;

-- Everyone can view active steps
CREATE POLICY "Anyone can view active onboarding steps"
ON public.onboarding_steps
FOR SELECT
USING (is_active = true);

-- Only admins can insert steps
CREATE POLICY "Admins can insert onboarding steps"
ON public.onboarding_steps
FOR INSERT
WITH CHECK (get_current_user_role() = 'admin');

-- Only admins can update steps
CREATE POLICY "Admins can update onboarding steps"
ON public.onboarding_steps
FOR UPDATE
USING (get_current_user_role() = 'admin')
WITH CHECK (get_current_user_role() = 'admin');

-- Only admins can delete steps
CREATE POLICY "Admins can delete onboarding steps"
ON public.onboarding_steps
FOR DELETE
USING (get_current_user_role() = 'admin');

-- Create trigger for updated_at
CREATE TRIGGER update_onboarding_steps_updated_at
BEFORE UPDATE ON public.onboarding_steps
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default steps
INSERT INTO public.onboarding_steps (title, description, icon, step_order) VALUES
('Complete Your Profile', 'Add your personal information and preferences to get started.', 'User', 1),
('Start Your First Challenge', 'Log your first daily challenge to begin your journey.', 'Target', 2),
('Connect with Community', 'Join our Discord server and connect with other dads.', 'Users', 3),
('Earn Your First Badge', 'Complete 7 challenges to earn your first badge!', 'Award', 4);