-- =====================================================
-- Migration: Fix invoke_internal_review_function to use http extension
-- Description: Corrige error "function net.http_post(...) does not exist"
-- Created: 2026-01-06
-- =====================================================

-- Asegurar que la extensión http está habilitada
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;

-- Redefinir la función para usar http síncrono en lugar de pg_net
CREATE OR REPLACE FUNCTION signing.invoke_internal_review_function(document_id UUID)
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
  -- Construir URL de la Edge Function
  function_url := current_setting('app.settings.supabase_url', true) || '/functions/v1/internal-document-review';

  -- Si no está configurado, usar valor por defecto
  IF function_url IS NULL OR function_url = '/functions/v1/internal-document-review' THEN
    function_url := 'http://localhost:54321/functions/v1/internal-document-review';
  END IF;

  -- Construir payload
  payload := jsonb_build_object('document_id', document_id::text);
  
  -- Preparar headers
  headers := ARRAY[
    http_header('Content-Type', 'application/json'),
    http_header('Authorization', 'Bearer ' || current_setting('app.settings.supabase_service_role_key', true))
  ];

  -- Llamar a la Edge Function usando http extension (síncrono)
  SELECT status, content INTO response_status, response_body
  FROM http((
    'POST',
    function_url,
    headers,
    'application/json',
    payload::text
  )::http_request);

  -- Log de errores
  IF response_status IS NULL OR response_status != 200 THEN
    RAISE WARNING 'Error al invocar internal-document-review: % - %', response_status, response_body;
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Excepción al invocar internal-document-review: %', SQLERRM;
  -- No re-lanzamos el error para no abortar la transacción principal
END;
$$;

-- Mensaje de éxito
DO $$ 
BEGIN 
  RAISE NOTICE '✅ Fixed signing.invoke_internal_review_function to use http extension';
END $$;
