-- Create whitelisted_ips table for fraud prevention
CREATE TABLE IF NOT EXISTS public.whitelisted_ips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address INET NOT NULL UNIQUE,
  reason TEXT,
  added_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create fraud_alerts table to log violations
CREATE TABLE IF NOT EXISTS public.fraud_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium',
  details JSONB NOT NULL DEFAULT '{}',
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_fraud_alerts_user_id ON public.fraud_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_fraud_alerts_created_at ON public.fraud_alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fraud_alerts_resolved ON public.fraud_alerts(resolved) WHERE resolved = false;

-- RLS policies for whitelisted_ips
ALTER TABLE public.whitelisted_ips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage whitelisted IPs"
  ON public.whitelisted_ips
  FOR ALL
  USING (get_current_user_role() = 'admin');

-- RLS policies for fraud_alerts
ALTER TABLE public.fraud_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all fraud alerts"
  ON public.fraud_alerts
  FOR SELECT
  USING (get_current_user_role() = 'admin');

CREATE POLICY "System can insert fraud alerts"
  ON public.fraud_alerts
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can update fraud alerts"
  ON public.fraud_alerts
  FOR UPDATE
  USING (get_current_user_role() = 'admin');

-- Function to check if IP is whitelisted
CREATE OR REPLACE FUNCTION public.is_ip_whitelisted(check_ip INET)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.whitelisted_ips WHERE ip_address = check_ip
  );
$$;

-- Trigger function to detect velocity violations and create alerts
CREATE OR REPLACE FUNCTION public.detect_fraud_violations()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_affiliate_settings RECORD;
  v_hourly_count INTEGER;
  v_daily_count INTEGER;
  v_ip_count INTEGER;
BEGIN
  -- Get affiliate settings
  SELECT * INTO v_affiliate_settings FROM public.affiliate_settings LIMIT 1;
  
  -- Skip if velocity limits not enabled
  IF v_affiliate_settings.velocity_limits_enabled = false THEN
    RETURN NEW;
  END IF;
  
  -- Skip if IP is whitelisted
  IF is_ip_whitelisted(NEW.visitor_ip) THEN
    RETURN NEW;
  END IF;
  
  -- Check hourly referral limit
  SELECT COUNT(*) INTO v_hourly_count
  FROM public.referral_visits
  WHERE referrer_user_id = NEW.referrer_user_id
    AND visited_at >= now() - INTERVAL '1 hour';
    
  IF v_hourly_count > v_affiliate_settings.max_referrals_per_hour THEN
    INSERT INTO public.fraud_alerts (user_id, alert_type, severity, details)
    VALUES (
      NEW.referrer_user_id,
      'velocity_hourly',
      'high',
      jsonb_build_object(
        'count', v_hourly_count,
        'limit', v_affiliate_settings.max_referrals_per_hour,
        'ip', host(NEW.visitor_ip)
      )
    );
  END IF;
  
  -- Check daily referral limit
  SELECT COUNT(*) INTO v_daily_count
  FROM public.referral_visits
  WHERE referrer_user_id = NEW.referrer_user_id
    AND visited_at >= now() - INTERVAL '24 hours';
    
  IF v_daily_count > v_affiliate_settings.max_referrals_per_day THEN
    INSERT INTO public.fraud_alerts (user_id, alert_type, severity, details)
    VALUES (
      NEW.referrer_user_id,
      'velocity_daily',
      'high',
      jsonb_build_object(
        'count', v_daily_count,
        'limit', v_affiliate_settings.max_referrals_per_day,
        'ip', host(NEW.visitor_ip)
      )
    );
  END IF;
  
  -- Check IP duplication
  SELECT COUNT(DISTINCT referrer_user_id) INTO v_ip_count
  FROM public.referral_visits
  WHERE visitor_ip = NEW.visitor_ip
    AND visited_at >= now() - INTERVAL '24 hours';
    
  IF v_ip_count > v_affiliate_settings.max_signups_per_ip_per_day THEN
    INSERT INTO public.fraud_alerts (user_id, alert_type, severity, details)
    VALUES (
      NEW.referrer_user_id,
      'ip_duplication',
      'critical',
      jsonb_build_object(
        'ip', host(NEW.visitor_ip),
        'user_count', v_ip_count,
        'limit', v_affiliate_settings.max_signups_per_ip_per_day
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on referral_visits
DROP TRIGGER IF EXISTS trigger_detect_fraud ON public.referral_visits;
CREATE TRIGGER trigger_detect_fraud
  AFTER INSERT ON public.referral_visits
  FOR EACH ROW
  EXECUTE FUNCTION public.detect_fraud_violations();

-- Update updated_at timestamp trigger for whitelisted_ips
CREATE TRIGGER update_whitelisted_ips_updated_at
  BEFORE UPDATE ON public.whitelisted_ips
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();