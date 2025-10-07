-- Create user record for steven@dadderup.com
INSERT INTO public.users (id, first_name, last_name, email)
SELECT 
  id,
  COALESCE(raw_user_meta_data->>'first_name', 'Steven'),
  COALESCE(raw_user_meta_data->>'last_name', 'Admin'),
  email
FROM auth.users 
WHERE email = 'steven@dadderup.com'
AND id NOT IN (SELECT id FROM public.users);