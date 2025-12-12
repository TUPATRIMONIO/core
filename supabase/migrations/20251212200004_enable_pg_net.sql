-- =====================================================
-- Migration: Enable pg_net and fix schema references
-- Description: Habilita pg_net y corrige referencias hardcoded a esquema 'net'
-- Created: 2025-12-12
-- =====================================================

-- 1. Asegurar que la extensión existe (preferiblemente en extensions)
CREATE EXTENSION IF NOT EXISTS pg_net SCHEMA extensions;

-- 2. Corregir signing.invoke_notification_function
CREATE OR REPLACE FUNCTION signing.invoke_notification_function(payload JSONB)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
-- Agregamos extensions y net (por si acaso) al search_path
SET search_path TO signing, core, public, extensions, net
AS $$
DECLARE
  function_url TEXT;
  response_status INT;
  response_body TEXT;
BEGIN
  -- Construir URL de la Edge Function
  function_url := current_setting('app.settings.supabase_url', true) || '/functions/v1/send-signing-notification';
  
  -- Si no está configurado, usar variable de entorno o valor por defecto
  IF function_url IS NULL OR function_url = '/functions/v1/send-signing-notification' THEN
    function_url := 'http://localhost:54321/functions/v1/send-signing-notification';
  END IF;

  -- Llamar a la Edge Function usando pg_net
  -- Usamos http_post sin prefijo de esquema gracias al search_path
  SELECT status, content INTO response_status, response_body
  FROM http_post(
    url := function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.supabase_service_role_key', true)
    ),
    body := payload::text
  );

  -- Log de errores (no fallar silenciosamente en producción)
  IF response_status != 200 THEN
    RAISE WARNING 'Error al invocar función de notificación: % - %', response_status, response_body;
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Capturar errores de pg_net para no abortar la transacción principal
  RAISE WARNING 'Excepción al invocar notificación: %', SQLERRM;
END;
$$;

-- 3. Corregir invoicing.on_order_completed (la versión modificada anteriormente)
CREATE OR REPLACE FUNCTION invoicing.on_order_completed()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
-- Agregamos extensions y net al search_path
SET search_path TO invoicing, billing, credits, core, public, extensions, net
AS $$
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
  
  -- Verificar monto 0
  IF NEW.amount <= 0 THEN
    RAISE NOTICE '[invoicing] Orden % tiene monto 0, saltando emisión', NEW.id;
    RETURN NEW;
  END IF;

  -- Obtener metadata de la orden
  v_order_metadata := NEW.metadata;

  -- Verificar document_type 'none' explícito
  IF (v_order_metadata->>'document_type') = 'none' THEN
    RAISE NOTICE '[invoicing] Orden % tiene document_type "none", saltando emisión', NEW.id;
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
  
  -- Obtener proveedor del pago asociado a la orden
  SELECT provider INTO v_payment_provider
  FROM billing.payments
  WHERE id = NEW.payment_id;
  
  -- Determinar tipo de documento según proveedor de pago
  IF v_payment_provider = 'stripe' THEN
    v_document_type := 'stripe_invoice'::invoicing.document_type;
  ELSIF v_payment_provider = 'transbank' THEN
    v_document_type := COALESCE(
      (v_order_metadata->>'document_type')::invoicing.document_type,
      'boleta_electronica'::invoicing.document_type
    );
  ELSE
    IF v_org_country = 'CL' THEN
        v_document_type := 'boleta_electronica'::invoicing.document_type;
    ELSE
        v_document_type := 'stripe_invoice'::invoicing.document_type;
    END IF;
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
  
  -- Llamar webhook usando pg_net
  BEGIN
    v_webhook_url := COALESCE(
      current_setting('app.webhook_base_url', true),
      'http://localhost:3000'
    ) || '/api/invoicing/process-request';
    
    -- Usamos http_post sin prefijo net.
    PERFORM http_post(
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
    
    RAISE NOTICE '[invoicing] Webhook llamado: %', v_webhook_url;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING '[invoicing] Error llamando webhook: %', SQLERRM;
  END;
  
  RETURN NEW;
END;
$$;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ pg_net habilitado y referencias a esquema corregidas';
END $$;
