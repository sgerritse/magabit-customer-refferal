-- Add new fields to onboarding_steps table
ALTER TABLE public.onboarding_steps 
ADD COLUMN enable_page_url boolean NOT NULL DEFAULT false,
ADD COLUMN page_url_type text CHECK (page_url_type IN ('internal', 'external')),
ADD COLUMN page_url text,
ADD COLUMN enable_video_url boolean NOT NULL DEFAULT false,
ADD COLUMN video_url text;

-- Add comment for documentation
COMMENT ON COLUMN public.onboarding_steps.enable_page_url IS 'Enable page URL navigation for this step';
COMMENT ON COLUMN public.onboarding_steps.page_url_type IS 'Type of URL: internal (dropdown) or external (custom)';
COMMENT ON COLUMN public.onboarding_steps.page_url IS 'URL path for navigation (e.g., /profile or https://example.com)';
COMMENT ON COLUMN public.onboarding_steps.enable_video_url IS 'Enable video popup for this step';
COMMENT ON COLUMN public.onboarding_steps.video_url IS 'YouTube video URL to display in popup';