-- Backfill missing users from existing auth records
INSERT INTO public.users (
  id, first_name, last_name, email, phone, 
  father_type, number_of_kids, date_of_birth, age_of_kids
)
SELECT 
  au.id,
  au.raw_user_meta_data->>'first_name',
  au.raw_user_meta_data->>'last_name',
  au.email,
  au.raw_user_meta_data->>'phone',
  au.raw_user_meta_data->>'father_type',
  CASE 
    WHEN au.raw_user_meta_data->>'number_of_kids' IS NOT NULL 
         AND au.raw_user_meta_data->>'number_of_kids' != ''
    THEN (au.raw_user_meta_data->>'number_of_kids')::integer 
    ELSE NULL 
  END,
  CASE 
    WHEN au.raw_user_meta_data->>'date_of_birth' IS NOT NULL 
         AND au.raw_user_meta_data->>'date_of_birth' != ''
    THEN (au.raw_user_meta_data->>'date_of_birth')::date 
    ELSE NULL 
  END,
  au.raw_user_meta_data->>'age_of_kids'
FROM auth.users au
LEFT JOIN users u ON au.id = u.id
WHERE u.id IS NULL 
  AND au.raw_user_meta_data IS NOT NULL
  AND au.raw_user_meta_data ? 'first_name'
  AND au.raw_user_meta_data ? 'last_name';