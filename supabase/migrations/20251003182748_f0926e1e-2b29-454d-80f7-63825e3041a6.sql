-- Add loading widget settings to theme_settings table
ALTER TABLE theme_settings 
ADD COLUMN IF NOT EXISTS loading_widget_settings jsonb DEFAULT '{
  "logo_url": "/dadderup-logo-white.png",
  "logo_size": 64,
  "bg_color": "hsl(var(--background))",
  "text_color": "hsl(var(--foreground))",
  "spinner_color": "hsl(var(--primary))",
  "loading_text": "Loading..."
}'::jsonb;