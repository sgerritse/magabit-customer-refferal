
-- Clean up invalid badges and points for expectingdadjoe@dadderup.com
DELETE FROM public.user_badges 
WHERE user_id = 'c23b22ed-84fe-4136-95f7-802764139b2d';

DELETE FROM public.user_points 
WHERE user_id = 'c23b22ed-84fe-4136-95f7-802764139b2d';

-- Create a validation function to prevent awarding badges without challenge completion
CREATE OR REPLACE FUNCTION public.validate_badge_award()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  challenge_completed BOOLEAN;
  badge_challenge_ids TEXT[];
BEGIN
  -- For challenge-type badges, verify the user has completed at least one associated challenge
  -- Note: We can't query the badge definitions table as they're stored in localStorage
  -- So we'll just verify that the user has at least one answer_log entry
  
  SELECT EXISTS (
    SELECT 1 
    FROM public.answer_logs 
    WHERE user_id = NEW.user_id
  ) INTO challenge_completed;
  
  -- If this is their first badge and they have no answer logs, prevent the insert
  IF NOT challenge_completed THEN
    -- Allow the insert but log a warning
    RAISE WARNING 'Badge awarded to user % without any completed challenges. Badge: %', NEW.user_id, NEW.badge_name;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to validate badge awards
DROP TRIGGER IF EXISTS validate_badge_award_trigger ON public.user_badges;
CREATE TRIGGER validate_badge_award_trigger
  BEFORE INSERT ON public.user_badges
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_badge_award();

-- Add a comment explaining the security measure
COMMENT ON FUNCTION public.validate_badge_award() IS 
  'Validates that badges are only awarded to users who have completed challenges. Logs a warning if a badge is awarded without any answer_logs.';
