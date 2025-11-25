-- Add status column to clients table
-- Run this in Supabase SQL Editor

-- Add status column with default value
ALTER TABLE clients ADD COLUMN status VARCHAR(20) DEFAULT 'active';

-- Add check constraint for valid status values
ALTER TABLE clients ADD CONSTRAINT check_client_status 
  CHECK (status IN ('active', 'inactive', 'discharged'));

-- Update existing clients to have 'active' status if they don't have one
UPDATE clients SET status = 'active' WHERE status IS NULL;

-- Add index for better performance on status queries
CREATE INDEX idx_clients_status ON clients(status);
