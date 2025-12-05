-- =====================================================
-- Migration: Fix on_order_completed trigger
-- Description: Actualiza el trigger para que funcione sin billing.invoices
-- Created: 2025-12-02
-- =====================================================

SET search_path TO invoicing, billing, credits, core, public, extensions;

-- =====================================================
-- FUNCTION: Trigger cuando orden cambia a completed (ACTUALIZADO)
-- =====================================================

CREATE OR REPLACE FUNCTION invoicing.on_order_completed()
RETURNS TRIGGER AS $$
DECLARE
  v_org_id UUID;
  v_settings invoicing.settings;
  v_request_id UUID;
  v_webhook_url TEXT;
  v_response RECORD;
  v_order_data JSONB;
  v_document_type invoicing.document_type;
BEGIN
  -- Solo procesar si el estado cambió a 'completed'
  IF NEW.status != 'completed' OR OLD.status = 'completed' THEN
    RETURN NEW;
  END IF;
  
  v_org_id := NEW.organization_id;
  
  -- Verificar configuración de emisión automática
  SELECT * INTO v_settings
  FROM invoicing.settings
  WHERE organization_id = v_org_id;
  
  -- Si hay configuración y auto_emit_on_order_completion está deshabilitado, saltar
  IF v_settings IS NOT NULL AND NOT v_settings.auto_emit_on_order_completion THEN
    RAISE NOTICE '[invoicing] Emisión automática deshabilitada para organización %, saltando', v_org_id;
    RETURN NEW;
  END IF;
  
  -- Verificar si ya existe una solicitud para esta orden
  IF EXISTS (
    SELECT 1 
    FROM invoicing.emission_requests er
    JOIN invoicing.documents d ON d.id = er.document_id
    WHERE d.order_id = NEW.id 
    AND er.status IN ('pending', 'processing', 'completed')
  ) THEN
    RAISE NOTICE '[invoicing] Ya existe solicitud para orden %, saltando', NEW.id;
    RETURN NEW;
  END IF;
  
  -- Obtener datos de la orden para el snapshot
  SELECT row_to_json(o.*)::JSONB INTO v_order_data
  FROM billing.orders o
  WHERE o.id = NEW.id;
  
  -- Determinar tipo de documento según país de la organización
  -- Si no hay configuración, usar defaults según país
  IF v_settings IS NULL THEN
    -- Determinar tipo según país (Chile = factura_electronica, otros = stripe_invoice)
    SELECT 
      CASE 
        WHEN country = 'CL' THEN 'factura_electronica'::invoicing.document_type
        ELSE 'stripe_invoice'::invoicing.document_type
      END
    INTO v_document_type
    FROM core.organizations
    WHERE id = v_org_id;
  ELSE
    v_document_type := v_settings.default_document_type;
  END IF;
  
  -- Crear solicitud de emisión directamente en emission_requests
  -- Nota: El processor creará el documento y lo vinculará después
  INSERT INTO invoicing.emission_requests (
    organization_id,
    status,
    request_data
  ) VALUES (
    v_org_id,
    'pending',
    jsonb_build_object(
      'order_id', NEW.id,
      'order_number', NEW.order_number,
      'order', v_order_data,
      'document_type', v_document_type,
      'triggered_at', NOW(),
      'triggered_by', 'on_order_completed'
    )
  ) RETURNING id INTO v_request_id;
  
  RAISE NOTICE '[invoicing] Solicitud de emisión creada: % para orden %', v_request_id, NEW.id;
  
  -- Llamar webhook usando pg_net (si está disponible)
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
          'order_id', NEW.id
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
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- GRANTS
-- =====================================================

GRANT EXECUTE ON FUNCTION invoicing.on_order_completed() TO postgres, service_role;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON FUNCTION invoicing.on_order_completed IS 'Trigger que crea solicitud de emisión cuando una orden se completa (actualizado para funcionar sin billing.invoices)';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Trigger on_order_completed actualizado exitosamente';
  RAISE NOTICE '';
  RAISE NOTICE 'Cambios realizados:';
  RAISE NOTICE '  ✅ Eliminada referencia a billing.invoices';
  RAISE NOTICE '  ✅ Usa directamente datos de billing.orders';
  RAISE NOTICE '  ✅ Crea solicitud en invoicing.emission_requests';
  RAISE NOTICE '  ✅ Determina tipo de documento según país/configuración';
END $$;

