-- Add phone field to users table
ALTER TABLE public.users ADD COLUMN phone text;

-- Add status field to users table (for active/inactive status)
ALTER TABLE public.users ADD COLUMN status text DEFAULT 'active';

-- Verify the changes
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position;
