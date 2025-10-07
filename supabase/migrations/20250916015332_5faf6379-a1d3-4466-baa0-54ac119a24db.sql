-- Add missing RLS policies for security_audit_logs table to prevent unauthorized access

-- INSERT policy: Only allow system functions and authenticated users to insert audit logs
CREATE POLICY "Allow system and authenticated users to insert audit logs" 
ON public.security_audit_logs 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- UPDATE policy: Prevent any updates to audit logs (immutable for security)
CREATE POLICY "Prevent updates to audit logs" 
ON public.security_audit_logs 
FOR UPDATE 
TO authenticated
USING (false);

-- DELETE policy: Only allow admins to delete audit logs in exceptional cases
CREATE POLICY "Admins can delete audit logs" 
ON public.security_audit_logs 
FOR DELETE 
TO authenticated
USING (get_current_user_role() = 'admin');

-- Add additional security function to validate audit log insertions
CREATE OR REPLACE FUNCTION public.validate_audit_log_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure all critical fields are populated
  IF NEW.action IS NULL OR NEW.user_id IS NULL THEN
    RAISE EXCEPTION 'Audit log must have action and user_id';
  END IF;
  
  -- Auto-populate metadata if not provided
  IF NEW.admin_user_id IS NULL THEN
    NEW.admin_user_id = auth.uid();
  END IF;
  
  -- Prevent tampering with timestamps
  NEW.created_at = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Add trigger to validate audit log insertions
CREATE TRIGGER validate_audit_log_before_insert
  BEFORE INSERT ON public.security_audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_audit_log_insert();