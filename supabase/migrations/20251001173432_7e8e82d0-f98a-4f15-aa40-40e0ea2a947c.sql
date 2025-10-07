
-- Insert default parent reactions
INSERT INTO public.parent_reactions (reaction_id, emoji, label, display_order, is_active) VALUES
('1', '😊', 'Happy', 1, true),
('2', '😌', 'Calm', 2, true),
('3', '😍', 'Proud', 3, true),
('4', '🥰', 'Connected', 4, true),
('5', '😭', 'Emotional', 5, true),
('6', '😤', 'Frustrated', 6, true),
('7', '😔', 'Disappointed', 7, true),
('8', '🤗', 'Loving', 8, true),
('9', '😮', 'Surprised', 9, true),
('10', '🔥', 'Energized', 10, true)
ON CONFLICT (reaction_id) DO NOTHING;
