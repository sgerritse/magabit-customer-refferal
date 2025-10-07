-- Add W-9 file path column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS w9_file_path TEXT;

-- Create user notification preferences table
CREATE TABLE IF NOT EXISTS user_notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_enabled BOOLEAN DEFAULT true,
  sms_enabled BOOLEAN DEFAULT false,
  push_enabled BOOLEAN DEFAULT false,
  weekly_digest BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on notification preferences
ALTER TABLE user_notification_preferences ENABLE ROW LEVEL SECURITY;

-- Users can manage their own preferences
CREATE POLICY "Users can manage own preferences"
ON user_notification_preferences
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create tax-documents storage bucket (private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'tax-documents',
  'tax-documents',
  false,
  10485760, -- 10MB limit
  ARRAY['application/pdf']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- RLS for tax-documents: Only admins can view
CREATE POLICY "Admins can view tax documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'tax-documents' 
  AND get_current_user_role() = 'admin'
);

-- Users can upload their own W-9
CREATE POLICY "Users can upload own tax documents"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'tax-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Add trigger for notification preferences updated_at
CREATE TRIGGER update_notification_preferences_updated_at
BEFORE UPDATE ON user_notification_preferences
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();