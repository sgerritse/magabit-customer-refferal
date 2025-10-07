-- Add CTA buttons field to onboarding_steps table
ALTER TABLE public.onboarding_steps 
ADD COLUMN cta_buttons jsonb DEFAULT '[]'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN public.onboarding_steps.cta_buttons IS 'Array of CTA buttons for video popup. Each button has: {text: string, url: string, url_type: "internal" | "external"}';