-- Migration: Add AI Review Retry Count
-- Description: Agrega contador de reintentos para revisión IA en documentos
-- Created: 2026-01-07

ALTER TABLE signing.documents 
ADD COLUMN IF NOT EXISTS ai_review_retry_count INT NOT NULL DEFAULT 0;

COMMENT ON COLUMN signing.documents.ai_review_retry_count IS 'Número de veces que se ha intentado la revisión IA para este documento';

-- Crear índice para facilitar la búsqueda de documentos estancados
CREATE INDEX IF NOT EXISTS idx_documents_ai_retry ON signing.documents(status, requires_ai_review, updated_at) 
WHERE status = 'pending_ai_review' AND requires_ai_review = true;

