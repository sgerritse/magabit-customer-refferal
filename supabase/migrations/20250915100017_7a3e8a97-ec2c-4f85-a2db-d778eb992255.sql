-- Fix storage policies for anonymous demo access
DROP POLICY IF EXISTS "Users can upload their own media files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own media files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own media files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own media files" ON storage.objects;

-- Create more permissive storage policies for demo purposes
CREATE POLICY "Allow anonymous uploads to challenge-media"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'challenge-media');

CREATE POLICY "Allow public read access to challenge-media"
ON storage.objects
FOR SELECT
USING (bucket_id = 'challenge-media');

CREATE POLICY "Allow anonymous updates to challenge-media"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'challenge-media');

CREATE POLICY "Allow anonymous deletes from challenge-media"
ON storage.objects
FOR DELETE
USING (bucket_id = 'challenge-media');

-- Fix user_points policies for demo user
DROP POLICY IF EXISTS "Users can insert their own points" ON user_points;
DROP POLICY IF EXISTS "Users can view their own points" ON user_points;
DROP POLICY IF EXISTS "Users can update their own points" ON user_points;
DROP POLICY IF EXISTS "Users can delete their own points" ON user_points;

-- Create policies that work for demo user
CREATE POLICY "Allow demo user points insert"
ON user_points
FOR INSERT
WITH CHECK (user_id = '1b41285e-6f26-47fe-ac6c-21564d8abc9e' OR auth.uid() = user_id);

CREATE POLICY "Allow demo user points select"
ON user_points
FOR SELECT
USING (user_id = '1b41285e-6f26-47fe-ac6c-21564d8abc9e' OR auth.uid() = user_id);

CREATE POLICY "Allow demo user points update"
ON user_points
FOR UPDATE
USING (user_id = '1b41285e-6f26-47fe-ac6c-21564d8abc9e' OR auth.uid() = user_id);

CREATE POLICY "Allow demo user points delete"
ON user_points
FOR DELETE
USING (user_id = '1b41285e-6f26-47fe-ac6c-21564d8abc9e' OR auth.uid() = user_id);

-- Fix user_badges policies for demo user
DROP POLICY IF EXISTS "Users can insert their own badges" ON user_badges;
DROP POLICY IF EXISTS "Users can view their own badges" ON user_badges;
DROP POLICY IF EXISTS "Users can update their own badges" ON user_badges;
DROP POLICY IF EXISTS "Users can delete their own badges" ON user_badges;

-- Create policies that work for demo user
CREATE POLICY "Allow demo user badges insert"
ON user_badges
FOR INSERT
WITH CHECK (user_id = '1b41285e-6f26-47fe-ac6c-21564d8abc9e' OR auth.uid() = user_id);

CREATE POLICY "Allow demo user badges select"
ON user_badges
FOR SELECT
USING (user_id = '1b41285e-6f26-47fe-ac6c-21564d8abc9e' OR auth.uid() = user_id);

CREATE POLICY "Allow demo user badges update"
ON user_badges
FOR UPDATE
USING (user_id = '1b41285e-6f26-47fe-ac6c-21564d8abc9e' OR auth.uid() = user_id);

CREATE POLICY "Allow demo user badges delete"
ON user_badges
FOR DELETE
USING (user_id = '1b41285e-6f26-47fe-ac6c-21564d8abc9e' OR auth.uid() = user_id);