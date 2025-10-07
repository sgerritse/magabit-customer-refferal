-- Drop the broken view that references non-existent columns
DROP VIEW IF EXISTS public.billing_addresses_admin_summary;

-- Recreate the view using encrypted columns with decryption
CREATE VIEW public.billing_addresses_admin_summary AS
SELECT 
  ba.id,
  ba.user_id,
  public.decrypt_sensitive_data(u.email_encrypted) as email,
  public.decrypt_sensitive_data(u.first_name_encrypted) as first_name,
  public.decrypt_sensitive_data(u.last_name_encrypted) as last_name,
  public.decrypt_sensitive_data(ba.address_line1_encrypted) as address_line1,
  public.decrypt_sensitive_data(ba.city_encrypted) as city,
  public.decrypt_sensitive_data(ba.state_encrypted) as state,
  -- Mask postal code for security (show first 3 digits + XX)
  CASE 
    WHEN public.decrypt_sensitive_data(ba.postal_code_encrypted) IS NOT NULL 
    THEN CONCAT(SUBSTRING(public.decrypt_sensitive_data(ba.postal_code_encrypted), 1, 3), 'XX')
    ELSE NULL
  END as postal_code_masked,
  ba.country,
  ba.created_at
FROM public.billing_addresses ba
JOIN public.users u ON ba.user_id = u.id
WHERE public.has_role(auth.uid(), 'admin');

-- Grant access to authenticated users (RLS will handle admin check)
GRANT SELECT ON public.billing_addresses_admin_summary TO authenticated;