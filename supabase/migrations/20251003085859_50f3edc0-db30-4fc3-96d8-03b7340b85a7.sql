-- Create marketing creatives storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('marketing-creatives', 'marketing-creatives', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for marketing creatives bucket
CREATE POLICY "Admins can upload marketing creatives"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'marketing-creatives' 
  AND get_current_user_role() = 'admin'
);

CREATE POLICY "Admins can update marketing creatives"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'marketing-creatives' 
  AND get_current_user_role() = 'admin'
);

CREATE POLICY "Admins can delete marketing creatives"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'marketing-creatives' 
  AND get_current_user_role() = 'admin'
);

CREATE POLICY "Anyone can view marketing creatives"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'marketing-creatives');

-- Add index for better performance on referral visits queries
CREATE INDEX IF NOT EXISTS idx_referral_visits_user_date 
ON referral_visits(referrer_user_id, visited_at DESC);

CREATE INDEX IF NOT EXISTS idx_referral_visits_link_date 
ON referral_visits(referral_link_id, visited_at DESC);

CREATE INDEX IF NOT EXISTS idx_ambassador_earnings_user_date 
ON ambassador_earnings(user_id, earned_at DESC);

-- Add function to get ambassador analytics
CREATE OR REPLACE FUNCTION get_ambassador_analytics(
  p_user_id UUID,
  p_start_date TIMESTAMPTZ DEFAULT NULL,
  p_end_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSON;
  v_start_date TIMESTAMPTZ;
  v_end_date TIMESTAMPTZ;
BEGIN
  -- Default to last 30 days if not specified
  v_start_date := COALESCE(p_start_date, NOW() - INTERVAL '30 days');
  v_end_date := COALESCE(p_end_date, NOW());

  SELECT json_build_object(
    'total_clicks', (
      SELECT COUNT(*) 
      FROM referral_visits 
      WHERE referrer_user_id = p_user_id 
        AND visited_at BETWEEN v_start_date AND v_end_date
    ),
    'total_conversions', (
      SELECT COUNT(*) 
      FROM referral_visits 
      WHERE referrer_user_id = p_user_id 
        AND converted = true
        AND converted_at BETWEEN v_start_date AND v_end_date
    ),
    'total_earnings', (
      SELECT COALESCE(SUM(amount), 0)
      FROM ambassador_earnings 
      WHERE user_id = p_user_id 
        AND earned_at BETWEEN v_start_date AND v_end_date
    ),
    'visits_by_date', (
      SELECT json_agg(
        json_build_object(
          'date', date::text,
          'visits', visit_count,
          'conversions', conversion_count
        ) ORDER BY date
      )
      FROM (
        SELECT 
          DATE(visited_at) as date,
          COUNT(*) as visit_count,
          COUNT(*) FILTER (WHERE converted = true) as conversion_count
        FROM referral_visits
        WHERE referrer_user_id = p_user_id
          AND visited_at BETWEEN v_start_date AND v_end_date
        GROUP BY DATE(visited_at)
        ORDER BY date
      ) daily_stats
    ),
    'visits_by_link_type', (
      SELECT json_agg(
        json_build_object(
          'link_type', link_type,
          'visits', visit_count,
          'conversions', conversion_count
        )
      )
      FROM (
        SELECT 
          link_type,
          COUNT(*) as visit_count,
          COUNT(*) FILTER (WHERE converted = true) as conversion_count
        FROM referral_visits
        WHERE referrer_user_id = p_user_id
          AND visited_at BETWEEN v_start_date AND v_end_date
        GROUP BY link_type
      ) link_stats
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;