-- Create storage buckets for user uploads
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('challenge-media', 'challenge-media', true);

-- Create RLS policies for the bucket
CREATE POLICY "Users can upload their own media files"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'challenge-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own media files"
ON storage.objects
FOR SELECT
USING (bucket_id = 'challenge-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own media files"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'challenge-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own media files"
ON storage.objects
FOR DELETE
USING (bucket_id = 'challenge-media' AND auth.uid()::text = (storage.foldername(name))[1]);