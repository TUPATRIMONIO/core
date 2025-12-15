-- =====================================================
-- Migration: Disable signing AI trigger
-- Description: Desactiva trigger_ai_review para que la IA se ejecute solo desde el backend (API route)
-- Created: 2025-12-16
-- =====================================================

SET search_path TO signing, core, public, extensions;

-- Desactivar trigger automático que estaba causando errores al crear documentos
DROP TRIGGER IF EXISTS trigger_ai_review ON signing.documents;

DO $$
BEGIN
  RAISE NOTICE '✅ trigger_ai_review desactivado (IA se invoca desde API)';
END $$;



