-- Add general_files column to daily_reports_v2 table
-- Run this in Supabase SQL Editor

-- Add general files column
ALTER TABLE daily_reports_v2 
ADD COLUMN general_files JSONB DEFAULT '[]';

-- Add general files updated by column
ALTER TABLE daily_reports_v2 
ADD COLUMN general_files_updated_by UUID REFERENCES users(id);

-- Add indexes for JSONB queries
CREATE INDEX idx_daily_reports_general_files ON daily_reports_v2 USING GIN (general_files);
CREATE INDEX idx_daily_reports_general_files_updated_by ON daily_reports_v2(general_files_updated_by);

-- Add comments for documentation
COMMENT ON COLUMN daily_reports_v2.general_files IS 'JSONB array of general documentation files';
COMMENT ON COLUMN daily_reports_v2.general_files_updated_by IS 'User who last updated the general files';
