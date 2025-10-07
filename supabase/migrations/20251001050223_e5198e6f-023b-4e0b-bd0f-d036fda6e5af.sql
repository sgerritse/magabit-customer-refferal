-- Insert missing profile record for expectingdadjoe@dadderup.com
INSERT INTO public.profiles (user_id, display_name, role, username)
VALUES (
  'c23b22ed-84fe-4136-95f7-802764139b2d',
  'Joe Smith',
  'user',
  'joe.smith'
)
ON CONFLICT (user_id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  username = EXCLUDED.username;

-- Insert missing users record for expectingdadjoe@dadderup.com
INSERT INTO public.users (
  id, first_name, last_name, email, phone, 
  father_type, number_of_kids, date_of_birth
)
VALUES (
  'c23b22ed-84fe-4136-95f7-802764139b2d',
  'Joe',
  'Smith',
  'expectingdadjoe@dadderup.com',
  '5555555555',
  'blood_father',
  0,
  '1988-07-21'
)
ON CONFLICT (id) DO UPDATE SET
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  phone = EXCLUDED.phone,
  father_type = EXCLUDED.father_type,
  number_of_kids = EXCLUDED.number_of_kids,
  date_of_birth = EXCLUDED.date_of_birth;