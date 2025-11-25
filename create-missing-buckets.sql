-- Create missing storage buckets
-- Run this in Supabase SQL Editor

-- Create the buckets if they don't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit) VALUES
  ('appointment-files', 'appointment-files', false, 10485760),
  ('bir-files', 'bir-files', false, 10485760),
  ('awol-files', 'awol-files', false, 10485760),
  ('injury-files', 'injury-files', false, 10485760)
ON CONFLICT (id) DO NOTHING;

-- Verify they were created
SELECT name, public, file_size_limit FROM storage.buckets 
WHERE name IN ('appointment-files', 'bir-files', 'awol-files', 'injury-files')
ORDER BY name;
