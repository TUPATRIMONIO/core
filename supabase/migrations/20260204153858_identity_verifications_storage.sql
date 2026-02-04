-- =====================================================
-- Migration: Identity Verifications Storage Bucket
-- Description: Bucket para almacenar evidencia multimedia de verificaciones
-- Created: 2026-02-04
-- =====================================================

-- =====================================================
-- CREAR BUCKET
-- =====================================================

-- Insertar el bucket (si no existe)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'identity-verifications',
  'identity-verifications',
  false, -- NO público (privado)
  52428800, -- 50 MB límite por archivo
  ARRAY[
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'video/mp4',
    'video/webm',
    'application/pdf'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- POLÍTICAS DE ACCESO AL BUCKET
-- =====================================================

-- Política: Solo service_role puede subir archivos
CREATE POLICY "Service role can upload verification media"
ON storage.objects
FOR INSERT
TO service_role
WITH CHECK (
  bucket_id = 'identity-verifications'
);

-- Política: Solo service_role puede actualizar archivos
CREATE POLICY "Service role can update verification media"
ON storage.objects
FOR UPDATE
TO service_role
USING (
  bucket_id = 'identity-verifications'
)
WITH CHECK (
  bucket_id = 'identity-verifications'
);

-- Política: Usuarios pueden ver archivos de su organización
CREATE POLICY "Users can view own org verification media"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'identity-verifications'
  AND (
    -- El path debe empezar con el org_id del usuario
    (storage.foldername(name))[1] IN (
      SELECT organization_id::text
      FROM core.organization_users
      WHERE user_id = auth.uid()
        AND status = 'active'
    )
    OR
    -- O el usuario es platform admin
    public.is_platform_admin()
  )
);

-- Política: Platform admins tienen acceso total
CREATE POLICY "Platform admins full access to verification media"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'identity-verifications'
  AND public.is_platform_admin()
)
WITH CHECK (
  bucket_id = 'identity-verifications'
  AND public.is_platform_admin()
);

-- Política: Solo service_role puede eliminar archivos
-- (Retención indefinida para auditorías, pero permitimos eliminación por service_role)
CREATE POLICY "Service role can delete verification media"
ON storage.objects
FOR DELETE
TO service_role
USING (
  bucket_id = 'identity-verifications'
);

-- =====================================================
-- FUNCIÓN HELPER: Construir path de storage
-- =====================================================

CREATE OR REPLACE FUNCTION identity_verifications.build_storage_path(
  p_organization_id UUID,
  p_session_id UUID,
  p_media_type identity_verifications.media_type,
  p_file_extension TEXT
)
RETURNS TEXT AS $$
BEGIN
  -- Estructura: /{org_id}/{session_id}/{media_type}_{timestamp}.{ext}
  RETURN format(
    '%s/%s/%s_%s.%s',
    p_organization_id::text,
    p_session_id::text,
    p_media_type,
    EXTRACT(EPOCH FROM NOW())::bigint,
    p_file_extension
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

GRANT EXECUTE ON FUNCTION identity_verifications.build_storage_path TO service_role;

COMMENT ON FUNCTION identity_verifications.build_storage_path IS 
  'Construye el path para almacenar un archivo de verificación en Storage';

-- =====================================================
-- FUNCIÓN HELPER: Obtener URL pública temporal
-- =====================================================

CREATE OR REPLACE FUNCTION identity_verifications.get_media_download_url(
  p_storage_path TEXT,
  p_expires_in INTEGER DEFAULT 3600 -- 1 hora por defecto
)
RETURNS TEXT AS $$
DECLARE
  v_url TEXT;
BEGIN
  -- Esta función debe ser llamada desde el cliente o edge function
  -- que tenga las credenciales para generar URLs firmadas
  -- Por ahora solo retornamos el path, la generación de URL firmada
  -- se hará en el edge function o cliente
  RETURN p_storage_path;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION identity_verifications.get_media_download_url TO authenticated;
GRANT EXECUTE ON FUNCTION identity_verifications.get_media_download_url TO service_role;

COMMENT ON FUNCTION identity_verifications.get_media_download_url IS 
  'Retorna el path del archivo (la URL firmada se genera en el cliente/edge function)';

-- =====================================================
-- VIEWS: URLs de media con acceso filtrado
-- =====================================================

CREATE OR REPLACE VIEW identity_verifications.media_with_urls AS
SELECT 
  m.*,
  -- El path completo para descargar
  format('identity-verifications/%s', m.storage_path) as full_storage_path,
  -- Información de la sesión
  s.organization_id,
  s.subject_name,
  s.status as session_status
FROM identity_verifications.verification_media m
JOIN identity_verifications.verification_sessions s ON s.id = m.session_id;

-- RLS se aplica automáticamente a través de las tablas base
GRANT SELECT ON identity_verifications.media_with_urls TO authenticated;

COMMENT ON VIEW identity_verifications.media_with_urls IS 
  'Vista de media con información adicional para facilitar descarga';

-- =====================================================
-- NOTA: No se pueden agregar comentarios a políticas de storage.objects
-- porque el owner es supabase_storage_admin
-- =====================================================

-- Success message
DO $$ 
BEGIN 
  RAISE NOTICE '✅ Storage bucket configurado exitosamente';
  RAISE NOTICE '';
  RAISE NOTICE 'Bucket creado:';
  RAISE NOTICE '  - identity-verifications (privado)';
  RAISE NOTICE '  - Límite: 50 MB por archivo';
  RAISE NOTICE '  - MIME types: image/*, video/*, application/pdf';
  RAISE NOTICE '';
  RAISE NOTICE 'Estructura de paths:';
  RAISE NOTICE '  /{org_id}/{session_id}/{media_type}_{timestamp}.{ext}';
  RAISE NOTICE '';
  RAISE NOTICE 'Políticas:';
  RAISE NOTICE '  - Solo service_role puede subir/modificar';
  RAISE NOTICE '  - Usuarios ven solo de su org';
  RAISE NOTICE '  - Platform admins acceso total';
END $$;
