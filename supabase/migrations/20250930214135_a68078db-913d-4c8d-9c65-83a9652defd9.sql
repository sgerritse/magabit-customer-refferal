-- Add username field to profiles table
ALTER TABLE public.profiles 
ADD COLUMN username TEXT UNIQUE;

-- Create index for faster username lookups
CREATE INDEX idx_profiles_username ON public.profiles(username);

-- Add comment explaining the username field
COMMENT ON COLUMN public.profiles.username IS 'User-chosen username for referral links (format: first.last)';

-- Function to generate default username from display_name
CREATE OR REPLACE FUNCTION public.generate_default_username()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only generate if username is null and display_name exists
  IF NEW.username IS NULL AND NEW.display_name IS NOT NULL THEN
    NEW.username = LOWER(REPLACE(TRIM(NEW.display_name), ' ', '.'));
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger to auto-generate username on profile creation
CREATE TRIGGER set_default_username
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_default_username();