-- Create security monitor logs table
CREATE TABLE IF NOT EXISTS public.security_monitor_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  check_date DATE NOT NULL DEFAULT CURRENT_DATE,
  health_status TEXT NOT NULL CHECK (health_status IN ('OK', 'WARNING', 'CRITICAL')),
  fraud_alerts_count INTEGER DEFAULT 0,
  anomalous_access_count INTEGER DEFAULT 0,
  unencrypted_pii_count INTEGER DEFAULT 0,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.security_monitor_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can view security monitor logs"
  ON public.security_monitor_logs
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert security monitor logs"
  ON public.security_monitor_logs
  FOR INSERT
  WITH CHECK (true);

-- Add index for efficient querying
CREATE INDEX IF NOT EXISTS idx_security_monitor_logs_check_date 
  ON public.security_monitor_logs(check_date DESC);

-- Schedule daily security monitoring at 8:00 AM UTC
SELECT cron.schedule(
  'security-monitor-daily',
  '0 8 * * *',
  $$
  SELECT net.http_post(
    url := 'https://ctmzlorgzptgeluwjxwk.supabase.co/functions/v1/security-monitor',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN0bXpsb3JnenB0Z2VsdXdqeHdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5MTMyNzcsImV4cCI6MjA3MzQ4OTI3N30.sSt9h440CZ6aYyCdkALmGO5WEwL1z-6BBrnZeTJNkTI"}'::jsonb,
    body := '{"source": "cron"}'::jsonb
  ) as request_id;
  $$
);