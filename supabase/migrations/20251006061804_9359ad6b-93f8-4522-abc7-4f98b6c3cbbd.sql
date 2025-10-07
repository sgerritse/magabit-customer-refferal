-- Use schema-qualified functions from the extensions schema and cast algorithm to text
CREATE OR REPLACE FUNCTION public.encrypt_sensitive_data(data text)
RETURNS bytea
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  encryption_key text;
BEGIN
  SELECT decrypted_secret INTO encryption_key
  FROM vault.decrypted_secrets
  WHERE name = 'field_encryption_key'
  LIMIT 1;

  IF encryption_key IS NULL OR encryption_key = '' THEN
    RAISE EXCEPTION 'Encryption key not found in Vault. Create secret "field_encryption_key" in Supabase Dashboard > Project Settings > Vault.';
  END IF;

  RETURN extensions.encrypt(
    data::bytea,
    decode(encryption_key, 'hex'),
    'aes-cbc'::text
  );
END;
$$;

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
  WHERE name = 'field_encryption_key'
  LIMIT 1;

  IF encryption_key IS NULL OR encryption_key = '' THEN
    RAISE EXCEPTION 'Encryption key not found in Vault. Create secret "field_encryption_key" in Supabase Dashboard > Project Settings > Vault.';
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