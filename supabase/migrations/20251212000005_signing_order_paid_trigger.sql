-- =====================================================
-- Migration: Signing - advance document status on paid order
-- Description: Cuando una orden de firma se paga, avanzar el documento según flags
-- Created: 2025-12-12
-- =====================================================

SET search_path TO signing, billing, core, public, extensions;

-- =====================================================
-- TRIGGER FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION signing.on_signing_order_paid()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_doc RECORD;
  v_has_signers BOOLEAN;
  v_ai_approved BOOLEAN;
BEGIN
  -- Seguridad: fijar search_path para evitar inyección
  PERFORM set_config('search_path', 'signing,billing,core,public,extensions', true);

  -- Solo nos interesa cuando pasa a pagada/completada
  IF NEW.status NOT IN ('paid', 'completed') OR OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Solo órdenes relacionadas a firma
  IF NEW.product_type NOT IN ('electronic_signature', 'electronic_signature_resend') THEN
    RETURN NEW;
  END IF;

  FOR v_doc IN (
    SELECT d.*
    FROM signing.documents d
    WHERE d.order_id = NEW.id
      AND d.status IN ('draft', 'approved')
  ) LOOP
    -- Validar que el documento tenga firmantes
    SELECT EXISTS (
      SELECT 1 FROM signing.signers s
      WHERE s.document_id = v_doc.id
        AND s.status != 'removed'
      LIMIT 1
    ) INTO v_has_signers;

    IF NOT v_has_signers THEN
      -- Mantener en draft si aún no hay firmantes
      CONTINUE;
    END IF;

    -- Si requiere IA, verificar si ya hay revisión aprobada
    IF v_doc.requires_ai_review THEN
      SELECT EXISTS (
        SELECT 1
        FROM signing.ai_reviews ar
        WHERE ar.document_id = v_doc.id
          AND ar.status = 'approved'
          AND ar.completed_at IS NOT NULL
        LIMIT 1
      ) INTO v_ai_approved;

      IF NOT v_ai_approved THEN
        UPDATE signing.documents
        SET status = 'pending_ai_review',
            updated_at = NOW()
        WHERE id = v_doc.id;

        CONTINUE;
      END IF;
    END IF;

    -- Si requiere aprobación humana, mover a pending_review
    IF v_doc.requires_approval THEN
      UPDATE signing.documents
      SET status = 'pending_review',
          updated_at = NOW()
      WHERE id = v_doc.id;

      CONTINUE;
    END IF;

    -- Caso estándar: enviar a firma
    UPDATE signing.documents
    SET status = 'pending_signature',
        sent_to_sign_at = COALESCE(sent_to_sign_at, NOW()),
        updated_at = NOW()
    WHERE id = v_doc.id;
  END LOOP;

  RETURN NEW;
END;
$$;

-- =====================================================
-- TRIGGER ON billing.orders
-- =====================================================

DROP TRIGGER IF EXISTS trigger_signing_order_paid ON billing.orders;

CREATE TRIGGER trigger_signing_order_paid
  AFTER UPDATE OF status ON billing.orders
  FOR EACH ROW
  WHEN (NEW.status IN ('paid', 'completed') AND OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION signing.on_signing_order_paid();

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Trigger signing_order_paid instalado en billing.orders';
END $$;

