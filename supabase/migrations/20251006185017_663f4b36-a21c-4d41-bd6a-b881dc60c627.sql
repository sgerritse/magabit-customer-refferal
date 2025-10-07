-- Drop overly permissive profile viewing policies
DROP POLICY IF EXISTS "Authenticated users can view profiles with rate limit" ON public.profiles;
DROP POLICY IF EXISTS "Profiles viewable with rate limiting" ON public.profiles;

-- Add admin-only view policy
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Create security definer function for public ambassador profile lookup
-- This allows public access ONLY to approved ambassador profiles via landing pages
CREATE OR REPLACE FUNCTION public.get_public_ambassador_profile(p_username text)
RETURNS TABLE(
  user_id uuid,
  display_name text,
  avatar_url text,
  username text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only return profile if user has an approved, enabled landing page
  RETURN QUERY
  SELECT 
    p.user_id,
    p.display_name,
    p.avatar_url,
    p.username
  FROM public.profiles p
  INNER JOIN public.ambassador_landing_pages alp 
    ON p.user_id = alp.user_id
  WHERE p.username = p_username
    AND alp.status = 'approved'
    AND alp.enabled = true
  LIMIT 1;
END;
$$;