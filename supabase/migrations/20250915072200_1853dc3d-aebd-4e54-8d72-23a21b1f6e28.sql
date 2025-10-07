-- Add father_type column to users table
ALTER TABLE public.users 
ADD COLUMN father_type text CHECK (father_type IN ('blood_father', 'flex_dad'));