-- Phase 1: Fix Plaintext PII - Update decryption functions to use encrypted columns
-- This ensures all PII access goes through encrypted columns only

-- Update get_user_decrypted to use encrypted email/phone columns
CREATE OR REPLACE FUNCTION public.get_user_decrypted(target_user_id uuid)
RETURNS TABLE(
  id uuid,
  email text,
  phone text,
  first_name text,
  last_name text,
  date_of_birth date,
  father_type text,
  number_of_kids integer,
  age_of_kids text,
  due_date date,
  wp_user_id integer,
  sync_status text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
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
        'accessed_fields', ARRAY['email', 'phone', 'first_name', 'last_name', 'date_of_birth']
      )
    );
  END IF;

  -- Check authorization: user accessing own data OR admin
  IF auth.uid() = target_user_id OR public.has_role(auth.uid(), 'admin') THEN
    RETURN QUERY
    SELECT 
      u.id,
      -- Decrypt email and phone from encrypted columns with fallback to plaintext (temporary during migration)
      COALESCE(public.decrypt_sensitive_data(u.email_encrypted), u.email, '') as email,
      COALESCE(public.decrypt_sensitive_data(u.phone_encrypted), u.phone, '') as phone,
      -- Decrypt other PII fields
      COALESCE(public.decrypt_sensitive_data(u.first_name_encrypted), '') as first_name,
      COALESCE(public.decrypt_sensitive_data(u.last_name_encrypted), '') as last_name,
      CASE 
        WHEN u.date_of_birth_encrypted IS NOT NULL 
        THEN public.decrypt_sensitive_data(u.date_of_birth_encrypted)::DATE
        ELSE NULL
      END as date_of_birth,
      u.father_type,
      u.number_of_kids,
      u.age_of_kids,
      u.due_date,
      u.wp_user_id,
      u.sync_status,
      u.created_at,
      u.updated_at
    FROM public.users u
    WHERE u.id = target_user_id;
  ELSE
    RAISE EXCEPTION 'Unauthorized access to user PII';
  END IF;
END;
$$;

-- Update get_all_users_decrypted for admin access
CREATE OR REPLACE FUNCTION public.get_all_users_decrypted()
RETURNS TABLE(
  id uuid,
  email text,
  phone text,
  first_name text,
  last_name text,
  date_of_birth date,
  father_type text,
  number_of_kids integer,
  age_of_kids text,
  due_date date,
  wp_user_id integer,
  sync_status text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins can access this function
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Only administrators can access this function';
  END IF;

  -- Log admin access to bulk user data
  INSERT INTO public.security_audit_logs (
    user_id,
    admin_user_id,
    action,
    target_user_id,
    new_values
  ) VALUES (
    auth.uid(),
    auth.uid(),
    'ACCESS_ALL_USERS_DECRYPTED',
    auth.uid(),
    jsonb_build_object('accessed_at', NOW())
  );

  RETURN QUERY
  SELECT 
    u.id,
    -- Decrypt email and phone from encrypted columns with fallback to plaintext (temporary during migration)
    COALESCE(public.decrypt_sensitive_data(u.email_encrypted), u.email, '') as email,
    COALESCE(public.decrypt_sensitive_data(u.phone_encrypted), u.phone, '') as phone,
    -- Decrypt other PII fields
    COALESCE(public.decrypt_sensitive_data(u.first_name_encrypted), '') as first_name,
    COALESCE(public.decrypt_sensitive_data(u.last_name_encrypted), '') as last_name,
    COALESCE(
      CASE 
        WHEN u.date_of_birth_encrypted IS NOT NULL 
        THEN public.decrypt_sensitive_data(u.date_of_birth_encrypted)::DATE
        ELSE NULL
      END,
      NULL
    ) as date_of_birth,
    u.father_type,
    u.number_of_kids,
    u.age_of_kids,
    u.due_date,
    u.wp_user_id,
    u.sync_status,
    u.created_at,
    u.updated_at
  FROM public.users u
  ORDER BY u.created_at DESC;
END;
$$;

COMMENT ON FUNCTION public.get_user_decrypted IS 'Returns decrypted user PII from encrypted columns. Email and phone now use encrypted columns with temporary fallback to plaintext during migration.';
COMMENT ON FUNCTION public.get_all_users_decrypted IS 'Admin-only function to retrieve all users with decrypted PII from encrypted columns.';