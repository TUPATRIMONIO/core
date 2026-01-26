-- =====================================================
-- Migration: Support Tickets
-- Description: Sistema de tickets de soporte con mensajes y RLS
-- Created: 2026-01-19
-- =====================================================

SET search_path TO communications, core, public, extensions;

CREATE SCHEMA IF NOT EXISTS communications;

-- =====================================================
-- Secuencia y función para ticket_number
-- =====================================================

CREATE SEQUENCE IF NOT EXISTS communications.support_ticket_seq;

CREATE OR REPLACE FUNCTION communications.generate_support_ticket_number()
RETURNS TEXT AS $$
BEGIN
  RETURN 'TP-SUP-' || LPAD(NEXTVAL('communications.support_ticket_seq')::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Tabla: support_tickets
-- =====================================================

CREATE TABLE IF NOT EXISTS communications.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number TEXT NOT NULL DEFAULT communications.generate_support_ticket_number(),

  -- Usuario
  user_id UUID REFERENCES core.users(id),
  user_email TEXT CHECK (user_email IS NULL OR user_email ~ '^[^@]+@[^@]+\.[^@]+$'),

  -- Origen
  source TEXT NOT NULL DEFAULT 'user_created'
    CHECK (source IN ('feedback', 'user_created', 'admin_created')),
  source_feedback_id UUID REFERENCES communications.user_feedback(id) ON DELETE SET NULL,

  -- Contenido
  subject TEXT NOT NULL CHECK (length(subject) BETWEEN 3 AND 200),
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'pending', 'resolved', 'closed')),
  priority TEXT NOT NULL DEFAULT 'medium'
    CHECK (priority IN ('low', 'medium', 'high')),

  -- Asignación
  assigned_to UUID REFERENCES core.users(id),
  organization_id UUID REFERENCES core.organizations(id),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,

  CONSTRAINT support_ticket_requires_contact CHECK (
    user_id IS NOT NULL OR user_email IS NOT NULL
  )
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON communications.support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON communications.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON communications.support_tickets(created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_support_tickets_number ON communications.support_tickets(ticket_number);

-- =====================================================
-- Tabla: ticket_messages
-- =====================================================

CREATE TABLE IF NOT EXISTS communications.ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES communications.support_tickets(id) ON DELETE CASCADE,

  sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'admin', 'system')),
  sender_id UUID REFERENCES core.users(id),

  message_text TEXT NOT NULL CHECK (length(message_text) BETWEEN 1 AND 5000),
  message_html TEXT,
  is_internal BOOLEAN NOT NULL DEFAULT false,
  email_sent_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket_id ON communications.ticket_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_created_at ON communications.ticket_messages(created_at);

-- =====================================================
-- Trigger updated_at para tickets
-- =====================================================

CREATE OR REPLACE FUNCTION communications.handle_support_ticket_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_support_ticket_updated_at
  BEFORE UPDATE ON communications.support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION communications.handle_support_ticket_updated_at();

-- Actualizar ticket al recibir mensaje
CREATE OR REPLACE FUNCTION communications.touch_support_ticket_on_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE communications.support_tickets
  SET updated_at = NOW()
  WHERE id = NEW.ticket_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_support_ticket_touch_on_message
  AFTER INSERT ON communications.ticket_messages
  FOR EACH ROW
  EXECUTE FUNCTION communications.touch_support_ticket_on_message();

-- =====================================================
-- RLS
-- =====================================================

ALTER TABLE communications.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE communications.ticket_messages ENABLE ROW LEVEL SECURITY;

-- Usuarios pueden ver sus tickets
CREATE POLICY "Users can view their support tickets"
ON communications.support_tickets FOR SELECT
USING (
  (user_id = auth.uid())
  OR (user_id IS NULL AND user_email = (auth.jwt() ->> 'email'))
  OR EXISTS (
    SELECT 1
    FROM core.organization_users ou
    JOIN core.roles r ON r.id = ou.role_id
    WHERE ou.user_id = auth.uid()
      AND ou.status = 'active'
      AND r.level >= 9
  )
);

-- Usuarios pueden crear tickets propios
CREATE POLICY "Users can create support tickets"
ON communications.support_tickets FOR INSERT
WITH CHECK (
  (
    (user_id = auth.uid())
    OR (user_id IS NULL AND user_email = (auth.jwt() ->> 'email'))
  )
  AND source IN ('feedback', 'user_created')
);

-- Solo admins pueden actualizar tickets
CREATE POLICY "Admins can update support tickets"
ON communications.support_tickets FOR UPDATE
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

-- Mensajes: usuarios pueden ver mensajes de sus tickets (no internos)
CREATE POLICY "Users can view their ticket messages"
ON communications.ticket_messages FOR SELECT
USING (
  (
    NOT is_internal
    AND EXISTS (
      SELECT 1
      FROM communications.support_tickets t
      WHERE t.id = ticket_id
        AND (
          t.user_id = auth.uid()
          OR (t.user_id IS NULL AND t.user_email = (auth.jwt() ->> 'email'))
        )
    )
  )
  OR EXISTS (
    SELECT 1
    FROM core.organization_users ou
    JOIN core.roles r ON r.id = ou.role_id
    WHERE ou.user_id = auth.uid()
      AND ou.status = 'active'
      AND r.level >= 9
  )
);

-- Usuarios pueden crear mensajes en sus tickets
CREATE POLICY "Users can create ticket messages"
ON communications.ticket_messages FOR INSERT
WITH CHECK (
  sender_type = 'user'
  AND sender_id = auth.uid()
  AND is_internal = false
  AND EXISTS (
    SELECT 1
    FROM communications.support_tickets t
    WHERE t.id = ticket_id
      AND (
        t.user_id = auth.uid()
        OR (t.user_id IS NULL AND t.user_email = (auth.jwt() ->> 'email'))
      )
  )
);

-- Admins pueden insertar mensajes
CREATE POLICY "Admins can create ticket messages"
ON communications.ticket_messages FOR INSERT
WITH CHECK (
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
-- Vistas públicas (PostgREST)
-- =====================================================

CREATE OR REPLACE VIEW public.support_tickets AS
SELECT * FROM communications.support_tickets;

CREATE OR REPLACE VIEW public.ticket_messages AS
SELECT * FROM communications.ticket_messages;

GRANT SELECT, INSERT, UPDATE ON public.support_tickets TO authenticated;
GRANT SELECT, INSERT ON public.ticket_messages TO authenticated;
