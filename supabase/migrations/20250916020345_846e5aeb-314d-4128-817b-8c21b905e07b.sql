-- Fix security concern: Properly handle existing RLS policies for answer_logs privacy

-- Drop ALL existing policies on answer_logs table
DROP POLICY IF EXISTS "Users can view their own answer logs" ON public.answer_logs;
DROP POLICY IF EXISTS "Users can insert their own answer logs" ON public.answer_logs;
DROP POLICY IF EXISTS "Users can update their own answer logs" ON public.answer_logs;
DROP POLICY IF EXISTS "Users can delete their own answer logs" ON public.answer_logs;
DROP POLICY IF EXISTS "Admins can view all answer logs" ON public.answer_logs;
DROP POLICY IF EXISTS "Admins can delete any answer logs" ON public.answer_logs;

-- Create comprehensive privacy-aware RLS policies for answer_logs

-- SELECT Policy: Respect privacy settings while allowing admin access
CREATE POLICY "Privacy-aware answer logs viewing" 
ON public.answer_logs 
FOR SELECT 
TO authenticated
USING (
  -- Users can always view their own logs regardless of privacy
  auth.uid() = user_id 
  OR 
  -- Users can view public logs from other users  
  (privacy = 'public')
  OR
  -- Admins can view all logs
  get_current_user_role() = 'admin'
);

-- INSERT Policy: Ensure user ownership and privacy validation
CREATE POLICY "Secure answer logs creation" 
ON public.answer_logs 
FOR INSERT 
TO authenticated
WITH CHECK (
  auth.uid() = user_id 
  AND 
  -- Ensure privacy field is set to either 'public' or 'private'
  privacy IN ('public', 'private')
);

-- UPDATE Policy: Maintain ownership and privacy integrity
CREATE POLICY "Secure answer logs updating" 
ON public.answer_logs 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id 
  AND 
  -- Ensure privacy field remains valid
  privacy IN ('public', 'private')
);

-- DELETE Policy: Allow users to delete their own logs, admins can delete any
CREATE POLICY "Secure answer logs deletion" 
ON public.answer_logs 
FOR DELETE 
TO authenticated
USING (
  auth.uid() = user_id 
  OR 
  get_current_user_role() = 'admin'
);

-- Add privacy validation function
CREATE OR REPLACE FUNCTION public.validate_answer_log_privacy()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure privacy is always set (default to private for security)
  IF NEW.privacy IS NULL THEN
    NEW.privacy = 'private';
  END IF;
  
  -- Validate privacy values
  IF NEW.privacy NOT IN ('public', 'private') THEN
    RAISE EXCEPTION 'Privacy must be either public or private';
  END IF;
  
  -- Ensure user_id is set correctly
  IF NEW.user_id IS NULL THEN
    RAISE EXCEPTION 'User ID must be set for answer logs';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Add trigger to validate privacy on insert and update
CREATE TRIGGER validate_answer_log_privacy_trigger
  BEFORE INSERT OR UPDATE ON public.answer_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_answer_log_privacy();