-- Fix Demo User Vulnerabilities: Remove hardcoded UUID policies and replace with proper authentication
DROP POLICY IF EXISTS "Allow demo user badges insert" ON public.user_badges;
DROP POLICY IF EXISTS "Allow demo user badges select" ON public.user_badges;  
DROP POLICY IF EXISTS "Allow demo user badges update" ON public.user_badges;
DROP POLICY IF EXISTS "Allow demo user badges delete" ON public.user_badges;

DROP POLICY IF EXISTS "Allow demo user points insert" ON public.user_points;
DROP POLICY IF EXISTS "Allow demo user points select" ON public.user_points;
DROP POLICY IF EXISTS "Allow demo user points update" ON public.user_points;
DROP POLICY IF EXISTS "Allow demo user points delete" ON public.user_points;

-- Create proper authenticated-only policies for user_badges
CREATE POLICY "Users can view their own badges"
ON public.user_badges FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own badges"
ON public.user_badges FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own badges"
ON public.user_badges FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own badges"
ON public.user_badges FOR DELETE
USING (auth.uid() = user_id);

-- Create proper authenticated-only policies for user_points
CREATE POLICY "Users can view their own points"
ON public.user_points FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own points"
ON public.user_points FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own points"
ON public.user_points FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own points"
ON public.user_points FOR DELETE
USING (auth.uid() = user_id);

-- Fix Role Security: Remove users' ability to update their own role
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Create new profile policies with role protection
CREATE POLICY "Users can update their own profile except role"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id AND 
  (OLD.role = NEW.role OR get_current_user_role() = 'admin')
);

-- Admin-only role management policy
CREATE POLICY "Admins can update any profile role"
ON public.profiles FOR UPDATE
USING (get_current_user_role() = 'admin')
WITH CHECK (get_current_user_role() = 'admin');

-- Create trigger function to auto-populate profiles table
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
    COALESCE(NEW.raw_user_meta_data->>'display_name', 
             NEW.raw_user_meta_data->>'first_name' || ' ' || NEW.raw_user_meta_data->>'last_name',
             NEW.email),
    'user'
  );
  
  -- Create users table entry from auth metadata if it has the required fields
  IF NEW.raw_user_meta_data ? 'first_name' AND NEW.raw_user_meta_data ? 'last_name' AND NEW.raw_user_meta_data ? 'email' THEN
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
      COALESCE((NEW.raw_user_meta_data->>'number_of_kids')::integer, 0),
      COALESCE((NEW.raw_user_meta_data->>'date_of_birth')::date, NULL),
      NEW.raw_user_meta_data->>'age_of_kids'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for auto-populating profiles and users on auth signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Tighten storage policies - make challenge-media require authentication
DROP POLICY IF EXISTS "Public Access" ON storage.objects;

CREATE POLICY "Authenticated users can view challenge media"
ON storage.objects FOR SELECT
USING (bucket_id = 'challenge-media' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can upload challenge media"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'challenge-media' AND auth.role() = 'authenticated');