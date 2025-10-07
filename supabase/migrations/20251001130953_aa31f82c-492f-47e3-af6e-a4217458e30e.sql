-- Create notification settings tables

-- Email notification settings
CREATE TABLE IF NOT EXISTS public.email_notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mailgun_api_key TEXT,
  mailgun_domain TEXT,
  from_email TEXT,
  from_name TEXT DEFAULT 'DadderUp',
  enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- SMS notification settings
CREATE TABLE IF NOT EXISTS public.sms_notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  twilio_account_sid TEXT,
  twilio_auth_token TEXT,
  twilio_phone_number TEXT,
  enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Push notification settings
CREATE TABLE IF NOT EXISTS public.push_notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firebase_api_key TEXT,
  firebase_auth_domain TEXT,
  firebase_project_id TEXT,
  firebase_sender_id TEXT,
  firebase_app_id TEXT,
  firebase_vapid_key TEXT,
  enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Email templates
CREATE TABLE IF NOT EXISTS public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  variables JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- SMS templates
CREATE TABLE IF NOT EXISTS public.sms_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  message TEXT NOT NULL,
  variables JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Push notification templates
CREATE TABLE IF NOT EXISTS public.push_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  icon_url TEXT,
  action_url TEXT,
  variables JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Notification triggers
CREATE TABLE IF NOT EXISTS public.notification_triggers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  trigger_type TEXT NOT NULL, -- 'email', 'sms', 'push'
  event_type TEXT NOT NULL, -- 'badge_earned', 'challenge_completed', 'weekly_digest', etc.
  template_id UUID,
  conditions JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_triggers ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Only admins can manage notification settings
CREATE POLICY "Admins can view email settings"
  ON public.email_notification_settings FOR SELECT
  USING (get_current_user_role() = 'admin');

CREATE POLICY "Admins can insert email settings"
  ON public.email_notification_settings FOR INSERT
  WITH CHECK (get_current_user_role() = 'admin');

CREATE POLICY "Admins can update email settings"
  ON public.email_notification_settings FOR UPDATE
  USING (get_current_user_role() = 'admin');

CREATE POLICY "Admins can view SMS settings"
  ON public.sms_notification_settings FOR SELECT
  USING (get_current_user_role() = 'admin');

CREATE POLICY "Admins can insert SMS settings"
  ON public.sms_notification_settings FOR INSERT
  WITH CHECK (get_current_user_role() = 'admin');

CREATE POLICY "Admins can update SMS settings"
  ON public.sms_notification_settings FOR UPDATE
  USING (get_current_user_role() = 'admin');

CREATE POLICY "Admins can view push settings"
  ON public.push_notification_settings FOR SELECT
  USING (get_current_user_role() = 'admin');

CREATE POLICY "Admins can insert push settings"
  ON public.push_notification_settings FOR INSERT
  WITH CHECK (get_current_user_role() = 'admin');

CREATE POLICY "Admins can update push settings"
  ON public.push_notification_settings FOR UPDATE
  USING (get_current_user_role() = 'admin');

CREATE POLICY "Admins can manage email templates"
  ON public.email_templates FOR ALL
  USING (get_current_user_role() = 'admin');

CREATE POLICY "Admins can manage SMS templates"
  ON public.sms_templates FOR ALL
  USING (get_current_user_role() = 'admin');

CREATE POLICY "Admins can manage push templates"
  ON public.push_templates FOR ALL
  USING (get_current_user_role() = 'admin');

CREATE POLICY "Admins can manage triggers"
  ON public.notification_triggers FOR ALL
  USING (get_current_user_role() = 'admin');

-- Update timestamp trigger
CREATE TRIGGER update_email_notification_settings_updated_at
  BEFORE UPDATE ON public.email_notification_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sms_notification_settings_updated_at
  BEFORE UPDATE ON public.sms_notification_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_push_notification_settings_updated_at
  BEFORE UPDATE ON public.push_notification_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sms_templates_updated_at
  BEFORE UPDATE ON public.sms_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_push_templates_updated_at
  BEFORE UPDATE ON public.push_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notification_triggers_updated_at
  BEFORE UPDATE ON public.notification_triggers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();