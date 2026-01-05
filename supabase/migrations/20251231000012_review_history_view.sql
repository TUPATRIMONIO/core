-- =====================================================
-- Migration: Review History View
-- Description: Vista consolidada para historial de revisiones (IA y manuales)
-- Created: 2025-12-31
-- =====================================================

SET search_path TO signing, core, public, extensions;

-- =====================================================
-- VIEW: Historial consolidado de revisiones
-- =====================================================

CREATE OR REPLACE VIEW signing.review_history AS
SELECT 
  d.id as document_id,
  d.title,
  d.status as current_status,
  d.organization_id,
  d.created_at as document_created_at,
  d.updated_at as document_updated_at,
  -- Información de revisión IA (más reciente)
  ar.id as ai_review_id,
  ar.status as ai_review_status,
  ar.passed as ai_passed,
  ar.confidence_score,
  ar.completed_at as ai_reviewed_at,
  ar.review_type,
  -- Conteo de mensajes del equipo
  (SELECT COUNT(*) FROM signing.document_messages dm 
   WHERE dm.document_id = d.id) as message_count,
  -- Indicador si pasó por revisión manual
  CASE 
    WHEN d.status IN ('manual_review', 'needs_correction', 'rejected') 
      OR EXISTS (
        SELECT 1 FROM signing.document_messages dm 
        WHERE dm.document_id = d.id
      )
    THEN true 
    ELSE false 
  END as has_manual_review
FROM signing.documents d
LEFT JOIN LATERAL (
  SELECT ar.*
  FROM signing.ai_reviews ar
  WHERE ar.document_id = d.id
    AND ar.completed_at IS NOT NULL
  ORDER BY ar.completed_at DESC
  LIMIT 1
) ar ON true
WHERE ar.id IS NOT NULL 
   OR d.status IN ('manual_review', 'needs_correction', 'rejected', 'approved', 'pending_signature', 'signed', 'completed', 'pending_ai_review', 'ai_rejected')
ORDER BY COALESCE(ar.completed_at, d.updated_at) DESC;

-- =====================================================
-- GRANTS
-- =====================================================

GRANT SELECT ON signing.review_history TO authenticated;
GRANT SELECT ON signing.review_history TO service_role;

-- =====================================================
-- COMENTARIOS
-- =====================================================

COMMENT ON VIEW signing.review_history IS 
  'Vista consolidada del historial de revisiones de documentos, incluyendo revisiones IA y manuales';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Vista signing.review_history creada';
  RAISE NOTICE '';
  RAISE NOTICE 'Funcionalidad:';
  RAISE NOTICE '  - Consolida información de revisiones IA y manuales';
  RAISE NOTICE '  - Incluye conteo de mensajes y estado actual del documento';
  RAISE NOTICE '  - Ordenada por fecha de revisión más reciente';
END $$;

