-- Fix security concern: User Challenge Responses Could Be Viewed by Other Users
-- Add proper RLS policies to ensure answer_logs privacy is respected

-- Drop existing broad policies and replace with privacy-aware ones
DROP POLICY IF EXISTS "Users can view their own answer logs" ON public.answer_logs;
DROP POLICY IF EXISTS "Admins can view all answer logs" ON public.answer_logs;

-- Create new privacy-aware SELECT policy
CREATE POLICY "Users can view answer logs based on privacy settings" 
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

-- Ensure INSERT policy respects user ownership
CREATE POLICY "Users can insert their own answer logs with privacy control" 
ON public.answer_logs 
FOR INSERT 
TO authenticated
WITH CHECK (
  auth.uid() = user_id 
  AND 
  -- Ensure privacy field is set to either 'public' or 'private'
  privacy IN ('public', 'private')
);

-- Ensure UPDATE policy maintains ownership and privacy integrity
CREATE POLICY "Users can update their own answer logs" 
ON public.answer_logs 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id 
  AND 
  -- Ensure privacy field is set correctly
  privacy IN ('public', 'private')
);

-- Maintain DELETE policy for users and admins
CREATE POLICY "Users and admins can delete answer logs" 
ON public.answer_logs 
FOR DELETE 
TO authenticated
USING (
  auth.uid() = user_id 
  OR 
  get_current_user_role() = 'admin'
);

-- Add a function to validate answer log privacy settings
CREATE OR REPLACE FUNCTION public.validate_answer_log_privacy()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure privacy is always set
  IF NEW.privacy IS NULL THEN
    NEW.privacy = 'private';
  END IF;
  
  -- Validate privacy values
  IF NEW.privacy NOT IN ('public', 'private') THEN
    RAISE EXCEPTION 'Privacy must be either public or private';
  END IF;
  
  -- Ensure user_id is set correctly
  IF NEW.user_id IS NULL THEN
    RAISE EXCEPTION 'User ID must be set';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Add trigger to validate privacy on insert and update
CREATE TRIGGER validate_answer_log_privacy_trigger
  BEFORE INSERT OR UPDATE ON public.answer_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_answer_log_privacy();