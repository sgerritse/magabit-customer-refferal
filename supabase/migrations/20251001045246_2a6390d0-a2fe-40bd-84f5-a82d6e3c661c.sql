-- Update the 7-Day Trial package features
UPDATE public.packages
SET features = '["7 days of Challenges", "7-day trial period", "Upgrades to monthly after trial"]'::jsonb
WHERE name = '7-Day Trial';