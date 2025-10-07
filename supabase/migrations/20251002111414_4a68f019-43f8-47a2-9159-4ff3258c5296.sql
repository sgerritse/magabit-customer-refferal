-- Add CTA button fields to plans_page_settings
ALTER TABLE public.plans_page_settings 
ADD COLUMN enable_cta_button BOOLEAN DEFAULT false,
ADD COLUMN cta_button_text TEXT DEFAULT 'Continue to Plans';

COMMENT ON COLUMN public.plans_page_settings.enable_cta_button IS 'Enable CTA button in video section to manually trigger showing plans';
COMMENT ON COLUMN public.plans_page_settings.cta_button_text IS 'Text to display on the CTA button';