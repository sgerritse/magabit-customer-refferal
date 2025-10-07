-- Stage 2 Phase 1: Create database function for secure PII decryption
-- This function decrypts user PII with audit logging

CREATE OR REPLACE FUNCTION public.get_user_decrypted(target_user_id UUID)
RETURNS TABLE(
  id UUID,
  email TEXT,
  phone TEXT,
  first_name TEXT,
  last_name TEXT,
  date_of_birth DATE,
  father_type TEXT,
  number_of_kids INTEGER,
  age_of_kids TEXT,
  due_date DATE,
  wordpress_user_id TEXT,
  wordpress_synced BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log access if admin is accessing another user's data
  IF auth.uid() != target_user_id AND public.has_role(auth.uid(), 'admin') THEN
    INSERT INTO public.security_audit_logs (
      user_id,
      admin_user_id,
      action,
      target_user_id,
      new_values
    ) VALUES (
      auth.uid(),
      auth.uid(),
      'ACCESS_DECRYPTED_USER_PII',
      target_user_id,
      jsonb_build_object(
        'accessed_fields', ARRAY['first_name', 'last_name', 'date_of_birth']
      )
    );
  END IF;

  -- Check authorization: user accessing own data OR admin
  IF auth.uid() = target_user_id OR public.has_role(auth.uid(), 'admin') THEN
    RETURN QUERY
    SELECT 
      u.id,
      u.email,
      u.phone,
      -- Decrypt PII fields or fallback to plaintext during migration
      COALESCE(
        public.decrypt_sensitive_data(u.first_name_encrypted),
        u.first_name
      ) as first_name,
      COALESCE(
        public.decrypt_sensitive_data(u.last_name_encrypted),
        u.last_name
      ) as last_name,
      COALESCE(
        CASE 
          WHEN u.date_of_birth_encrypted IS NOT NULL 
          THEN public.decrypt_sensitive_data(u.date_of_birth_encrypted)::DATE
          ELSE u.date_of_birth
        END,
        u.date_of_birth
      ) as date_of_birth,
      u.father_type,
      u.number_of_kids,
      u.age_of_kids,
      u.due_date,
      u.wordpress_user_id,
      u.wordpress_synced,
      u.created_at,
      u.updated_at
    FROM public.users u
    WHERE u.id = target_user_id;
  ELSE
    RAISE EXCEPTION 'Unauthorized access to user PII';
  END IF;
END;
$$;

COMMENT ON FUNCTION public.get_user_decrypted(UUID) IS 'Securely decrypts user PII with audit logging. Only accessible by data owner or admins.';