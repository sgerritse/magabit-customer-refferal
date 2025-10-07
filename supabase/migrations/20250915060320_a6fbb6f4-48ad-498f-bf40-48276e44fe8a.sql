-- Create tables for user points and badge tracking

-- User points history table
CREATE TABLE public.user_points (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  points INTEGER NOT NULL,
  reason TEXT NOT NULL,
  source_type TEXT NOT NULL DEFAULT 'manual', -- 'challenge', 'badge', 'manual', 'bonus'
  source_id TEXT, -- reference to challenge id, badge id, etc.
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User badge achievements table
CREATE TABLE public.user_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  badge_id TEXT NOT NULL,
  badge_name TEXT NOT NULL,
  badge_icon TEXT NOT NULL,
  badge_description TEXT NOT NULL,
  points_awarded INTEGER NOT NULL DEFAULT 0,
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- Create policies for user_points
CREATE POLICY "Users can view their own points" 
ON public.user_points 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own points" 
ON public.user_points 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create policies for user_badges
CREATE POLICY "Users can view their own badges" 
ON public.user_badges 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own badges" 
ON public.user_badges 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_user_points_user_id ON public.user_points(user_id);
CREATE INDEX idx_user_points_created_at ON public.user_points(created_at DESC);
CREATE INDEX idx_user_badges_user_id ON public.user_badges(user_id);
CREATE INDEX idx_user_badges_earned_at ON public.user_badges(earned_at DESC);

-- Create function to automatically award points when badges are earned
CREATE OR REPLACE FUNCTION public.award_badge_points()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert points record when a badge is earned
  INSERT INTO public.user_points (user_id, points, reason, source_type, source_id)
  VALUES (
    NEW.user_id, 
    NEW.points_awarded, 
    'Badge earned: ' || NEW.badge_name,
    'badge',
    NEW.badge_id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger to award points when badges are earned
CREATE TRIGGER award_badge_points_trigger
AFTER INSERT ON public.user_badges
FOR EACH ROW
EXECUTE FUNCTION public.award_badge_points();

-- Update timestamps function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;