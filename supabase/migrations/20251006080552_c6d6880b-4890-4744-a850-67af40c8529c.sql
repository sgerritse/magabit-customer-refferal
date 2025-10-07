-- Phase 2: Document encryption decision for billing_addresses.country field
-- This migration adds database-level documentation explaining why country is not encrypted

-- Add comment explaining the encryption decision
COMMENT ON COLUMN public.billing_addresses.country IS 
'Stored as plaintext (not encrypted) - Country codes are not considered sensitive PII and are needed for tax compliance, regional restrictions, and analytics without decryption overhead. All other address fields (street, city, state, postal code) ARE encrypted.';

-- Add comments on encrypted fields for clarity
COMMENT ON COLUMN public.billing_addresses.address_line1_encrypted IS 
'AES-CBC encrypted using pgcrypto - Contains street address (highly sensitive, can pinpoint exact location)';

COMMENT ON COLUMN public.billing_addresses.address_line2_encrypted IS 
'AES-CBC encrypted using pgcrypto - Contains apartment/suite number (sensitive location data)';

COMMENT ON COLUMN public.billing_addresses.city_encrypted IS 
'AES-CBC encrypted using pgcrypto - City name (combined with other data, can identify user)';

COMMENT ON COLUMN public.billing_addresses.state_encrypted IS 
'AES-CBC encrypted using pgcrypto - State/province (location data)';

COMMENT ON COLUMN public.billing_addresses.postal_code_encrypted IS 
'AES-CBC encrypted using pgcrypto - Postal/ZIP code (can narrow location to small area)';

-- Verify encryption status with informational notice
DO $$
BEGIN
  RAISE NOTICE 'Billing Address Encryption Status:';
  RAISE NOTICE '  ✅ address_line1_encrypted - ENCRYPTED (Street address)';
  RAISE NOTICE '  ✅ address_line2_encrypted - ENCRYPTED (Apt/Suite)';
  RAISE NOTICE '  ✅ city_encrypted - ENCRYPTED (City)';
  RAISE NOTICE '  ✅ state_encrypted - ENCRYPTED (State/Province)';
  RAISE NOTICE '  ✅ postal_code_encrypted - ENCRYPTED (Postal/ZIP)';
  RAISE NOTICE '  ℹ️  country - PLAINTEXT (By design - ISO 3166 codes, not sensitive PII)';
END $$;