-- Create progress_reports table for analytics progress reports
-- Run this in Supabase SQL Editor

CREATE TABLE progress_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  report_type VARCHAR(50) NOT NULL, -- 'monthly', 'yearly', 'custom'
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  overall_score DECIMAL(5,2),
  health_score DECIMAL(5,2),
  routine_score DECIMAL(5,2),
  wellbeing_score DECIMAL(5,2),
  behaviour_score DECIMAL(5,2),
  indicator VARCHAR(50),
  fillable_data JSONB DEFAULT '{}', -- Store all fillable remarks
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE progress_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can view all progress reports" ON progress_reports
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins can insert progress reports" ON progress_reports
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins can update progress reports" ON progress_reports
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins can delete progress reports" ON progress_reports
FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- Add indexes
CREATE INDEX idx_progress_reports_client_id ON progress_reports(client_id);
CREATE INDEX idx_progress_reports_date_range ON progress_reports(start_date, end_date);
CREATE INDEX idx_progress_reports_type ON progress_reports(report_type);
CREATE INDEX idx_progress_reports_created_by ON progress_reports(created_by);

-- Add comments
COMMENT ON TABLE progress_reports IS 'Stores analytics progress reports with calculated scores and fillable data';
COMMENT ON COLUMN progress_reports.overall_score IS 'Overall score calculated from all section averages';
COMMENT ON COLUMN progress_reports.indicator IS 'Performance indicator: Needs Improvement, Fair, Good, Excellent';
COMMENT ON COLUMN progress_reports.fillable_data IS 'JSONB object storing all fillable remarks and custom data';
