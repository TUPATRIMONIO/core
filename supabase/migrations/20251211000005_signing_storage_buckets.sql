-- =====================================================
-- Migration: Create Storage Buckets for Signing
-- Description: Buckets for documents, covers, and notary files
-- Created: 2025-12-11
-- =====================================================

-- =====================================================
-- BUCKET: signing-documents
-- =====================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'signing-documents',
  'signing-documents',
  false, -- Privado
  52428800, -- 50MB max
  ARRAY['application/pdf']
) ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- BUCKET: signing-covers
-- =====================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'signing-covers',
  'signing-covers',
  false,
  10485760, -- 10MB max
  ARRAY['application/pdf', 'image/png', 'image/jpeg']
) ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- BUCKET: notary-documents
-- =====================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'notary-documents',
  'notary-documents',
  false,
  52428800, -- 50MB max
  ARRAY['application/pdf']
) ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- RLS POLICIES: signing-documents
-- =====================================================

-- Users can view documents from their organization
CREATE POLICY "Users can view org signing documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'signing-documents'
  AND (
    -- Check org_id from path (format: {org_id}/{document_id}/filename.pdf)
    EXISTS (
      SELECT 1 FROM core.organization_users ou
      WHERE ou.user_id = auth.uid()
        AND ou.status = 'active'
        AND ou.organization_id::text = (string_to_array(name, '/'))[1]
    )
  )
);

-- Users can upload documents to their organization
CREATE POLICY "Users can upload org signing documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'signing-documents'
  AND (
    EXISTS (
      SELECT 1 FROM core.organization_users ou
      WHERE ou.user_id = auth.uid()
        AND ou.status = 'active'
        AND ou.organization_id::text = (string_to_array(name, '/'))[1]
    )
  )
);

-- Users can delete documents from their organization (admins only)
CREATE POLICY "Admins can delete org signing documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'signing-documents'
  AND (
    EXISTS (
      SELECT 1 FROM core.organization_users ou
      JOIN core.roles r ON r.id = ou.role_id
      WHERE ou.user_id = auth.uid()
        AND ou.status = 'active'
        AND r.level >= 7
        AND ou.organization_id::text = (string_to_array(name, '/'))[1]
    )
  )
);

-- =====================================================
-- RLS POLICIES: signing-covers
-- =====================================================

-- Covers are readable by authenticated users
CREATE POLICY "Authenticated users can view signing covers"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'signing-covers'
  AND auth.role() = 'authenticated'
);

-- Only admins can manage covers
CREATE POLICY "Admins can manage signing covers"
ON storage.objects FOR ALL
USING (
  bucket_id = 'signing-covers'
  AND (
    EXISTS (
      SELECT 1 FROM core.organization_users ou
      JOIN core.organizations o ON o.id = ou.organization_id
      JOIN core.roles r ON r.id = ou.role_id
      WHERE ou.user_id = auth.uid()
        AND o.org_type = 'platform'
        AND r.level >= 9
    )
  )
);

-- =====================================================
-- RLS POLICIES: notary-documents
-- =====================================================

-- Users can view notary documents from their organization
CREATE POLICY "Users can view org notary documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'notary-documents'
  AND (
    EXISTS (
      SELECT 1 FROM core.organization_users ou
      WHERE ou.user_id = auth.uid()
        AND ou.status = 'active'
        AND ou.organization_id::text = (string_to_array(name, '/'))[1]
    )
  )
);

-- Service role can upload notary documents (from edge functions)
CREATE POLICY "Service can manage notary documents"
ON storage.objects FOR ALL
USING (
  bucket_id = 'notary-documents'
  AND auth.role() = 'service_role'
);

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Storage buckets para signing creados';
  RAISE NOTICE '';
  RAISE NOTICE 'Buckets:';
  RAISE NOTICE '  - signing-documents (50MB, PDF)';
  RAISE NOTICE '  - signing-covers (10MB, PDF/PNG/JPG)';
  RAISE NOTICE '  - notary-documents (50MB, PDF)';
END $$;
