-- Drop unused view that references dropped plaintext columns
DROP VIEW IF EXISTS public.billing_addresses_admin_summary;

-- Fix get_user_decrypted() to only use encrypted columns
CREATE OR REPLACE FUNCTION public.get_user_decrypted(target_user_id uuid)
RETURNS TABLE(id uuid, email text, phone text, first_name text, last_name text, date_of_birth date, father_type text, number_of_kids integer, age_of_kids text, due_date date, wp_user_id integer, sync_status text, created_at timestamp with time zone, updated_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
      -- Decrypt PII fields (NO FALLBACK to plaintext)
      public.decrypt_sensitive_data(u.first_name_encrypted) as first_name,
      public.decrypt_sensitive_data(u.last_name_encrypted) as last_name,
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
$function$;