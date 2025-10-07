-- Phase 2: Privacy Enhancement for Referral Tracking (Corrected)
-- Implements IP hashing, user agent truncation, and automated data retention

-- Enable pgcrypto extension for hashing (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pgcrypto SCHEMA extensions;

-- Create function to hash IP addresses using SHA-256
CREATE OR REPLACE FUNCTION public.hash_ip_address(ip inet)
RETURNS text
LANGUAGE sql
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT encode(extensions.digest(host(ip)::text, 'sha256'), 'hex');
$$;

COMMENT ON FUNCTION public.hash_ip_address IS 'Hashes IP addresses using SHA-256 for privacy protection. Returns hex-encoded hash string.';

-- Create function to truncate user agent strings (first 100 chars + browser/OS info)
CREATE OR REPLACE FUNCTION public.truncate_user_agent(ua text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    CASE 
      WHEN ua IS NULL THEN NULL
      WHEN length(ua) <= 100 THEN ua
      ELSE substring(ua, 1, 100) || '...'
    END;
$$;

COMMENT ON FUNCTION public.truncate_user_agent IS 'Truncates user agent strings to first 100 characters for privacy while preserving browser/OS identification.';

-- Add new privacy-enhanced columns to referral_visits
ALTER TABLE public.referral_visits 
ADD COLUMN IF NOT EXISTS ip_address_hash text,
ADD COLUMN IF NOT EXISTS user_agent_truncated text;

-- Migrate existing data to hashed/truncated format
UPDATE public.referral_visits
SET 
  ip_address_hash = public.hash_ip_address(ip_address),
  user_agent_truncated = public.truncate_user_agent(user_agent)
WHERE ip_address_hash IS NULL;

-- Drop the city column (too granular for privacy)
ALTER TABLE public.referral_visits DROP COLUMN IF EXISTS city;

-- Create function for automated data retention cleanup (365 days)
CREATE OR REPLACE FUNCTION public.cleanup_old_referral_visits()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count integer;
BEGIN
  -- Delete referral visits older than 365 days
  WITH deleted AS (
    DELETE FROM public.referral_visits
    WHERE visited_at < NOW() - INTERVAL '365 days'
    RETURNING *
  )
  SELECT COUNT(*) INTO deleted_count FROM deleted;
  
  -- Log the cleanup operation
  RAISE LOG 'Deleted % old referral visit records (older than 365 days)', deleted_count;
  
  RETURN deleted_count;
END;
$$;

COMMENT ON FUNCTION public.cleanup_old_referral_visits IS 'Automatically deletes referral visit records older than 365 days for data retention compliance.';

-- Schedule monthly cleanup using pg_cron (runs on 1st of each month at 2 AM UTC)
SELECT cron.schedule(
  'cleanup-old-referral-visits',
  '0 2 1 * *', -- At 02:00 on day-of-month 1
  $$
  SELECT public.cleanup_old_referral_visits();
  $$
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_referral_visits_ip_hash 
ON public.referral_visits(ip_address_hash);

CREATE INDEX IF NOT EXISTS idx_referral_visits_visited_at 
ON public.referral_visits(visited_at DESC);

CREATE INDEX IF NOT EXISTS idx_referral_visits_country_state 
ON public.referral_visits(country_code, state_code);

COMMENT ON TABLE public.referral_visits IS 'Stores privacy-enhanced referral visit tracking data. IP addresses are hashed (SHA-256), user agents truncated to 100 chars, and data is auto-deleted after 365 days.';