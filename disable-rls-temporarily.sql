-- Temporarily disable RLS on users table to fix the infinite recursion issue
-- This will allow the app to work while we figure out the proper RLS policies

-- Disable RLS on users table
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Verify the change
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'users' AND schemaname = 'public';
