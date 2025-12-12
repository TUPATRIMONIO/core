-- =====================================================
-- Migration: Handle resend order payment callback
-- Description: Limpia metadata.resend cuando se paga un re-envío
-- Created: 2025-12-12
-- =====================================================

SET search_path TO signing, billing, core, public, extensions;

-- =====================================================
-- FUNCTION: Callback para orden de re-envío completada
-- =====================================================

CREATE OR REPLACE FUNCTION signing.on_resend_order_completed()
RETURNS TRIGGER AS $$
DECLARE
  v_document_id UUID;
  v_product_type TEXT;
BEGIN
  -- Solo procesar si el estado cambió a 'completed' o 'paid'
  IF NEW.status NOT IN ('completed', 'paid') OR OLD.status IN ('completed', 'paid') THEN
    RETURN NEW;
  END IF;

  -- Verificar si es una orden de re-envío
  v_product_type := NEW.product_type::TEXT;

  IF v_product_type != 'electronic_signature_resend' THEN
    RETURN NEW;
  END IF;

  -- Obtener document_id desde metadata
  v_document_id := NULLIF((NEW.metadata->>'document_id')::TEXT, '')::UUID;

  IF v_document_id IS NULL THEN
    RAISE NOTICE '[signing.on_resend_order_completed] No se encontró document_id en metadata de orden %', NEW.id;
    RETURN NEW;
  END IF;

  -- Actualizar documento: limpiar resend.invalidated_signatures_count y marcar como pagado
  UPDATE signing.documents
  SET
    order_id = NEW.id,
    metadata = jsonb_set(
      jsonb_set(
        COALESCE(metadata, '{}'::jsonb),
        '{resend,invalidated_signatures_count}',
        '0'::jsonb,
        true
      ),
      '{resend,paid_at}',
      to_jsonb(NOW()::TEXT),
      true
    ),
    updated_at = NOW()
  WHERE id = v_document_id;

  RAISE NOTICE '[signing.on_resend_order_completed] Documento % actualizado tras pago de re-envío (orden %)', v_document_id, NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGER: En billing.orders cuando se paga
-- =====================================================

DROP TRIGGER IF EXISTS trigger_resend_order_completed ON billing.orders;

CREATE TRIGGER trigger_resend_order_completed
  AFTER UPDATE ON billing.orders
  FOR EACH ROW
  EXECUTE FUNCTION signing.on_resend_order_completed();

-- =====================================================
-- GRANTS
-- =====================================================

GRANT EXECUTE ON FUNCTION signing.on_resend_order_completed() TO postgres, service_role;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Trigger signing.on_resend_order_completed creado para procesar pagos de re-envío';
END $$;

