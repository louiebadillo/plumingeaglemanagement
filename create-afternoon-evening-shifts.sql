-- Add afternoon shift fields to daily_reports_v2 table
ALTER TABLE daily_reports_v2 ADD COLUMN afternoon_medication_required BOOLEAN;
ALTER TABLE daily_reports_v2 ADD COLUMN afternoon_medication_status TEXT;
ALTER TABLE daily_reports_v2 ADD COLUMN afternoon_medication_updated_by UUID;
ALTER TABLE daily_reports_v2 ADD COLUMN afternoon_slept_on_time BOOLEAN;
ALTER TABLE daily_reports_v2 ADD COLUMN afternoon_slept_on_time_updated_by UUID;
ALTER TABLE daily_reports_v2 ADD COLUMN afternoon_diet_ate_well BOOLEAN;
ALTER TABLE daily_reports_v2 ADD COLUMN afternoon_diet_updated_by UUID;
ALTER TABLE daily_reports_v2 ADD COLUMN afternoon_dental_hygiene_done BOOLEAN;
ALTER TABLE daily_reports_v2 ADD COLUMN afternoon_dental_updated_by UUID;
ALTER TABLE daily_reports_v2 ADD COLUMN afternoon_shower_taken BOOLEAN;
ALTER TABLE daily_reports_v2 ADD COLUMN afternoon_shower_updated_by UUID;
ALTER TABLE daily_reports_v2 ADD COLUMN afternoon_routine_made_bed INTEGER CHECK (afternoon_routine_made_bed >= 1 AND afternoon_routine_made_bed <= 5);
ALTER TABLE daily_reports_v2 ADD COLUMN afternoon_routine_made_bed_updated_by UUID;
ALTER TABLE daily_reports_v2 ADD COLUMN afternoon_routine_put_clothes_away INTEGER CHECK (afternoon_routine_put_clothes_away >= 1 AND afternoon_routine_put_clothes_away <= 5);
ALTER TABLE daily_reports_v2 ADD COLUMN afternoon_routine_put_clothes_away_updated_by UUID;
ALTER TABLE daily_reports_v2 ADD COLUMN afternoon_routine_cleared_floor INTEGER CHECK (afternoon_routine_cleared_floor >= 1 AND afternoon_routine_cleared_floor <= 5);
ALTER TABLE daily_reports_v2 ADD COLUMN afternoon_routine_cleared_floor_updated_by UUID;
ALTER TABLE daily_reports_v2 ADD COLUMN afternoon_routine_washed_dishes INTEGER CHECK (afternoon_routine_washed_dishes >= 1 AND afternoon_routine_washed_dishes <= 5);
ALTER TABLE daily_reports_v2 ADD COLUMN afternoon_routine_washed_dishes_updated_by UUID;
ALTER TABLE daily_reports_v2 ADD COLUMN afternoon_school_supposed_to_go BOOLEAN;
ALTER TABLE daily_reports_v2 ADD COLUMN afternoon_school_status TEXT;
ALTER TABLE daily_reports_v2 ADD COLUMN afternoon_school_updated_by UUID;
ALTER TABLE daily_reports_v2 ADD COLUMN afternoon_behaviour_observation TEXT CHECK (afternoon_behaviour_observation IN ('positive', 'negative'));
ALTER TABLE daily_reports_v2 ADD COLUMN afternoon_behaviour_observation_updated_by UUID;
ALTER TABLE daily_reports_v2 ADD COLUMN afternoon_behaviour_followed_rules BOOLEAN;
ALTER TABLE daily_reports_v2 ADD COLUMN afternoon_behaviour_followed_rules_updated_by UUID;
ALTER TABLE daily_reports_v2 ADD COLUMN afternoon_behaviour_listened BOOLEAN;
ALTER TABLE daily_reports_v2 ADD COLUMN afternoon_behaviour_listened_updated_by UUID;
ALTER TABLE daily_reports_v2 ADD COLUMN afternoon_behaviour_control BOOLEAN;
ALTER TABLE daily_reports_v2 ADD COLUMN afternoon_behaviour_control_updated_by UUID;

-- Add evening shift fields to daily_reports_v2 table
ALTER TABLE daily_reports_v2 ADD COLUMN evening_medication_required BOOLEAN;
ALTER TABLE daily_reports_v2 ADD COLUMN evening_medication_status TEXT;
ALTER TABLE daily_reports_v2 ADD COLUMN evening_medication_updated_by UUID;
ALTER TABLE daily_reports_v2 ADD COLUMN appointments JSONB DEFAULT '[]';
ALTER TABLE daily_reports_v2 ADD COLUMN appointments_updated_by UUID;
ALTER TABLE daily_reports_v2 ADD COLUMN bir_incidents JSONB;
ALTER TABLE daily_reports_v2 ADD COLUMN bir_updated_by UUID;
ALTER TABLE daily_reports_v2 ADD COLUMN awol_incident BOOLEAN;
ALTER TABLE daily_reports_v2 ADD COLUMN awol_status TEXT;
ALTER TABLE daily_reports_v2 ADD COLUMN awol_updated_by UUID;
ALTER TABLE daily_reports_v2 ADD COLUMN injury_occurred BOOLEAN;
ALTER TABLE daily_reports_v2 ADD COLUMN injury_type TEXT;
ALTER TABLE daily_reports_v2 ADD COLUMN injury_perpetrator TEXT;
ALTER TABLE daily_reports_v2 ADD COLUMN injury_remarks TEXT;
ALTER TABLE daily_reports_v2 ADD COLUMN injury_updated_by UUID;

-- Add indexes for JSONB queries
CREATE INDEX idx_daily_reports_appointments ON daily_reports_v2 USING GIN (appointments);
CREATE INDEX idx_daily_reports_bir ON daily_reports_v2 USING GIN (bir_incidents);

-- Add comments for documentation
COMMENT ON COLUMN daily_reports_v2.afternoon_medication_required IS 'Whether medication was required during afternoon shift (2pm-10pm)';
COMMENT ON COLUMN daily_reports_v2.afternoon_medication_status IS 'Medication status: Taken, Not Taken - AWOL, etc.';
COMMENT ON COLUMN daily_reports_v2.afternoon_slept_on_time IS 'Whether client slept on time during afternoon shift';
COMMENT ON COLUMN daily_reports_v2.afternoon_diet_ate_well IS 'Whether client ate well during afternoon shift';
COMMENT ON COLUMN daily_reports_v2.afternoon_dental_hygiene_done IS 'Whether evening dental hygiene was done';
COMMENT ON COLUMN daily_reports_v2.afternoon_shower_taken IS 'Whether client took a shower today';
COMMENT ON COLUMN daily_reports_v2.afternoon_school_supposed_to_go IS 'Whether client was supposed to go to school today';
COMMENT ON COLUMN daily_reports_v2.afternoon_school_status IS 'School status: Attended, Late, Early Pick Up, Absent, etc.';
COMMENT ON COLUMN daily_reports_v2.appointments IS 'JSONB array of appointment objects with health/non-health types';
COMMENT ON COLUMN daily_reports_v2.bir_incidents IS 'JSONB object containing BIR incident data and remarks';
COMMENT ON COLUMN daily_reports_v2.awol_incident IS 'Whether there was an AWOL incident today';
COMMENT ON COLUMN daily_reports_v2.awol_status IS 'AWOL status: late return, reported to agency, escalated to NEP, etc.';
COMMENT ON COLUMN daily_reports_v2.injury_occurred IS 'Whether there was an injury today';
COMMENT ON COLUMN daily_reports_v2.injury_type IS 'Type of injury that occurred';
COMMENT ON COLUMN daily_reports_v2.injury_perpetrator IS 'Who caused the injury (self, other client, staff, etc.)';
