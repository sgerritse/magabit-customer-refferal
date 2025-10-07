-- Fix audit trigger to avoid blocking service/admin operations
-- Ensures action is present; auto-populates user_id/admin_user_id/created_at when absent
CREATE OR REPLACE FUNCTION public.validate_audit_log_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Require action
  IF NEW.action IS NULL OR btrim(NEW.action) = '' THEN
    RAISE EXCEPTION 'Audit log must have action';
  END IF;

  -- Populate user_id when missing (service role or cascades)
  IF NEW.user_id IS NULL THEN
    NEW.user_id := COALESCE(auth.uid(), NEW.admin_user_id, '00000000-0000-0000-0000-000000000000'::uuid);
  END IF;

  -- Populate admin_user_id when missing
  IF NEW.admin_user_id IS NULL THEN
    NEW.admin_user_id := COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid);
  END IF;

  -- Ensure created_at
  IF NEW.created_at IS NULL THEN
    NEW.created_at := now();
  END IF;

  RETURN NEW;
END;
$$;