-- Insert the missing user record for stevengerritse@gmail.com
INSERT INTO public.users (
  id, first_name, last_name, email, phone, 
  father_type, number_of_kids, date_of_birth, age_of_kids, 
  created_at, updated_at
)
VALUES (
  '404bb8da-a3a1-4379-8f3e-74e27f90ad6b',
  'Steven',
  'Gerritse', 
  'stevengerritse@gmail.com',
  '6099151662',
  'flex_dad',
  1,
  '1988-07-21',
  'John',
  '2025-09-25 13:23:12.814367+00',
  now()
);