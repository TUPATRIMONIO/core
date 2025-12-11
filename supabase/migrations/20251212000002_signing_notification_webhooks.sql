-- =====================================================
-- Migration: Signing notification webhooks
-- Description: Database webhooks para notificaciones por email
-- Created: 2025-12-11
-- =====================================================

SET search_path TO signing, core, public, extensions;

-- =====================================================
-- HELPER FUNCTION: Invocar Edge Function
-- =====================================================

CREATE OR REPLACE FUNCTION signing.invoke_notification_function(payload JSONB)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  function_url TEXT;
  response_status INT;
  response_body TEXT;
BEGIN
  -- Construir URL de la Edge Function
  function_url := current_setting('app.settings.supabase_url', true) || '/functions/v1/send-signing-notification';
  
  -- Si no está configurado, usar variable de entorno o valor por defecto
  IF function_url IS NULL OR function_url = '/functions/v1/send-signing-notification' THEN
    function_url := 'http://localhost:54321/functions/v1/send-signing-notification';
  END IF;

  -- Llamar a la Edge Function usando pg_net extension
  -- Nota: Requiere que la extensión pg_net esté habilitada (viene por defecto en Supabase)
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
    RAISE WARNING 'Error al invocar función de notificación: % - %', response_status, response_body;
  END IF;
END;
$$;

-- =====================================================
-- FUNCTION: Notificar cuando documento pasa a revisión
-- =====================================================

CREATE OR REPLACE FUNCTION signing.notify_reviewers_on_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  reviewer_record RECORD;
  action_url TEXT;
  base_url TEXT;
BEGIN
  -- Solo procesar si el estado cambió a 'pending_review'
  IF NEW.status = 'pending_review' AND (OLD.status IS NULL OR OLD.status != 'pending_review') THEN
    -- Obtener URL base de la aplicación
    base_url := current_setting('app.settings.public_app_url', true);
    IF base_url IS NULL OR base_url = '' THEN
      base_url := 'https://tupatrimonio.cl';
    END IF;

    -- Notificar a todos los revisores pendientes
    FOR reviewer_record IN
      SELECT 
        r.id,
        r.user_id,
        r.document_id,
        u.email,
        u.full_name,
        d.title as document_title,
        d.organization_id
      FROM signing.reviewers r
      JOIN core.users u ON u.id = r.user_id
      JOIN signing.documents d ON d.id = r.document_id
      WHERE r.document_id = NEW.id
        AND r.status = 'pending'
    LOOP
      -- Construir URL de acción (dashboard de revisión)
      action_url := base_url || '/dashboard/signing/documents/' || reviewer_record.document_id;

      -- Invocar función de notificación
      PERFORM signing.invoke_notification_function(
        jsonb_build_object(
          'type', 'REVIEW_REQUEST',
          'recipient_email', reviewer_record.email,
          'recipient_name', COALESCE(reviewer_record.full_name, reviewer_record.email),
          'document_title', reviewer_record.document_title,
          'action_url', action_url,
          'org_id', reviewer_record.organization_id::text,
          'document_id', reviewer_record.document_id::text
        )
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

-- =====================================================
-- FUNCTION: Notificar cuando documento pasa a firma
-- =====================================================

CREATE OR REPLACE FUNCTION signing.notify_signers_on_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  signer_record RECORD;
  action_url TEXT;
  base_url TEXT;
  signing_token TEXT;
BEGIN
  -- Solo procesar si el estado cambió a 'pending_signature' o 'partially_signed'
  IF (NEW.status = 'pending_signature' OR NEW.status = 'partially_signed') 
     AND (OLD.status IS NULL OR (OLD.status != 'pending_signature' AND OLD.status != 'partially_signed')) THEN
    
    -- Obtener URL base
    base_url := current_setting('app.settings.public_app_url', true);
    IF base_url IS NULL OR base_url = '' THEN
      base_url := 'https://tupatrimonio.cl';
    END IF;

    -- Notificar al siguiente firmante (si es secuencial) o a todos (si es simultáneo)
    FOR signer_record IN
      SELECT 
        s.id,
        s.document_id,
        s.email,
        s.name,
        s.signing_token,
        s.signing_order,
        d.title as document_title,
        d.organization_id,
        d.signing_order as doc_signing_order
      FROM signing.signers s
      JOIN signing.documents d ON d.id = s.document_id
      WHERE s.document_id = NEW.id
        AND s.status = 'pending'
        AND (
          -- Si es simultáneo, notificar a todos
          d.signing_order = 'simultaneous'
          OR
          -- Si es secuencial, solo al primero en orden
          (d.signing_order = 'sequential' AND s.signing_order = (
            SELECT MIN(s2.signing_order) 
            FROM signing.signers s2 
            WHERE s2.document_id = NEW.id AND s2.status = 'pending'
          ))
        )
    LOOP
      -- Construir URL de acción (portal público de firma)
      signing_token := signer_record.signing_token;
      IF signing_token IS NULL THEN
        -- Generar token si no existe (debería existir, pero por seguridad)
        signing_token := encode(gen_random_bytes(32), 'hex');
        UPDATE signing.signers SET signing_token = signing_token WHERE id = signer_record.id;
      END IF;

      action_url := base_url || '/sign/' || signing_token;

      -- Invocar función de notificación
      PERFORM signing.invoke_notification_function(
        jsonb_build_object(
          'type', 'SIGNING_REQUEST',
          'recipient_email', signer_record.email,
          'recipient_name', signer_record.name,
          'document_title', signer_record.document_title,
          'action_url', action_url,
          'org_id', signer_record.organization_id::text,
          'document_id', signer_record.document_id::text,
          'signer_id', signer_record.id::text
        )
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

-- =====================================================
-- FUNCTION: Notificar cuando se completa la firma
-- =====================================================

CREATE OR REPLACE FUNCTION signing.notify_completion_on_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  signer_record RECORD;
  action_url TEXT;
  base_url TEXT;
BEGIN
  -- Solo procesar si el estado cambió a 'signed' o 'completed'
  IF (NEW.status = 'signed' OR NEW.status = 'completed') 
     AND (OLD.status IS NULL OR (OLD.status != 'signed' AND OLD.status != 'completed')) THEN
    
    base_url := current_setting('app.settings.public_app_url', true);
    IF base_url IS NULL OR base_url = '' THEN
      base_url := 'https://tupatrimonio.cl';
    END IF;

    -- Notificar a todos los firmantes que el documento está completo
    FOR signer_record IN
      SELECT DISTINCT
        s.email,
        s.name,
        d.title as document_title,
        d.organization_id,
        d.id as document_id
      FROM signing.signers s
      JOIN signing.documents d ON d.id = s.document_id
      WHERE s.document_id = NEW.id
        AND s.status = 'signed'
    LOOP
      action_url := base_url || '/dashboard/signing/documents/' || signer_record.document_id;

      PERFORM signing.invoke_notification_function(
        jsonb_build_object(
          'type', 'SIGNING_COMPLETED',
          'recipient_email', signer_record.email,
          'recipient_name', signer_record.name,
          'document_title', signer_record.document_title,
          'action_url', action_url,
          'org_id', signer_record.organization_id::text,
          'document_id', signer_record.document_id::text
        )
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger para notificar revisores cuando documento pasa a revisión
DROP TRIGGER IF EXISTS trigger_notify_reviewers ON signing.documents;
CREATE TRIGGER trigger_notify_reviewers
  AFTER UPDATE OF status ON signing.documents
  FOR EACH ROW
  WHEN (NEW.status = 'pending_review' AND (OLD.status IS NULL OR OLD.status != 'pending_review'))
  EXECUTE FUNCTION signing.notify_reviewers_on_status_change();

-- Trigger para notificar firmantes cuando documento pasa a firma
DROP TRIGGER IF EXISTS trigger_notify_signers ON signing.documents;
CREATE TRIGGER trigger_notify_signers
  AFTER UPDATE OF status ON signing.documents
  FOR EACH ROW
  WHEN ((NEW.status = 'pending_signature' OR NEW.status = 'partially_signed') 
        AND (OLD.status IS NULL OR (OLD.status != 'pending_signature' AND OLD.status != 'partially_signed')))
  EXECUTE FUNCTION signing.notify_signers_on_status_change();

-- Trigger para notificar cuando se completa la firma
DROP TRIGGER IF EXISTS trigger_notify_completion ON signing.documents;
CREATE TRIGGER trigger_notify_completion
  AFTER UPDATE OF status ON signing.documents
  FOR EACH ROW
  WHEN ((NEW.status = 'signed' OR NEW.status = 'completed') 
        AND (OLD.status IS NULL OR (OLD.status != 'signed' AND OLD.status != 'completed')))
  EXECUTE FUNCTION signing.notify_completion_on_status_change();

-- =====================================================
-- COMENTARIOS
-- =====================================================

COMMENT ON FUNCTION signing.invoke_notification_function IS 'Invoca la Edge Function send-signing-notification con el payload proporcionado';
COMMENT ON FUNCTION signing.notify_reviewers_on_status_change IS 'Notifica a revisores cuando un documento pasa a estado pending_review';
COMMENT ON FUNCTION signing.notify_signers_on_status_change IS 'Notifica a firmantes cuando un documento pasa a estado de firma';
COMMENT ON FUNCTION signing.notify_completion_on_status_change IS 'Notifica a firmantes cuando un documento se completa';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Webhooks de notificación configurados para signing';
END $$;
