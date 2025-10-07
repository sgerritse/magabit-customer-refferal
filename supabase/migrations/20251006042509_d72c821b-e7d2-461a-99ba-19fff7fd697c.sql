-- CRITICAL SECURITY FIX: Remove API keys from database tables
-- This migration removes plaintext API keys and secrets from database tables
-- All credentials will be moved to secure environment variables

-- Step 1: Remove API key columns from email_notification_settings
ALTER TABLE public.email_notification_settings 
DROP COLUMN IF EXISTS mailgun_api_key,
DROP COLUMN IF EXISTS mailgun_domain;

-- Keep only non-sensitive configuration
COMMENT ON TABLE public.email_notification_settings IS
'Email notification configuration (non-sensitive settings only).
API credentials are stored in environment variables:
- MAILGUN_API_KEY
- MAILGUN_DOMAIN
- RESEND_API_KEY (if using Resend instead of Mailgun)';

-- Step 2: Remove API key columns from sms_notification_settings  
ALTER TABLE public.sms_notification_settings
DROP COLUMN IF EXISTS twilio_account_sid,
DROP COLUMN IF EXISTS twilio_auth_token,
DROP COLUMN IF EXISTS twilio_phone_number;

COMMENT ON TABLE public.sms_notification_settings IS
'SMS notification configuration (non-sensitive settings only).
Twilio credentials are stored in environment variables:
- TWILIO_ACCOUNT_SID
- TWILIO_AUTH_TOKEN
- TWILIO_PHONE_NUMBER';

-- Step 3: Remove API key columns from stripe_settings
ALTER TABLE public.stripe_settings
DROP COLUMN IF EXISTS stripe_secret_key,
DROP COLUMN IF EXISTS stripe_publishable_key;

COMMENT ON TABLE public.stripe_settings IS
'Stripe payment configuration (non-sensitive settings only).
Stripe credentials are stored in environment variables:
- STRIPE_SECRET_KEY (already set)
- STRIPE_PUBLISHABLE_KEY';

-- Step 4: Remove API key column from woocommerce_settings
ALTER TABLE public.woocommerce_settings
DROP COLUMN IF EXISTS api_key;

-- Keep site_url as it's not sensitive
COMMENT ON TABLE public.woocommerce_settings IS
'WooCommerce integration configuration (non-sensitive settings only).
WooCommerce credentials are stored in environment variables:
- WOOCOMMERCE_API_KEY (already set)
- WOOCOMMERCE_SITE_URL (already set)';

-- Step 5: Add audit logging for settings table access
CREATE OR REPLACE FUNCTION audit_settings_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Log when admins access sensitive settings tables
  IF TG_OP IN ('SELECT', 'UPDATE', 'INSERT') THEN
    INSERT INTO public.security_audit_logs (
      user_id,
      admin_user_id,
      action,
      target_user_id,
      new_values
    ) VALUES (
      auth.uid(),
      auth.uid(),
      'SETTINGS_' || TG_OP || '_' || TG_TABLE_NAME,
      auth.uid(),
      jsonb_build_object('table', TG_TABLE_NAME, 'operation', TG_OP)
    );
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Apply audit triggers to settings tables
DROP TRIGGER IF EXISTS audit_email_settings ON public.email_notification_settings;
CREATE TRIGGER audit_email_settings
  AFTER INSERT OR UPDATE ON public.email_notification_settings
  FOR EACH ROW
  EXECUTE FUNCTION audit_settings_access();

DROP TRIGGER IF EXISTS audit_sms_settings ON public.sms_notification_settings;
CREATE TRIGGER audit_sms_settings
  AFTER INSERT OR UPDATE ON public.sms_notification_settings
  FOR EACH ROW
  EXECUTE FUNCTION audit_settings_access();

DROP TRIGGER IF EXISTS audit_stripe_settings ON public.stripe_settings;
CREATE TRIGGER audit_stripe_settings
  AFTER INSERT OR UPDATE ON public.stripe_settings
  FOR EACH ROW
  EXECUTE FUNCTION audit_settings_access();

DROP TRIGGER IF EXISTS audit_woocommerce_settings ON public.woocommerce_settings;
CREATE TRIGGER audit_woocommerce_settings
  AFTER INSERT OR UPDATE ON public.woocommerce_settings
  FOR EACH ROW
  EXECUTE FUNCTION audit_settings_access();
