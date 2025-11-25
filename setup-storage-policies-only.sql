-- RLS policies for storage buckets
-- Run this AFTER manually creating the buckets in Supabase Dashboard

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Employees can upload appointment files" ON storage.objects;
DROP POLICY IF EXISTS "Employees can view appointment files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage all appointment files" ON storage.objects;
DROP POLICY IF EXISTS "Employees can upload BIR files" ON storage.objects;
DROP POLICY IF EXISTS "Employees can view BIR files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage all BIR files" ON storage.objects;
DROP POLICY IF EXISTS "Employees can upload AWOL files" ON storage.objects;
DROP POLICY IF EXISTS "Employees can view AWOL files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage all AWOL files" ON storage.objects;
DROP POLICY IF EXISTS "Employees can upload injury files" ON storage.objects;
DROP POLICY IF EXISTS "Employees can view injury files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage all injury files" ON storage.objects;

-- RLS policies for appointment-files bucket
CREATE POLICY "Employees can upload appointment files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'appointment-files' AND
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'employee'
    )
  );

CREATE POLICY "Employees can view appointment files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'appointment-files' AND
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'employee'
    )
  );

CREATE POLICY "Admins can manage all appointment files" ON storage.objects
  FOR ALL USING (
    bucket_id = 'appointment-files' AND
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS policies for bir-files bucket
CREATE POLICY "Employees can upload BIR files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'bir-files' AND
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'employee'
    )
  );

CREATE POLICY "Employees can view BIR files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'bir-files' AND
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'employee'
    )
  );

CREATE POLICY "Admins can manage all BIR files" ON storage.objects
  FOR ALL USING (
    bucket_id = 'bir-files' AND
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS policies for awol-files bucket
CREATE POLICY "Employees can upload AWOL files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'awol-files' AND
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'employee'
    )
  );

CREATE POLICY "Employees can view AWOL files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'awol-files' AND
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'employee'
    )
  );

CREATE POLICY "Admins can manage all AWOL files" ON storage.objects
  FOR ALL USING (
    bucket_id = 'awol-files' AND
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS policies for injury-files bucket
CREATE POLICY "Employees can upload injury files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'injury-files' AND
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'employee'
    )
  );

CREATE POLICY "Employees can view injury files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'injury-files' AND
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'employee'
    )
  );

CREATE POLICY "Admins can manage all injury files" ON storage.objects
  FOR ALL USING (
    bucket_id = 'injury-files' AND
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
