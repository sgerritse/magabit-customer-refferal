-- Add delay_seconds field to plans_page_settings
ALTER TABLE public.plans_page_settings 
ADD COLUMN delay_seconds INTEGER DEFAULT 0;

COMMENT ON COLUMN public.plans_page_settings.delay_seconds IS 'Delay in seconds before showing the Choose Your Plan section';