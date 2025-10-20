-- Add missing client fields to the clients table
-- Run this in your Supabase SQL Editor

-- Add gender field
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS gender VARCHAR(20);

-- Add medical and preference fields
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS medical_notes TEXT;

ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS dietary_restrictions TEXT;

ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS activity_preferences TEXT;

ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS other_preferences TEXT;

-- Add emergency contact fields
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS emergency_contact_name VARCHAR(255);

ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS emergency_contact_relationship VARCHAR(100);

ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS emergency_contact_phone VARCHAR(20);

ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS emergency_contact_email VARCHAR(255);

-- Add secondary emergency contact fields
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS secondary_emergency_contact_name VARCHAR(255);

ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS secondary_emergency_contact_relationship VARCHAR(100);

ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS secondary_emergency_contact_phone VARCHAR(20);

ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS secondary_emergency_contact_email VARCHAR(255);

-- Add admission and room fields
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS admission_date DATE;

ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS room VARCHAR(50);

-- Add comments to describe the new columns
COMMENT ON COLUMN clients.gender IS 'Client gender/sex (Male, Female, Other, Prefer not to say)';
COMMENT ON COLUMN clients.medical_notes IS 'Medical notes and health information';
COMMENT ON COLUMN clients.dietary_restrictions IS 'Dietary restrictions and food preferences';
COMMENT ON COLUMN clients.activity_preferences IS 'Activity and recreational preferences';
COMMENT ON COLUMN clients.other_preferences IS 'Other client preferences and special needs';
COMMENT ON COLUMN clients.emergency_contact_name IS 'Primary emergency contact name';
COMMENT ON COLUMN clients.emergency_contact_relationship IS 'Relationship to client';
COMMENT ON COLUMN clients.emergency_contact_phone IS 'Primary emergency contact phone';
COMMENT ON COLUMN clients.emergency_contact_email IS 'Primary emergency contact email';
COMMENT ON COLUMN clients.secondary_emergency_contact_name IS 'Secondary emergency contact name';
COMMENT ON COLUMN clients.secondary_emergency_contact_relationship IS 'Relationship to client';
COMMENT ON COLUMN clients.secondary_emergency_contact_phone IS 'Secondary emergency contact phone';
COMMENT ON COLUMN clients.secondary_emergency_contact_email IS 'Secondary emergency contact email';
COMMENT ON COLUMN clients.admission_date IS 'Date client was admitted to facility';
COMMENT ON COLUMN clients.room IS 'Room number or identifier';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_clients_gender ON clients(gender);
CREATE INDEX IF NOT EXISTS idx_clients_admission_date ON clients(admission_date);
CREATE INDEX IF NOT EXISTS idx_clients_room ON clients(room);
