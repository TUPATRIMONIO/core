-- =====================================================
-- Migration: Signing AI review trigger
-- Description: Trigger para análisis automático por IA al crear documentos
-- Created: 2025-12-11
-- =====================================================

SET search_path TO signing, core, public, extensions;

-- =====================================================
-- FUNCTION: Invocar Edge Function de análisis IA
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
  -- Construir URL de la Edge Function
  function_url := current_setting('app.settings.supabase_url', true) || '/functions/v1/analyze-document-risks';
  
  -- Si no está configurado, usar variable de entorno o valor por defecto
  IF function_url IS NULL OR function_url = '/functions/v1/analyze-document-risks' THEN
    function_url := 'http://localhost:54321/functions/v1/analyze-document-risks';
  END IF;

  -- Construir payload
  payload := jsonb_build_object('document_id', document_id::text);

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
    RAISE WARNING 'Error al invocar función de análisis IA: % - %', response_status, response_body;
    
    -- Guardar error en la tabla ai_reviews
    INSERT INTO signing.ai_reviews (
      document_id,
      status,
      error_message,
      created_at
    ) VALUES (
      document_id,
      'failed',
      'HTTP ' || response_status::text || ': ' || response_body,
      NOW()
    ) ON CONFLICT DO NOTHING;
  END IF;
END;
$$;

-- =====================================================
-- FUNCTION: Trigger para análisis IA automático
-- =====================================================

CREATE OR REPLACE FUNCTION signing.trigger_ai_review_on_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Solo procesar si requires_ai_review es true
  IF NEW.requires_ai_review = true THEN
    -- Invocar función de análisis de forma asíncrona (no bloquea la inserción)
    -- Usar pg_notify o simplemente invocar en background
    -- Por ahora lo invocamos directamente, pero en producción podría ser mejor usar una cola
    
    -- Nota: En producción, considerar usar pg_notify + LISTEN o una cola de trabajos
    -- para no bloquear la inserción del documento
    PERFORM signing.invoke_ai_analysis_function(NEW.id);
  END IF;

  RETURN NEW;
END;
$$;

-- =====================================================
-- TRIGGER
-- =====================================================

-- Trigger para análisis IA cuando se crea un documento con requires_ai_review = true
DROP TRIGGER IF EXISTS trigger_ai_review ON signing.documents;
CREATE TRIGGER trigger_ai_review
  AFTER INSERT ON signing.documents
  FOR EACH ROW
  WHEN (NEW.requires_ai_review = true)
  EXECUTE FUNCTION signing.trigger_ai_review_on_insert();

-- =====================================================
-- COMENTARIOS
-- =====================================================

COMMENT ON FUNCTION signing.invoke_ai_analysis_function IS 'Invoca la Edge Function analyze-document-risks para analizar un documento';
COMMENT ON FUNCTION signing.trigger_ai_review_on_insert IS 'Trigger que inicia análisis por IA cuando se crea un documento con requires_ai_review = true';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Trigger de análisis IA configurado para signing';
END $$;
