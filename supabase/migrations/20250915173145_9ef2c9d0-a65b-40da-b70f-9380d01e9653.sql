-- Create admin profile for steven@dadderup.com if it doesn't exist
INSERT INTO public.profiles (user_id, display_name, role)
SELECT 
  id,
  email,
  'admin'
FROM auth.users 
WHERE email = 'steven@dadderup.com'
AND id NOT IN (SELECT user_id FROM public.profiles);