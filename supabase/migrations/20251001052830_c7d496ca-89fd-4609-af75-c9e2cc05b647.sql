-- Add due_date column to users table for expecting fathers
ALTER TABLE public.users
ADD COLUMN due_date DATE;