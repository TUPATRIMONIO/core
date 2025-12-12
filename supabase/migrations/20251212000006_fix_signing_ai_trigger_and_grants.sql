-- =====================================================
-- Migration: Fix signing AI trigger + grants for edge functions
-- Description: Corrige invoke_ai_analysis_function para no usar columnas inexistentes y asegura permisos
-- Created: 2025-12-12
-- =====================================================

SET search_path TO signing, billing, credits, core, public, extensions;

-- =====================================================
-- Fix: invoke_ai_analysis_function
-- =====================================================

CREATE OR REPLACE FUNCTION signing.invoke_ai_analysis_function(document_id UUID)
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
  -- Seguridad: fijar search_path
  PERFORM set_config('search_path', 'signing,billing,credits,core,public,extensions', true);

  function_url := current_setting('app.settings.supabase_url', true) || '/functions/v1/analyze-document-risks';

  IF function_url IS NULL OR function_url = '/functions/v1/analyze-document-risks' THEN
    function_url := 'http://localhost:54321/functions/v1/analyze-document-risks';
  END IF;

  payload := jsonb_build_object('document_id', document_id::text);

  SELECT status, content INTO response_status, response_body
  FROM net.http_post(
    url := function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.supabase_service_role_key', true)
    ),
    body := payload::text
  );

  IF response_status != 200 THEN
    RAISE WARNING 'Error al invocar analyze-document-risks: % - %', response_status, response_body;

    -- Registrar en ai_reviews (sin romper por columnas inexistentes)
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
END;
$$;

-- =====================================================
-- Grants: allow service_role to use signing public views (edge functions)
-- =====================================================

GRANT SELECT ON public.signing_documents TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.signing_ai_reviews TO service_role;

-- credits RPC wrappers (safe, but ensure execute)
GRANT EXECUTE ON FUNCTION public.reserve_credits(UUID, DECIMAL, TEXT, UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.confirm_credits(UUID, UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.release_credits(UUID, UUID) TO service_role;

DO $$
BEGIN
  RAISE NOTICE '✅ Fixed signing.invoke_ai_analysis_function + grants for edge functions';
END $$;

