-- Add awol_remarks column to daily_reports_v2 table
-- Run this in Supabase SQL Editor

-- Add AWOL remarks column
ALTER TABLE daily_reports_v2 
ADD COLUMN awol_remarks TEXT;

-- Add comment for documentation
COMMENT ON COLUMN daily_reports_v2.awol_remarks IS 'Additional remarks and details about AWOL incidents';
