-- =====================================================
-- Migration: Notify order completed
-- Description: Trigger para notificar al gestor y firmantes cuando el pedido se completa
-- Created: 2026-02-16
-- =====================================================

SET search_path TO billing, public, extensions;

-- =====================================================
-- FUNCTION: Notify order completed
-- =====================================================

CREATE OR REPLACE FUNCTION billing.notify_order_completed()
RETURNS TRIGGER AS $$
DECLARE
  v_webhook_url TEXT;
  v_response RECORD;
BEGIN
  -- Solo procesar si el estado cambió a 'completed'
  IF NEW.status != 'completed' OR (OLD.status IS NOT NULL AND OLD.status = 'completed') THEN
    RETURN NEW;
  END IF;

  -- Construir URL de la Edge Function
  v_webhook_url := current_setting('app.settings.supabase_url', true) || '/functions/v1/send-order-completed-notification';
  
  -- Si no está configurado, usar variable de entorno o valor por defecto
  IF v_webhook_url IS NULL OR v_webhook_url = '/functions/v1/send-order-completed-notification' THEN
    -- Fallback para desarrollo local o si no está configurado
    v_webhook_url := 'http://localhost:54321/functions/v1/send-order-completed-notification';
  END IF;

  RAISE NOTICE '[billing] Notificando pedido completado: % (URL: %)', NEW.id, v_webhook_url;

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
          'order_id', NEW.id
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

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGER
-- =====================================================

DROP TRIGGER IF EXISTS trigger_notify_order_completed ON billing.orders;

CREATE TRIGGER trigger_notify_order_completed
  AFTER UPDATE OF status ON billing.orders
  FOR EACH ROW
  EXECUTE FUNCTION billing.notify_order_completed();

-- =====================================================
-- GRANTS
-- =====================================================

GRANT EXECUTE ON FUNCTION billing.notify_order_completed() TO postgres, service_role;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON FUNCTION billing.notify_order_completed IS 'Trigger que llama a la Edge Function para notificar finalización del pedido';
COMMENT ON TRIGGER trigger_notify_order_completed ON billing.orders IS 'Dispara notificación cuando el pedido pasa a completed';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Trigger trigger_notify_order_completed creado exitosamente';
END $$;
