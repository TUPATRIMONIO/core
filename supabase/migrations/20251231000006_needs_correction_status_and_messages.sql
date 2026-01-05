-- =====================================================
-- Migration: Add needs_correction status and document_messages table
-- Description: Agrega estado needs_correction al ENUM y tabla para mensajes cliente-equipo
-- Created: 2025-12-31
-- =====================================================

SET search_path TO signing, core, public, extensions;

-- =====================================================
-- 1. Agregar estado needs_correction al ENUM
-- =====================================================

-- En PostgreSQL, para agregar un valor a un ENUM existente:
ALTER TYPE signing.document_status ADD VALUE IF NOT EXISTS 'needs_correction';

-- =====================================================
-- 2. Crear tabla document_messages
-- =====================================================

CREATE TABLE IF NOT EXISTS signing.document_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES signing.documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES core.users(id),
  
  -- Contenido del mensaje
  message TEXT NOT NULL CHECK (length(message) >= 1 AND length(message) <= 5000),
  
  -- Si es mensaje interno (solo visible para equipo)
  is_internal BOOLEAN NOT NULL DEFAULT false,
  
  -- Archivos adjuntos (paths en storage)
  attachments JSONB NOT NULL DEFAULT '[]',
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_document_messages_document ON signing.document_messages(document_id);
CREATE INDEX idx_document_messages_user ON signing.document_messages(user_id);
CREATE INDEX idx_document_messages_created ON signing.document_messages(created_at DESC);

-- Trigger para updated_at
CREATE TRIGGER update_document_messages_updated_at
  BEFORE UPDATE ON signing.document_messages
  FOR EACH ROW
  EXECUTE FUNCTION signing.update_updated_at();

-- =====================================================
-- 3. RLS para document_messages
-- =====================================================

ALTER TABLE signing.document_messages ENABLE ROW LEVEL SECURITY;

-- Política: Usuarios pueden ver mensajes de documentos de su organización
-- Mensajes internos solo visibles para document_reviewer o platform_admin
CREATE POLICY "Users can view messages from their org documents"
  ON signing.document_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM signing.documents d
      JOIN core.organization_users ou ON ou.organization_id = d.organization_id
      WHERE d.id = document_messages.document_id
        AND ou.user_id = auth.uid()
        AND ou.status = 'active'
        AND (
          NOT document_messages.is_internal
          OR EXISTS (
            SELECT 1
            FROM core.organization_users ou2
            JOIN core.roles r ON r.id = ou2.role_id
            WHERE ou2.user_id = auth.uid()
              AND ou2.organization_id = d.organization_id
              AND ou2.status = 'active'
              AND (
                r.slug = 'document_reviewer'
                OR r.level >= 9
              )
          )
        )
    )
  );

-- Política: Usuarios pueden crear mensajes en documentos de su organización
CREATE POLICY "Users can create messages in their org documents"
  ON signing.document_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM signing.documents d
      JOIN core.organization_users ou ON ou.organization_id = d.organization_id
      WHERE d.id = document_messages.document_id
        AND ou.user_id = auth.uid()
        AND ou.status = 'active'
    )
    AND user_id = auth.uid()
  );

-- Política: Solo el autor puede actualizar sus mensajes
CREATE POLICY "Users can update their own messages"
  ON signing.document_messages FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- =====================================================
-- 4. Vista pública para document_messages
-- =====================================================

CREATE OR REPLACE VIEW public.signing_document_messages AS
SELECT 
  m.id,
  m.document_id,
  m.user_id,
  m.message,
  m.is_internal,
  m.attachments,
  m.created_at,
  m.updated_at
FROM signing.document_messages m;

GRANT SELECT, INSERT, UPDATE ON public.signing_document_messages TO authenticated;
GRANT SELECT ON public.signing_document_messages TO anon;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Estado needs_correction agregado y tabla document_messages creada';
END $$;

