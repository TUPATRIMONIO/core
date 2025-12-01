-- =====================================================
-- Migration: Configure webhook URL for invoicing
-- Description: Configura la URL base del webhook para pg_net
-- Created: 2025-12-02
-- =====================================================

-- =====================================================
-- CONFIGURAR URL BASE DEL WEBHOOK
-- =====================================================

-- Nota: Esta configuración se usa en el trigger on_order_completed
-- para llamar al webhook de procesamiento de documentos

-- Para producción, configurar via variable de entorno o aquí directamente
-- La URL se puede cambiar dinámicamente con:
-- ALTER DATABASE postgres SET app.webhook_base_url = 'https://tu-dominio.com';

-- Por defecto, usar localhost para desarrollo
DO $$
BEGIN
  -- Solo configurar si no está ya configurado
  IF current_setting('app.webhook_base_url', true) IS NULL THEN
    PERFORM set_config('app.webhook_base_url', 'http://localhost:3000', false);
    RAISE NOTICE 'app.webhook_base_url configurado a: http://localhost:3000';
  ELSE
    RAISE NOTICE 'app.webhook_base_url ya configurado: %', current_setting('app.webhook_base_url', true);
  END IF;
END $$;

-- =====================================================
-- FUNCIÓN HELPER PARA CONFIGURAR URL
-- =====================================================

CREATE OR REPLACE FUNCTION invoicing.set_webhook_url(base_url TEXT)
RETURNS VOID AS $$
BEGIN
  -- Configurar URL para la sesión actual
  PERFORM set_config('app.webhook_base_url', base_url, false);
  RAISE NOTICE 'Webhook URL configurado a: %', base_url;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION invoicing.set_webhook_url(TEXT) TO service_role;

COMMENT ON FUNCTION invoicing.set_webhook_url IS 
'Configura la URL base del webhook de facturación. Uso: SELECT invoicing.set_webhook_url(''https://tu-dominio.com'')';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Configuración de webhook creada';
  RAISE NOTICE '';
  RAISE NOTICE 'Para configurar la URL del webhook:';
  RAISE NOTICE '  SELECT invoicing.set_webhook_url(''https://tu-dominio.com'');';
  RAISE NOTICE '';
  RAISE NOTICE 'El webhook llamará a: {base_url}/api/invoicing/process-request';
END $$;

