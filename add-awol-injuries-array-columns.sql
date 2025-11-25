-- Add awol_incidents and injuries JSONB array columns to daily_reports_v2 table
-- Run this in Supabase SQL Editor

-- Add AWOL incidents array column
ALTER TABLE daily_reports_v2 
ADD COLUMN IF NOT EXISTS awol_incidents JSONB DEFAULT '[]';

-- Add injuries array column
ALTER TABLE daily_reports_v2 
ADD COLUMN IF NOT EXISTS injuries JSONB DEFAULT '[]';

-- Add AWOL remarks column if it doesn't exist (for backward compatibility)
ALTER TABLE daily_reports_v2 
ADD COLUMN IF NOT EXISTS awol_remarks TEXT;

-- Add indexes for JSONB queries
CREATE INDEX IF NOT EXISTS idx_daily_reports_awol_incidents ON daily_reports_v2 USING GIN (awol_incidents);
CREATE INDEX IF NOT EXISTS idx_daily_reports_injuries ON daily_reports_v2 USING GIN (injuries);

-- Add comments for documentation
COMMENT ON COLUMN daily_reports_v2.awol_incidents IS 'JSONB array of AWOL incident objects with status, remarks, and files';
COMMENT ON COLUMN daily_reports_v2.injuries IS 'JSONB array of injury objects with type, perpetrator, remarks, and files';

-- Optional: Migrate existing data from old format to new format
-- This will convert existing awol_incident/awol_status/awol_remarks to awol_incidents array
UPDATE daily_reports_v2
SET awol_incidents = CASE
    WHEN awol_incident = true AND awol_status IS NOT NULL THEN
        jsonb_build_array(
            jsonb_build_object(
                'id', 'awol-' || id::text,
                'status', awol_status,
                'remarks', COALESCE(awol_remarks, ''),
                'files', COALESCE(awol_files, '[]'::jsonb),
                'updatedBy', awol_updated_by,
                'updatedAt', updated_at::text
            )
        )
    ELSE '[]'::jsonb
END
WHERE awol_incidents IS NULL OR awol_incidents = '[]'::jsonb;

-- Migrate existing injury data from old format to new format
UPDATE daily_reports_v2
SET injuries = CASE
    WHEN injury_occurred = true AND injury_type IS NOT NULL THEN
        jsonb_build_array(
            jsonb_build_object(
                'id', 'injury-' || id::text,
                'type', injury_type,
                'perpetrator', COALESCE(injury_perpetrator, ''),
                'remarks', COALESCE(injury_remarks, ''),
                'files', COALESCE(injury_files, '[]'::jsonb),
                'updatedBy', injury_updated_by,
                'updatedAt', updated_at::text
            )
        )
    ELSE '[]'::jsonb
END
WHERE injuries IS NULL OR injuries = '[]'::jsonb;

