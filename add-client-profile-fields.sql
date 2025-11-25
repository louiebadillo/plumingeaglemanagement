-- Add new client profile fields to clients table
-- Run this in your Supabase SQL Editor

-- Basic Information additions
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS pronouns VARCHAR(50);

ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS social_media_links JSONB DEFAULT '[]';

-- Case Worker Information (replaces Emergency Contacts)
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS case_worker_name VARCHAR(255);

ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS case_worker_phone VARCHAR(20);

ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS case_worker_agency VARCHAR(255);

ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS case_worker_agency_office_number VARCHAR(20);

ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS case_worker_on_call_number VARCHAR(20);

-- Physical Attributes
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS hair_colour VARCHAR(50);

ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS eye_colour VARCHAR(50);

ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS height VARCHAR(20);

ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS weight VARCHAR(20);

ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS build VARCHAR(50);

ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS body_marks TEXT;

-- School Information
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS alberta_student_number VARCHAR(50);

ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS school_name VARCHAR(255);

ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS grade VARCHAR(20);

ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS teacher VARCHAR(255);

ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS school_address TEXT;

ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS school_phone VARCHAR(20);

-- Medical Information additions
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS allergies TEXT;

ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS diagnosis TEXT;

ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS family_doctor VARCHAR(255);

ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS dentist VARCHAR(255);

ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS optometrist VARCHAR(255);

ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS specialist VARCHAR(255);

ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS pediatrician VARCHAR(255);

-- Allowed Contacts (array of contacts)
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS allowed_contacts JSONB DEFAULT '[]';

-- Risks and Preferences
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS risks_and_preferences TEXT;

-- Add indexes for JSONB queries
CREATE INDEX IF NOT EXISTS idx_clients_social_media_links ON clients USING GIN (social_media_links);
CREATE INDEX IF NOT EXISTS idx_clients_allowed_contacts ON clients USING GIN (allowed_contacts);

-- Add comments for documentation
COMMENT ON COLUMN clients.pronouns IS 'Client pronouns (e.g., he/him, she/her, they/them)';
COMMENT ON COLUMN clients.social_media_links IS 'JSONB array of social media links with platform and url';
COMMENT ON COLUMN clients.case_worker_name IS 'Case worker name';
COMMENT ON COLUMN clients.case_worker_phone IS 'Case worker phone number';
COMMENT ON COLUMN clients.case_worker_agency IS 'Case worker agency name';
COMMENT ON COLUMN clients.case_worker_agency_office_number IS 'Case worker agency office number';
COMMENT ON COLUMN clients.case_worker_on_call_number IS 'Case worker on-call number';
COMMENT ON COLUMN clients.hair_colour IS 'Client hair colour';
COMMENT ON COLUMN clients.eye_colour IS 'Client eye colour';
COMMENT ON COLUMN clients.height IS 'Client height (e.g., 5''10")';
COMMENT ON COLUMN clients.weight IS 'Client weight (e.g., 150 lbs)';
COMMENT ON COLUMN clients.build IS 'Client build (e.g., slim, average, stocky)';
COMMENT ON COLUMN clients.body_marks IS 'Body marks including tattoos, piercings, birthmarks, etc.';
COMMENT ON COLUMN clients.alberta_student_number IS 'Alberta student number';
COMMENT ON COLUMN clients.school_name IS 'School name';
COMMENT ON COLUMN clients.grade IS 'Current grade level';
COMMENT ON COLUMN clients.teacher IS 'Teacher name';
COMMENT ON COLUMN clients.school_address IS 'School address';
COMMENT ON COLUMN clients.school_phone IS 'School phone number';
COMMENT ON COLUMN clients.allergies IS 'Client allergies';
COMMENT ON COLUMN clients.diagnosis IS 'Medical diagnosis';
COMMENT ON COLUMN clients.family_doctor IS 'Family doctor name';
COMMENT ON COLUMN clients.dentist IS 'Dentist name';
COMMENT ON COLUMN clients.optometrist IS 'Optometrist name';
COMMENT ON COLUMN clients.specialist IS 'Specialist name (please specify)';
COMMENT ON COLUMN clients.pediatrician IS 'Pediatrician name';
COMMENT ON COLUMN clients.allowed_contacts IS 'JSONB array of allowed contacts with name, phone, and relationship';
COMMENT ON COLUMN clients.risks_and_preferences IS 'Risks and preferences information';

