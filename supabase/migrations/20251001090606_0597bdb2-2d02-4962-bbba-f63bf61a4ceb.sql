-- Add pause reminders settings to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS reminders_paused BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS reminders_resume_date DATE;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_users_reminders_paused ON public.users(reminders_paused);
