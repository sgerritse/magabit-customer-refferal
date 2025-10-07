-- Update handle_new_user function to properly handle due_date
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only create profile if it doesn't exist
  INSERT INTO public.profiles (user_id, display_name, role)
  VALUES (
    NEW.id,
    COALESCE(
      CASE 
        WHEN NEW.raw_user_meta_data IS NOT NULL THEN
          CONCAT(
            COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
            ' ',
            COALESCE(NEW.raw_user_meta_data->>'last_name', '')
          )
        ELSE NEW.email
      END,
      NEW.email
    ),
    'user'
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Create users table entry from auth metadata if it has the required fields
  IF NEW.raw_user_meta_data IS NOT NULL 
     AND NEW.raw_user_meta_data ? 'first_name' 
     AND NEW.raw_user_meta_data ? 'last_name' THEN
    
    INSERT INTO public.users (
      id, first_name, last_name, email, phone, 
      father_type, number_of_kids, date_of_birth, age_of_kids, due_date
    )
    VALUES (
      NEW.id,
      NEW.raw_user_meta_data->>'first_name',
      NEW.raw_user_meta_data->>'last_name', 
      NEW.email,
      NEW.raw_user_meta_data->>'phone',
      NEW.raw_user_meta_data->>'father_type',
      CASE 
        WHEN NEW.raw_user_meta_data->>'number_of_kids' IS NOT NULL 
             AND NEW.raw_user_meta_data->>'number_of_kids' != ''
             AND NEW.raw_user_meta_data->>'number_of_kids' != 'expecting'
        THEN (NEW.raw_user_meta_data->>'number_of_kids')::integer 
        ELSE NULL 
      END,
      CASE 
        WHEN NEW.raw_user_meta_data->>'date_of_birth' IS NOT NULL 
             AND NEW.raw_user_meta_data->>'date_of_birth' != ''
        THEN (NEW.raw_user_meta_data->>'date_of_birth')::date 
        ELSE NULL 
      END,
      NEW.raw_user_meta_data->>'age_of_kids',
      CASE 
        WHEN NEW.raw_user_meta_data->>'due_date' IS NOT NULL 
             AND NEW.raw_user_meta_data->>'due_date' != ''
        THEN (NEW.raw_user_meta_data->>'due_date')::date 
        ELSE NULL 
      END
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail the auth signup
  RAISE LOG 'Error in handle_new_user trigger: %', SQLERRM;
  RETURN NEW;
END;
$function$;