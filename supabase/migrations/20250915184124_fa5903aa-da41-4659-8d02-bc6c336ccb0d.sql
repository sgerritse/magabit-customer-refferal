-- Create answer_logs table to replace localStorage storage
CREATE TABLE public.answer_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id INTEGER NOT NULL,
  challenge_title TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_avatar TEXT,
  response TEXT NOT NULL,
  rating INTEGER NOT NULL DEFAULT 0,
  time_spent INTEGER NOT NULL DEFAULT 0,
  privacy TEXT NOT NULL DEFAULT 'private' CHECK (privacy IN ('public', 'private')),
  submission_type TEXT NOT NULL,
  media_files JSONB DEFAULT '[]',
  points_earned INTEGER NOT NULL DEFAULT 0,
  reaction TEXT,
  child_reactions JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.answer_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own answer logs" 
ON public.answer_logs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own answer logs" 
ON public.answer_logs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own answer logs" 
ON public.answer_logs 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own answer logs" 
ON public.answer_logs 
FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all answer logs" 
ON public.answer_logs 
FOR SELECT 
USING (get_current_user_role() = 'admin');

CREATE POLICY "Admins can delete any answer logs" 
ON public.answer_logs 
FOR DELETE 
USING (get_current_user_role() = 'admin');

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_answer_logs_updated_at
BEFORE UPDATE ON public.answer_logs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();