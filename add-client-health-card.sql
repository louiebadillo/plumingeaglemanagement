-- Add Alberta Health Card Number field to clients table
-- Run this in your Supabase SQL Editor

-- Add the alberta_health_card_number column to the clients table
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS alberta_health_card_number VARCHAR(20);

-- Add a comment to describe the field
COMMENT ON COLUMN clients.alberta_health_card_number IS 'Alberta Health Card Number for the client';

-- Add an index for better performance when searching by health card number
CREATE INDEX IF NOT EXISTS idx_clients_health_card ON clients(alberta_health_card_number);
