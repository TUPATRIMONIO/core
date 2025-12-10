-- =====================================================
-- Migration: Create Storage Bucket for Ticket Attachments
-- Description: Creates the ticket-attachments bucket and policies
-- =====================================================

-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'ticket-attachments',
  'ticket-attachments',
  true,  -- Public bucket for easy download links
  10485760,  -- 10MB max file size
  NULL  -- Allow all mime types
)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- Storage Policies
-- =====================================================

-- Policy: Allow authenticated users to upload files
CREATE POLICY "Allow authenticated uploads to ticket-attachments"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'ticket-attachments');

-- Policy: Allow public read access (since bucket is public)
CREATE POLICY "Allow public read from ticket-attachments"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'ticket-attachments');

-- Policy: Allow authenticated users to update their files
CREATE POLICY "Allow authenticated updates to ticket-attachments"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'ticket-attachments');

-- Policy: Allow authenticated users to delete files
CREATE POLICY "Allow authenticated deletes from ticket-attachments"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'ticket-attachments');

-- =====================================================
-- Success Message
-- =====================================================
DO $$ 
BEGIN 
  RAISE NOTICE '✅ Storage bucket ticket-attachments created successfully';
  RAISE NOTICE '  - Public access: enabled';
  RAISE NOTICE '  - Max file size: 10MB';
  RAISE NOTICE '  - Policies: upload, read, update, delete';
END $$;
