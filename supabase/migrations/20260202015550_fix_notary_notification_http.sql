-- =====================================================
-- Migration: Fix notary notification http call
-- Description: Reemplaza net.http_post con extensión http en send_notary_notification
--              para corregir error "function net.http_post does not exist"
-- Created: 2026-02-02
-- =====================================================

-- Asegurar que la extensión http está habilitada
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION signing.send_notary_notification(
  p_type TEXT,
  p_recipient_email TEXT,
  p_recipient_name TEXT,
  p_document_title TEXT,
  p_action_url TEXT,
  p_org_id UUID,
  p_document_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = signing, core, public, extensions
AS $$
DECLARE
  function_url TEXT;
  response_status INT;
  response_body TEXT;
  payload JSONB;
  headers http_header[];
BEGIN
  function_url := current_setting('app.settings.supabase_url', true) || '/functions/v1/send-signing-notification';
  IF function_url IS NULL OR function_url = '/functions/v1/send-signing-notification' THEN
    function_url := 'http://localhost:54321/functions/v1/send-signing-notification';
  END IF;

  payload := jsonb_build_object(
    'type', p_type,
    'recipient_email', p_recipient_email,
    'recipient_name', p_recipient_name,
    'document_title', p_document_title,
    'action_url', p_action_url,
    'org_id', p_org_id::text,
    'document_id', p_document_id::text
  );

  headers := ARRAY[
    http_header('Content-Type', 'application/json'),
    http_header('Authorization', 'Bearer ' || current_setting('app.settings.supabase_service_role_key', true))
  ];

  SELECT status, content INTO response_status, response_body
  FROM http((
    'POST',
    function_url,
    headers,
    'application/json',
    payload::text
  )::http_request);

  IF response_status != 200 THEN
    RAISE WARNING 'Error al enviar notificación notarial a %: % - %',
      p_recipient_email, response_status, response_body;
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Excepción al enviar notificación notarial: %', SQLERRM;
END;
$$;

DO $$
BEGIN
  RAISE NOTICE '✅ Función send_notary_notification actualizada para usar extensión http';
END $$;
