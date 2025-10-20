-- Update users table schema for complete CRUD functionality

-- Add phone field if it doesn't exist
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone text;

-- Add profile_picture_url field for storing profile picture URLs
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS profile_picture_url text;

-- Remove any existing status, hire_date, last_login columns if they exist
-- (These will be handled in the frontend only, not stored in Supabase)

-- Update the trigger function to handle new user creation with all fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, first_name, last_name, role, phone, profile_picture_url)
    VALUES (
        NEW.id, 
        NEW.email, 
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''), 
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''), 
        COALESCE(NEW.raw_user_meta_data->>'role', 'employee')::user_role,
        COALESCE(NEW.raw_user_meta_data->>'phone', ''),
        COALESCE(NEW.raw_user_meta_data->>'profile_picture_url', '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Verify the schema
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position;
