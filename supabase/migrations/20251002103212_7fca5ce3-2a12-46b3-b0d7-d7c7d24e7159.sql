-- Add WordPress user ID tracking and sync status to users table
ALTER TABLE public.users 
ADD COLUMN wp_user_id INTEGER UNIQUE,
ADD COLUMN sync_status TEXT DEFAULT 'pending'
CHECK (sync_status IN ('pending', 'synced', 'failed'));

-- Add index for fast WordPress ID lookups
CREATE INDEX idx_users_wp_user_id ON public.users(wp_user_id);

-- Add comments for documentation
COMMENT ON COLUMN public.users.wp_user_id IS 'WordPress user ID for cross-system reference';
COMMENT ON COLUMN public.users.sync_status IS 'Status of sync between WordPress and Supabase';