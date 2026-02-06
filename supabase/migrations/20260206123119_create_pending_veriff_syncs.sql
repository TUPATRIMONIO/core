-- =====================================================
-- Migration: Create pending_veriff_syncs table
-- Description: Tabla temporal para queue de sincronización de Veriff vía webhook
-- =====================================================

CREATE TABLE IF NOT EXISTS pending_veriff_syncs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  veriff_session_id TEXT NOT NULL UNIQUE,
  event_type TEXT,
  event_payload JSONB,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'processed', 'failed')),
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- Índice para búsqueda rápida de pendientes
CREATE INDEX IF NOT EXISTS idx_pending_veriff_syncs_status 
  ON pending_veriff_syncs(status, created_at);

-- Índice para búsqueda por session ID
CREATE INDEX IF NOT EXISTS idx_pending_veriff_syncs_session 
  ON pending_veriff_syncs(veriff_session_id);

-- Comentarios
COMMENT ON TABLE pending_veriff_syncs IS 'Cola de sincronización de verificaciones de Veriff recibidas via webhook';
COMMENT ON COLUMN pending_veriff_syncs.veriff_session_id IS 'ID de sesión de Veriff';
COMMENT ON COLUMN pending_veriff_syncs.event_type IS 'Tipo de evento recibido (e.g., verification.decision)';
COMMENT ON COLUMN pending_veriff_syncs.event_payload IS 'Payload completo del webhook para debugging';
COMMENT ON COLUMN pending_veriff_syncs.status IS 'Estado: pending, processing, processed, failed';
COMMENT ON COLUMN pending_veriff_syncs.retry_count IS 'Número de reintentos en caso de error';
