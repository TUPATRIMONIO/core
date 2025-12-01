-- =====================================================
-- Migration: Invoicing trigger and webhook integration
-- Description: Trigger en billing.orders que crea solicitud de documento y llama webhook
-- Created: 2025-12-02
-- =====================================================

SET search_path TO invoicing, billing, credits, core, public, extensions;

-- =====================================================
-- FUNCTION: Trigger cuando orden cambia a completed
-- =====================================================

CREATE OR REPLACE FUNCTION invoicing.on_order_completed()
RETURNS TRIGGER AS $$
DECLARE
  v_invoice_id UUID;
  v_org_id UUID;
  v_config invoicing.emission_config;
  v_request_id UUID;
  v_webhook_url TEXT;
  v_response RECORD;
BEGIN
  -- Solo procesar si el estado cambió a 'completed'
  IF NEW.status != 'completed' OR OLD.status = 'completed' THEN
    RETURN NEW;
  END IF;
  
  -- Verificar que la orden tenga invoice_id
  IF NEW.invoice_id IS NULL THEN
    RAISE NOTICE '[invoicing] Orden % sin invoice_id, saltando emisión', NEW.id;
    RETURN NEW;
  END IF;
  
  v_invoice_id := NEW.invoice_id;
  v_org_id := NEW.organization_id;
  
  -- Verificar configuración de emisión automática
  SELECT * INTO v_config
  FROM invoicing.emission_config
  WHERE organization_id = v_org_id;
  
  -- Si hay configuración y auto_emit_on_completion está deshabilitado, saltar
  IF v_config IS NOT NULL AND NOT v_config.auto_emit_on_completion THEN
    RAISE NOTICE '[invoicing] Emisión automática deshabilitada para organización %, saltando', v_org_id;
    RETURN NEW;
  END IF;
  
  -- Verificar si ya existe una solicitud para esta orden
  IF EXISTS (
    SELECT 1 
    FROM invoicing.document_requests 
    WHERE order_id = NEW.id 
    AND status IN ('pending', 'processing', 'completed')
  ) THEN
    RAISE NOTICE '[invoicing] Ya existe solicitud para orden %, saltando', NEW.id;
    RETURN NEW;
  END IF;
  
  -- Obtener datos de la orden e invoice para el snapshot
  DECLARE
    v_order_data JSONB;
    v_invoice_data JSONB;
  BEGIN
    SELECT row_to_json(o.*)::JSONB INTO v_order_data
    FROM billing.orders o
    WHERE o.id = NEW.id;
    
    SELECT row_to_json(i.*)::JSONB INTO v_invoice_data
    FROM billing.invoices i
    WHERE i.id = v_invoice_id;
    
    -- Crear solicitud de documento
    v_request_id := invoicing.create_document_request(
      p_order_id := NEW.id,
      p_invoice_id := v_invoice_id,
      p_organization_id := v_org_id,
      p_document_type := NULL, -- Se determina automáticamente
      p_request_data := jsonb_build_object(
        'order', v_order_data,
        'invoice', v_invoice_data,
        'triggered_at', NOW()
      )
    );
    
    RAISE NOTICE '[invoicing] Solicitud creada: % para orden %', v_request_id, NEW.id;
    
    -- Llamar webhook usando pg_net (si está disponible)
    -- Nota: pg_net requiere extensión habilitada y configuración de URL
    BEGIN
      -- Obtener URL base desde variable de entorno o usar valor por defecto
      v_webhook_url := COALESCE(
        current_setting('app.webhook_base_url', true),
        'http://localhost:3000'
      ) || '/api/invoicing/process-request';
      
      -- Intentar llamar webhook usando pg_net
      -- Si pg_net no está disponible, solo loguear
      IF EXISTS (
        SELECT 1 FROM pg_extension WHERE extname = 'pg_net'
      ) THEN
        SELECT * INTO v_response
        FROM net.http_post(
          url := v_webhook_url,
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'X-Internal-Request', 'true'
          ),
          body := jsonb_build_object(
            'request_id', v_request_id,
            'order_id', NEW.id,
            'invoice_id', v_invoice_id
          )::text
        );
        
        RAISE NOTICE '[invoicing] Webhook llamado: % (status: %)', v_webhook_url, v_response.status_code;
      ELSE
        RAISE NOTICE '[invoicing] pg_net no disponible, webhook debe ser llamado manualmente o por cron';
      END IF;
    EXCEPTION WHEN OTHERS THEN
      -- Si falla el webhook, solo loguear el error pero no fallar el trigger
      RAISE WARNING '[invoicing] Error llamando webhook: %', SQLERRM;
    END;
    
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- CREATE TRIGGER
-- =====================================================

-- Trigger en billing.orders
CREATE TRIGGER trigger_order_completed_invoicing
  AFTER UPDATE OF status ON billing.orders
  FOR EACH ROW
  WHEN (NEW.status = 'completed' AND OLD.status != 'completed')
  EXECUTE FUNCTION invoicing.on_order_completed();

-- =====================================================
-- FUNCTION: Procesar solicitud manualmente (para retry)
-- =====================================================

CREATE OR REPLACE FUNCTION invoicing.retry_document_request(
  p_request_id UUID
)
RETURNS VOID AS $$
DECLARE
  v_request invoicing.document_requests;
  v_webhook_url TEXT;
  v_response RECORD;
BEGIN
  -- Obtener solicitud
  SELECT * INTO v_request
  FROM invoicing.document_requests
  WHERE id = p_request_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Solicitud no encontrada: %', p_request_id;
  END IF;
  
  -- Solo reintentar si está en estado failed o pending
  IF v_request.status NOT IN ('failed', 'pending') THEN
    RAISE EXCEPTION 'Solicitud % no puede ser reintentada (estado: %)', p_request_id, v_request.status;
  END IF;
  
  -- Resetear estado a pending
  UPDATE invoicing.document_requests
  SET 
    status = 'pending',
    updated_at = NOW()
  WHERE id = p_request_id;
  
  -- Llamar webhook
  BEGIN
    v_webhook_url := COALESCE(
      current_setting('app.webhook_base_url', true),
      'http://localhost:3000'
    ) || '/api/invoicing/process-request';
    
    IF EXISTS (
      SELECT 1 FROM pg_extension WHERE extname = 'pg_net'
    ) THEN
      SELECT * INTO v_response
      FROM net.http_post(
        url := v_webhook_url,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'X-Internal-Request', 'true'
        ),
        body := jsonb_build_object(
          'request_id', p_request_id,
          'order_id', v_request.order_id,
          'invoice_id', v_request.invoice_id
        )::text
      );
      
      RAISE NOTICE '[invoicing] Reintento webhook llamado: % (status: %)', v_webhook_url, v_response.status_code;
    ELSE
      RAISE NOTICE '[invoicing] pg_net no disponible, webhook debe ser llamado manualmente';
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING '[invoicing] Error llamando webhook de reintento: %', SQLERRM;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- GRANTS
-- =====================================================

GRANT EXECUTE ON FUNCTION invoicing.on_order_completed() TO postgres, service_role;
GRANT EXECUTE ON FUNCTION invoicing.retry_document_request(UUID) TO authenticated, service_role;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON FUNCTION invoicing.on_order_completed IS 'Trigger que crea solicitud de documento cuando una orden se completa';
COMMENT ON FUNCTION invoicing.retry_document_request IS 'Reintenta procesar una solicitud de documento fallida';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Trigger y webhook de invoicing creados exitosamente';
  RAISE NOTICE '';
  RAISE NOTICE 'Funciones creadas:';
  RAISE NOTICE '  ✅ on_order_completed() - Trigger cuando orden se completa';
  RAISE NOTICE '  ✅ retry_document_request() - Reintentar solicitud';
  RAISE NOTICE '';
  RAISE NOTICE 'Trigger creado:';
  RAISE NOTICE '  ✅ trigger_order_completed_invoicing en billing.orders';
  RAISE NOTICE '';
  RAISE NOTICE 'Nota: Si pg_net no está disponible, el webhook debe ser llamado';
  RAISE NOTICE 'manualmente o mediante un cron job que procese solicitudes pendientes';
END $$;

