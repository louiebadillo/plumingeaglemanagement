-- Add new client fields for analytics progress reports
-- Run this in Supabase SQL Editor

-- Add client_id_no column
ALTER TABLE clients 
ADD COLUMN client_id_no VARCHAR(50);

-- Add band_no column
ALTER TABLE clients 
ADD COLUMN band_no VARCHAR(50);

-- Add indexes for the new columns
CREATE INDEX idx_clients_client_id_no ON clients(client_id_no);
CREATE INDEX idx_clients_band_no ON clients(band_no);

-- Add comments for documentation
COMMENT ON COLUMN clients.client_id_no IS 'Client ID number for progress reports';
COMMENT ON COLUMN clients.band_no IS 'Band number for progress reports';
