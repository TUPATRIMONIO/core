-- =====================================================
-- Migration: Support Tickets - Fix Permissions
-- Description: Otorga permisos necesarios para secuencias y vistas
-- Created: 2026-01-21
-- =====================================================

-- Permisos en la secuencia para el schema communications
GRANT USAGE ON SEQUENCE communications.support_ticket_seq TO authenticated;
GRANT USAGE ON SEQUENCE communications.support_ticket_seq TO service_role;

-- Hacer que la función generadora sea SECURITY DEFINER
CREATE OR REPLACE FUNCTION communications.generate_support_ticket_number()
RETURNS TEXT AS $$
BEGIN
  RETURN 'TP-SUP-' || LPAD(NEXTVAL('communications.support_ticket_seq')::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Permisos en el schema communications
GRANT USAGE ON SCHEMA communications TO authenticated;
GRANT USAGE ON SCHEMA communications TO service_role;

-- Permisos en las tablas para service_role (bypass RLS)
GRANT ALL ON communications.support_tickets TO service_role;
GRANT ALL ON communications.ticket_messages TO service_role;

-- Permisos en las vistas para operaciones CRUD
GRANT SELECT, INSERT, UPDATE, DELETE ON public.support_tickets TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ticket_messages TO service_role;

-- Asegurar que las vistas pueden insertar en las tablas subyacentes
-- Crear reglas INSTEAD OF para las vistas

-- Regla para INSERT en support_tickets
CREATE OR REPLACE RULE support_tickets_insert AS
ON INSERT TO public.support_tickets
DO INSTEAD
INSERT INTO communications.support_tickets (
  id, ticket_number, user_id, user_email, source, source_feedback_id,
  subject, status, priority, assigned_to, organization_id,
  created_at, updated_at, resolved_at
) VALUES (
  COALESCE(NEW.id, gen_random_uuid()),
  COALESCE(NEW.ticket_number, communications.generate_support_ticket_number()),
  NEW.user_id, NEW.user_email, NEW.source, NEW.source_feedback_id,
  NEW.subject, NEW.status, NEW.priority, NEW.assigned_to, NEW.organization_id,
  COALESCE(NEW.created_at, NOW()), COALESCE(NEW.updated_at, NOW()), NEW.resolved_at
)
RETURNING *;

-- Regla para UPDATE en support_tickets
CREATE OR REPLACE RULE support_tickets_update AS
ON UPDATE TO public.support_tickets
DO INSTEAD
UPDATE communications.support_tickets SET
  user_id = NEW.user_id,
  user_email = NEW.user_email,
  source = NEW.source,
  source_feedback_id = NEW.source_feedback_id,
  subject = NEW.subject,
  status = NEW.status,
  priority = NEW.priority,
  assigned_to = NEW.assigned_to,
  organization_id = NEW.organization_id,
  updated_at = NOW(),
  resolved_at = NEW.resolved_at
WHERE id = OLD.id
RETURNING *;

-- Regla para INSERT en ticket_messages
CREATE OR REPLACE RULE ticket_messages_insert AS
ON INSERT TO public.ticket_messages
DO INSTEAD
INSERT INTO communications.ticket_messages (
  id, ticket_id, sender_type, sender_id,
  message_text, message_html, is_internal, email_sent_at, created_at
) VALUES (
  COALESCE(NEW.id, gen_random_uuid()),
  NEW.ticket_id, NEW.sender_type, NEW.sender_id,
  NEW.message_text, NEW.message_html, NEW.is_internal, NEW.email_sent_at,
  COALESCE(NEW.created_at, NOW())
)
RETURNING *;

DO $$
BEGIN
  RAISE NOTICE '✅ Support tickets permissions fixed';
END $$;
