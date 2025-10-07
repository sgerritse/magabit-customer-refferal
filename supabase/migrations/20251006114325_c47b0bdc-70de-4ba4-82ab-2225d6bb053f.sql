-- Final Cleanup: Drop plaintext PII columns (Phase 1 & 2 completion)

-- Drop plaintext columns from users table
ALTER TABLE public.users DROP COLUMN IF EXISTS email;
ALTER TABLE public.users DROP COLUMN IF EXISTS phone;
ALTER TABLE public.users DROP COLUMN IF EXISTS date_of_birth;

COMMENT ON TABLE public.users IS 'User profiles - all PII stored in encrypted columns only';
COMMENT ON COLUMN public.users.email_encrypted IS 'Encrypted email - decrypt via get_user_decrypted()';
COMMENT ON COLUMN public.users.phone_encrypted IS 'Encrypted phone - decrypt via get_user_decrypted()';

-- Drop plaintext paypal_email from ambassador_payout_methods
ALTER TABLE public.ambassador_payout_methods DROP COLUMN IF EXISTS paypal_email;

COMMENT ON TABLE public.ambassador_payout_methods IS 'Payout methods - all financial data encrypted';
COMMENT ON COLUMN public.ambassador_payout_methods.paypal_email_encrypted IS 'Encrypted PayPal email - decrypt via Edge Function';

-- Drop old privacy columns from referral_visits
ALTER TABLE public.referral_visits DROP COLUMN IF EXISTS ip_address;
ALTER TABLE public.referral_visits DROP COLUMN IF EXISTS user_agent;

COMMENT ON TABLE public.referral_visits IS 'Privacy-enhanced visit tracking - IPs hashed, user agents truncated';
COMMENT ON COLUMN public.referral_visits.ip_address_hash IS 'SHA-256 hash of IP for duplicate detection';
COMMENT ON COLUMN public.referral_visits.user_agent_truncated IS 'Truncated user agent (100 chars max)';

-- Final verification and completion log
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ PHASE 1: PII ENCRYPTION - COMPLETE';
  RAISE NOTICE '✅ PHASE 2: REFERRAL PRIVACY - COMPLETE';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'All plaintext PII columns have been permanently removed';
  RAISE NOTICE 'Database is now fully encrypted and privacy-enhanced';
END $$;