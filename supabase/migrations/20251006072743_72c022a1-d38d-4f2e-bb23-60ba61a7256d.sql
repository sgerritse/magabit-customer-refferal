-- Phase 1: Add encrypted columns for users table
ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS email_encrypted bytea,
  ADD COLUMN IF NOT EXISTS phone_encrypted bytea;

-- Phase 2: Add encrypted columns for billing_addresses table  
ALTER TABLE public.billing_addresses
  ADD COLUMN IF NOT EXISTS city_encrypted bytea,
  ADD COLUMN IF NOT EXISTS state_encrypted bytea;

-- Phase 3: Migrate existing data to encrypted columns
-- Users table - email and phone
UPDATE public.users 
SET email_encrypted = public.encrypt_sensitive_data(email)
WHERE email IS NOT NULL AND email_encrypted IS NULL;

UPDATE public.users 
SET phone_encrypted = public.encrypt_sensitive_data(phone)
WHERE phone IS NOT NULL AND phone_encrypted IS NULL;

-- Billing addresses - city and state
UPDATE public.billing_addresses 
SET city_encrypted = public.encrypt_sensitive_data(city)
WHERE city IS NOT NULL AND city_encrypted IS NULL;

UPDATE public.billing_addresses 
SET state_encrypted = public.encrypt_sensitive_data(state)
WHERE state IS NOT NULL AND state_encrypted IS NULL;

-- Migrate remaining address fields that have plaintext versions
UPDATE public.billing_addresses 
SET address_line1_encrypted = public.encrypt_sensitive_data(address_line1)
WHERE address_line1 IS NOT NULL AND address_line1_encrypted IS NULL;

UPDATE public.billing_addresses 
SET address_line2_encrypted = public.encrypt_sensitive_data(address_line2)
WHERE address_line2 IS NOT NULL AND address_line2_encrypted IS NULL;

UPDATE public.billing_addresses 
SET postal_code_encrypted = public.encrypt_sensitive_data(postal_code)
WHERE postal_code IS NOT NULL AND postal_code_encrypted IS NULL;

-- Phase 4: Drop plaintext columns from billing_addresses
-- Note: Keeping email and phone in users table for now as they're used by auth system
ALTER TABLE public.billing_addresses 
  DROP COLUMN IF EXISTS address_line1,
  DROP COLUMN IF EXISTS address_line2,
  DROP COLUMN IF EXISTS city,
  DROP COLUMN IF EXISTS state,
  DROP COLUMN IF EXISTS postal_code;

-- Phase 5: Create helper function for secure billing address retrieval
CREATE OR REPLACE FUNCTION public.get_billing_address_decrypted(target_user_id uuid)
RETURNS TABLE(
  id uuid,
  user_id uuid,
  address_line1 text,
  address_line2 text,
  city text,
  state text,
  postal_code text,
  country text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log access if admin is accessing another user's data
  IF auth.uid() != target_user_id AND public.has_role(auth.uid(), 'admin') THEN
    INSERT INTO public.billing_address_access_logs (
      admin_user_id,
      accessed_user_id,
      access_type,
      accessed_fields
    ) VALUES (
      auth.uid(),
      target_user_id,
      'VIEW_BILLING_ADDRESS_DECRYPTED',
      ARRAY['address_line1', 'address_line2', 'city', 'state', 'postal_code']
    );
  END IF;

  -- Return decrypted data if authorized
  IF public.can_access_billing_address(target_user_id) THEN
    RETURN QUERY
    SELECT 
      ba.id,
      ba.user_id,
      COALESCE(public.decrypt_sensitive_data(ba.address_line1_encrypted), '') as address_line1,
      COALESCE(public.decrypt_sensitive_data(ba.address_line2_encrypted), '') as address_line2,
      COALESCE(public.decrypt_sensitive_data(ba.city_encrypted), '') as city,
      COALESCE(public.decrypt_sensitive_data(ba.state_encrypted), '') as state,
      COALESCE(public.decrypt_sensitive_data(ba.postal_code_encrypted), '') as postal_code,
      ba.country,
      ba.created_at,
      ba.updated_at
    FROM public.billing_addresses ba
    WHERE ba.user_id = target_user_id;
  ELSE
    RAISE EXCEPTION 'Unauthorized access to billing address';
  END IF;
END;
$$;

-- Phase 6: Update existing get_billing_address_secure function to handle new structure
DROP FUNCTION IF EXISTS public.get_billing_address_secure(uuid);
CREATE OR REPLACE FUNCTION public.get_billing_address_secure(target_user_id uuid)
RETURNS TABLE(
  id uuid,
  user_id uuid,
  address_line1 text,
  address_line2 text,
  city text,
  state text,
  postal_code text,
  country text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY SELECT * FROM public.get_billing_address_decrypted(target_user_id);
END;
$$;

-- Phase 7: Add comments for documentation
COMMENT ON COLUMN public.users.email IS 'Email address - kept for auth system, consider reading from email_encrypted for privacy';
COMMENT ON COLUMN public.users.phone IS 'Phone number - kept for auth metadata, consider reading from phone_encrypted for privacy';
COMMENT ON COLUMN public.users.email_encrypted IS 'Encrypted email address using field_encryption_key';
COMMENT ON COLUMN public.users.phone_encrypted IS 'Encrypted phone number using field_encryption_key';
COMMENT ON COLUMN public.billing_addresses.address_line1_encrypted IS 'Encrypted street address line 1';
COMMENT ON COLUMN public.billing_addresses.address_line2_encrypted IS 'Encrypted street address line 2';
COMMENT ON COLUMN public.billing_addresses.city_encrypted IS 'Encrypted city name';
COMMENT ON COLUMN public.billing_addresses.state_encrypted IS 'Encrypted state/province';
COMMENT ON COLUMN public.billing_addresses.postal_code_encrypted IS 'Encrypted postal/zip code';