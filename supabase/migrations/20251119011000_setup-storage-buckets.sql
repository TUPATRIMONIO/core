-- Migration: Setup Storage Buckets
-- Description: Crea y configura los buckets de Supabase Storage con las políticas RLS correctas
-- Created: 2025-11-19

-- =====================================================
-- 1. CREAR BUCKETS
-- =====================================================

-- Bucket para documentos de firma
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'signatures',
  'signatures',
  false,
  52428800, -- 50MB
  ARRAY['application/pdf']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Bucket para documentos notariales
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'notary-documents',
  'notary-documents',
  false,
  52428800, -- 50MB
  ARRAY['application/pdf', 'image/jpeg', 'image/png']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- =====================================================
-- 2. POLÍTICAS RLS PARA BUCKET SIGNATURES
-- =====================================================

-- Los usuarios pueden subir archivos a su propia organización
CREATE POLICY "Users can upload to their org folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'signatures' AND
  (storage.foldername(name))[1] IN (
    SELECT organization_id::text
    FROM core.organization_users
    WHERE user_id = auth.uid() AND status = 'active'
  )
);

-- Los usuarios pueden ver archivos de sus organizaciones
CREATE POLICY "Users can view their org files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'signatures' AND
  (storage.foldername(name))[1] IN (
    SELECT organization_id::text
    FROM core.organization_users
    WHERE user_id = auth.uid() AND status = 'active'
  )
);

-- Los usuarios pueden actualizar archivos de sus organizaciones
CREATE POLICY "Users can update their org files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'signatures' AND
  (storage.foldername(name))[1] IN (
    SELECT organization_id::text
    FROM core.organization_users
    WHERE user_id = auth.uid() AND status = 'active'
  )
);

-- Los usuarios pueden eliminar archivos de sus organizaciones
CREATE POLICY "Users can delete their org files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'signatures' AND
  (storage.foldername(name))[1] IN (
    SELECT organization_id::text
    FROM core.organization_users
    WHERE user_id = auth.uid() AND status = 'active'
  )
);

-- =====================================================
-- 3. POLÍTICAS RLS PARA BUCKET NOTARY-DOCUMENTS
-- =====================================================

-- Las organizaciones pueden subir archivos
CREATE POLICY "Organizations can upload notary documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'notary-documents' AND
  (storage.foldername(name))[1] IN (
    SELECT organization_id::text
    FROM core.organization_users
    WHERE user_id = auth.uid() AND status = 'active'
  )
);

-- Las organizaciones pueden ver sus documentos
CREATE POLICY "Organizations can view their notary documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'notary-documents' AND
  (
    -- Organizaciones clientes
    (storage.foldername(name))[1] IN (
      SELECT organization_id::text
      FROM core.organization_users
      WHERE user_id = auth.uid() AND status = 'active'
    )
    OR
    -- Notarías pueden ver documentos asignados
    EXISTS (
      SELECT 1
      FROM core.organization_users ou
      JOIN core.organizations o ON o.id = ou.organization_id
      WHERE ou.user_id = auth.uid()
        AND ou.status = 'active'
        AND o.org_type = 'notary'
    )
  )
);

-- Las notarías pueden subir resultados
CREATE POLICY "Notaries can upload results"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'notary-documents' AND
  EXISTS (
    SELECT 1
    FROM core.organization_users ou
    JOIN core.organizations o ON o.id = ou.organization_id
    WHERE ou.user_id = auth.uid()
      AND ou.status = 'active'
      AND o.org_type = 'notary'
  )
);

-- =====================================================
-- 4. RESUMEN
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Buckets de Storage configurados';
  RAISE NOTICE '';
  RAISE NOTICE 'Buckets creados:';
  RAISE NOTICE '  ✅ signatures - Documentos de firma electrónica';
  RAISE NOTICE '  ✅ notary-documents - Documentos notariales';
  RAISE NOTICE '';
  RAISE NOTICE 'Políticas RLS configuradas:';
  RAISE NOTICE '  ✅ Usuarios pueden gestionar archivos de sus organizaciones';
  RAISE NOTICE '  ✅ Notarías pueden acceder a documentos asignados';
  RAISE NOTICE '  ✅ Aislamiento por organization_id';
  RAISE NOTICE '';
  RAISE NOTICE 'Límites:';
  RAISE NOTICE '  - Tamaño máximo: 50MB';
  RAISE NOTICE '  - Formatos: PDF (signatures), PDF/JPG/PNG (notary)';
END $$;

