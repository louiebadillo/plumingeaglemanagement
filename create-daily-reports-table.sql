-- Create daily_reports_v2 table for comprehensive daily reporting
-- Run this in your Supabase SQL Editor

-- Create enum for report status
CREATE TYPE report_status_v2 AS ENUM ('draft', 'submitted');

-- Create daily_reports_v2 table
CREATE TABLE daily_reports_v2 (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    facility_id UUID REFERENCES facilities(id) ON DELETE CASCADE,
    report_date DATE NOT NULL,
    status report_status_v2 DEFAULT 'draft',
    created_by UUID REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Morning Shift Fields
    medication_required BOOLEAN,
    medication_status TEXT,
    medication_updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    
    sleep_woke_on_time BOOLEAN,
    sleep_updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    
    diet_ate_well BOOLEAN,
    diet_updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    
    dental_hygiene_done BOOLEAN,
    dental_updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    
    routine_made_bed INTEGER CHECK (routine_made_bed >= 1 AND routine_made_bed <= 5),
    routine_made_bed_updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    
    routine_put_clothes_away INTEGER CHECK (routine_put_clothes_away >= 1 AND routine_put_clothes_away <= 5),
    routine_put_clothes_away_updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    
    routine_cleared_floor INTEGER CHECK (routine_cleared_floor >= 1 AND routine_cleared_floor <= 5),
    routine_cleared_floor_updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    
    routine_washed_dishes INTEGER CHECK (routine_washed_dishes >= 1 AND routine_washed_dishes <= 5),
    routine_washed_dishes_updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    
    behaviour_observation TEXT CHECK (behaviour_observation IN ('positive', 'negative')),
    behaviour_observation_updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    
    behaviour_followed_rules BOOLEAN,
    behaviour_followed_rules_updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    
    behaviour_listened BOOLEAN,
    behaviour_listened_updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    
    behaviour_control BOOLEAN,
    behaviour_control_updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    
    -- Unique constraint: one report per client per day
    CONSTRAINT unique_client_date UNIQUE (client_id, report_date)
);

-- Create indexes for better performance
CREATE INDEX idx_daily_reports_v2_client_id ON daily_reports_v2(client_id);
CREATE INDEX idx_daily_reports_v2_facility_id ON daily_reports_v2(facility_id);
CREATE INDEX idx_daily_reports_v2_report_date ON daily_reports_v2(report_date);
CREATE INDEX idx_daily_reports_v2_status ON daily_reports_v2(status);
CREATE INDEX idx_daily_reports_v2_created_by ON daily_reports_v2(created_by);

-- Enable Row Level Security
ALTER TABLE daily_reports_v2 ENABLE ROW LEVEL SECURITY;

-- RLS Policies for daily_reports_v2
-- Users can view reports for clients in their facility
CREATE POLICY "Users can view reports for their facility clients" ON daily_reports_v2
    FOR SELECT USING (
        client_id IN (
            SELECT id FROM clients 
            WHERE facility_id IN (
                SELECT facility_id FROM public.users WHERE id = auth.uid()
            )
        ) OR
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Users can create reports for clients in their facility
CREATE POLICY "Users can create reports for their facility clients" ON daily_reports_v2
    FOR INSERT WITH CHECK (
        client_id IN (
            SELECT id FROM clients 
            WHERE facility_id IN (
                SELECT facility_id FROM public.users WHERE id = auth.uid()
            )
        ) OR
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Users can update draft reports for clients in their facility
CREATE POLICY "Users can update draft reports for their facility clients" ON daily_reports_v2
    FOR UPDATE USING (
        status = 'draft' AND (
            client_id IN (
                SELECT id FROM clients 
                WHERE facility_id IN (
                    SELECT facility_id FROM public.users WHERE id = auth.uid()
                )
            ) OR
            EXISTS (
                SELECT 1 FROM public.users 
                WHERE id = auth.uid() AND role = 'admin'
            )
        )
    );

-- Admins can manage all reports
CREATE POLICY "Admins can manage all reports" ON daily_reports_v2
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_daily_reports_v2_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_daily_reports_v2_updated_at
    BEFORE UPDATE ON daily_reports_v2
    FOR EACH ROW EXECUTE FUNCTION update_daily_reports_v2_updated_at();
