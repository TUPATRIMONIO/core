-- =====================================================
-- Migration: Remove SQL notification triggers
-- Description: Elimina los triggers y funciones de notificación SQL
--              ya que ahora se manejan desde TypeScript/Edge Functions
-- Created: 2026-02-17
-- =====================================================

SET search_path TO billing, signing, public, extensions;

-- =====================================================
-- DROP TRIGGERS AND FUNCTIONS
-- =====================================================

-- 1. Eliminar trigger de notificación en billing.orders
DROP TRIGGER IF EXISTS trigger_notify_order_completed ON billing.orders;

-- 2. Eliminar función del trigger
DROP FUNCTION IF EXISTS billing.notify_order_completed();

-- 3. Eliminar función helper de webhook
DROP FUNCTION IF EXISTS billing.send_order_notification_webhook(UUID);

-- =====================================================
-- REVERT signing.auto_complete_order_on_document_done
-- =====================================================
-- Esta función ya no necesita llamar a send_order_notification_webhook
-- Solo debe completar el pedido.

CREATE OR REPLACE FUNCTION signing.auto_complete_order_on_document_done()
RETURNS TRIGGER AS $$
DECLARE
  v_order_id UUID;
  v_order_status billing.order_status;
  v_pending_docs_count INTEGER;
BEGIN
  -- Solo procesar si el estado es 'completed'
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

  -- Si el pedido ya está completado, cancelado o reembolsado, no hacemos nada
  -- (La notificación de re-subida ahora se maneja en el código de la aplicación/edge function)
  IF v_order_status = 'completed' OR v_order_status = 'cancelled' OR v_order_status = 'refunded' THEN
    RETURN NEW;
  END IF;

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
    
    RAISE NOTICE '[signing] Pedido % completado automáticamente al finalizar todos sus documentos', v_order_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Triggers SQL de notificación eliminados correctamente';
  RAISE NOTICE '   - trigger_notify_order_completed eliminado';
  RAISE NOTICE '   - billing.notify_order_completed eliminada';
  RAISE NOTICE '   - billing.send_order_notification_webhook eliminada';
  RAISE NOTICE '   - signing.auto_complete_order_on_document_done simplificada';
END $$;
