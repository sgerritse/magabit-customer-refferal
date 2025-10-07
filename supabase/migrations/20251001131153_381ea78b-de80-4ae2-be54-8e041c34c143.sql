-- Create challenges table
CREATE TABLE public.challenges (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id text NOT NULL UNIQUE,
  title text NOT NULL,
  description text NOT NULL,
  type text NOT NULL,
  duration integer NOT NULL DEFAULT 0,
  difficulty text NOT NULL DEFAULT 'beginner',
  category text NOT NULL,
  points integer NOT NULL DEFAULT 0,
  icon text NOT NULL DEFAULT 'Trophy',
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create reactions table
CREATE TABLE public.reactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reaction_id text NOT NULL UNIQUE,
  emoji text NOT NULL,
  label text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create parent_reactions table
CREATE TABLE public.parent_reactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reaction_id text NOT NULL UNIQUE,
  emoji text NOT NULL,
  label text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create badge_definitions table
CREATE TABLE public.badge_definitions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  badge_id text NOT NULL UNIQUE,
  name text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL,
  points integer NOT NULL DEFAULT 0,
  type text NOT NULL,
  challenge_ids jsonb DEFAULT '[]'::jsonb,
  required_count integer DEFAULT 1,
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badge_definitions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for challenges
CREATE POLICY "Anyone can view active challenges"
  ON public.challenges FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage challenges"
  ON public.challenges FOR ALL
  USING (get_current_user_role() = 'admin');

-- RLS Policies for reactions
CREATE POLICY "Anyone can view active reactions"
  ON public.reactions FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage reactions"
  ON public.reactions FOR ALL
  USING (get_current_user_role() = 'admin');

-- RLS Policies for parent_reactions
CREATE POLICY "Anyone can view active parent reactions"
  ON public.parent_reactions FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage parent reactions"
  ON public.parent_reactions FOR ALL
  USING (get_current_user_role() = 'admin');

-- RLS Policies for badge_definitions
CREATE POLICY "Anyone can view active badge definitions"
  ON public.badge_definitions FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage badge definitions"
  ON public.badge_definitions FOR ALL
  USING (get_current_user_role() = 'admin');

-- Triggers for updated_at
CREATE TRIGGER update_challenges_updated_at
  BEFORE UPDATE ON public.challenges
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reactions_updated_at
  BEFORE UPDATE ON public.reactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_parent_reactions_updated_at
  BEFORE UPDATE ON public.parent_reactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_badge_definitions_updated_at
  BEFORE UPDATE ON public.badge_definitions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();