-- Add heading_text field to welcome_video_settings table
ALTER TABLE public.welcome_video_settings 
ADD COLUMN heading_text text DEFAULT 'Watch this quick tutorial video!';

COMMENT ON COLUMN public.welcome_video_settings.heading_text IS 'Custom heading text displayed above the welcome video';