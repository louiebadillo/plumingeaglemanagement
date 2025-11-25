-- Simple script to create storage buckets
-- Run this in the Supabase SQL Editor

-- Create the buckets
INSERT INTO storage.buckets (id, name, public) VALUES
  ('appointment-files', 'appointment-files', false),
  ('bir-files', 'bir-files', false),
  ('awol-files', 'awol-files', false),
  ('injury-files', 'injury-files', false)
ON CONFLICT (id) DO NOTHING;

-- Check if buckets were created
SELECT name, public FROM storage.buckets WHERE name IN ('appointment-files', 'bir-files', 'awol-files', 'injury-files');
