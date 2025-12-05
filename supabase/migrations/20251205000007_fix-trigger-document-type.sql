-- =====================================================
-- Migration: Fix trigger document type logic
-- Description: Determina tipo de documento según proveedor de pago
-- Created: 2025-12-05
-- =====================================================

SET search_path TO invoicing, billing, credits, core, public, extensions;

-- =====================================================
-- FUNCTION: Trigger actualizado con lógica mejorada
-- =====================================================

CREATE OR REPLACE FUNCTION invoicing.on_order_completed()
RETURNS TRIGGER AS $$
DECLARE
  v_org_id UUID;
  v_org_country TEXT;
  v_org_tax_id TEXT;
  v_settings invoicing.settings;
  v_request_id UUID;
  v_webhook_url TEXT;
  v_response RECORD;
  v_order_data JSONB;
  v_document_type invoicing.document_type;
  v_payment_provider TEXT;
  v_order_metadata JSONB;
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
    WHERE (er.request_data->>'order_id')::UUID = NEW.id 
    AND er.status IN ('pending', 'processing', 'completed')
  ) THEN
    RAISE NOTICE '[invoicing] Ya existe solicitud para orden %, saltando', NEW.id;
    RETURN NEW;
  END IF;
  
  -- Obtener datos de la organización
  SELECT country, tax_id 
  INTO v_org_country, v_org_tax_id
  FROM core.organizations
  WHERE id = v_org_id;
  
  -- Obtener datos de la orden para el snapshot
  SELECT row_to_json(o.*)::JSONB INTO v_order_data
  FROM billing.orders o
  WHERE o.id = NEW.id;
  
  -- Obtener metadata de la orden
  v_order_metadata := NEW.metadata;
  
  -- Obtener proveedor del pago asociado a la orden
  SELECT provider INTO v_payment_provider
  FROM billing.payments
  WHERE id = NEW.payment_id;
  
  -- Determinar tipo de documento según proveedor de pago
  -- Lógica:
  -- 1. Stripe → SIEMPRE stripe_invoice
  -- 2. Transbank → Usar document_type de metadata de la orden, o boleta por defecto
  -- 3. Si no hay proveedor o es desconocido → stripe_invoice (fallback)
  IF v_payment_provider = 'stripe' THEN
    v_document_type := 'stripe_invoice'::invoicing.document_type;
  ELSIF v_payment_provider = 'transbank' THEN
    -- Usar tipo especificado en metadata de la orden, o boleta por defecto
    v_document_type := COALESCE(
      (v_order_metadata->>'document_type')::invoicing.document_type,
      'boleta_electronica'::invoicing.document_type
    );
  ELSE
    -- Fallback: stripe_invoice para otros proveedores o si no hay proveedor
    v_document_type := 'stripe_invoice'::invoicing.document_type;
  END IF;
  
  RAISE NOTICE '[invoicing] Tipo de documento determinado: % (proveedor: %, metadata: %)', 
    v_document_type, v_payment_provider, v_order_metadata;
  
  -- Crear solicitud de emisión
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
  
  RAISE NOTICE '[invoicing] Solicitud de emisión creada: % para orden % (tipo: %)', 
    v_request_id, NEW.id, v_document_type;
  
  -- Llamar webhook usando pg_net (si está disponible)
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
          'request_id', v_request_id,
          'order_id', NEW.id
        )::text
      );
      
      RAISE NOTICE '[invoicing] Webhook llamado: % (status: %)', v_webhook_url, v_response.status_code;
    ELSE
      RAISE NOTICE '[invoicing] pg_net no disponible, webhook debe ser llamado manualmente o por cron';
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING '[invoicing] Error llamando webhook: %', SQLERRM;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Trigger on_order_completed actualizado con lógica de documento mejorada';
  RAISE NOTICE '';
  RAISE NOTICE 'Lógica de tipo de documento:';
  RAISE NOTICE '  1. Stripe → SIEMPRE stripe_invoice';
  RAISE NOTICE '  2. Transbank → Usa document_type de metadata de orden, o boleta por defecto';
  RAISE NOTICE '  3. Otros proveedores → stripe_invoice (fallback)';
END $$;

