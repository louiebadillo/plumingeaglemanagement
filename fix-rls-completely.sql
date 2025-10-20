-- Completely fix RLS issues by dropping all policies and disabling RLS temporarily

-- Drop ALL policies on users table
DROP POLICY IF EXISTS "Public users are viewable by authenticated users." ON public.users;
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile." ON public.users;
DROP POLICY IF EXISTS "Admins can view all user profiles." ON public.users;
DROP POLICY IF EXISTS "Admins can insert any user profile." ON public.users;
DROP POLICY IF EXISTS "Admins can update any user profile." ON public.users;
DROP POLICY IF EXISTS "Admins can delete any user profile." ON public.users;
DROP POLICY IF EXISTS "Authenticated users can view all users" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Service role can do everything" ON public.users;

-- Disable RLS completely on users table
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Verify the change
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'users' AND schemaname = 'public';
