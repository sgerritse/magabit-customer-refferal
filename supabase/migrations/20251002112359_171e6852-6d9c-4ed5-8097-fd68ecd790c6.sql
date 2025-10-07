-- Add enable_delay column to plans_page_settings
ALTER TABLE public.plans_page_settings 
ADD COLUMN enable_delay BOOLEAN DEFAULT false;