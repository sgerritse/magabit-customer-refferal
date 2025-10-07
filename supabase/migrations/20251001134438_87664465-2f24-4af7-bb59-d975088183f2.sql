-- Add missing columns to challenges table for complete frontend functionality
ALTER TABLE challenges 
  ADD COLUMN IF NOT EXISTS tip text DEFAULT '',
  ADD COLUMN IF NOT EXISTS video_url text DEFAULT '',
  ADD COLUMN IF NOT EXISTS badges jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS reactions jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS parent_reactions jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS points_earned integer DEFAULT 10,
  ADD COLUMN IF NOT EXISTS points_bonus integer DEFAULT 5,
  ADD COLUMN IF NOT EXISTS shop_points integer DEFAULT 5,
  ADD COLUMN IF NOT EXISTS image_points integer DEFAULT 3,
  ADD COLUMN IF NOT EXISTS video_points integer DEFAULT 10,
  ADD COLUMN IF NOT EXISTS audio_points integer DEFAULT 5,
  ADD COLUMN IF NOT EXISTS shop_button_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS shop_type text DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS shop_product_id text DEFAULT '',
  ADD COLUMN IF NOT EXISTS shop_url text DEFAULT '',
  ADD COLUMN IF NOT EXISTS woocommerce_product_id text DEFAULT '',
  ADD COLUMN IF NOT EXISTS submission_types jsonb DEFAULT '{"text": true, "image": false, "audio": false, "video": false}'::jsonb;

-- Update existing challenges with complete data
UPDATE challenges SET
  tip = 'Look them in the eyes when you say it. This moment anchors your journey and lets them know they''re your ''why.''',
  description = 'Sit with your child and tell them: "I joined DadderUp because I want to be the best version of myself—for you." Say it simply. Clearly. Out loud. This moment anchors your journey and lets them know they''re your ''why.'' Look them in the eyes when you say it - this builds the foundation of your commitment to being better.',
  badges = '["commitment-maker"]'::jsonb,
  reactions = '[1, 5, 6, 7, 10, 18]'::jsonb,
  parent_reactions = '[1, 2, 3, 4, 5]'::jsonb,
  points_earned = 10,
  image_points = 3,
  video_points = 10,
  audio_points = 5,
  shop_points = 5,
  submission_types = '{"text": true, "image": false, "audio": true, "video": true}'::jsonb
WHERE challenge_id = '1';

UPDATE challenges SET
  tip = 'Include specific details like what you were wearing, the weather, or how small their hands were. Kids love these intimate details.',
  description = 'Tell your child the story of the day they were born—or the first time you met them. Describe how it felt to hold them or see them for the first time. Include specific details like what you were wearing, the weather, or how small their hands were. Kids love these intimate details.',
  badges = '["storyteller"]'::jsonb,
  reactions = '[1, 4, 5, 9, 10, 15, 20]'::jsonb,
  parent_reactions = '[1, 3, 4, 5]'::jsonb,
  points_earned = 15,
  image_points = 3,
  video_points = 10,
  audio_points = 5,
  shop_points = 5,
  submission_types = '{"text": true, "image": false, "audio": true, "video": true}'::jsonb
WHERE challenge_id = '2';

UPDATE challenges SET
  tip = 'Speak from the heart, not from a script. Authenticity matters more than perfection.',
  description = 'Record a short video of yourself (30–60 seconds) saying why you joined DadderUp and two things you love most about your kid(s). Post it and tag @DadderUp. Speak from the heart, not from a script. Authenticity matters more than perfection.',
  badges = '["brave-heart", "public-declarer"]'::jsonb,
  reactions = '[1, 11, 12, 14, 15, 19]'::jsonb,
  parent_reactions = '[1, 2, 6, 9]'::jsonb,
  points_earned = 20,
  image_points = 3,
  video_points = 15,
  audio_points = 5,
  shop_points = 5,
  shop_button_enabled = true,
  shop_type = 'general',
  shop_url = '/shop',
  woocommerce_product_id = 'video-challenge-001',
  submission_types = '{"text": true, "image": true, "audio": false, "video": true}'::jsonb
WHERE challenge_id = '3';

UPDATE challenges SET
  tip = 'Make it specific and personal. Instead of ''be a good dad,'' try ''be the dad who listens first and speaks second.''',
  description = 'Write a one-sentence vision of the kind of father you want to be by next year. Say it out loud while looking in the mirror. Make it specific and personal. Instead of ''be a good dad,'' try ''be the dad who listens first and speaks second.''',
  badges = '["visionary"]'::jsonb,
  reactions = '[5, 6, 11, 16, 18, 20]'::jsonb,
  parent_reactions = '[1, 3, 4, 10]'::jsonb,
  points_earned = 12,
  image_points = 3,
  video_points = 10,
  audio_points = 5,
  shop_points = 5,
  submission_types = '{"text": true, "image": true, "audio": true, "video": false}'::jsonb
WHERE challenge_id = '4';

UPDATE challenges SET
  tip = 'Pick something that resonates with your biggest parenting challenge right now. You''ll come back to this phrase often.',
  description = 'Choose a phrase that will be your mantra for this season (e.g., "Show up anyway," "Calm is the flex," "Legacy, not noise."). Write it down and post it somewhere visible. Pick something that resonates with your biggest parenting challenge right now.',
  badges = '["anchor-setter"]'::jsonb,
  reactions = '[12, 13, 17, 20]'::jsonb,
  parent_reactions = '[1, 2, 3, 10]'::jsonb,
  points_earned = 8,
  image_points = 3,
  video_points = 10,
  audio_points = 5,
  shop_points = 5,
  shop_button_enabled = true,
  shop_type = 'product',
  shop_product_id = 'mantra-poster-123',
  shop_url = '/shop/mantra-poster',
  woocommerce_product_id = 'mantra-challenge-005',
  submission_types = '{"text": true, "image": false, "audio": true, "video": false}'::jsonb
WHERE challenge_id = '5';

UPDATE challenges SET
  tip = 'Make it visual and fun. Kids love being part of your progress and seeing tangible results.',
  description = 'Create a DadderUp DDS Board in your home (like a chore board). Every time you log a Flex, let your child mark an "X" or sticker. At the end of the month, celebrate together. Make it visual and fun. Kids love being part of your progress and seeing tangible results.',
  badges = '["habit-tracker", "system-builder"]'::jsonb,
  reactions = '[9, 12, 13, 14, 17]'::jsonb,
  parent_reactions = '[1, 3, 6, 10]'::jsonb,
  points_earned = 15,
  image_points = 4,
  video_points = 12,
  audio_points = 6,
  shop_points = 5,
  submission_types = '{"text": true, "image": true, "audio": true, "video": false}'::jsonb
WHERE challenge_id = '6';

UPDATE challenges SET
  tip = 'Choose something meaningful they can keep with them. This becomes a physical reminder of your commitment to growth.',
  description = 'Give your child a small, sentimental item (or DadderUp Coin if received) and say: "This is a symbol of how seriously I take being your dad." Let it anchor your commitment. Choose something meaningful they can keep with them. This becomes a physical reminder of your commitment to growth.',
  badges = '["legacy-builder", "commitment-keeper"]'::jsonb,
  reactions = '[1, 4, 7, 8, 10, 15, 19]'::jsonb,
  parent_reactions = '[1, 3, 4, 5, 8]'::jsonb,
  points_earned = 20,
  image_points = 3,
  video_points = 10,
  audio_points = 5,
  shop_points = 5,
  shop_button_enabled = true,
  shop_type = 'general',
  shop_url = '/shop/legacy-items',
  woocommerce_product_id = 'legacy-symbol-007',
  submission_types = '{"text": true, "image": true, "audio": false, "video": true}'::jsonb
WHERE challenge_id = '7';