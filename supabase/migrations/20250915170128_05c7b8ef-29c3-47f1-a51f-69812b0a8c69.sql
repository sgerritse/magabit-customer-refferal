-- Fix the user creation trigger function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create a corrected trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Create profile with default 'user' role
  INSERT INTO public.profiles (user_id, display_name, role)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'first_name' || ' ' || NEW.raw_user_meta_data->>'last_name',
      NEW.email
    ),
    'user'
  );
  
  -- Create users table entry from auth metadata if it has the required fields
  IF NEW.raw_user_meta_data ? 'first_name' AND NEW.raw_user_meta_data ? 'last_name' THEN
    INSERT INTO public.users (
      id, first_name, last_name, email, phone, 
      father_type, number_of_kids, date_of_birth, age_of_kids
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
        THEN (NEW.raw_user_meta_data->>'number_of_kids')::integer 
        ELSE NULL 
      END,
      CASE 
        WHEN NEW.raw_user_meta_data->>'date_of_birth' IS NOT NULL 
        THEN (NEW.raw_user_meta_data->>'date_of_birth')::date 
        ELSE NULL 
      END,
      NEW.raw_user_meta_data->>'age_of_kids'
    );
  END IF;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail the auth signup
  RAISE LOG 'Error in handle_new_user trigger: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();