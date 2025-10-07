# Encryption Key Rotation Procedure

## ⚠️ CRITICAL WARNING

**Losing the encryption key means PERMANENT DATA LOSS.** All encrypted data will become unrecoverable. Follow this procedure exactly and test in a staging environment first.

## Overview

This document outlines the step-by-step procedure for rotating the `field_encryption_key` stored in Supabase Vault. Key rotation is necessary for:

- **Security compliance** (PCI-DSS, GDPR recommendations)
- **Suspected key compromise**
- **Regular security hygiene** (recommended annually)

## Prerequisites

- [ ] Full database backup completed and verified
- [ ] Staging environment for testing rotation
- [ ] Access to Supabase Dashboard (Project Settings > Vault)
- [ ] Service role key with admin privileges
- [ ] At least 2 hours of maintenance window
- [ ] Notification to users about maintenance

## Key Rotation Process

### Phase 1: Preparation (Do NOT Skip)

#### 1.1 Create Full Backup

```sql
-- Export all encrypted data to a temporary table
CREATE TABLE key_rotation_backup AS
SELECT 
  'billing_addresses' as table_name,
  id::text as record_id,
  user_id,
  decrypt_sensitive_data(address_line1_encrypted) as decrypted_address_line1,
  decrypt_sensitive_data(address_line2_encrypted) as decrypted_address_line2,
  decrypt_sensitive_data(postal_code_encrypted) as decrypted_postal_code,
  city,
  state,
  country,
  created_at
FROM public.billing_addresses
WHERE address_line1_encrypted IS NOT NULL;

-- Add stripe customers to backup
INSERT INTO key_rotation_backup (table_name, record_id, user_id, decrypted_address_line1, decrypted_address_line2, city)
SELECT 
  'stripe_customers',
  id::text,
  user_id,
  decrypt_sensitive_data(stripe_customer_id_encrypted),
  decrypt_sensitive_data(stripe_payment_method_id_encrypted),
  card_brand
FROM public.stripe_customers
WHERE stripe_customer_id_encrypted IS NOT NULL;

-- Add payout methods to backup
INSERT INTO key_rotation_backup (table_name, record_id, user_id, decrypted_address_line1, decrypted_address_line2)
SELECT 
  'ambassador_payout_methods',
  id::text,
  user_id,
  decrypt_sensitive_data(paypal_email_encrypted),
  decrypt_sensitive_data(bank_details_encrypted)
FROM public.ambassador_payout_methods
WHERE paypal_email_encrypted IS NOT NULL OR bank_details_encrypted IS NOT NULL;

-- Add tax documents to backup
INSERT INTO key_rotation_backup (table_name, record_id, user_id, decrypted_address_line1)
SELECT 
  'tax_documents',
  id::text,
  user_id,
  decrypt_sensitive_data(tax_id_encrypted)
FROM public.tax_documents
WHERE tax_id_encrypted IS NOT NULL;

-- Verify backup count matches source tables
SELECT 
  table_name,
  COUNT(*) as record_count
FROM key_rotation_backup
GROUP BY table_name;
```

#### 1.2 Export Backup to Safe Location

```bash
# Export backup table to CSV
psql $DATABASE_URL -c "\COPY key_rotation_backup TO 'key_rotation_backup.csv' CSV HEADER"

# Encrypt the backup file
gpg --symmetric --cipher-algo AES256 key_rotation_backup.csv

# Store encrypted backup in multiple secure locations:
# 1. AWS S3 with encryption
# 2. Encrypted external drive
# 3. Secure password manager vault
```

#### 1.3 Generate New Encryption Key

```bash
# Generate a cryptographically secure 32-byte (256-bit) key
openssl rand -hex 32

# Example output: a1b2c3d4e5f6...
# SAVE THIS KEY SECURELY - You'll need it for the next steps
```

### Phase 2: Key Rotation Execution

#### 2.1 Add New Key to Vault

1. Go to Supabase Dashboard > Project Settings > Vault
2. Click "New Secret"
3. Name: `field_encryption_key_new`
4. Value: Paste the new key generated in step 1.3
5. Save

#### 2.2 Create Temporary Re-encryption Function

```sql
-- Function to re-encrypt data with new key
CREATE OR REPLACE FUNCTION public.reencrypt_with_new_key(
  encrypted_data bytea,
  old_key_name text DEFAULT 'field_encryption_key',
  new_key_name text DEFAULT 'field_encryption_key_new'
)
RETURNS bytea
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  old_key text;
  new_key text;
  decrypted_text text;
BEGIN
  -- Get both keys from vault
  SELECT decrypted_secret INTO old_key
  FROM vault.decrypted_secrets
  WHERE name = old_key_name
  LIMIT 1;

  SELECT decrypted_secret INTO new_key
  FROM vault.decrypted_secrets
  WHERE name = new_key_name
  LIMIT 1;

  IF old_key IS NULL OR new_key IS NULL THEN
    RAISE EXCEPTION 'Encryption keys not found in Vault';
  END IF;

  -- Decrypt with old key
  decrypted_text := convert_from(
    extensions.decrypt(
      encrypted_data,
      decode(old_key, 'hex'),
      'aes-cbc'::text
    ),
    'UTF8'
  );

  -- Re-encrypt with new key
  RETURN extensions.encrypt(
    decrypted_text::bytea,
    decode(new_key, 'hex'),
    'aes-cbc'::text
  );
END;
$$;
```

#### 2.3 Re-encrypt All Data

```sql
-- Re-encrypt billing addresses
UPDATE public.billing_addresses
SET 
  address_line1_encrypted = reencrypt_with_new_key(address_line1_encrypted),
  address_line2_encrypted = reencrypt_with_new_key(address_line2_encrypted),
  postal_code_encrypted = reencrypt_with_new_key(postal_code_encrypted)
WHERE address_line1_encrypted IS NOT NULL;

-- Re-encrypt stripe customers
UPDATE public.stripe_customers
SET 
  stripe_customer_id_encrypted = reencrypt_with_new_key(stripe_customer_id_encrypted),
  stripe_payment_method_id_encrypted = reencrypt_with_new_key(stripe_payment_method_id_encrypted)
WHERE stripe_customer_id_encrypted IS NOT NULL;

-- Re-encrypt payout methods
UPDATE public.ambassador_payout_methods
SET 
  paypal_email_encrypted = reencrypt_with_new_key(paypal_email_encrypted),
  bank_details_encrypted = reencrypt_with_new_key(bank_details_encrypted)
WHERE paypal_email_encrypted IS NOT NULL OR bank_details_encrypted IS NOT NULL;

-- Re-encrypt tax documents
UPDATE public.tax_documents
SET tax_id_encrypted = reencrypt_with_new_key(tax_id_encrypted)
WHERE tax_id_encrypted IS NOT NULL;
```

#### 2.4 Update Encryption Functions to Use New Key

```sql
-- Update decrypt function
CREATE OR REPLACE FUNCTION public.decrypt_sensitive_data(encrypted_data bytea)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  encryption_key text;
BEGIN
  IF encrypted_data IS NULL THEN
    RETURN NULL;
  END IF;

  -- NOW USING NEW KEY NAME
  SELECT decrypted_secret INTO encryption_key
  FROM vault.decrypted_secrets
  WHERE name = 'field_encryption_key_new'  -- CHANGED
  LIMIT 1;

  IF encryption_key IS NULL OR encryption_key = '' THEN
    RAISE EXCEPTION 'Encryption key not found in Vault';
  END IF;

  RETURN convert_from(
    extensions.decrypt(
      encrypted_data,
      decode(encryption_key, 'hex'),
      'aes-cbc'::text
    ),
    'UTF8'
  );
END;
$$;

-- Update encrypt function
CREATE OR REPLACE FUNCTION public.encrypt_sensitive_data(data text)
RETURNS bytea
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  encryption_key text;
BEGIN
  -- NOW USING NEW KEY NAME
  SELECT decrypted_secret INTO encryption_key
  FROM vault.decrypted_secrets
  WHERE name = 'field_encryption_key_new'  -- CHANGED
  LIMIT 1;

  IF encryption_key IS NULL OR encryption_key = '' THEN
    RAISE EXCEPTION 'Encryption key not found in Vault';
  END IF;

  RETURN extensions.encrypt(
    data::bytea,
    decode(encryption_key, 'hex'),
    'aes-cbc'::text
  );
END;
$$;
```

### Phase 3: Verification

#### 3.1 Verify Decryption Works

```sql
-- Test decryption with new key
SELECT 
  id,
  decrypt_sensitive_data(address_line1_encrypted) as address_line1,
  decrypt_sensitive_data(postal_code_encrypted) as postal_code
FROM public.billing_addresses
WHERE address_line1_encrypted IS NOT NULL
LIMIT 5;

-- Should return readable data, not gibberish or errors
```

#### 3.2 Compare Against Backup

```sql
-- Verify data integrity
SELECT 
  ba.id,
  CASE 
    WHEN decrypt_sensitive_data(ba.address_line1_encrypted) = krb.decrypted_address_line1 
    THEN 'MATCH' 
    ELSE 'MISMATCH' 
  END as verification_status
FROM public.billing_addresses ba
JOIN key_rotation_backup krb 
  ON ba.id::text = krb.record_id 
  AND krb.table_name = 'billing_addresses'
WHERE ba.address_line1_encrypted IS NOT NULL;

-- All rows should show 'MATCH'
```

#### 3.3 Test Edge Function

```bash
# Test decrypt-sensitive-field edge function
curl -X POST 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/decrypt-sensitive-field' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "table": "billing_addresses",
    "column": "address_line1_encrypted",
    "recordId": "SOME_RECORD_ID",
    "targetUserId": "SOME_USER_ID"
  }'

# Should return decrypted data successfully
```

### Phase 4: Finalization

#### 4.1 Archive Old Key

1. Go to Supabase Dashboard > Project Settings > Vault
2. **DO NOT DELETE** `field_encryption_key` yet
3. Rename it to `field_encryption_key_old_YYYYMMDD`
4. Store old key securely for 90 days (compliance/rollback)

#### 4.2 Rename New Key

1. Rename `field_encryption_key_new` to `field_encryption_key`
2. Update functions to use `field_encryption_key` (original name)

```sql
-- Revert function names back to original
CREATE OR REPLACE FUNCTION public.decrypt_sensitive_data(encrypted_data bytea)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  encryption_key text;
BEGIN
  IF encrypted_data IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT decrypted_secret INTO encryption_key
  FROM vault.decrypted_secrets
  WHERE name = 'field_encryption_key'  -- BACK TO ORIGINAL
  LIMIT 1;

  IF encryption_key IS NULL OR encryption_key = '' THEN
    RAISE EXCEPTION 'Encryption key not found in Vault';
  END IF;

  RETURN convert_from(
    extensions.decrypt(
      encrypted_data,
      decode(encryption_key, 'hex'),
      'aes-cbc'::text
    ),
    'UTF8'
  );
END;
$$;

-- Repeat for encrypt_sensitive_data function
```

#### 4.3 Clean Up

```sql
-- Drop temporary re-encryption function
DROP FUNCTION IF EXISTS public.reencrypt_with_new_key(bytea, text, text);

-- Drop backup table after 30 days retention
-- DO NOT RUN IMMEDIATELY
-- DROP TABLE key_rotation_backup;
```

#### 4.4 Document Rotation

Create a record of the key rotation:

```sql
INSERT INTO public.security_audit_logs (
  user_id,
  admin_user_id,
  action,
  new_values
) VALUES (
  NULL,
  auth.uid(),
  'KEY_ROTATION_COMPLETED',
  jsonb_build_object(
    'rotation_date', NOW(),
    'records_re_encrypted', (SELECT COUNT(*) FROM key_rotation_backup),
    'old_key_archived', true
  )
);
```

## Rollback Procedure (If Something Goes Wrong)

### Emergency Rollback Steps

```sql
-- 1. Revert decrypt function to use old key
CREATE OR REPLACE FUNCTION public.decrypt_sensitive_data(encrypted_data bytea)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  encryption_key text;
BEGIN
  SELECT decrypted_secret INTO encryption_key
  FROM vault.decrypted_secrets
  WHERE name = 'field_encryption_key_old_YYYYMMDD'  -- USE OLD KEY
  LIMIT 1;

  RETURN convert_from(
    extensions.decrypt(
      encrypted_data,
      decode(encryption_key, 'hex'),
      'aes-cbc'::text
    ),
    'UTF8'
  );
END;
$$;

-- 2. Verify data is accessible
SELECT decrypt_sensitive_data(address_line1_encrypted) FROM billing_addresses LIMIT 1;

-- 3. If verification passes, you have time to diagnose the issue
-- 4. If verification fails, restore from backup (see disaster recovery below)
```

## Disaster Recovery (Data Loss Scenario)

### If Encrypted Data Becomes Unrecoverable

```sql
-- 1. Restore from backup table
UPDATE public.billing_addresses ba
SET 
  address_line1_encrypted = encrypt_sensitive_data(krb.decrypted_address_line1),
  address_line2_encrypted = encrypt_sensitive_data(krb.decrypted_address_line2),
  postal_code_encrypted = encrypt_sensitive_data(krb.decrypted_postal_code)
FROM key_rotation_backup krb
WHERE ba.id::text = krb.record_id
  AND krb.table_name = 'billing_addresses';

-- 2. Repeat for other tables
-- 3. Verify restoration
-- 4. Document incident
```

## Key Rotation Schedule

### Recommended Frequency

- **Normal operations**: Every 12 months
- **After team changes**: When admins with vault access leave
- **Security incidents**: Immediately if key compromise suspected
- **Compliance requirements**: As mandated by PCI-DSS/GDPR

### Next Rotation Date

After completing rotation, schedule the next one:

```
Last Rotation: [DATE]
Next Rotation: [DATE + 12 months]
Scheduled By: [ADMIN NAME]
Calendar Reminder Set: [ ] Yes [ ] No
```

## Checklist

### Pre-Rotation
- [ ] Full database backup completed
- [ ] Backup exported and encrypted
- [ ] Backup stored in 3 secure locations
- [ ] New key generated (32-byte hex)
- [ ] Staging environment tested
- [ ] Maintenance window scheduled
- [ ] Users notified of maintenance

### During Rotation
- [ ] New key added to Vault as `field_encryption_key_new`
- [ ] Re-encryption function created
- [ ] All tables re-encrypted
- [ ] Functions updated to use new key
- [ ] Decryption verified on sample data

### Post-Rotation
- [ ] Data integrity verified against backup
- [ ] Edge function tested
- [ ] Old key archived (not deleted)
- [ ] New key renamed to `field_encryption_key`
- [ ] Temporary functions dropped
- [ ] Rotation documented in audit logs
- [ ] Next rotation date scheduled

## Support

If issues arise during rotation:

1. **STOP IMMEDIATELY** - Do not proceed if verification fails
2. **Contact**: Your database administrator
3. **Review**: Security audit logs for errors
4. **Check**: Supabase Edge Function logs
5. **Restore**: From backup if necessary

## Additional Resources

- [Supabase Vault Documentation](https://supabase.com/docs/guides/database/vault)
- [PostgreSQL pgcrypto](https://www.postgresql.org/docs/current/pgcrypto.html)
- [NIST Key Management Guidelines](https://csrc.nist.gov/publications/detail/sp/800-57-part-1/rev-5/final)
