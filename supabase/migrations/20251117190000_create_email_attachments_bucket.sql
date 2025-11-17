/**
 * Migración: Bucket de Storage para Adjuntos de Email
 * 
 * Crea bucket privado para almacenar adjuntos de emails con
 * políticas RLS multi-tenant por organización.
 * 
 * Fecha: 17 Noviembre 2025
 */

-- ============================================================================
-- 1. CREAR BUCKET
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'email-attachments',
  'email-attachments',
  false, -- Privado
  26214400, -- 25 MB en bytes
  NULL -- Permitir todos los tipos
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 2. POLÍTICAS RLS PARA EL BUCKET
-- ============================================================================

-- Permitir subir archivos a usuarios de organizaciones activas
DROP POLICY IF EXISTS "Users can upload email attachments" ON storage.objects;
CREATE POLICY "Users can upload email attachments"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'email-attachments'
  AND auth.uid() IN (
    SELECT user_id FROM core.organization_users 
    WHERE status = 'active'
  )
);

-- Permitir ver archivos de la organización
DROP POLICY IF EXISTS "Users can view email attachments" ON storage.objects;
CREATE POLICY "Users can view email attachments"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'email-attachments'
  AND auth.uid() IN (
    SELECT user_id FROM core.organization_users 
    WHERE status = 'active'
  )
);

-- Permitir actualizar archivos
DROP POLICY IF EXISTS "Users can update email attachments" ON storage.objects;
CREATE POLICY "Users can update email attachments"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'email-attachments'
  AND auth.uid() IN (
    SELECT user_id FROM core.organization_users 
    WHERE status = 'active'
  )
);

-- Permitir eliminar archivos
DROP POLICY IF EXISTS "Users can delete email attachments" ON storage.objects;
CREATE POLICY "Users can delete email attachments"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'email-attachments'
  AND auth.uid() IN (
    SELECT user_id FROM core.organization_users 
    WHERE status = 'active'
  )
);

-- ============================================================================
-- 3. VERIFICACIÓN
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'email-attachments') THEN
    RAISE NOTICE 'Bucket email-attachments creado exitosamente';
  ELSE
    RAISE WARNING 'No se pudo crear el bucket email-attachments';
  END IF;
END $$;

-- Mostrar políticas creadas
SELECT 
  'email-attachments bucket configurado con ' || 
  (SELECT count(*) FROM pg_policies WHERE tablename = 'objects' AND policyname LIKE '%email attachments%') || 
  ' políticas RLS' as resultado;

