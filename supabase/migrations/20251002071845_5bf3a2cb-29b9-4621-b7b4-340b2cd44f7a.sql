
-- =====================================================
-- SECURITY FIX: Proper Role-Based Access Control (Fixed)
-- =====================================================

-- Step 1: Create app_role enum if it doesn't exist
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Step 2: Create dedicated user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Step 3: Migrate existing roles from profiles to user_roles (only for valid users)
INSERT INTO public.user_roles (user_id, role)
SELECT 
  p.user_id,
  CASE 
    WHEN p.role = 'admin' THEN 'admin'::app_role
    WHEN p.role = 'moderator' THEN 'moderator'::app_role
    ELSE 'user'::app_role
  END as role
FROM public.profiles p
INNER JOIN auth.users u ON p.user_id = u.id  -- Only migrate for existing users
WHERE p.user_id IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- Step 4: Create secure role checking function
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Step 5: Update get_current_user_role to use new table
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(
    (SELECT role::text FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1),
    'user'
  );
$$;

-- Step 6: Create RLS policies for user_roles table
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles"
  ON public.user_roles
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Only admins can assign roles" ON public.user_roles;
CREATE POLICY "Only admins can assign roles"
  ON public.user_roles
  FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Only admins can update roles" ON public.user_roles;
CREATE POLICY "Only admins can update roles"
  ON public.user_roles
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Only admins can delete roles" ON public.user_roles;
CREATE POLICY "Only admins can delete roles"
  ON public.user_roles
  FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Step 7: Clean up duplicate policies on users table
DROP POLICY IF EXISTS "Users can view their own user row" ON public.users;
DROP POLICY IF EXISTS "Users can update their own user row" ON public.users;

-- Step 8: Deprecate role column in profiles
COMMENT ON COLUMN public.profiles.role IS 'DEPRECATED: Use user_roles table instead. This column is kept for backward compatibility only and should not be modified.';

-- Step 9: Create audit trigger for role changes
CREATE OR REPLACE FUNCTION public.audit_role_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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
    TG_OP || '_ROLE',
    COALESCE(NEW.user_id, OLD.user_id),
    CASE WHEN TG_OP = 'DELETE' THEN jsonb_build_object('role', OLD.role) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN jsonb_build_object('role', NEW.role) ELSE NULL END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS audit_user_role_changes ON public.user_roles;
CREATE TRIGGER audit_user_role_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_role_changes();

-- Step 10: Add updated_at trigger to user_roles
DROP TRIGGER IF EXISTS update_user_roles_updated_at ON public.user_roles;
CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Step 11: Create function to ensure new users get default role
CREATE OR REPLACE FUNCTION public.ensure_user_has_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ensure_new_user_role ON auth.users;
CREATE TRIGGER ensure_new_user_role
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_user_has_role();

-- Security verification comments
COMMENT ON TABLE public.user_roles IS 'Secure role storage table. Roles are protected by RLS and can only be modified by admins. This prevents privilege escalation attacks.';
COMMENT ON FUNCTION public.has_role IS 'Secure role checking function using SECURITY DEFINER to prevent RLS recursion. Always use this function in RLS policies instead of direct table queries.';
COMMENT ON TABLE public.users IS 'User data table. Contains PII. RLS policies ensure users can only access their own data. Admins can access all data. NO public read access exists.';
