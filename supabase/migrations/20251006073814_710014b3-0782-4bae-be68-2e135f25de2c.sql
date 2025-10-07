-- Stage 2 Phase 3: Database Cleanup - Drop plaintext PII columns
-- Only keeping email and phone for auth system compatibility

-- Drop the plaintext PII columns that are now fully encrypted
ALTER TABLE public.users DROP COLUMN IF EXISTS first_name;
ALTER TABLE public.users DROP COLUMN IF EXISTS last_name;
ALTER TABLE public.users DROP COLUMN IF EXISTS date_of_birth;

-- Add column comments for documentation
COMMENT ON COLUMN public.users.first_name_encrypted IS 'Encrypted first name - use get_user_decrypted() RPC to access';
COMMENT ON COLUMN public.users.last_name_encrypted IS 'Encrypted last name - use get_user_decrypted() RPC to access';
COMMENT ON COLUMN public.users.date_of_birth_encrypted IS 'Encrypted date of birth - use get_user_decrypted() RPC to access';
COMMENT ON COLUMN public.users.email IS 'Plaintext email - required for auth system';
COMMENT ON COLUMN public.users.phone IS 'Plaintext phone - used for auth and notifications';

-- Update table comment
COMMENT ON TABLE public.users IS 'User personal information table - Protected by RLS. PII fields (first_name, last_name, date_of_birth) are encrypted at rest. Use get_user_decrypted() RPC function to access decrypted data. Email and phone are kept plaintext for authentication system compatibility. All admin access is audit-logged.';