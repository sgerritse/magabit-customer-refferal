-- Update find_unencrypted_pii function to match current encrypted schema
CREATE OR REPLACE FUNCTION public.find_unencrypted_pii()
 RETURNS TABLE(table_name text, issue text, count bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  -- Check for plaintext paypal_email (this column still exists)
  SELECT 
    'ambassador_payout_methods'::text as table_name,
    'Plaintext paypal_email found'::text as issue,
    COUNT(*)::bigint as count
  FROM public.ambassador_payout_methods
  WHERE paypal_email IS NOT NULL
  UNION ALL
  -- Check for missing encrypted billing address data
  SELECT 
    'billing_addresses'::text,
    'Records with NULL encrypted address fields'::text,
    COUNT(*)::bigint
  FROM public.billing_addresses
  WHERE address_line1_encrypted IS NULL 
    OR city_encrypted IS NULL 
    OR state_encrypted IS NULL 
    OR postal_code_encrypted IS NULL;
END;
$function$;