-- =====================================================
-- Migration: Fix all functions using net.http_post
-- Description: Corrige error "function net.http_post(...) does not exist" en todas las funciones
-- Created: 2026-01-06
-- =====================================================

-- Asegurar que la extensión http está habilitada
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;

-- =====================================================
-- 1. FIX: signing.send_completed_document_notification
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
SET search_path = signing, core, public, extensions
AS $$
DECLARE
  function_url TEXT;
  response_status INT;
  response_body TEXT;
  payload JSONB;
  headers http_header[];
BEGIN
  -- Construir URL de la Edge Function
  function_url := current_setting('app.settings.supabase_url', true) || '/functions/v1/send-signing-notification';
  
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

  -- Preparar headers
  headers := ARRAY[
    http_header('Content-Type', 'application/json'),
    http_header('Authorization', 'Bearer ' || current_setting('app.settings.supabase_service_role_key', true))
  ];

  -- Llamar usando http extension
  SELECT status, content INTO response_status, response_body
  FROM http((
    'POST',
    function_url,
    headers,
    'application/json',
    payload::text
  )::http_request);

  IF response_status IS NULL OR response_status != 200 THEN
    RAISE WARNING 'Error al enviar notificación de documento completado a %: % - %', 
      p_signer_email, response_status, response_body;
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Excepción al enviar notificación: %', SQLERRM;
END;
$$;

-- =====================================================
-- 2. FIX: signing.invoke_signing_notification
-- =====================================================

CREATE OR REPLACE FUNCTION signing.invoke_signing_notification(payload JSONB)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = signing, core, public, extensions
AS $$
DECLARE
  function_url TEXT;
  response_status INT;
  response_body TEXT;
  headers http_header[];
BEGIN
  function_url := current_setting('app.settings.supabase_url', true) || '/functions/v1/send-signing-notification';
  
  IF function_url IS NULL OR function_url = '/functions/v1/send-signing-notification' THEN
    function_url := 'http://localhost:54321/functions/v1/send-signing-notification';
  END IF;

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

  IF response_status IS NULL OR response_status != 200 THEN
    RAISE WARNING 'Error al invocar send-signing-notification: % - %', response_status, response_body;
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Excepción al invocar signing notification: %', SQLERRM;
END;
$$;

-- =====================================================
-- 3. FIX: signing.invoke_ai_review_function
-- =====================================================

CREATE OR REPLACE FUNCTION signing.invoke_ai_review_function(document_id UUID)
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
  function_url := current_setting('app.settings.supabase_url', true) || '/functions/v1/analyze-document-risks';

  IF function_url IS NULL OR function_url = '/functions/v1/analyze-document-risks' THEN
    function_url := 'http://localhost:54321/functions/v1/analyze-document-risks';
  END IF;

  payload := jsonb_build_object('document_id', document_id::text);

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

  IF response_status IS NULL OR response_status != 200 THEN
    RAISE WARNING 'Error al invocar analyze-document-risks: % - %', response_status, response_body;
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Excepción al invocar AI review: %', SQLERRM;
END;
$$;

-- =====================================================
-- 4. FIX: signing.invoke_internal_review_after_ai
-- (Llamada desde trigger on_ai_review_completed)
-- =====================================================

CREATE OR REPLACE FUNCTION signing.invoke_internal_review_after_ai(document_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = signing, billing, credits, core, public, extensions
AS $$
DECLARE
  function_url TEXT;
  response_status INT;
  response_body TEXT;
  payload JSONB;
  headers http_header[];
BEGIN
  function_url := current_setting('app.settings.supabase_url', true) || '/functions/v1/internal-document-review';

  IF function_url IS NULL OR function_url = '/functions/v1/internal-document-review' THEN
    function_url := 'http://localhost:54321/functions/v1/internal-document-review';
  END IF;

  payload := jsonb_build_object('document_id', document_id::text);

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

  IF response_status IS NULL OR response_status != 200 THEN
    RAISE WARNING 'Error al invocar internal-document-review: % - %', response_status, response_body;
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Excepción al invocar internal review: %', SQLERRM;
END;
$$;

-- =====================================================
-- Mensaje de éxito
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Fixed all signing functions to use http extension instead of pg_net';
  RAISE NOTICE '   - send_completed_document_notification';
  RAISE NOTICE '   - invoke_signing_notification';
  RAISE NOTICE '   - invoke_ai_review_function';
  RAISE NOTICE '   - invoke_internal_review_after_ai';
END $$;

