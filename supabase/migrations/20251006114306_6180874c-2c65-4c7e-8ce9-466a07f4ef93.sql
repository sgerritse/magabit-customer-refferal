-- Fix NULL encrypted fields by encrypting empty strings for NULL plaintext values

-- Update users with NULL plaintext fields to have encrypted empty strings
UPDATE public.users
SET 
  email_encrypted = COALESCE(email_encrypted, public.encrypt_sensitive_data('')),
  phone_encrypted = COALESCE(phone_encrypted, public.encrypt_sensitive_data(''))
WHERE email_encrypted IS NULL OR phone_encrypted IS NULL;

-- Verify all records now have encrypted fields
DO $$
DECLARE
  remaining_nulls INTEGER;
BEGIN
  SELECT COUNT(*) INTO remaining_nulls
  FROM public.users
  WHERE email_encrypted IS NULL OR phone_encrypted IS NULL;
  
  IF remaining_nulls > 0 THEN
    RAISE EXCEPTION 'Still have % users with NULL encrypted fields', remaining_nulls;
  ELSE
    RAISE NOTICE '✅ All users now have encrypted fields';
  END IF;
END $$;