-- =====================================================
-- Migration: Auto-complete order when documents are completed
-- Description: Trigger para pasar el pedido a 'completed' cuando todos sus documentos están en 'completed'
-- Created: 2026-02-16
-- =====================================================

SET search_path TO signing, billing, core, public, extensions;

-- =====================================================
-- FUNCTION: Auto-complete order
-- =====================================================

CREATE OR REPLACE FUNCTION signing.auto_complete_order_on_document_done()
RETURNS TRIGGER AS $$
DECLARE
  v_order_id UUID;
  v_order_status billing.order_status;
  v_pending_docs_count INTEGER;
BEGIN
  -- Solo procesar si el estado cambió a 'completed'
  IF NEW.status != 'completed' OR (OLD.status IS NOT NULL AND OLD.status = 'completed') THEN
    RETURN NEW;
  END IF;

  v_order_id := NEW.order_id;

  -- Si no tiene pedido asociado, no hacer nada
  IF v_order_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Verificar estado actual del pedido
  -- Solo nos interesa si está en 'paid' (o 'pending_payment' si se permite flujo asíncrono, pero idealmente 'paid')
  -- Si ya está 'completed', 'cancelled' o 'refunded', no hacemos nada
  SELECT status INTO v_order_status
  FROM billing.orders
  WHERE id = v_order_id;

  IF v_order_status IS NULL OR v_order_status = 'completed' OR v_order_status = 'cancelled' OR v_order_status = 'refunded' THEN
    RETURN NEW;
  END IF;

  -- Verificar si quedan documentos pendientes para este pedido
  -- Contamos documentos que NO están en 'completed'
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
  ELSE
    RAISE NOTICE '[signing] Pedido % tiene % documentos pendientes, esperando...', v_order_id, v_pending_docs_count;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGER
-- =====================================================

DROP TRIGGER IF EXISTS trigger_auto_complete_order ON signing.documents;

CREATE TRIGGER trigger_auto_complete_order
  AFTER UPDATE OF status ON signing.documents
  FOR EACH ROW
  EXECUTE FUNCTION signing.auto_complete_order_on_document_done();

-- =====================================================
-- GRANTS
-- =====================================================

GRANT EXECUTE ON FUNCTION signing.auto_complete_order_on_document_done() TO postgres, service_role;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON FUNCTION signing.auto_complete_order_on_document_done IS 'Trigger que actualiza el estado del pedido a completed cuando todos sus documentos asociados están completados';
COMMENT ON TRIGGER trigger_auto_complete_order ON signing.documents IS 'Dispara la verificación de completitud del pedido al finalizar un documento';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Trigger trigger_auto_complete_order creado exitosamente';
END $$;
