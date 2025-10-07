-- Clear any existing badges and reseed with default badge definitions
DELETE FROM badge_definitions;

-- Insert default badge definitions (without action_trigger column)
INSERT INTO badge_definitions (badge_id, name, description, icon, points, type, challenge_ids, required_count, display_order, is_active) VALUES
  ('commitment-maker', 'Commitment Maker', 'Made a clear commitment to being the best father for your child', '🤝', 15, 'challenge', '["1"]'::jsonb, 1, 0, true),
  ('storyteller', 'Storyteller', 'Shared your child''s beautiful origin story with them', '📚', 20, 'challenge', '["2"]'::jsonb, 1, 1, true),
  ('brave-heart', 'Brave Heart', 'Courageously shared your first public post with the DadderUp community', '🧡', 30, 'action', '[]'::jsonb, 1, 2, true),
  ('public-declarer', 'Public Declarer', 'Shared video or audio content publicly with the community', '📢', 25, 'action', '[]'::jsonb, 1, 3, true),
  ('video-challenger', 'Video Challenger', 'Created and shared video content', '🎥', 20, 'action', '[]'::jsonb, 1, 4, true),
  ('visionary', 'Visionary', 'Created a clear vision for your future fatherhood', '🎯', 20, 'challenge', '["4"]'::jsonb, 1, 5, true),
  ('anchor-setter', 'Anchor Setter', 'Established a personal mantra to guide your parenting journey', '⚓', 18, 'challenge', '["5"]'::jsonb, 1, 6, true),
  ('consistency-champion', 'Consistency Champion', 'Completed challenges for 3 consecutive days', '🔥', 25, 'action', '[]'::jsonb, 1, 7, true),
  ('dedication-master', 'Dedication Master', 'Completed challenges for 7 consecutive days', '🏆', 50, 'action', '[]'::jsonb, 1, 8, true),
  ('community-engager', 'Community Engager', 'Actively shared multiple public posts with the community', '🤗', 35, 'action', '[]'::jsonb, 1, 9, true),
  ('reflection-master', 'Reflection Master', 'Consistently provided thoughtful responses across all challenges', '💭', 40, 'action', '[]'::jsonb, 1, 10, true),
  ('habit-tracker', 'Habit Tracker', 'Created systems for tracking parenting progress', '📊', 20, 'challenge', '["6"]'::jsonb, 1, 11, true),
  ('system-builder', 'System Builder', 'Built sustainable systems for family engagement', '🛠️', 25, 'challenge', '["6"]'::jsonb, 1, 12, true),
  ('legacy-builder', 'Legacy Builder', 'Created meaningful symbols of commitment', '🏆', 30, 'challenge', '["7"]'::jsonb, 1, 13, true),
  ('commitment-keeper', 'Commitment Keeper', 'Anchored commitment with meaningful gestures', '💎', 25, 'challenge', '["7"]'::jsonb, 1, 14, true);
