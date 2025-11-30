-- =====================================================
-- Migration: Create invoices storage bucket
-- Description: Bucket para almacenar PDFs y XMLs de facturas electrónicas
-- Created: 2025-12-02
-- =====================================================

-- Crear bucket para facturas (si no existe)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'invoices',
  'invoices',
  true, -- Público para que los usuarios puedan descargar sus facturas
  10485760, -- 10MB máximo
  ARRAY['application/pdf', 'application/xml', 'text/xml']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- =====================================================
-- STORAGE POLICIES
-- =====================================================

-- Política: Usuarios autenticados pueden ver facturas de su organización
CREATE POLICY "Users can view own org invoices"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'invoices'
  AND (
    -- Verificar que el usuario pertenece a la organización
    -- El path es: haulmer/{org_id}/... o stripe/{org_id}/...
    EXISTS (
      SELECT 1 FROM core.organization_users ou
      WHERE ou.user_id = auth.uid()
      AND ou.status = 'active'
      AND (
        storage.filename(name) LIKE 'haulmer/' || ou.organization_id::text || '/%'
        OR storage.filename(name) LIKE 'stripe/' || ou.organization_id::text || '/%'
        OR name LIKE 'haulmer/' || ou.organization_id::text || '/%'
        OR name LIKE 'stripe/' || ou.organization_id::text || '/%'
      )
    )
    OR
    -- Platform admins pueden ver todo
    EXISTS (
      SELECT 1 FROM _bypass.platform_admins pa
      WHERE pa.user_id = auth.uid()
    )
  )
);

-- Política: Service role puede insertar (para webhooks)
CREATE POLICY "Service role can insert invoices"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'invoices'
);

-- Política: Service role puede actualizar
CREATE POLICY "Service role can update invoices"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'invoices');

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Bucket de facturas creado exitosamente';
  RAISE NOTICE '';
  RAISE NOTICE 'Configuración:';
  RAISE NOTICE '  ✅ Bucket: invoices';
  RAISE NOTICE '  ✅ Público: sí (para descarga de facturas)';
  RAISE NOTICE '  ✅ Tamaño máximo: 10MB';
  RAISE NOTICE '  ✅ Tipos permitidos: PDF, XML';
  RAISE NOTICE '';
  RAISE NOTICE 'Políticas:';
  RAISE NOTICE '  ✅ Usuarios pueden ver facturas de su organización';
  RAISE NOTICE '  ✅ Service role puede insertar/actualizar';
END $$;

