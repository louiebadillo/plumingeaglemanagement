-- Fix RLS policies to prevent infinite recursion
-- Drop existing policies first
DROP POLICY IF EXISTS "Public users are viewable by authenticated users." ON public.users;
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile." ON public.users;
DROP POLICY IF EXISTS "Admins can view all user profiles." ON public.users;
DROP POLICY IF EXISTS "Admins can insert any user profile." ON public.users;
DROP POLICY IF EXISTS "Admins can update any user profile." ON public.users;
DROP POLICY IF EXISTS "Admins can delete any user profile." ON public.users;

-- Create simpler, non-recursive policies
-- Allow authenticated users to view all users (for now, we can make this more restrictive later)
CREATE POLICY "Authenticated users can view all users" ON public.users 
FOR SELECT USING (auth.role() = 'authenticated');

-- Allow users to insert their own profile
CREATE POLICY "Users can insert their own profile" ON public.users 
FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile" ON public.users 
FOR UPDATE USING (auth.uid() = id);

-- Allow service role to do everything (for admin operations)
CREATE POLICY "Service role can do everything" ON public.users 
FOR ALL USING (auth.role() = 'service_role');
