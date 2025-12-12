-- =====================================================
-- Migration: Storage buckets for signing document lifecycle
-- Description: Crea buckets docs-originals / docs-signed / docs-notarized y políticas base
-- Created: 2025-12-12
-- =====================================================

SET search_path TO storage, core, public, extensions;

-- =====================================================
-- BUCKETS
-- =====================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('docs-originals', 'docs-originals', false, 52428800, ARRAY['application/pdf']),
  ('docs-signed', 'docs-signed', false, 52428800, ARRAY['application/pdf']),
  ('docs-notarized', 'docs-notarized', false, 52428800, ARRAY['application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- POLICIES: docs-originals
-- Path: {org_id}/{document_id}/v{n}/original.pdf
-- =====================================================

DROP POLICY IF EXISTS "Users can view org docs originals" ON storage.objects;
CREATE POLICY "Users can view org docs originals"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'docs-originals'
  AND EXISTS (
    SELECT 1
    FROM core.organization_users ou
    WHERE ou.user_id = auth.uid()
      AND ou.status = 'active'
      AND ou.organization_id::text = (string_to_array(name, '/'))[1]
  )
);

DROP POLICY IF EXISTS "Users can upload org docs originals" ON storage.objects;
CREATE POLICY "Users can upload org docs originals"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'docs-originals'
  AND EXISTS (
    SELECT 1
    FROM core.organization_users ou
    WHERE ou.user_id = auth.uid()
      AND ou.status = 'active'
      AND ou.organization_id::text = (string_to_array(name, '/'))[1]
  )
);

DROP POLICY IF EXISTS "Admins can delete org docs originals" ON storage.objects;
CREATE POLICY "Admins can delete org docs originals"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'docs-originals'
  AND EXISTS (
    SELECT 1
    FROM core.organization_users ou
    JOIN core.roles r ON r.id = ou.role_id
    WHERE ou.user_id = auth.uid()
      AND ou.status = 'active'
      AND r.level >= 7
      AND ou.organization_id::text = (string_to_array(name, '/'))[1]
  )
);

-- =====================================================
-- POLICIES: docs-signed
-- Path: {org_id}/{document_id}/v{n}/complete.pdf
-- =====================================================

DROP POLICY IF EXISTS "Users can view org docs signed" ON storage.objects;
CREATE POLICY "Users can view org docs signed"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'docs-signed'
  AND EXISTS (
    SELECT 1
    FROM core.organization_users ou
    WHERE ou.user_id = auth.uid()
      AND ou.status = 'active'
      AND ou.organization_id::text = (string_to_array(name, '/'))[1]
  )
);

DROP POLICY IF EXISTS "Users can upload org docs signed" ON storage.objects;
CREATE POLICY "Users can upload org docs signed"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'docs-signed'
  AND EXISTS (
    SELECT 1
    FROM core.organization_users ou
    WHERE ou.user_id = auth.uid()
      AND ou.status = 'active'
      AND ou.organization_id::text = (string_to_array(name, '/'))[1]
  )
);

DROP POLICY IF EXISTS "Admins can delete org docs signed" ON storage.objects;
CREATE POLICY "Admins can delete org docs signed"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'docs-signed'
  AND EXISTS (
    SELECT 1
    FROM core.organization_users ou
    JOIN core.roles r ON r.id = ou.role_id
    WHERE ou.user_id = auth.uid()
      AND ou.status = 'active'
      AND r.level >= 7
      AND ou.organization_id::text = (string_to_array(name, '/'))[1]
  )
);

-- =====================================================
-- POLICIES: docs-notarized
-- Path: {org_id}/{document_id}/v{n}/notarized.pdf
-- Base policy: lectura por org del documento, escritura por service_role
-- (La subida por notaría se habilita cuando exista el sistema de asignaciones.)
-- =====================================================

DROP POLICY IF EXISTS "Users can view org docs notarized" ON storage.objects;
CREATE POLICY "Users can view org docs notarized"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'docs-notarized'
  AND EXISTS (
    SELECT 1
    FROM core.organization_users ou
    WHERE ou.user_id = auth.uid()
      AND ou.status = 'active'
      AND ou.organization_id::text = (string_to_array(name, '/'))[1]
  )
);

DROP POLICY IF EXISTS "Service can manage docs notarized" ON storage.objects;
CREATE POLICY "Service can manage docs notarized"
ON storage.objects FOR ALL
USING (
  bucket_id = 'docs-notarized'
  AND auth.role() = 'service_role'
);

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Buckets creados: docs-originals, docs-signed, docs-notarized';
END $$;

