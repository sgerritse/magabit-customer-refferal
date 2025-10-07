-- Create table for pause reminder tips
CREATE TABLE public.pause_reminder_tips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tip_text TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '📱',
  display_order INTEGER NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.pause_reminder_tips ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access
CREATE POLICY "Admins can view all tips"
ON public.pause_reminder_tips
FOR SELECT
USING (get_current_user_role() = 'admin');

CREATE POLICY "Admins can insert tips"
ON public.pause_reminder_tips
FOR INSERT
WITH CHECK (get_current_user_role() = 'admin');

CREATE POLICY "Admins can update tips"
ON public.pause_reminder_tips
FOR UPDATE
USING (get_current_user_role() = 'admin');

CREATE POLICY "Admins can delete tips"
ON public.pause_reminder_tips
FOR DELETE
USING (get_current_user_role() = 'admin');

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_pause_reminder_tips_updated_at
BEFORE UPDATE ON public.pause_reminder_tips
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default tips
INSERT INTO public.pause_reminder_tips (tip_text, emoji, display_order, is_active) VALUES
('Schedule a quick FaceTime or video call just to say hi.', '📱', 1, true),
('Send a funny meme, joke, or voice note to brighten their day.', '😂', 2, true),
('Write down one thing you want to share with them when you''re back together.', '✍️', 3, true),
('Pick up a small gift or snack they love for their return.', '🎁', 4, true),
('Send a picture of something from your day to make them feel included.', '📷', 5, true),
('Plan a "welcome back" activity, even something small like a favorite meal or game.', '❤️', 6, true);
