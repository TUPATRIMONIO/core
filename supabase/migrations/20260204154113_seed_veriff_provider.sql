-- =====================================================
-- Migration: Seed Veriff Provider
-- Description: Insertar Veriff como proveedor inicial de verificación de identidad
-- Created: 2026-02-04
-- =====================================================

SET search_path TO identity_verifications, public, extensions;

-- =====================================================
-- INSERTAR PROVEEDOR VERIFF
-- =====================================================

INSERT INTO identity_verifications.providers (
  name,
  slug,
  description,
  provider_type,
  base_url,
  test_url,
  endpoints,
  documentation_url,
  supported_countries,
  is_active,
  is_default
) VALUES (
  'Veriff',
  'veriff',
  'Verificación de identidad con biometría facial, reconocimiento de documentos y liveness detection',
  'combined',
  'https://stationapi.veriff.com',
  'https://stationapi.veriff.me',
  jsonb_build_object(
    'sessions', '/v1/sessions',
    'decision', '/v1/sessions/{id}/decision',
    'media', '/v1/sessions/{id}/media',
    'attempts', '/v1/sessions/{id}/attempts'
  ),
  'https://developers.veriff.com/',
  ARRAY['CL', 'MX', 'CO', 'AR', 'PE', 'US', 'ES'], -- Países soportados
  true,
  true -- Proveedor por defecto
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  provider_type = EXCLUDED.provider_type,
  base_url = EXCLUDED.base_url,
  test_url = EXCLUDED.test_url,
  endpoints = EXCLUDED.endpoints,
  documentation_url = EXCLUDED.documentation_url,
  supported_countries = EXCLUDED.supported_countries,
  is_active = EXCLUDED.is_active,
  is_default = EXCLUDED.is_default,
  updated_at = NOW();

-- =====================================================
-- COMENTARIOS Y DOCUMENTACIÓN
-- =====================================================

COMMENT ON TABLE identity_verifications.providers IS 
  'Catálogo de proveedores de verificación de identidad. Veriff es el proveedor inicial.';

-- Success message
DO $$ 
DECLARE
  v_provider_id UUID;
BEGIN 
  -- Obtener el ID del proveedor insertado
  SELECT id INTO v_provider_id
  FROM identity_verifications.providers
  WHERE slug = 'veriff';

  RAISE NOTICE '✅ Proveedor Veriff configurado exitosamente';
  RAISE NOTICE '';
  RAISE NOTICE 'Detalles:';
  RAISE NOTICE '  - ID: %', v_provider_id;
  RAISE NOTICE '  - Nombre: Veriff';
  RAISE NOTICE '  - Tipo: combined (biometric + document + liveness)';
  RAISE NOTICE '  - Base URL: https://stationapi.veriff.com';
  RAISE NOTICE '  - Estado: activo';
  RAISE NOTICE '  - Por defecto: sí';
  RAISE NOTICE '';
  RAISE NOTICE '📝 Próximos pasos:';
  RAISE NOTICE '  1. Configurar API Key de Veriff en variables de entorno';
  RAISE NOTICE '  2. Crear provider_config para cada organización que use Veriff';
  RAISE NOTICE '  3. Configurar webhook URL en Veriff dashboard';
  RAISE NOTICE '';
  RAISE NOTICE '🔗 Documentación de Veriff:';
  RAISE NOTICE '   https://developers.veriff.com/';
END $$;
