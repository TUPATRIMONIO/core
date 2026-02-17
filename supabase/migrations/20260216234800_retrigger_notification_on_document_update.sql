-- =====================================================
-- Migration: Retrigger notification on document update
-- Description: Refactoriza la notificación de pedido completado y permite re-enviarla
--              cuando se actualiza un documento (ej: corrección notarial)
-- Created: 2026-02-16
-- =====================================================

SET search_path TO billing, signing, public, extensions;

-- =====================================================
-- 1. Helper function for sending notification (Refactor)
-- =====================================================

CREATE OR REPLACE FUNCTION billing.send_order_notification_webhook(p_order_id UUID)
RETURNS void AS $$
DECLARE
  v_webhook_url TEXT;
  v_response RECORD;
BEGIN
  -- Construir URL de la Edge Function
  v_webhook_url := current_setting('app.settings.supabase_url', true) || '/functions/v1/send-order-completed-notification';
  
  -- Si no está configurado, usar variable de entorno o valor por defecto
  IF v_webhook_url IS NULL OR v_webhook_url = '/functions/v1/send-order-completed-notification' THEN
    -- Fallback para desarrollo local o si no está configurado
    v_webhook_url := 'http://localhost:54321/functions/v1/send-order-completed-notification';
  END IF;

  RAISE NOTICE '[billing] Enviando notificación para pedido: % (URL: %)', p_order_id, v_webhook_url;

  -- Llamar webhook usando pg_net (si está disponible)
  BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net') THEN
      SELECT * INTO v_response
      FROM net.http_post(
        url := v_webhook_url,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.supabase_service_role_key', true)
        ),
        body := jsonb_build_object(
          'order_id', p_order_id
        )::text
      );
      
      RAISE NOTICE '[billing] Webhook llamado: % (status: %)', v_webhook_url, v_response.status_code;
    ELSE
      RAISE NOTICE '[billing] pg_net no disponible, no se pudo enviar notificación automática';
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- No fallar la transacción si el webhook falla
    RAISE WARNING '[billing] Error llamando webhook de notificación: %', SQLERRM;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION billing.send_order_notification_webhook(UUID) TO postgres, service_role;

-- =====================================================
-- 2. Update billing.notify_order_completed trigger function
-- =====================================================

CREATE OR REPLACE FUNCTION billing.notify_order_completed()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo procesar si el estado cambió a 'completed'
  IF NEW.status != 'completed' OR (OLD.status IS NOT NULL AND OLD.status = 'completed') THEN
    RETURN NEW;
  END IF;

  -- Usar la función helper refactorizada
  PERFORM billing.send_order_notification_webhook(NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 3. Update signing.auto_complete_order_on_document_done
-- =====================================================

CREATE OR REPLACE FUNCTION signing.auto_complete_order_on_document_done()
RETURNS TRIGGER AS $$
DECLARE
  v_order_id UUID;
  v_order_status billing.order_status;
  v_pending_docs_count INTEGER;
BEGIN
  -- Solo procesar si el estado es 'completed' (sea nuevo o actualización)
  IF NEW.status != 'completed' THEN
    RETURN NEW;
  END IF;

  v_order_id := NEW.order_id;

  -- Si no tiene pedido asociado, no hacer nada
  IF v_order_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Verificar estado actual del pedido
  SELECT status INTO v_order_status
  FROM billing.orders
  WHERE id = v_order_id;

  -- CASO 1: El pedido YA está completado
  -- Si el documento se actualizó (ej: resubida notarial), re-enviamos la notificación
  IF v_order_status = 'completed' THEN
    RAISE NOTICE '[signing] Documento % actualizado en pedido completado %, re-enviando notificación', NEW.id, v_order_id;
    PERFORM billing.send_order_notification_webhook(v_order_id);
    RETURN NEW;
  END IF;

  -- Si el pedido está cancelado o reembolsado, no hacemos nada
  IF v_order_status = 'cancelled' OR v_order_status = 'refunded' THEN
    RETURN NEW;
  END IF;

  -- CASO 2: El pedido NO está completado (está 'paid' o 'pending_payment')
  -- Verificar si quedan documentos pendientes para este pedido
  SELECT COUNT(*) INTO v_pending_docs_count
  FROM signing.documents
  WHERE order_id = v_order_id
    AND status != 'completed';

  -- Si no quedan documentos pendientes (count = 0), completamos el pedido
  IF v_pending_docs_count = 0 THEN
    UPDATE billing.orders
    SET 
      status = 'completed',
      completed_at = NOW(),
      updated_at = NOW()
    WHERE id = v_order_id;
    
    -- Nota: El update disparará billing.notify_order_completed automáticamente
    RAISE NOTICE '[signing] Pedido % completado automáticamente al finalizar todos sus documentos', v_order_id;
  ELSE
    RAISE NOTICE '[signing] Pedido % tiene % documentos pendientes, esperando...', v_order_id, v_pending_docs_count;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Notificaciones refactorizadas y re-envío configurado correctamente';
  RAISE NOTICE '   - billing.send_order_notification_webhook creada';
  RAISE NOTICE '   - billing.notify_order_completed actualizada';
  RAISE NOTICE '   - signing.auto_complete_order_on_document_done actualizada para re-enviar';
END $$;
