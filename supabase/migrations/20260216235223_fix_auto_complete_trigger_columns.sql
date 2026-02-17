-- =====================================================
-- Migration: Fix auto complete trigger columns
-- Description: Actualiza el trigger para escuchar cambios en completed_at
--              Esto asegura que se dispare en re-subidas donde el status no cambia
-- Created: 2026-02-16
-- =====================================================

SET search_path TO signing, public, extensions;

-- =====================================================
-- TRIGGER UPDATE
-- =====================================================

DROP TRIGGER IF EXISTS trigger_auto_complete_order ON signing.documents;

CREATE TRIGGER trigger_auto_complete_order
  AFTER UPDATE OF status, completed_at ON signing.documents
  FOR EACH ROW
  EXECUTE FUNCTION signing.auto_complete_order_on_document_done();

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TRIGGER trigger_auto_complete_order ON signing.documents IS 'Dispara la verificación de completitud (o re-notificación) cuando cambia el estado o la fecha de completado';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Trigger trigger_auto_complete_order actualizado para escuchar status y completed_at';
END $$;
