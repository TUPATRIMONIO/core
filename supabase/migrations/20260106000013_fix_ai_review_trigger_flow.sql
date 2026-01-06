-- =====================================================
-- Migration: Fix AI Review Trigger Flow
-- Description: Asegura que si la IA aprueba, el documento va directo a firma.
--             Si la IA rechaza o observa, va a revisión manual.
-- Created: 2026-01-06
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
    -- Solo procesar revisiones internas
    IF NEW.review_type = 'internal_document_review' THEN
      -- Obtener documento con bloqueo
      SELECT * INTO v_doc
      FROM signing.documents
      WHERE id = NEW.document_id
      FOR UPDATE;

      IF FOUND THEN
        -- Actualizar estado según resultado de la revisión
        IF NEW.status = 'approved' THEN
          -- SIEMPRE enviar directamente a firma si la IA aprueba
          UPDATE signing.documents
          SET status = 'pending_signature',
              sent_to_sign_at = COALESCE(sent_to_sign_at, NOW()),
              updated_at = NOW()
          WHERE id = NEW.document_id;
          
          RAISE NOTICE 'Documento % aprobado por IA y enviado a firma', NEW.document_id;
          
        ELSIF NEW.status IN ('rejected', 'needs_changes', 'observed') THEN
          -- Mover a revisión manual para que el equipo decida
          UPDATE signing.documents
          SET status = 'manual_review',
              updated_at = NOW()
          WHERE id = NEW.document_id;
          
          RAISE NOTICE 'Documento % rechazado/observado por IA y movido a revisión manual', NEW.document_id;
        END IF;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DO $$
BEGIN
  RAISE NOTICE '✅ Trigger on_ai_review_completed actualizado para flujo directo a firma';
END $$;

