-- =====================================================
-- Migration: Trigger for AI review completion
-- Description: Actualiza estado del documento cuando se completa revisión IA interna
-- Created: 2025-12-31
-- =====================================================

SET search_path TO signing, core, public, extensions;

-- =====================================================
-- FUNCTION: Invocar Edge Function de revisión interna
-- =====================================================

CREATE OR REPLACE FUNCTION signing.invoke_internal_review_function(document_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  function_url TEXT;
  response_status INT;
  response_body TEXT;
  payload JSONB;
BEGIN
  -- Construir URL de la Edge Function
  function_url := current_setting('app.settings.supabase_url', true) || '/functions/v1/internal-document-review';
  
  -- Si no está configurado, usar variable de entorno o valor por defecto
  IF function_url IS NULL OR function_url = '/functions/v1/internal-document-review' THEN
    function_url := 'http://localhost:54321/functions/v1/internal-document-review';
  END IF;

  -- Construir payload
  payload := jsonb_build_object('document_id', document_id::text);

  -- Llamar a la Edge Function usando pg_net extension
  SELECT status, content INTO response_status, response_body
  FROM net.http_post(
    url := function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.supabase_service_role_key', true)
    ),
    body := payload::text
  );

  -- Log de errores (no fallar silenciosamente en producción)
  IF response_status != 200 THEN
    RAISE WARNING 'Error al invocar función de revisión IA interna: % - %', response_status, response_body;
  END IF;
END;
$$;

-- =====================================================
-- FUNCTION: Trigger cuando se completa revisión IA
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
-- TRIGGER ON signing.ai_reviews
-- =====================================================

DROP TRIGGER IF EXISTS trigger_ai_review_completed ON signing.ai_reviews;

CREATE TRIGGER trigger_ai_review_completed
  AFTER UPDATE OF completed_at ON signing.ai_reviews
  FOR EACH ROW
  WHEN (NEW.completed_at IS NOT NULL AND (OLD.completed_at IS NULL OR OLD.completed_at IS DISTINCT FROM NEW.completed_at))
  EXECUTE FUNCTION signing.on_ai_review_completed();

-- =====================================================
-- FUNCTION: Trigger para iniciar revisión IA interna post-pago
-- =====================================================

CREATE OR REPLACE FUNCTION signing.trigger_internal_review_on_paid()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_doc RECORD;
BEGIN
  -- Solo nos interesa cuando pasa a pagada/completada
  IF NEW.status NOT IN ('paid', 'completed') OR OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Solo órdenes relacionadas a firma
  IF NEW.product_type NOT IN ('electronic_signature', 'electronic_signature_resend') THEN
    RETURN NEW;
  END IF;

  -- Buscar documentos relacionados que requieren revisión IA
  FOR v_doc IN (
    SELECT d.*
    FROM signing.documents d
    WHERE d.order_id = NEW.id
      AND d.status IN ('draft', 'pending_ai_review')
      AND d.requires_ai_review = true
  ) LOOP
    -- Verificar que no haya ya una revisión interna completada
    IF NOT EXISTS (
      SELECT 1
      FROM signing.ai_reviews ar
      WHERE ar.document_id = v_doc.id
        AND ar.review_type = 'internal_document_review'
        AND ar.completed_at IS NOT NULL
      LIMIT 1
    ) THEN
      -- Invocar función de revisión interna (asíncrona)
      PERFORM signing.invoke_internal_review_function(v_doc.id);
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

-- =====================================================
-- TRIGGER ON billing.orders para iniciar revisión interna
-- =====================================================

DROP TRIGGER IF EXISTS trigger_internal_review_on_paid ON billing.orders;

CREATE TRIGGER trigger_internal_review_on_paid
  AFTER UPDATE OF status ON billing.orders
  FOR EACH ROW
  WHEN (NEW.status IN ('paid', 'completed') AND OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION signing.trigger_internal_review_on_paid();

-- =====================================================
-- COMENTARIOS
-- =====================================================

COMMENT ON FUNCTION signing.invoke_internal_review_function IS 
  'Invoca la Edge Function internal-document-review para analizar un documento internamente';

COMMENT ON FUNCTION signing.on_ai_review_completed IS 
  'Trigger que actualiza el estado del documento cuando se completa una revisión IA interna';

COMMENT ON FUNCTION signing.trigger_internal_review_on_paid IS 
  'Trigger que inicia revisión IA interna cuando se paga una orden de firma';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Triggers de revisión IA interna configurados';
  RAISE NOTICE '';
  RAISE NOTICE 'Triggers creados:';
  RAISE NOTICE '  - trigger_ai_review_completed: Actualiza estado al completar revisión';
  RAISE NOTICE '  - trigger_internal_review_on_paid: Inicia revisión interna post-pago';
END $$;

