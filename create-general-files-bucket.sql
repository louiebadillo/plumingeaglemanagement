-- Create general-files bucket for general file uploads
-- Run this in Supabase SQL Editor

-- Create the general-files bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'general-files',
  'general-files',
  false,
  52428800, -- 50MB limit
  ARRAY['image/*', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
);

-- Create RLS policies for general-files bucket
CREATE POLICY "Employees can upload general files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'general-files' AND
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'employee')
);

CREATE POLICY "Admins can upload general files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'general-files' AND
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Employees can view general files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'general-files' AND
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'employee')
);

CREATE POLICY "Admins can view general files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'general-files' AND
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins can delete general files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'general-files' AND
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);
