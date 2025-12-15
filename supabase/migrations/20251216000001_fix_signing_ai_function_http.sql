-- Fix signing.invoke_ai_analysis_function to use http extension for synchronous execution
-- This fixes the "function net.http_post(...) does not exist" error

-- Ensure http extension is enabled
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;

-- Redefine the function to use extensions.http synchronous call
CREATE OR REPLACE FUNCTION signing.invoke_ai_analysis_function(document_id UUID)
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
  function_url := current_setting('app.settings.supabase_url', true) || '/functions/v1/analyze-document-risks';

  -- Si no está configurado, usar variable de entorno o valor por defecto
  IF function_url IS NULL OR function_url = '/functions/v1/analyze-document-risks' THEN
    function_url := 'http://localhost:54321/functions/v1/analyze-document-risks';
  END IF;

  -- Construir payload
  payload := jsonb_build_object('document_id', document_id::text);
  
  -- Preparar headers
  headers := ARRAY[
    http_header('Content-Type', 'application/json'),
    http_header('Authorization', 'Bearer ' || current_setting('app.settings.supabase_service_role_key', true))
  ];

  -- Llamar a la Edge Function usando http extension (sincrónico)
  -- Esto permite capturar el status y body inmediatamente
  SELECT status, content INTO response_status, response_body
  FROM http((
    'POST',
    function_url,
    headers,
    'application/json',
    payload::text
  )::http_request);

  -- Log de errores y guardar en base de datos si falla
  IF response_status != 200 THEN
    RAISE WARNING 'Error al invocar analyze-document-risks: % - %', response_status, response_body;

    -- Registrar en ai_reviews
    INSERT INTO signing.ai_reviews (
      document_id,
      review_type,
      status,
      passed,
      reasons,
      suggestions,
      raw_response,
      ai_model,
      completed_at,
      metadata
    ) VALUES (
      document_id,
      'ai_document_review_full',
      'rejected',
      false,
      '[]'::jsonb,
      '[]'::jsonb,
      jsonb_build_object('http_status', response_status, 'body', response_body),
      'system',
      NOW(),
      jsonb_build_object('source', 'db_trigger')
    );
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Excepción al invocar analyze-document-risks: %', SQLERRM;
  -- No re-lanzamos el error para no abortar la creación del documento
END;
$$;

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Fixed signing.invoke_ai_analysis_function to use http extension';
END $$;



