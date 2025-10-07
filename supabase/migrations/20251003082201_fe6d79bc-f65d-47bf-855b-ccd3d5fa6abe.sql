-- ============================================
-- FIX SECURITY WARNINGS
-- ============================================

-- 1. Fix function search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 2. Enable RLS and add policies for notification_queue
ALTER TABLE public.notification_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON public.notification_queue FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
  ON public.notification_queue FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update notifications"
  ON public.notification_queue FOR UPDATE
  USING (true);

CREATE POLICY "Admins can manage all notifications"
  ON public.notification_queue FOR ALL
  USING (get_current_user_role() = 'admin');

-- 3. Enable RLS and add policies for email_rate_limits
ALTER TABLE public.email_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own rate limits"
  ON public.email_rate_limits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can manage rate limits"
  ON public.email_rate_limits FOR ALL
  USING (true);

-- 4. Enable RLS and add policies for sms_rate_limits
ALTER TABLE public.sms_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sms rate limits"
  ON public.sms_rate_limits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can manage sms rate limits"
  ON public.sms_rate_limits FOR ALL
  USING (true);

-- 5. Enable RLS and add policies for campaign_boost_ambassadors
ALTER TABLE public.campaign_boost_ambassadors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own campaign boost"
  ON public.campaign_boost_ambassadors FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage campaign boosts"
  ON public.campaign_boost_ambassadors FOR ALL
  USING (get_current_user_role() = 'admin');

-- 6. Enable RLS and add policies for email_sequence_progress
ALTER TABLE public.email_sequence_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sequence progress"
  ON public.email_sequence_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can manage sequence progress"
  ON public.email_sequence_progress FOR ALL
  USING (true);

CREATE POLICY "Admins can view all sequence progress"
  ON public.email_sequence_progress FOR SELECT
  USING (get_current_user_role() = 'admin');