-- =====================================================
-- Migration: Update AI Review Trigger Logic
-- Description: Remove requires_approval check when IA approves a document
--              to ensure it goes directly to pending_signature.
--              Also ensure rejected/needs_changes results go to manual_review.
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
          -- (Ignoramos v_doc.requires_approval por decisión de negocio)
          UPDATE signing.documents
          SET status = 'pending_signature',
              sent_to_sign_at = COALESCE(sent_to_sign_at, NOW()),
              updated_at = NOW()
          WHERE id = NEW.document_id;
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

