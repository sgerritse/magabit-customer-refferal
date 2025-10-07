-- Insert initial key rotation record for new system setup
INSERT INTO public.encryption_key_rotations (
  rotation_date,
  rotated_by,
  old_key_identifier,
  new_key_identifier,
  records_re_encrypted,
  status,
  notes
) VALUES (
  NOW(),
  NULL,
  NULL,
  'field_encryption_key',
  0,
  'completed',
  'Initial encryption key setup during system deployment'
)
ON CONFLICT DO NOTHING;