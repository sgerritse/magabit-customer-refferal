-- Create plans page settings table
CREATE TABLE public.plans_page_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_url TEXT,
  video_heading TEXT,
  show_video BOOLEAN DEFAULT false,
  video_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.plans_page_settings ENABLE ROW LEVEL SECURITY;

-- Admin can view settings
CREATE POLICY "Admins can view plans page settings"
ON public.plans_page_settings
FOR SELECT
USING (get_current_user_role() = 'admin');

-- Admin can update settings
CREATE POLICY "Admins can update plans page settings"
ON public.plans_page_settings
FOR UPDATE
USING (get_current_user_role() = 'admin');

-- Admin can insert settings
CREATE POLICY "Admins can insert plans page settings"
ON public.plans_page_settings
FOR INSERT
WITH CHECK (get_current_user_role() = 'admin');

-- Anyone can view settings (for public plans page)
CREATE POLICY "Anyone can view enabled plans page settings"
ON public.plans_page_settings
FOR SELECT
USING (true);

-- Insert default row
INSERT INTO public.plans_page_settings (show_video, video_heading)
VALUES (false, 'Watch Our Introduction Video');

-- Add updated_at trigger
CREATE TRIGGER update_plans_page_settings_updated_at
BEFORE UPDATE ON public.plans_page_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();