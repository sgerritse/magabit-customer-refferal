-- Create a table for welcome/onboarding video settings
CREATE TABLE IF NOT EXISTS public.welcome_video_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_url text,
  is_enabled boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.welcome_video_settings ENABLE ROW LEVEL SECURITY;

-- Policies for welcome video settings
CREATE POLICY "Anyone can view welcome video settings"
  ON public.welcome_video_settings
  FOR SELECT
  USING (is_enabled = true);

CREATE POLICY "Admins can insert welcome video settings"
  ON public.welcome_video_settings
  FOR INSERT
  WITH CHECK (get_current_user_role() = 'admin');

CREATE POLICY "Admins can update welcome video settings"
  ON public.welcome_video_settings
  FOR UPDATE
  USING (get_current_user_role() = 'admin')
  WITH CHECK (get_current_user_role() = 'admin');

CREATE POLICY "Admins can delete welcome video settings"
  ON public.welcome_video_settings
  FOR DELETE
  USING (get_current_user_role() = 'admin');

-- Add trigger for updated_at
CREATE TRIGGER update_welcome_video_settings_updated_at
  BEFORE UPDATE ON public.welcome_video_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default row
INSERT INTO public.welcome_video_settings (video_url, is_enabled)
VALUES ('', false)
ON CONFLICT DO NOTHING;

COMMENT ON TABLE public.welcome_video_settings IS 'Settings for the welcome/onboarding video displayed at the top of the Getting Started page';