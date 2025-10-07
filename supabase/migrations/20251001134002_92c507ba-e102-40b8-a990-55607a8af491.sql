-- Add challenge_ids column to reactions table
ALTER TABLE reactions ADD COLUMN IF NOT EXISTS challenge_ids jsonb DEFAULT '[]'::jsonb;

-- Update existing reactions with their challenge associations from the original mock data
UPDATE reactions SET challenge_ids = '["1", "2", "3", "4", "5", "6", "7"]'::jsonb WHERE reaction_id = '1';
UPDATE reactions SET challenge_ids = '["1", "3"]'::jsonb WHERE reaction_id = '2';
UPDATE reactions SET challenge_ids = '["2", "3"]'::jsonb WHERE reaction_id = '3';
UPDATE reactions SET challenge_ids = '["1", "2", "7"]'::jsonb WHERE reaction_id = '4';
UPDATE reactions SET challenge_ids = '["2", "3", "4"]'::jsonb WHERE reaction_id = '5';
UPDATE reactions SET challenge_ids = '["1", "2", "4"]'::jsonb WHERE reaction_id = '6';
UPDATE reactions SET challenge_ids = '["1", "4", "7"]'::jsonb WHERE reaction_id = '7';
UPDATE reactions SET challenge_ids = '["1", "2", "7"]'::jsonb WHERE reaction_id = '8';
UPDATE reactions SET challenge_ids = '["2", "3", "6"]'::jsonb WHERE reaction_id = '9';
UPDATE reactions SET challenge_ids = '["1", "2", "7"]'::jsonb WHERE reaction_id = '10';
UPDATE reactions SET challenge_ids = '["2", "3", "4"]'::jsonb WHERE reaction_id = '11';
UPDATE reactions SET challenge_ids = '["3", "5", "6"]'::jsonb WHERE reaction_id = '12';
UPDATE reactions SET challenge_ids = '["2", "5", "6"]'::jsonb WHERE reaction_id = '13';
UPDATE reactions SET challenge_ids = '["2", "3", "6"]'::jsonb WHERE reaction_id = '14';
UPDATE reactions SET challenge_ids = '["2", "3", "7"]'::jsonb WHERE reaction_id = '15';
UPDATE reactions SET challenge_ids = '["1", "2", "4"]'::jsonb WHERE reaction_id = '16';
UPDATE reactions SET challenge_ids = '["5", "6", "7"]'::jsonb WHERE reaction_id = '17';
UPDATE reactions SET challenge_ids = '["1", "2", "4"]'::jsonb WHERE reaction_id = '18';
UPDATE reactions SET challenge_ids = '["1", "3", "7"]'::jsonb WHERE reaction_id = '19';
UPDATE reactions SET challenge_ids = '["2", "4", "5"]'::jsonb WHERE reaction_id = '20';

-- Seed default challenges if none exist
INSERT INTO challenges (challenge_id, title, description, type, category, difficulty, duration, points, icon, display_order, is_active)
VALUES 
  ('1', 'Make your commitment clear to your child', 'Express your dedication to being an involved and present father', 'reflection', 'Foundation', 'beginner', 15, 50, 'Heart', 1, true),
  ('2', 'Share their origin story', 'Tell your child about the day they were born and how they came into your life', 'storytelling', 'Connection', 'beginner', 20, 75, 'Book', 2, true),
  ('3', 'Make your declaration public', 'Share your commitment to fatherhood with your community', 'action', 'Community', 'intermediate', 30, 100, 'Megaphone', 3, true),
  ('4', 'Define your father vision', 'Create a clear vision of the father you want to become', 'reflection', 'Foundation', 'intermediate', 25, 75, 'Target', 4, true),
  ('5', 'Choose your anchor phrase', 'Develop a personal mantra to guide your parenting journey', 'reflection', 'Foundation', 'beginner', 15, 50, 'Anchor', 5, true),
  ('6', 'Create your DDS tracking board', 'Build a system to track your daily dedication to your child', 'action', 'Systems', 'intermediate', 30, 100, 'LayoutGrid', 6, true),
  ('7', 'Give them your legacy symbol', 'Create or give a meaningful object that represents your commitment', 'action', 'Legacy', 'advanced', 45, 150, 'Gift', 7, true)
ON CONFLICT (challenge_id) DO NOTHING;