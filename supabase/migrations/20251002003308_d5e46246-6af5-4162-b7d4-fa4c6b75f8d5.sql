-- Update woocommerce_settings table to use API key instead of consumer credentials
ALTER TABLE woocommerce_settings 
  DROP COLUMN IF EXISTS consumer_key,
  DROP COLUMN IF EXISTS consumer_secret;

ALTER TABLE woocommerce_settings 
  ADD COLUMN IF NOT EXISTS api_key text,
  ADD COLUMN IF NOT EXISTS last_sync_at timestamp with time zone;

-- Update existing rows to set default site_url if needed
UPDATE woocommerce_settings 
SET site_url = 'https://dadderup.com' 
WHERE site_url IS NULL OR site_url = '';