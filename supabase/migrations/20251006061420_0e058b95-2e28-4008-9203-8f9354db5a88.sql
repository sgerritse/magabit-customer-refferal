-- Enable pgcrypto extension for encryption functions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Update encrypt_sensitive_data() to use pgcrypto properly
CREATE OR REPLACE FUNCTION public.encrypt_sensitive_data(data text)
RETURNS bytea
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  encryption_key text;
BEGIN
  -- Get encryption key from Vault
  SELECT decrypted_secret INTO encryption_key
  FROM vault.decrypted_secrets
  WHERE name = 'field_encryption_key'
  LIMIT 1;
  
  IF encryption_key IS NULL OR encryption_key = '' THEN
    RAISE EXCEPTION 'Encryption key not found in Vault. Create secret "field_encryption_key" in Supabase Dashboard > Project Settings > Vault.';
  END IF;
  
  -- Encrypt using AES-256 in CBC mode with pgcrypto
  RETURN pgcrypto.encrypt(
    data::bytea,
    decode(encryption_key, 'hex'),
    'aes-cbc'
  );
END;
$$;

-- Update decrypt_sensitive_data() to use pgcrypto properly
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
  
  -- Get encryption key from Vault
  SELECT decrypted_secret INTO encryption_key
  FROM vault.decrypted_secrets
  WHERE name = 'field_encryption_key'
  LIMIT 1;
  
  IF encryption_key IS NULL OR encryption_key = '' THEN
    RAISE EXCEPTION 'Encryption key not found in Vault. Create secret "field_encryption_key" in Supabase Dashboard > Project Settings > Vault.';
  END IF;
  
  -- Decrypt using AES-256 in CBC mode with pgcrypto
  RETURN convert_from(
    pgcrypto.decrypt(
      encrypted_data,
      decode(encryption_key, 'hex'),
      'aes-cbc'
    ),
    'UTF8'
  );
END;
$$;