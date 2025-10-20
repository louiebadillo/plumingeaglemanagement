-- Update facilities table to remove email and add description
-- Run this in your Supabase SQL Editor

-- First, add the description column if it doesn't exist
ALTER TABLE facilities 
ADD COLUMN IF NOT EXISTS description TEXT;

-- Set default value for description
ALTER TABLE facilities 
ALTER COLUMN description SET DEFAULT '';

-- Remove the email column since it's no longer needed
ALTER TABLE facilities 
DROP COLUMN IF EXISTS email;

-- Add a comment to describe the description column
COMMENT ON COLUMN facilities.description IS 'Description of the facility (e.g., Group Home - Main House, Specialized Care, etc.)';
