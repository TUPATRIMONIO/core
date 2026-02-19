-- =====================================================
-- Migration: Add secondary credentials to provider configs
-- Description: Agrega soporte para credenciales secundarias (fallback) en configuraciones de proveedores
-- Created: 2026-02-19
-- =====================================================

-- 1. Agregar columna secondary_credentials a la tabla base
ALTER TABLE identity_verifications.provider_configs
ADD COLUMN IF NOT EXISTS secondary_credentials JSONB DEFAULT '[]';

COMMENT ON COLUMN identity_verifications.provider_configs.secondary_credentials IS 
  'Credenciales adicionales de integraciones externas [{api_key, api_secret, label}]';

-- 2. Actualizar la vista pública para incluir la nueva columna
-- Necesario porque SELECT * se expande al crear la vista
CREATE OR REPLACE VIEW public.identity_verification_provider_configs
WITH (security_invoker = true) AS
SELECT * FROM identity_verifications.provider_configs;

-- 3. Grant permisos nuevamente (por si acaso, aunque REPLACE suele mantenerlos)
GRANT SELECT ON public.identity_verification_provider_configs TO authenticated;
GRANT ALL ON public.identity_verification_provider_configs TO service_role;

-- Mensaje de éxito
DO $$ 
BEGIN 
  RAISE NOTICE '✅ Columna secondary_credentials agregada y vista actualizada';
END $$;
