-- Add file columns to daily_reports_v2 table
-- Run this in Supabase SQL Editor

-- Add AWOL files column
ALTER TABLE daily_reports_v2 
ADD COLUMN awol_files JSONB DEFAULT '[]';

-- Add injury files column  
ALTER TABLE daily_reports_v2 
ADD COLUMN injury_files JSONB DEFAULT '[]';

-- Add indexes for JSONB queries
CREATE INDEX idx_daily_reports_awol_files ON daily_reports_v2 USING GIN (awol_files);
CREATE INDEX idx_daily_reports_injury_files ON daily_reports_v2 USING GIN (injury_files);

-- Add comments for documentation
COMMENT ON COLUMN daily_reports_v2.awol_files IS 'JSONB array of AWOL documentation files';
COMMENT ON COLUMN daily_reports_v2.injury_files IS 'JSONB array of injury documentation files';
