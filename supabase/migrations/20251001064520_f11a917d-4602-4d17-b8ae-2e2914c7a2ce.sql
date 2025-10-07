-- Insert a default welcome video settings row if none exists
INSERT INTO public.welcome_video_settings (is_enabled, video_url, heading_text)
SELECT false, null, 'Watch this quick tutorial video!'
WHERE NOT EXISTS (SELECT 1 FROM public.welcome_video_settings);