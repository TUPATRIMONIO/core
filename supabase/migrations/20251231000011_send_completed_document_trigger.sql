-- =====================================================
-- Migration: Trigger to send completed document to recipients
-- Description: Envía documento firmado a firmantes cuando pasa a completed
-- Created: 2025-12-31
-- =====================================================

SET search_path TO signing, core, public, extensions;

-- =====================================================
-- FUNCTION: Invocar Edge Function de notificación
-- =====================================================

CREATE OR REPLACE FUNCTION signing.send_completed_document_notification(
  p_document_id UUID,
  p_signer_email TEXT,
  p_signer_name TEXT,
  p_document_title TEXT,
  p_action_url TEXT,
  p_org_id UUID
)
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
  function_url := current_setting('app.settings.supabase_url', true) || '/functions/v1/send-signing-notification';
  
  -- Si no está configurado, usar variable de entorno o valor por defecto
  IF function_url IS NULL OR function_url = '/functions/v1/send-signing-notification' THEN
    function_url := 'http://localhost:54321/functions/v1/send-signing-notification';
  END IF;

  -- Construir payload
  payload := jsonb_build_object(
    'type', 'SIGNING_COMPLETED',
    'recipient_email', p_signer_email,
    'recipient_name', p_signer_name,
    'document_title', p_document_title,
    'action_url', p_action_url,
    'org_id', p_org_id::text,
    'document_id', p_document_id::text
  );

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

  -- Log de errores (no fallar silenciosamente)
  IF response_status != 200 THEN
    RAISE WARNING 'Error al enviar notificación de documento completado a %: % - %', 
      p_signer_email, response_status, response_body;
  END IF;
END;
$$;

-- =====================================================
-- FUNCTION: Trigger cuando documento pasa a completed
-- =====================================================

CREATE OR REPLACE FUNCTION signing.on_document_completed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_signer RECORD;
  v_base_url TEXT;
  v_action_url TEXT;
BEGIN
  -- Solo procesar si cambió a completed
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    -- Verificar si debe enviar a firmantes
    IF NEW.send_to_signers_on_complete = true THEN
      -- Obtener URL base de la aplicación
      v_base_url := current_setting('app.settings.public_app_url', true);
      IF v_base_url IS NULL OR v_base_url = '' THEN
        v_base_url := 'https://tupatrimonio.cl';
      END IF;

      -- Construir URL de acción (página de descarga del documento)
      v_action_url := v_base_url || '/dashboard/signing/documents/' || NEW.id;

      -- Enviar notificación a cada firmante
      FOR v_signer IN (
        SELECT 
          s.email,
          s.full_name,
          s.id as signer_id
        FROM signing.signers s
        WHERE s.document_id = NEW.id
          AND s.status != 'removed'
          AND s.email IS NOT NULL
      ) LOOP
        -- Enviar notificación de forma asíncrona (no bloquea)
        PERFORM signing.send_completed_document_notification(
          NEW.id,
          v_signer.email,
          v_signer.full_name,
          NEW.title,
          v_action_url,
          NEW.organization_id
        );
      END LOOP;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- =====================================================
-- TRIGGER ON signing.documents
-- =====================================================

DROP TRIGGER IF EXISTS trigger_document_completed ON signing.documents;

CREATE TRIGGER trigger_document_completed
  AFTER UPDATE OF status ON signing.documents
  FOR EACH ROW
  WHEN (NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed'))
  EXECUTE FUNCTION signing.on_document_completed();

-- =====================================================
-- COMENTARIOS
-- =====================================================

COMMENT ON FUNCTION signing.send_completed_document_notification IS 
  'Envía notificación de documento completado a un firmante usando la Edge Function send-signing-notification';

COMMENT ON FUNCTION signing.on_document_completed IS 
  'Trigger que envía el documento firmado a todos los firmantes cuando el documento pasa a estado completed';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Trigger de envío de documento completado configurado';
  RAISE NOTICE '';
  RAISE NOTICE 'Funcionalidad:';
  RAISE NOTICE '  - Cuando un documento pasa a estado "completed"';
  RAISE NOTICE '  - Se envían notificaciones a todos los firmantes';
  RAISE NOTICE '  - Solo si send_to_signers_on_complete = true';
END $$;

