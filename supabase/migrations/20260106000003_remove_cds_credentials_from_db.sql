-- =====================================================
-- Migration: Remove CDS Credentials from Database
-- Description: Elimina credenciales sensibles de CDS de la tabla signing_provider_configs
--              ya que ahora se leen desde variables de entorno en la Edge Function.
-- Created: 2026-01-06
-- =====================================================

SET search_path TO signing, core, public, extensions;

-- Eliminar credenciales sensibles del campo credentials
-- Mantener la estructura de la tabla pero limpiar datos sensibles
UPDATE signing.provider_configs 
SET 
    credentials = '{}'::jsonb,
    webhook_secret = NULL,
    updated_at = NOW()
WHERE provider_id = (SELECT id FROM signing.providers WHERE slug = 'cds')
  AND (credentials IS NOT NULL OR webhook_secret IS NOT NULL);

-- Comentario para documentar el cambio
COMMENT ON COLUMN signing.provider_configs.credentials IS 
    'Campo legacy. Las credenciales de CDS ahora se almacenan en variables de entorno de Supabase Edge Functions (CDS_USUARIO, CDS_CLAVE).';

COMMENT ON COLUMN signing.provider_configs.webhook_secret IS 
    'Campo legacy. El webhook secret de CDS ahora se almacena en variable de entorno CDS_WEBHOOK_SECRET.';

