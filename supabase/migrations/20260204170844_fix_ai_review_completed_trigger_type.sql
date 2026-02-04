-- =====================================================
-- Migration: Fix AI review completed trigger to handle both review types
-- Description: El trigger solo manejaba 'internal_document_review' pero la
--              Edge Function usa 'ai_document_review_full'
-- Created: 2026-02-04
-- =====================================================

SET search_path TO signing, core, public, extensions;

-- =====================================================
-- Actualizar la función para manejar ambos tipos de revisión
-- =====================================================

CREATE OR REPLACE FUNCTION signing.on_ai_review_completed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_doc RECORD;
BEGIN
  -- Solo procesar si completed_at cambió de NULL a valor
  IF NEW.completed_at IS NOT NULL AND (OLD.completed_at IS NULL OR OLD.completed_at IS DISTINCT FROM NEW.completed_at) THEN
    -- Procesar revisiones internas (ambos tipos)
    IF NEW.review_type IN ('internal_document_review', 'ai_document_review_full') THEN
      -- Obtener documento con bloqueo
      SELECT * INTO v_doc
      FROM signing.documents
      WHERE id = NEW.document_id
      FOR UPDATE;

      IF FOUND THEN
        -- Solo procesar si el documento está en pending_ai_review o manual_review
        IF v_doc.status NOT IN ('pending_ai_review', 'manual_review') THEN
          RETURN NEW;
        END IF;

        -- Actualizar estado según resultado de la revisión
        IF NEW.status = 'approved' THEN
          -- Si requiere aprobación humana, mover a pending_review
          -- Si no, enviar directamente a firma
          IF v_doc.requires_approval THEN
            UPDATE signing.documents
            SET status = 'pending_review',
                updated_at = NOW()
            WHERE id = NEW.document_id;
          ELSE
            UPDATE signing.documents
            SET status = 'pending_signature',
                sent_to_sign_at = COALESCE(sent_to_sign_at, NOW()),
                updated_at = NOW()
            WHERE id = NEW.document_id;
          END IF;
        ELSIF NEW.status IN ('rejected', 'needs_changes') THEN
          -- Mover a revisión manual para que el equipo decida
          UPDATE signing.documents
          SET status = 'manual_review',
              updated_at = NOW()
          WHERE id = NEW.document_id;
        END IF;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- =====================================================
-- Recrear el trigger (por si acaso)
-- =====================================================

DROP TRIGGER IF EXISTS trigger_ai_review_completed ON signing.ai_reviews;

CREATE TRIGGER trigger_ai_review_completed
  AFTER UPDATE OF completed_at ON signing.ai_reviews
  FOR EACH ROW
  WHEN (NEW.completed_at IS NOT NULL AND (OLD.completed_at IS NULL OR OLD.completed_at IS DISTINCT FROM NEW.completed_at))
  EXECUTE FUNCTION signing.on_ai_review_completed();

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Trigger on_ai_review_completed actualizado para manejar ambos tipos:';
  RAISE NOTICE '   - internal_document_review';
  RAISE NOTICE '   - ai_document_review_full';
END $$;
