-- =====================================================
-- Migration: CRM Ticket Messages
-- Description: Mensajes conversacionales para tickets CRM
-- Created: 2026-01-21
-- =====================================================

SET search_path TO crm, core, public, extensions;

-- =====================================================
-- Tabla: ticket_messages
-- =====================================================

CREATE TABLE IF NOT EXISTS crm.ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES crm.tickets(id) ON DELETE CASCADE,

  sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'admin', 'system')),
  sender_id UUID REFERENCES core.users(id),

  message_text TEXT NOT NULL CHECK (length(message_text) BETWEEN 1 AND 5000),
  message_html TEXT,
  is_internal BOOLEAN NOT NULL DEFAULT false,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_ticket_messages_ticket_id
  ON crm.ticket_messages(ticket_id);

CREATE INDEX IF NOT EXISTS idx_crm_ticket_messages_created_at
  ON crm.ticket_messages(created_at);

-- =====================================================
-- Row Level Security
-- =====================================================

ALTER TABLE crm.ticket_messages ENABLE ROW LEVEL SECURITY;

-- Usuarios pueden ver mensajes de tickets de su organización
CREATE POLICY "Users can view own org ticket messages"
ON crm.ticket_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM crm.tickets t
    JOIN core.organization_users ou ON ou.organization_id = t.organization_id
    WHERE t.id = ticket_id
      AND ou.user_id = auth.uid()
      AND ou.status = 'active'
  )
);

-- Usuarios pueden crear mensajes en tickets de su organización
CREATE POLICY "Users can create ticket messages in own org"
ON crm.ticket_messages FOR INSERT
WITH CHECK (
  sender_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM crm.tickets t
    JOIN core.organization_users ou ON ou.organization_id = t.organization_id
    WHERE t.id = ticket_id
      AND ou.user_id = auth.uid()
      AND ou.status = 'active'
  )
);

-- Usuarios pueden actualizar mensajes de su organización
CREATE POLICY "Users can update own org ticket messages"
ON crm.ticket_messages FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM crm.tickets t
    JOIN core.organization_users ou ON ou.organization_id = t.organization_id
    WHERE t.id = ticket_id
      AND ou.user_id = auth.uid()
      AND ou.status = 'active'
  )
);

-- Admins de organización pueden eliminar mensajes
CREATE POLICY "Org admins can delete ticket messages"
ON crm.ticket_messages FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM crm.tickets t
    JOIN core.organization_users ou ON ou.organization_id = t.organization_id
    JOIN core.roles r ON r.id = ou.role_id
    WHERE t.id = ticket_id
      AND ou.user_id = auth.uid()
      AND ou.status = 'active'
      AND r.level >= 7
  )
);
