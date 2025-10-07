-- ============================================
-- BRAND AMBASSADOR / AFFILIATE SYSTEM
-- Complete Database Schema Migration
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. REFERRAL LINKS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.referral_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  link_type TEXT NOT NULL CHECK (link_type IN ('main', 'shop', 'waitlist-a', 'waitlist-b')),
  username TEXT NOT NULL,
  full_url TEXT NOT NULL,
  clicks_count INTEGER DEFAULT 0,
  conversions_count INTEGER DEFAULT 0,
  last_click_at TIMESTAMP WITH TIME ZONE,
  notifications_enabled JSONB DEFAULT '{"push": true, "sms": true, "email": true}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, link_type)
);

-- ============================================
-- 2. REFERRAL VISITS TABLE (365-day attribution)
-- ============================================
CREATE TABLE IF NOT EXISTS public.referral_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_link_id UUID REFERENCES public.referral_links(id) ON DELETE CASCADE,
  referrer_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  visitor_id TEXT NOT NULL,
  visited_page TEXT NOT NULL,
  landing_page TEXT,
  user_agent TEXT,
  ip_address INET,
  country_code TEXT,
  state_code TEXT,
  city TEXT,
  converted BOOLEAN DEFAULT false,
  converted_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  conversion_value NUMERIC(10,2),
  conversion_date TIMESTAMP WITH TIME ZONE,
  subscription_id TEXT,
  subscription_status TEXT,
  days_active INTEGER DEFAULT 0,
  subscription_start_date TIMESTAMP WITH TIME ZONE,
  billing_cycle_number INTEGER DEFAULT 0,
  visited_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_referral_visits_visitor_id ON public.referral_visits(visitor_id);
CREATE INDEX idx_referral_visits_referrer ON public.referral_visits(referrer_user_id);
CREATE INDEX idx_referral_visits_converted ON public.referral_visits(converted);
CREATE INDEX idx_referral_visits_visited_at ON public.referral_visits(visited_at);

-- ============================================
-- 3. AMBASSADOR EARNINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.ambassador_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_visit_id UUID REFERENCES public.referral_visits(id) ON DELETE SET NULL,
  amount NUMERIC(10,2) NOT NULL,
  commission_rate NUMERIC(5,2) NOT NULL,
  commission_type TEXT NOT NULL CHECK (commission_type IN ('percentage', 'flat')),
  product_id UUID REFERENCES public.packages(id) ON DELETE SET NULL,
  subscription_id TEXT,
  billing_cycle_number INTEGER DEFAULT 1,
  campaign_boost_applied BOOLEAN DEFAULT false,
  campaign_boost_amount NUMERIC(10,2) DEFAULT 0,
  tier_at_earning TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'reversed')),
  payout_id UUID,
  notes TEXT,
  tax_year INTEGER,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  approved_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_ambassador_earnings_user ON public.ambassador_earnings(user_id);
CREATE INDEX idx_ambassador_earnings_status ON public.ambassador_earnings(status);
CREATE INDEX idx_ambassador_earnings_earned_at ON public.ambassador_earnings(earned_at);

-- ============================================
-- 4. AMBASSADOR PAYOUT METHODS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.ambassador_payout_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  payout_method TEXT CHECK (payout_method IN ('stripe', 'paypal', 'bank_transfer')),
  stripe_account_id TEXT,
  paypal_email TEXT,
  bank_details JSONB,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================
-- 5. AMBASSADOR PAYOUTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.ambassador_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  payout_method TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  transaction_id TEXT,
  failure_reason TEXT,
  processed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_ambassador_payouts_user ON public.ambassador_payouts(user_id);
CREATE INDEX idx_ambassador_payouts_status ON public.ambassador_payouts(status);

-- ============================================
-- 6. AFFILIATE SETTINGS TABLE (Global Config)
-- ============================================
CREATE TABLE IF NOT EXISTS public.affiliate_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cookie_attribution_days INTEGER DEFAULT 365,
  default_commission_rate NUMERIC(5,2) DEFAULT 30.00,
  default_commission_type TEXT DEFAULT 'percentage' CHECK (default_commission_type IN ('percentage', 'flat')),
  campaign_boost_enabled BOOLEAN DEFAULT false,
  campaign_boost_target TEXT DEFAULT 'all' CHECK (campaign_boost_target IN ('all', 'selected')),
  campaign_boost_amount NUMERIC(10,2) DEFAULT 0,
  campaign_boost_start_date TIMESTAMP WITH TIME ZONE,
  campaign_boost_end_date TIMESTAMP WITH TIME ZONE,
  notification_frequency TEXT DEFAULT 'daily_digest' CHECK (notification_frequency IN ('immediate', 'daily_digest')),
  auto_payout_enabled BOOLEAN DEFAULT false,
  auto_payout_schedule TEXT DEFAULT 'monthly' CHECK (auto_payout_schedule IN ('daily', 'weekly', 'monthly')),
  auto_payout_day INTEGER DEFAULT 15,
  auto_payout_time TIME DEFAULT '09:00:00',
  minimum_payout_amount NUMERIC(10,2) DEFAULT 1.00,
  velocity_limits_enabled BOOLEAN DEFAULT false,
  max_referrals_per_hour INTEGER DEFAULT 10,
  max_referrals_per_day INTEGER DEFAULT 50,
  max_signups_per_ip_per_day INTEGER DEFAULT 3,
  tiered_commissions_enabled BOOLEAN DEFAULT false,
  bronze_threshold INTEGER DEFAULT 0,
  bronze_rate NUMERIC(5,2) DEFAULT 30.00,
  silver_threshold INTEGER DEFAULT 10,
  silver_rate NUMERIC(5,2) DEFAULT 35.00,
  gold_threshold INTEGER DEFAULT 25,
  gold_rate NUMERIC(5,2) DEFAULT 40.00,
  max_emails_per_hour INTEGER DEFAULT 10,
  max_emails_per_day INTEGER DEFAULT 50,
  max_sms_per_hour INTEGER DEFAULT 5,
  max_sms_per_day INTEGER DEFAULT 20,
  spam_keywords JSONB DEFAULT '["click here", "free money", "urgent", "act now"]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert default settings
INSERT INTO public.affiliate_settings (id) VALUES (gen_random_uuid()) ON CONFLICT DO NOTHING;

-- ============================================
-- 7. USER COMMISSION OVERRIDES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_commission_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  commission_rate NUMERIC(5,2) NOT NULL,
  commission_type TEXT NOT NULL CHECK (commission_type IN ('percentage', 'flat')),
  reason TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================
-- 8. CAMPAIGN BOOST AMBASSADORS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.campaign_boost_ambassadors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_start_date TIMESTAMP WITH TIME ZONE,
  campaign_end_date TIMESTAMP WITH TIME ZONE,
  boost_amount NUMERIC(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- ============================================
-- 9. AMBASSADOR LANDING PAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.ambassador_landing_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  enabled BOOLEAN DEFAULT false,
  youtube_url TEXT,
  custom_content TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================
-- 10. NOTIFICATION QUEUE TABLE (Daily Digest)
-- ============================================
CREATE TABLE IF NOT EXISTS public.notification_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('push', 'sms', 'email')),
  data JSONB NOT NULL,
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_notification_queue_user ON public.notification_queue(user_id);
CREATE INDEX idx_notification_queue_processed ON public.notification_queue(processed);

-- ============================================
-- 11. EMAIL RATE LIMITS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.email_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hourly_count INTEGER DEFAULT 0,
  daily_count INTEGER DEFAULT 0,
  hourly_reset_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '1 hour'),
  daily_reset_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '1 day'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- ============================================
-- 12. SMS RATE LIMITS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.sms_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hourly_count INTEGER DEFAULT 0,
  daily_count INTEGER DEFAULT 0,
  hourly_reset_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '1 hour'),
  daily_reset_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '1 day'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- ============================================
-- 13. EMAIL SEQUENCES TABLE (Drag-and-Drop)
-- ============================================
CREATE TABLE IF NOT EXISTS public.email_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_name TEXT NOT NULL UNIQUE,
  description TEXT,
  trigger_event TEXT NOT NULL CHECK (trigger_event IN ('first_challenge_completed', 'ambassador_signup', 'trial_started')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================
-- 14. EMAIL SEQUENCE STEPS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.email_sequence_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id UUID NOT NULL REFERENCES public.email_sequences(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.email_templates(id) ON DELETE SET NULL,
  step_order INTEGER NOT NULL,
  delay_days INTEGER DEFAULT 0,
  delay_hours INTEGER DEFAULT 0,
  send_time TIME DEFAULT '08:00:00',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(sequence_id, step_order)
);

-- ============================================
-- 15. EMAIL SEQUENCE PROGRESS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.email_sequence_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sequence_id UUID NOT NULL REFERENCES public.email_sequences(id) ON DELETE CASCADE,
  current_step INTEGER DEFAULT 0,
  next_send_at TIMESTAMP WITH TIME ZONE,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, sequence_id)
);

-- ============================================
-- 16. ADD TAX COMPLIANCE TO PROFILES
-- ============================================
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS tax_id_type TEXT,
  ADD COLUMN IF NOT EXISTS tax_id_last_four TEXT,
  ADD COLUMN IF NOT EXISTS w9_submitted BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS w9_submitted_date TIMESTAMP WITH TIME ZONE;

-- ============================================
-- 17. ADD COMMISSION TRACKING TO PACKAGES
-- ============================================
ALTER TABLE public.packages 
  ADD COLUMN IF NOT EXISTS commission_enabled BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS commission_rate NUMERIC(5,2) DEFAULT 30.00,
  ADD COLUMN IF NOT EXISTS commission_type TEXT DEFAULT 'percentage' CHECK (commission_type IN ('percentage', 'flat'));

-- ============================================
-- 18. AMBASSADOR TIERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.ambassador_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  current_tier TEXT DEFAULT 'bronze' CHECK (current_tier IN ('bronze', 'silver', 'gold')),
  monthly_conversions INTEGER DEFAULT 0,
  tier_calculated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  tier_reset_at TIMESTAMP WITH TIME ZONE DEFAULT (date_trunc('month', now()) + interval '1 month'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- referral_links
ALTER TABLE public.referral_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own referral links"
  ON public.referral_links FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own referral links"
  ON public.referral_links FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own referral links"
  ON public.referral_links FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all referral links"
  ON public.referral_links FOR ALL
  USING (get_current_user_role() = 'admin');

-- referral_visits
ALTER TABLE public.referral_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own referral visits"
  ON public.referral_visits FOR SELECT
  USING (auth.uid() = referrer_user_id);

CREATE POLICY "System can insert referral visits"
  ON public.referral_visits FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all referral visits"
  ON public.referral_visits FOR SELECT
  USING (get_current_user_role() = 'admin');

-- ambassador_earnings
ALTER TABLE public.ambassador_earnings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own earnings"
  ON public.ambassador_earnings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert earnings"
  ON public.ambassador_earnings FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can manage all earnings"
  ON public.ambassador_earnings FOR ALL
  USING (get_current_user_role() = 'admin');

-- ambassador_payout_methods
ALTER TABLE public.ambassador_payout_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own payout methods"
  ON public.ambassador_payout_methods FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all payout methods"
  ON public.ambassador_payout_methods FOR SELECT
  USING (get_current_user_role() = 'admin');

-- ambassador_payouts
ALTER TABLE public.ambassador_payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payouts"
  ON public.ambassador_payouts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can request payouts"
  ON public.ambassador_payouts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all payouts"
  ON public.ambassador_payouts FOR ALL
  USING (get_current_user_role() = 'admin');

-- affiliate_settings
ALTER TABLE public.affiliate_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage affiliate settings"
  ON public.affiliate_settings FOR ALL
  USING (get_current_user_role() = 'admin');

-- user_commission_overrides
ALTER TABLE public.user_commission_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage commission overrides"
  ON public.user_commission_overrides FOR ALL
  USING (get_current_user_role() = 'admin');

-- ambassador_landing_pages
ALTER TABLE public.ambassador_landing_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own landing pages"
  ON public.ambassador_landing_pages FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can view approved landing pages"
  ON public.ambassador_landing_pages FOR SELECT
  USING (status = 'approved');

CREATE POLICY "Admins can manage all landing pages"
  ON public.ambassador_landing_pages FOR ALL
  USING (get_current_user_role() = 'admin');

-- email_sequences
ALTER TABLE public.email_sequences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage email sequences"
  ON public.email_sequences FOR ALL
  USING (get_current_user_role() = 'admin');

-- email_sequence_steps
ALTER TABLE public.email_sequence_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage sequence steps"
  ON public.email_sequence_steps FOR ALL
  USING (get_current_user_role() = 'admin');

-- ambassador_tiers
ALTER TABLE public.ambassador_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tier"
  ON public.ambassador_tiers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all tiers"
  ON public.ambassador_tiers FOR ALL
  USING (get_current_user_role() = 'admin');

-- ============================================
-- TRIGGERS
-- ============================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_referral_links_updated_at BEFORE UPDATE ON public.referral_links
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ambassador_payout_methods_updated_at BEFORE UPDATE ON public.ambassador_payout_methods
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_affiliate_settings_updated_at BEFORE UPDATE ON public.affiliate_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_commission_overrides_updated_at BEFORE UPDATE ON public.user_commission_overrides
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ambassador_landing_pages_updated_at BEFORE UPDATE ON public.ambassador_landing_pages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_sequences_updated_at BEFORE UPDATE ON public.email_sequences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_sequence_steps_updated_at BEFORE UPDATE ON public.email_sequence_steps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ambassador_tiers_updated_at BEFORE UPDATE ON public.ambassador_tiers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();