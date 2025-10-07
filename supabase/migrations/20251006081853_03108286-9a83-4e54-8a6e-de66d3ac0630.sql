-- Phase 4: Key Rotation Tracking
-- Table to track encryption key rotation history
CREATE TABLE IF NOT EXISTS public.encryption_key_rotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rotation_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  rotated_by UUID REFERENCES auth.users(id),
  old_key_identifier TEXT,
  new_key_identifier TEXT NOT NULL DEFAULT 'field_encryption_key',
  records_re_encrypted INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('in_progress', 'completed', 'failed', 'rolled_back')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS Policies for encryption_key_rotations
ALTER TABLE public.encryption_key_rotations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view key rotation history"
  ON public.encryption_key_rotations
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert key rotation records"
  ON public.encryption_key_rotations
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Function to get key age in days
CREATE OR REPLACE FUNCTION public.get_encryption_key_age()
RETURNS INTEGER
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    EXTRACT(DAY FROM NOW() - MAX(rotation_date))::INTEGER,
    999  -- Return 999 if no rotation history exists
  )
  FROM public.encryption_key_rotations
  WHERE status = 'completed';
$$;

-- Function to check if key rotation is overdue
CREATE OR REPLACE FUNCTION public.is_key_rotation_overdue()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.get_encryption_key_age() > 365;
$$;

-- Index for performance
CREATE INDEX idx_key_rotations_date ON public.encryption_key_rotations(rotation_date DESC);