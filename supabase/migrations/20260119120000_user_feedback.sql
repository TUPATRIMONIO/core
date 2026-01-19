-- =====================================================
-- Migration: User Feedback
-- Description: Tabla para reportes de errores y mejoras (público + admin)
-- Created: 2026-01-19
-- =====================================================

SET search_path TO communications, core, public, extensions;

-- Asegurar schema
CREATE SCHEMA IF NOT EXISTS communications;

-- =====================================================
-- Tabla: user_feedback
-- =====================================================

CREATE TABLE IF NOT EXISTS communications.user_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Tipo de feedback
  type TEXT NOT NULL CHECK (type IN ('error', 'improvement')),

  -- Contenido
  title TEXT NOT NULL CHECK (length(title) BETWEEN 3 AND 200),
  description TEXT NOT NULL CHECK (length(description) BETWEEN 10 AND 5000),
  url TEXT,
  user_agent TEXT,

  -- Usuario (opcional para anonimos)
  user_id UUID REFERENCES core.users(id),
  user_email TEXT CHECK (user_email IS NULL OR user_email ~ '^[^@]+@[^@]+\.[^@]+$'),

  -- Estado y gestion
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'rejected')),
  admin_response TEXT,
  responded_by UUID REFERENCES core.users(id),
  responded_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT feedback_requires_contact CHECK (
    user_id IS NOT NULL OR user_email IS NOT NULL
  )
);

CREATE INDEX IF NOT EXISTS idx_user_feedback_status ON communications.user_feedback(status);
CREATE INDEX IF NOT EXISTS idx_user_feedback_type ON communications.user_feedback(type);
CREATE INDEX IF NOT EXISTS idx_user_feedback_created_at ON communications.user_feedback(created_at DESC);

-- =====================================================
-- RLS
-- =====================================================

ALTER TABLE communications.user_feedback ENABLE ROW LEVEL SECURITY;

-- Insert público (anon o autenticado)
CREATE POLICY "Anyone can submit feedback"
ON communications.user_feedback FOR INSERT
WITH CHECK (
  user_id IS NULL OR user_id = auth.uid()
);

-- Lectura solo admins de plataforma
CREATE POLICY "Platform admins can view feedback"
ON communications.user_feedback FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM core.organization_users ou
    JOIN core.roles r ON r.id = ou.role_id
    WHERE ou.user_id = auth.uid()
      AND ou.status = 'active'
      AND r.level >= 9
  )
);

-- Actualización solo admins de plataforma
CREATE POLICY "Platform admins can update feedback"
ON communications.user_feedback FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM core.organization_users ou
    JOIN core.roles r ON r.id = ou.role_id
    WHERE ou.user_id = auth.uid()
      AND ou.status = 'active'
      AND r.level >= 9
  )
);

-- Eliminación solo admins de plataforma
CREATE POLICY "Platform admins can delete feedback"
ON communications.user_feedback FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM core.organization_users ou
    JOIN core.roles r ON r.id = ou.role_id
    WHERE ou.user_id = auth.uid()
      AND ou.status = 'active'
      AND r.level >= 9
  )
);

-- =====================================================
-- Trigger updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION communications.handle_user_feedback_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_user_feedback_updated_at
  BEFORE UPDATE ON communications.user_feedback
  FOR EACH ROW
  EXECUTE FUNCTION communications.handle_user_feedback_updated_at();

-- =====================================================
-- Permisos
-- =====================================================

GRANT USAGE ON SCHEMA communications TO anon, authenticated;
GRANT INSERT ON communications.user_feedback TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON communications.user_feedback TO authenticated;
