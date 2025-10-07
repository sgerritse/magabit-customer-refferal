-- Create audit log table for security events
CREATE TABLE public.security_audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  admin_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_user_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on audit logs
ALTER TABLE public.security_audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view all audit logs" 
ON public.security_audit_logs 
FOR SELECT 
USING (get_current_user_role() = 'admin');

-- Create function to validate role changes
CREATE OR REPLACE FUNCTION public.validate_role_change()
RETURNS TRIGGER AS $$
DECLARE
  admin_count INTEGER;
  current_user_role TEXT;
BEGIN
  -- Get current user's role
  SELECT get_current_user_role() INTO current_user_role;
  
  -- Only admins can change roles
  IF current_user_role != 'admin' THEN
    RAISE EXCEPTION 'Only administrators can change user roles';
  END IF;
  
  -- Prevent users from changing their own role
  IF NEW.user_id = auth.uid() THEN
    RAISE EXCEPTION 'Users cannot change their own role';
  END IF;
  
  -- If demoting from admin, ensure at least one admin remains
  IF OLD.role = 'admin' AND NEW.role != 'admin' THEN
    SELECT COUNT(*) INTO admin_count 
    FROM public.profiles 
    WHERE role = 'admin' AND user_id != NEW.user_id;
    
    IF admin_count = 0 THEN
      RAISE EXCEPTION 'Cannot remove the last administrator';
    END IF;
  END IF;
  
  -- Log the role change
  INSERT INTO public.security_audit_logs (
    user_id, admin_user_id, action, target_user_id, old_values, new_values
  ) VALUES (
    auth.uid(), 
    auth.uid(),
    'role_change',
    NEW.user_id,
    jsonb_build_object('role', OLD.role),
    jsonb_build_object('role', NEW.role)
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for role validation
CREATE TRIGGER validate_role_change_trigger
  BEFORE UPDATE OF role ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_role_change();

-- Create function to log admin switches
CREATE OR REPLACE FUNCTION public.log_admin_switch(
  target_user_id UUID,
  target_user_name TEXT,
  action TEXT
) RETURNS VOID AS $$
BEGIN
  INSERT INTO public.security_audit_logs (
    user_id, admin_user_id, action, target_user_id, new_values
  ) VALUES (
    auth.uid(),
    auth.uid(), 
    action,
    target_user_id,
    jsonb_build_object('target_user_name', target_user_name)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Add indexes for performance
CREATE INDEX idx_security_audit_logs_user_id ON public.security_audit_logs(user_id);
CREATE INDEX idx_security_audit_logs_created_at ON public.security_audit_logs(created_at);
CREATE INDEX idx_security_audit_logs_action ON public.security_audit_logs(action);