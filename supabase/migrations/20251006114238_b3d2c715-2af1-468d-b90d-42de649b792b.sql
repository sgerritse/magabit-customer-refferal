-- Data Migration: Encrypt existing PII (only fields with plaintext versions)

-- Migrate users table: encrypt email, phone, and date_of_birth if they exist as plaintext
UPDATE public.users
SET 
  email_encrypted = public.encrypt_sensitive_data(email),
  phone_encrypted = public.encrypt_sensitive_data(phone)
WHERE email IS NOT NULL OR phone IS NOT NULL;

-- Encrypt date_of_birth if plaintext column exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'date_of_birth'
  ) THEN
    EXECUTE 'UPDATE public.users SET date_of_birth_encrypted = public.encrypt_sensitive_data(date_of_birth::text) WHERE date_of_birth IS NOT NULL AND date_of_birth_encrypted IS NULL';
  END IF;
END $$;

-- Migrate ambassador_payout_methods: encrypt PayPal emails
UPDATE public.ambassador_payout_methods
SET paypal_email_encrypted = public.encrypt_sensitive_data(paypal_email)
WHERE paypal_email IS NOT NULL AND paypal_email_encrypted IS NULL;

-- Migrate referral_visits: hash IPs and truncate user agents
UPDATE public.referral_visits
SET 
  ip_address_hash = public.hash_ip_address(ip_address),
  user_agent_truncated = public.truncate_user_agent(user_agent)
WHERE ip_address IS NOT NULL AND ip_address_hash IS NULL;

-- Log completion
DO $$
DECLARE
  users_migrated INTEGER;
  payouts_migrated INTEGER;
  visits_migrated INTEGER;
BEGIN
  SELECT COUNT(*) INTO users_migrated FROM public.users WHERE email_encrypted IS NOT NULL;
  SELECT COUNT(*) INTO payouts_migrated FROM public.ambassador_payout_methods WHERE paypal_email_encrypted IS NOT NULL;
  SELECT COUNT(*) INTO visits_migrated FROM public.referral_visits WHERE ip_address_hash IS NOT NULL;
  
  RAISE NOTICE '✅ Data migration completed!';
  RAISE NOTICE '   - Users encrypted: %', users_migrated;
  RAISE NOTICE '   - Payout methods encrypted: %', payouts_migrated;
  RAISE NOTICE '   - Referral visits hashed: %', visits_migrated;
END $$;