-- Test if afternoon and evening shift columns exist
-- Run this in Supabase SQL Editor to check

SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'daily_reports_v2' 
AND column_name LIKE '%afternoon%' OR column_name LIKE '%evening%' OR column_name IN ('appointments', 'bir_incidents')
ORDER BY column_name;
