-- Update steven@dadderup.com to admin role when they register
-- This will be applied after they complete registration

-- Create a function to update user role to admin for steven@dadderup.com
CREATE OR REPLACE FUNCTION public.make_steven_admin()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update the role to admin for steven@dadderup.com
  UPDATE public.profiles 
  SET role = 'admin' 
  WHERE user_id IN (
    SELECT id FROM auth.users WHERE email = 'steven@dadderup.com'
  );
  
  -- Log the action
  RAISE LOG 'Updated steven@dadderup.com role to admin';
END;
$$;