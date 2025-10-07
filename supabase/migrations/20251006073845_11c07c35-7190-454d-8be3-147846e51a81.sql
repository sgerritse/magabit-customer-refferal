-- Create admin function to bulk decrypt all users
-- Only accessible by admins for the admin panel

CREATE OR REPLACE FUNCTION public.get_all_users_decrypted()
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
    u.email,
    u.phone,
    -- Decrypt PII fields
    COALESCE(
      public.decrypt_sensitive_data(u.first_name_encrypted),
      ''
    ) as first_name,
    COALESCE(
      public.decrypt_sensitive_data(u.last_name_encrypted),
      ''
    ) as last_name,
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
    u.wordpress_user_id,
    u.wordpress_synced,
    u.created_at,
    u.updated_at
  FROM public.users u
  ORDER BY u.created_at DESC;
END;
$$;

COMMENT ON FUNCTION public.get_all_users_decrypted() IS 'Admin-only function to bulk decrypt all user PII. Access is audit-logged.';