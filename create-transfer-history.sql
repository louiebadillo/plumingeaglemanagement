-- Create client transfer history table
-- Run this in Supabase SQL Editor

-- Create transfer history table
CREATE TABLE client_transfers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
    from_facility_id UUID REFERENCES facilities(id) ON DELETE SET NULL,
    to_facility_id UUID REFERENCES facilities(id) ON DELETE SET NULL,
    transferred_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    transfer_reason TEXT,
    transferred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX idx_client_transfers_client_id ON client_transfers(client_id);
CREATE INDEX idx_client_transfers_transferred_at ON client_transfers(transferred_at);

-- Enable RLS
ALTER TABLE client_transfers ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Admins can view all transfer history" ON client_transfers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can insert transfer history" ON client_transfers
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );
