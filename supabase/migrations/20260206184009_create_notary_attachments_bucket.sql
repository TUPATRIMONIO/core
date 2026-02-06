-- =====================================================
-- Migration: Create notary-attachments storage bucket
-- Description: Bucket privado para adjuntos de observaciones notariales
-- Created: 2026-02-06
-- =====================================================

-- 1. Crear bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'notary-attachments',
  'notary-attachments',
  false, -- Privado
  20971520, -- 20 MB por archivo
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- 2. Políticas de acceso

-- Admins/Document Reviewers pueden subir archivos
CREATE POLICY "Admins can upload notary attachments"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'notary-attachments'
  AND EXISTS (
    SELECT 1 FROM core.organization_users ou
    JOIN core.roles r ON r.id = ou.role_id
    WHERE ou.user_id = auth.uid()
      AND ou.status = 'active'
      AND (r.slug = 'document_reviewer' OR r.level >= 9)
  )
);

-- Admins y Notarios pueden ver/descargar archivos
CREATE POLICY "Admins and notaries can view notary attachments"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'notary-attachments'
  AND (
    -- Admin/Reviewer
    EXISTS (
      SELECT 1 FROM core.organization_users ou
      JOIN core.roles r ON r.id = ou.role_id
      WHERE ou.user_id = auth.uid()
        AND ou.status = 'active'
        AND (r.slug = 'document_reviewer' OR r.level >= 9)
    )
    OR
    -- Notario (pertenece a una org con notaría)
    EXISTS (
      SELECT 1 FROM core.organization_users ou
      JOIN signing.notary_offices no ON no.organization_id = ou.organization_id
      WHERE ou.user_id = auth.uid()
        AND ou.status = 'active'
        AND no.is_active = true
    )
    OR
    -- Platform admin
    public.is_platform_admin()
  )
);

-- Service role tiene acceso total (para APIs server-side)
CREATE POLICY "Service role full access notary attachments"
ON storage.objects
FOR ALL
TO service_role
USING (bucket_id = 'notary-attachments')
WITH CHECK (bucket_id = 'notary-attachments');

-- 3. Notify
DO $$
BEGIN
  RAISE NOTICE '✅ Bucket notary-attachments creado (privado, 20MB, PDF/imágenes)';
END $$;
