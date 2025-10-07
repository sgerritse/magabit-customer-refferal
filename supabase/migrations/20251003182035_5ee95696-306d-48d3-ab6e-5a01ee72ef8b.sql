-- Create theme_settings table for global theme persistence
CREATE TABLE public.theme_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  theme_name text NOT NULL DEFAULT 'default',
  light_theme jsonb NOT NULL DEFAULT '{}'::jsonb,
  dark_theme jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamp with time zone DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.theme_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can view theme settings (needed for all users to see themes)
CREATE POLICY "Anyone can view theme settings"
  ON public.theme_settings
  FOR SELECT
  USING (true);

-- Only admins can update theme settings
CREATE POLICY "Only admins can update theme settings"
  ON public.theme_settings
  FOR UPDATE
  TO authenticated
  USING (get_current_user_role() = 'admin')
  WITH CHECK (get_current_user_role() = 'admin');

-- Only admins can insert theme settings
CREATE POLICY "Only admins can insert theme settings"
  ON public.theme_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (get_current_user_role() = 'admin');

-- Create trigger to update timestamp
CREATE TRIGGER update_theme_settings_updated_at
  BEFORE UPDATE ON public.theme_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default row with empty themes (will be populated by admin)
INSERT INTO public.theme_settings (theme_name, light_theme, dark_theme)
VALUES ('default', '{}'::jsonb, '{}'::jsonb);