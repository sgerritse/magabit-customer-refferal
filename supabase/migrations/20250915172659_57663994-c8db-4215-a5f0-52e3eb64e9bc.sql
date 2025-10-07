-- Fix security linter warnings

-- 1. Fix function search path by making it immutable
DROP FUNCTION IF EXISTS public.make_steven_admin();

CREATE OR REPLACE FUNCTION public.make_steven_admin()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Execute the function to make steven admin (if they exist)
SELECT public.make_steven_admin();