-- Phase 2: Session Security & Profile Protection
-- Part 1: Session Management Tables

-- Create user_sessions table for tracking active sessions
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  device_fingerprint TEXT NOT NULL,
  device_name TEXT,
  ip_address INET,
  user_agent TEXT,
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 minutes'),
  is_remembered BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_sessions
CREATE POLICY "Users can view own sessions"
ON public.user_sessions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions"
ON public.user_sessions FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all sessions"
ON public.user_sessions FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "System can manage sessions"
ON public.user_sessions FOR ALL
WITH CHECK (true);

-- Create trusted_devices table
CREATE TABLE IF NOT EXISTS public.trusted_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_fingerprint TEXT NOT NULL,
  device_name TEXT,
  trusted_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '90 days'),
  UNIQUE(user_id, device_fingerprint)
);

ALTER TABLE public.trusted_devices ENABLE ROW LEVEL SECURITY;

-- RLS policies for trusted_devices
CREATE POLICY "Users can view own trusted devices"
ON public.trusted_devices FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own trusted devices"
ON public.trusted_devices FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all trusted devices"
ON public.trusted_devices FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Create device_fingerprints table for anomaly detection
CREATE TABLE IF NOT EXISTS public.device_fingerprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.user_sessions(id) ON DELETE CASCADE,
  fingerprint_hash TEXT NOT NULL,
  browser TEXT,
  os TEXT,
  screen_resolution TEXT,
  timezone TEXT,
  ip_address INET,
  geolocation JSONB,
  is_suspicious BOOLEAN DEFAULT false,
  flagged_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.device_fingerprints ENABLE ROW LEVEL SECURITY;

-- RLS policies for device_fingerprints
CREATE POLICY "Users can view own fingerprints"
ON public.device_fingerprints FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all fingerprints"
ON public.device_fingerprints FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert fingerprints"
ON public.device_fingerprints FOR INSERT
WITH CHECK (true);

-- Create profile_query_rate_limits table
CREATE TABLE IF NOT EXISTS public.profile_query_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_address INET,
  query_count INTEGER DEFAULT 0,
  window_start TIMESTAMPTZ DEFAULT NOW(),
  blocked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profile_query_rate_limits ENABLE ROW LEVEL SECURITY;

-- RLS policies for rate limits
CREATE POLICY "Admins can view all rate limits"
ON public.profile_query_rate_limits FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "System can manage rate limits"
ON public.profile_query_rate_limits FOR ALL
WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON public.user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_last_activity ON public.user_sessions(last_activity_at);
CREATE INDEX IF NOT EXISTS idx_trusted_devices_user_id ON public.trusted_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_device_fingerprints_user_id ON public.device_fingerprints(user_id);
CREATE INDEX IF NOT EXISTS idx_device_fingerprints_suspicious ON public.device_fingerprints(is_suspicious) WHERE is_suspicious = true;
CREATE INDEX IF NOT EXISTS idx_rate_limits_user_id ON public.profile_query_rate_limits(user_id);
CREATE INDEX IF NOT EXISTS idx_rate_limits_ip ON public.profile_query_rate_limits(ip_address);

-- Function to validate and refresh session
CREATE OR REPLACE FUNCTION public.validate_session(p_session_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session RECORD;
  v_is_valid BOOLEAN;
  v_session_count INTEGER;
BEGIN
  -- Get session details
  SELECT * INTO v_session
  FROM public.user_sessions
  WHERE session_token = p_session_token;
  
  -- Check if session exists
  IF v_session IS NULL THEN
    RETURN jsonb_build_object(
      'valid', false,
      'reason', 'session_not_found'
    );
  END IF;
  
  -- Check if session has expired
  IF v_session.expires_at < NOW() THEN
    -- Clean up expired session
    DELETE FROM public.user_sessions WHERE id = v_session.id;
    
    RETURN jsonb_build_object(
      'valid', false,
      'reason', 'session_expired'
    );
  END IF;
  
  -- Check for inactivity timeout (30 minutes)
  IF v_session.last_activity_at < (NOW() - INTERVAL '30 minutes') AND v_session.is_remembered = false THEN
    -- Clean up inactive session
    DELETE FROM public.user_sessions WHERE id = v_session.id;
    
    RETURN jsonb_build_object(
      'valid', false,
      'reason', 'session_inactive'
    );
  END IF;
  
  -- Update last activity
  UPDATE public.user_sessions
  SET last_activity_at = NOW(),
      expires_at = NOW() + INTERVAL '30 minutes'
  WHERE id = v_session.id;
  
  -- Session is valid
  RETURN jsonb_build_object(
    'valid', true,
    'user_id', v_session.user_id,
    'session_id', v_session.id,
    'expires_at', v_session.expires_at
  );
END;
$$;

-- Function to revoke old sessions when limit exceeded
CREATE OR REPLACE FUNCTION public.revoke_old_sessions(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session_count INTEGER;
  v_revoked_count INTEGER := 0;
BEGIN
  -- Count active sessions
  SELECT COUNT(*) INTO v_session_count
  FROM public.user_sessions
  WHERE user_id = p_user_id
    AND expires_at > NOW();
  
  -- If more than 3 sessions, revoke oldest ones
  IF v_session_count > 3 THEN
    WITH old_sessions AS (
      DELETE FROM public.user_sessions
      WHERE id IN (
        SELECT id FROM public.user_sessions
        WHERE user_id = p_user_id
          AND expires_at > NOW()
        ORDER BY last_activity_at ASC
        LIMIT (v_session_count - 3)
      )
      RETURNING *
    )
    SELECT COUNT(*) INTO v_revoked_count FROM old_sessions;
  END IF;
  
  RETURN v_revoked_count;
END;
$$;

-- Function to check profile query rate limit
CREATE OR REPLACE FUNCTION public.check_rate_limit(p_user_id UUID, p_ip_address INET)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rate_limit RECORD;
  v_is_blocked BOOLEAN := false;
BEGIN
  -- Get or create rate limit record
  SELECT * INTO v_rate_limit
  FROM public.profile_query_rate_limits
  WHERE (user_id = p_user_id OR ip_address = p_ip_address)
  ORDER BY updated_at DESC
  LIMIT 1;
  
  -- Check if currently blocked
  IF v_rate_limit.blocked_until IS NOT NULL AND v_rate_limit.blocked_until > NOW() THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'rate_limit_exceeded',
      'blocked_until', v_rate_limit.blocked_until
    );
  END IF;
  
  -- Check if window has expired (1 hour)
  IF v_rate_limit IS NULL OR v_rate_limit.window_start < (NOW() - INTERVAL '1 hour') THEN
    -- Start new window
    INSERT INTO public.profile_query_rate_limits (user_id, ip_address, query_count)
    VALUES (p_user_id, p_ip_address, 1)
    ON CONFLICT (user_id, ip_address) 
    DO UPDATE SET 
      query_count = 1,
      window_start = NOW(),
      blocked_until = NULL,
      updated_at = NOW();
    
    RETURN jsonb_build_object('allowed', true, 'remaining', 99);
  END IF;
  
  -- Increment counter
  UPDATE public.profile_query_rate_limits
  SET query_count = query_count + 1,
      updated_at = NOW()
  WHERE id = v_rate_limit.id;
  
  -- Check if limit exceeded (100 per hour)
  IF v_rate_limit.query_count >= 100 THEN
    -- Block for 1 hour
    UPDATE public.profile_query_rate_limits
    SET blocked_until = NOW() + INTERVAL '1 hour'
    WHERE id = v_rate_limit.id;
    
    -- Create fraud alert
    INSERT INTO public.fraud_alerts (user_id, alert_type, severity, details)
    VALUES (
      p_user_id,
      'profile_enumeration_attempt',
      'high',
      jsonb_build_object(
        'queries_in_hour', v_rate_limit.query_count,
        'ip_address', host(p_ip_address)
      )
    );
    
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'rate_limit_exceeded',
      'blocked_until', NOW() + INTERVAL '1 hour'
    );
  END IF;
  
  RETURN jsonb_build_object(
    'allowed', true,
    'remaining', 100 - v_rate_limit.query_count
  );
END;
$$;

-- Function to log device fingerprint
CREATE OR REPLACE FUNCTION public.log_device_fingerprint(
  p_user_id UUID,
  p_session_id UUID,
  p_fingerprint_hash TEXT,
  p_browser TEXT,
  p_os TEXT,
  p_screen_resolution TEXT,
  p_timezone TEXT,
  p_ip_address INET,
  p_geolocation JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_fingerprint_id UUID;
  v_last_fingerprint RECORD;
  v_is_suspicious BOOLEAN := false;
  v_flagged_reason TEXT := NULL;
BEGIN
  -- Get last fingerprint for this user
  SELECT * INTO v_last_fingerprint
  FROM public.device_fingerprints
  WHERE user_id = p_user_id
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Check for suspicious changes
  IF v_last_fingerprint IS NOT NULL THEN
    -- Check for location jump (different IP subnet)
    IF host(v_last_fingerprint.ip_address) != host(p_ip_address) THEN
      -- Check if created within last hour
      IF v_last_fingerprint.created_at > (NOW() - INTERVAL '1 hour') THEN
        v_is_suspicious := true;
        v_flagged_reason := 'Rapid location change detected';
      END IF;
    END IF;
    
    -- Check for fingerprint mismatch with same IP
    IF v_last_fingerprint.fingerprint_hash != p_fingerprint_hash 
       AND host(v_last_fingerprint.ip_address) = host(p_ip_address) THEN
      v_is_suspicious := true;
      v_flagged_reason := COALESCE(v_flagged_reason || '; ', '') || 'Device fingerprint changed from same IP';
    END IF;
  END IF;
  
  -- Insert fingerprint
  INSERT INTO public.device_fingerprints (
    user_id,
    session_id,
    fingerprint_hash,
    browser,
    os,
    screen_resolution,
    timezone,
    ip_address,
    geolocation,
    is_suspicious,
    flagged_reason
  ) VALUES (
    p_user_id,
    p_session_id,
    p_fingerprint_hash,
    p_browser,
    p_os,
    p_screen_resolution,
    p_timezone,
    p_ip_address,
    p_geolocation,
    v_is_suspicious,
    v_flagged_reason
  )
  RETURNING id INTO v_fingerprint_id;
  
  -- Create fraud alert if suspicious
  IF v_is_suspicious THEN
    INSERT INTO public.fraud_alerts (user_id, alert_type, severity, details)
    VALUES (
      p_user_id,
      'suspicious_device_change',
      'high',
      jsonb_build_object(
        'reason', v_flagged_reason,
        'new_ip', host(p_ip_address),
        'old_ip', CASE WHEN v_last_fingerprint IS NOT NULL 
                       THEN host(v_last_fingerprint.ip_address) 
                       ELSE NULL END
      )
    );
  END IF;
  
  RETURN v_fingerprint_id;
END;
$$;

-- Function to detect payment method anomalies
CREATE OR REPLACE FUNCTION public.detect_payment_anomalies(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_recent_changes INTEGER;
  v_last_change RECORD;
  v_current_fingerprint RECORD;
  v_anomalies TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- Count payment method changes in last 7 days
  SELECT COUNT(*) INTO v_recent_changes
  FROM public.payout_method_changes
  WHERE user_id = p_user_id
    AND created_at >= NOW() - INTERVAL '7 days';
  
  -- Flag if >2 changes in 7 days
  IF v_recent_changes > 2 THEN
    v_anomalies := array_append(v_anomalies, 'Frequent payment changes: ' || v_recent_changes || ' in 7 days');
  END IF;
  
  -- Get last payment change
  SELECT * INTO v_last_change
  FROM public.payout_method_changes
  WHERE user_id = p_user_id
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Get current device fingerprint
  SELECT * INTO v_current_fingerprint
  FROM public.device_fingerprints
  WHERE user_id = p_user_id
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Check if fingerprint is suspicious
  IF v_current_fingerprint.is_suspicious THEN
    v_anomalies := array_append(v_anomalies, 'Suspicious device: ' || v_current_fingerprint.flagged_reason);
  END IF;
  
  -- Return results
  RETURN jsonb_build_object(
    'has_anomalies', array_length(v_anomalies, 1) > 0,
    'anomalies', v_anomalies,
    'recent_changes', v_recent_changes,
    'requires_verification', array_length(v_anomalies, 1) > 0
  );
END;
$$;

-- Add constraint to profile_query_rate_limits
ALTER TABLE public.profile_query_rate_limits
ADD CONSTRAINT unique_user_or_ip UNIQUE NULLS NOT DISTINCT (user_id, ip_address);