-- =====================================================
-- Migration: Recreate order completed trigger
-- Description: Recrea el trigger que fue eliminado en cleanup
-- Created: 2025-12-05
-- =====================================================

SET search_path TO invoicing, billing, credits, core, public, extensions;

-- =====================================================
-- CREATE TRIGGER
-- =====================================================

-- Eliminar trigger si existe (por si acaso)
DROP TRIGGER IF EXISTS trigger_order_completed_invoicing ON billing.orders;

-- Crear trigger en billing.orders
CREATE TRIGGER trigger_order_completed_invoicing
  AFTER UPDATE OF status ON billing.orders
  FOR EACH ROW
  WHEN (NEW.status = 'completed' AND OLD.status != 'completed')
  EXECUTE FUNCTION invoicing.on_order_completed();

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TRIGGER trigger_order_completed_invoicing ON billing.orders IS 
'Trigger que crea solicitud de emisión cuando una orden cambia a completed';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Trigger trigger_order_completed_invoicing recreado exitosamente';
  RAISE NOTICE '';
  RAISE NOTICE 'Trigger activo en: billing.orders';
  RAISE NOTICE 'Función: invoicing.on_order_completed()';
  RAISE NOTICE 'Evento: AFTER UPDATE OF status';
  RAISE NOTICE 'Condición: NEW.status = completed AND OLD.status != completed';
END $$;







