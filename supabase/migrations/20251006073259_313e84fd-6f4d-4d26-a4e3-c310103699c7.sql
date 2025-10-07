-- Add encrypted columns for sensitive PII in users table
ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS first_name_encrypted bytea,
  ADD COLUMN IF NOT EXISTS last_name_encrypted bytea,
  ADD COLUMN IF NOT EXISTS date_of_birth_encrypted bytea;

-- Migrate existing user data to encrypted columns
UPDATE public.users 
SET first_name_encrypted = public.encrypt_sensitive_data(first_name)
WHERE first_name IS NOT NULL AND first_name_encrypted IS NULL;

UPDATE public.users 
SET last_name_encrypted = public.encrypt_sensitive_data(last_name)
WHERE last_name IS NOT NULL AND last_name_encrypted IS NULL;

UPDATE public.users 
SET date_of_birth_encrypted = public.encrypt_sensitive_data(date_of_birth::text)
WHERE date_of_birth IS NOT NULL AND date_of_birth_encrypted IS NULL;

-- Migrate Stripe customer data to encrypted columns
UPDATE public.stripe_customers 
SET stripe_customer_id_encrypted = public.encrypt_sensitive_data(stripe_customer_id)
WHERE stripe_customer_id IS NOT NULL AND stripe_customer_id_encrypted IS NULL;

UPDATE public.stripe_customers 
SET stripe_payment_method_id_encrypted = public.encrypt_sensitive_data(stripe_payment_method_id)
WHERE stripe_payment_method_id IS NOT NULL AND stripe_payment_method_id_encrypted IS NULL;

-- Drop plaintext Stripe columns (payment data should never be in plaintext)
ALTER TABLE public.stripe_customers 
  DROP COLUMN IF EXISTS stripe_customer_id,
  DROP COLUMN IF EXISTS stripe_payment_method_id;

-- Add helpful comments
COMMENT ON COLUMN public.users.first_name IS 'First name - consider migrating to first_name_encrypted for enhanced privacy';
COMMENT ON COLUMN public.users.last_name IS 'Last name - consider migrating to last_name_encrypted for enhanced privacy';
COMMENT ON COLUMN public.users.date_of_birth IS 'Date of birth - DEPRECATED: Use date_of_birth_encrypted instead';
COMMENT ON COLUMN public.users.first_name_encrypted IS 'Encrypted first name using field_encryption_key';
COMMENT ON COLUMN public.users.last_name_encrypted IS 'Encrypted last name using field_encryption_key';
COMMENT ON COLUMN public.users.date_of_birth_encrypted IS 'Encrypted date of birth using field_encryption_key';
COMMENT ON COLUMN public.stripe_customers.stripe_customer_id_encrypted IS 'Encrypted Stripe customer ID - contains payment account identifier';
COMMENT ON COLUMN public.stripe_customers.stripe_payment_method_id_encrypted IS 'Encrypted Stripe payment method ID - contains payment details reference';