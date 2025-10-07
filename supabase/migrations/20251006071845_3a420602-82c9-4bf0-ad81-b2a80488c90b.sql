-- Add security reports enabled toggle to email notification settings
ALTER TABLE public.email_notification_settings 
ADD COLUMN security_reports_enabled BOOLEAN DEFAULT false;

COMMENT ON COLUMN public.email_notification_settings.security_reports_enabled 
IS 'Controls whether daily security monitoring reports are emailed to administrators. Security checks run daily regardless of this setting.';