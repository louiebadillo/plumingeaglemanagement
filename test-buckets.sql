-- Test script to check if buckets exist
-- Run this in Supabase SQL Editor

-- List all buckets
SELECT name, public, file_size_limit, allowed_mime_types 
FROM storage.buckets 
ORDER BY name;

-- Check if our specific buckets exist
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'appointment-files') 
    THEN 'appointment-files EXISTS' 
    ELSE 'appointment-files MISSING' 
  END as appointment_files_status,
  CASE 
    WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'bir-files') 
    THEN 'bir-files EXISTS' 
    ELSE 'bir-files MISSING' 
  END as bir_files_status,
  CASE 
    WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'awol-files') 
    THEN 'awol-files EXISTS' 
    ELSE 'awol-files MISSING' 
  END as awol_files_status,
  CASE 
    WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'injury-files') 
    THEN 'injury-files EXISTS' 
    ELSE 'injury-files MISSING' 
  END as injury_files_status;
