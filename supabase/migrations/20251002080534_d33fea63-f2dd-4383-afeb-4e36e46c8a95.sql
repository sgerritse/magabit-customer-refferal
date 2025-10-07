-- Critical Security Fix: Secure the users table INSERT policy
-- ISSUE: Current policy allows anyone to insert data with "with check (true)"
-- FIX: Only allow authenticated users to insert their own records

-- Drop the insecure public registration policy
DROP POLICY IF EXISTS "Allow public registration" ON public.users;

-- Create a secure INSERT policy that requires authentication
-- and ensures users can only create their own record
CREATE POLICY "Users can create their own record"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Add audit logging when admins modify user PII
CREATE OR REPLACE FUNCTION public.audit_user_data_modification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log when admins modify other users' data
  IF auth.uid() != COALESCE(NEW.id, OLD.id) AND get_current_user_role() = 'admin' THEN
    INSERT INTO public.security_audit_logs (
      user_id,
      admin_user_id,
      action,
      target_user_id,
      old_values,
      new_values
    ) VALUES (
      auth.uid(),
      auth.uid(),
      'ADMIN_' || TG_OP || '_USER_PII',
      COALESCE(NEW.id, OLD.id),
      CASE WHEN TG_OP = 'UPDATE' THEN 
        jsonb_build_object(
          'email', OLD.email,
          'phone', OLD.phone,
          'first_name', OLD.first_name,
          'last_name', OLD.last_name
        )
      ELSE NULL END,
      CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN
        jsonb_build_object(
          'email', NEW.email,
          'phone', NEW.phone,
          'first_name', NEW.first_name,
          'last_name', NEW.last_name
        )
      ELSE NULL END
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Add trigger for audit logging on INSERT/UPDATE/DELETE operations
DROP TRIGGER IF EXISTS audit_user_data_modification_trigger ON public.users;
CREATE TRIGGER audit_user_data_modification_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.audit_user_data_modification();

-- Document the security improvement
COMMENT ON POLICY "Users can create their own record" ON public.users IS 
'Secure policy: Only authenticated users can insert their own record. 
User creation during sign-up is handled by the handle_new_user() trigger.
This prevents unauthenticated data injection attacks.';