-- =====================================================
-- PRIORITY 3: MEDIUM - Enhanced Fraud Detection
-- =====================================================

-- Step 1: Create admin_access_locations table to track admin access patterns
CREATE TABLE IF NOT EXISTS public.admin_access_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_address inet,
  country text,
  city text,
  first_seen_at timestamptz DEFAULT now(),
  last_seen_at timestamptz DEFAULT now(),
  access_count integer DEFAULT 1,
  is_flagged boolean DEFAULT false,
  flagged_reason text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_access_locations ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view location tracking
CREATE POLICY "Admins can view location tracking"
ON public.admin_access_locations
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Policy: System can manage locations
CREATE POLICY "System can manage locations"
ON public.admin_access_locations
FOR ALL
USING (true)
WITH CHECK (true);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_admin_locations_user ON public.admin_access_locations(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_locations_flagged ON public.admin_access_locations(is_flagged) WHERE is_flagged = true;

-- Step 2: Drop and recreate detect_anomalous_access function with enhanced detection
DROP FUNCTION IF EXISTS public.detect_anomalous_access();

CREATE FUNCTION public.detect_anomalous_access()
RETURNS TABLE(
  user_id uuid,
  access_count bigint,
  unique_tables bigint,
  first_access timestamptz,
  last_access timestamptz,
  risk_level text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH access_stats AS (
    SELECT 
      admin_user_id as uid,
      COUNT(*) as total_access,
      COUNT(DISTINCT (new_values->>'table')) as tables_accessed,
      MIN(created_at) as first,
      MAX(created_at) as last,
      -- Check for after-hours access (outside 9am-5pm UTC)
      COUNT(*) FILTER (
        WHERE EXTRACT(HOUR FROM created_at) < 9 OR EXTRACT(HOUR FROM created_at) > 17
      ) as after_hours_count,
      -- Check for excessive PII access
      COUNT(*) FILTER (
        WHERE action LIKE 'ACCESS_%PII%' OR action LIKE 'ACCESS_ENCRYPTED_%'
      ) as pii_access_count
    FROM public.security_audit_logs
    WHERE created_at >= NOW() - INTERVAL '24 hours'
      AND action LIKE 'ACCESS_%'
    GROUP BY admin_user_id
  )
  SELECT 
    uid as user_id,
    total_access as access_count,
    tables_accessed as unique_tables,
    first as first_access,
    last as last_access,
    CASE
      WHEN total_access > 100 OR pii_access_count > 100 THEN 'critical'::text
      WHEN total_access > 50 OR after_hours_count > 10 THEN 'high'::text
      WHEN after_hours_count > 0 THEN 'medium'::text
      ELSE 'low'::text
    END as risk_level
  FROM access_stats
  WHERE total_access > 50 OR after_hours_count > 0 OR pii_access_count > 50
  ORDER BY total_access DESC;
END;
$$;