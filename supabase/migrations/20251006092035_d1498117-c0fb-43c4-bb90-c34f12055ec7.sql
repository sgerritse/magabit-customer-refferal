-- =====================================================
-- PRIORITY 2: HIGH - Enhance Answer Logs Privacy
-- =====================================================

-- Step 1: Drop existing answer logs RLS policy
DROP POLICY IF EXISTS "Privacy-aware answer logs viewing" ON public.answer_logs;

-- Step 2: Create new policy requiring authentication for all access
CREATE POLICY "Privacy-aware answer logs viewing - authenticated only"
ON public.answer_logs
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND (
    auth.uid() = user_id OR 
    privacy = 'public' OR 
    public.has_role(auth.uid(), 'admin')
  )
);

-- Step 3: Create query_rate_limits table for tracking query rates
CREATE TABLE IF NOT EXISTS public.query_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  query_type text NOT NULL, -- 'public_posts', 'billing_address', 'tax_docs', etc.
  hourly_count integer DEFAULT 0,
  daily_count integer DEFAULT 0,
  hourly_reset_at timestamptz DEFAULT (now() + interval '1 hour'),
  daily_reset_at timestamptz DEFAULT (now() + interval '1 day'),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, query_type)
);

-- Enable RLS on query_rate_limits
ALTER TABLE public.query_rate_limits ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own rate limits
CREATE POLICY "Users can view own rate limits"
ON public.query_rate_limits
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: System can manage rate limits
CREATE POLICY "System can manage rate limits"
ON public.query_rate_limits
FOR ALL
USING (true)
WITH CHECK (true);

-- Create index for efficient rate limit queries
CREATE INDEX IF NOT EXISTS idx_query_rate_limits_user_type ON public.query_rate_limits(user_id, query_type);
CREATE INDEX IF NOT EXISTS idx_query_rate_limits_reset ON public.query_rate_limits(hourly_reset_at, daily_reset_at);