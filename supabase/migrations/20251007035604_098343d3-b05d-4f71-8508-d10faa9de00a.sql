-- Relax audit log constraints to prevent delete failures and service operations from breaking
-- 1) Drop strict FKs that require existing users; audit logs must survive after deletions
ALTER TABLE public.security_audit_logs DROP CONSTRAINT IF EXISTS security_audit_logs_user_id_fkey;
ALTER TABLE public.security_audit_logs DROP CONSTRAINT IF EXISTS security_audit_logs_admin_user_id_fkey;
ALTER TABLE public.security_audit_logs DROP CONSTRAINT IF EXISTS security_audit_logs_target_user_id_fkey;

-- 2) Strengthen the validator to prefer valid linkage when possible
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

  -- Prefer real actor when available, then admin, then target; finally fallback to a system UUID
  IF NEW.user_id IS NULL THEN
    NEW.user_id := COALESCE(auth.uid(), NEW.admin_user_id, NEW.target_user_id, '00000000-0000-0000-0000-000000000000'::uuid);
  END IF;

  IF NEW.admin_user_id IS NULL THEN
    NEW.admin_user_id := COALESCE(auth.uid(), NEW.user_id, NEW.target_user_id, '00000000-0000-0000-0000-000000000000'::uuid);
  END IF;

  -- Ensure created_at
  IF NEW.created_at IS NULL THEN
    NEW.created_at := now();
  END IF;

  RETURN NEW;
END;
$$;