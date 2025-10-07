-- Step 1: Fix find_unencrypted_pii() function to remove deleted paypal_email column
CREATE OR REPLACE FUNCTION public.find_unencrypted_pii()
RETURNS TABLE(table_name text, issue text, count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  -- Check for missing encrypted billing address data
  SELECT 
    'billing_addresses'::text as table_name,
    'Records with NULL encrypted address fields'::text as issue,
    COUNT(*)::bigint as count
  FROM public.billing_addresses
  WHERE address_line1_encrypted IS NULL 
    OR city_encrypted IS NULL 
    OR state_encrypted IS NULL 
    OR postal_code_encrypted IS NULL;
END;
$function$;

-- Step 2: Clean up email addresses in display_name field
-- Replace email addresses with a proper display name format
UPDATE public.profiles
SET display_name = SPLIT_PART(display_name, '@', 1)
WHERE display_name LIKE '%@%';

-- Add comment explaining the cleanup
COMMENT ON COLUMN public.profiles.display_name IS 'User display name - should not contain email addresses for privacy';

-- Step 3: Add RLS policy to prevent profile enumeration
-- Update the existing SELECT policy to be more restrictive
DROP POLICY IF EXISTS "Public profiles viewable by authenticated users" ON public.profiles;

CREATE POLICY "Profiles viewable with rate limiting"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  check_profile_access(id)
);