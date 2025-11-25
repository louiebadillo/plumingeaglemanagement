-- Add missing _updated_by columns for file fields in daily_reports_v2 table
-- Run this in Supabase SQL Editor

-- Add AWOL files updated by column
ALTER TABLE daily_reports_v2 
ADD COLUMN awol_files_updated_by UUID REFERENCES users(id);

-- Add injury files updated by column  
ALTER TABLE daily_reports_v2 
ADD COLUMN injury_files_updated_by UUID REFERENCES users(id);

-- Add comments for documentation
COMMENT ON COLUMN daily_reports_v2.awol_files_updated_by IS 'User who last updated the AWOL files';
COMMENT ON COLUMN daily_reports_v2.injury_files_updated_by IS 'User who last updated the injury files';

-- Add indexes for the new columns
CREATE INDEX idx_daily_reports_awol_files_updated_by ON daily_reports_v2(awol_files_updated_by);
CREATE INDEX idx_daily_reports_injury_files_updated_by ON daily_reports_v2(injury_files_updated_by);
