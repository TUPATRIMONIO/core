-- =====================================================
-- Migration: Create cover-templates bucket and policies
-- Description: Bucket para almacenar PDFs de portada personalizados
-- Created: 2025-01-20
-- =====================================================

SET search_path TO storage, core, public, extensions;

-- =====================================================
-- BUCKET: cover-templates
-- =====================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'cover-templates',
  'cover-templates',
  false, -- Privado
  10485760, -- 10MB max (10 * 1024 * 1024)
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- POLICIES: cover-templates
-- =====================================================

-- Service role puede leer todas las portadas (para Edge Functions)
DROP POLICY IF EXISTS "Service role can read cover templates" ON storage.objects;
CREATE POLICY "Service role can read cover templates"
ON storage.objects FOR SELECT
TO service_role
USING (bucket_id = 'cover-templates');

-- Usuarios autenticados pueden subir portadas de su organizacion
DROP POLICY IF EXISTS "Org members can upload cover templates" ON storage.objects;
CREATE POLICY "Org members can upload cover templates"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'cover-templates' AND
  (storage.foldername(name))[1] IN (
    SELECT o.id::text FROM core.organizations o
    JOIN core.organization_users ou ON ou.organization_id = o.id
    WHERE ou.user_id = auth.uid() AND ou.status = 'active'
  )
);

-- Usuarios autenticados pueden leer portadas de su organizacion
DROP POLICY IF EXISTS "Org members can read cover templates" ON storage.objects;
CREATE POLICY "Org members can read cover templates"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'cover-templates' AND
  (storage.foldername(name))[1] IN (
    SELECT o.id::text FROM core.organizations o
    JOIN core.organization_users ou ON ou.organization_id = o.id
    WHERE ou.user_id = auth.uid() AND ou.status = 'active'
  )
);

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Bucket creado: cover-templates';
END $$;

