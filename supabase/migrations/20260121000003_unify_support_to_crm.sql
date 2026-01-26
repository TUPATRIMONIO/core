-- =====================================================
-- Migration: Unify Support Tickets to CRM
-- Description: Migra tickets de soporte a la tabla CRM y unifica sistema
-- Created: 2026-01-21
-- =====================================================

SET search_path TO crm, core, public, extensions;

-- 1. Agregar columnas necesarias a crm.tickets para compatibilidad con soporte
ALTER TABLE crm.tickets ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES core.users(id);
ALTER TABLE crm.tickets ADD COLUMN IF NOT EXISTS user_email TEXT;
ALTER TABLE crm.tickets ADD COLUMN IF NOT EXISTS source TEXT;
ALTER TABLE crm.tickets ADD COLUMN IF NOT EXISTS source_feedback_id UUID;

-- 2. Migrar tickets existentes de communications.support_tickets a crm.tickets
-- Nota: Solo si existe la tabla origen
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'communications' AND table_name = 'support_tickets') THEN
        INSERT INTO crm.tickets (
            organization_id,
            ticket_number,
            subject,
            description,
            status,
            priority,
            assigned_to,
            created_at,
            updated_at,
            resolved_at,
            user_id,
            user_email
        )
        SELECT 
            organization_id,
            ticket_number,
            subject,
            COALESCE((SELECT message_text FROM communications.ticket_messages WHERE ticket_id = st.id ORDER BY created_at ASC LIMIT 1), subject) as description,
            CASE 
                WHEN status = 'open' THEN 'open'::crm.ticket_status
                WHEN status = 'pending' THEN 'waiting'::crm.ticket_status
                WHEN status = 'resolved' THEN 'resolved'::crm.ticket_status
                WHEN status = 'closed' THEN 'closed'::crm.ticket_status
                ELSE 'new'::crm.ticket_status
            END as status,
            CASE 
                WHEN priority = 'low' THEN 'low'::crm.ticket_priority
                WHEN priority = 'medium' THEN 'medium'::crm.ticket_priority
                WHEN priority = 'high' THEN 'high'::crm.ticket_priority
                ELSE 'medium'::crm.ticket_priority
            END as priority,
            assigned_to,
            created_at,
            updated_at,
            resolved_at,
            user_id,
            user_email
        FROM communications.support_tickets st
        ON CONFLICT (organization_id, ticket_number) DO NOTHING;
    END IF;
END $$;

-- 3. Migrar mensajes existentes
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'communications' AND table_name = 'ticket_messages') THEN
        INSERT INTO crm.ticket_messages (
            ticket_id,
            sender_type,
            sender_id,
            message_text,
            message_html,
            is_internal,
            created_at
        )
        SELECT 
            (SELECT id FROM crm.tickets WHERE ticket_number = (SELECT ticket_number FROM communications.support_tickets WHERE id = tm.ticket_id)),
            sender_type,
            sender_id,
            message_text,
            message_html,
            is_internal,
            created_at
        FROM communications.ticket_messages tm
        WHERE EXISTS (SELECT 1 FROM crm.tickets WHERE ticket_number = (SELECT ticket_number FROM communications.support_tickets WHERE id = tm.ticket_id))
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- 4. Actualizar RLS en crm.tickets para que usuarios vean sus propios tickets
CREATE POLICY "Users can view their own support tickets in CRM"
ON crm.tickets FOR SELECT
USING (
  (user_id = auth.uid())
  OR (user_id IS NULL AND user_email = (auth.jwt() ->> 'email'))
);

-- 5. Actualizar RLS en crm.ticket_messages
CREATE POLICY "Users can view their own ticket messages in CRM"
ON crm.ticket_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM crm.tickets t
    WHERE t.id = ticket_id
      AND (
        t.user_id = auth.uid()
        OR (t.user_id IS NULL AND t.user_email = (auth.jwt() ->> 'email'))
      )
  )
);

-- 6. Crear asociaciones automáticas para tickets migrados que tengan user_id
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'crm' AND table_name = 'ticket_users') THEN
        INSERT INTO crm.ticket_users (ticket_id, user_id)
        SELECT id, user_id
        FROM crm.tickets
        WHERE user_id IS NOT NULL
          AND source IN ('feedback', 'user_created')
          AND NOT EXISTS (
            SELECT 1 FROM crm.ticket_users WHERE ticket_id = crm.tickets.id AND user_id = crm.tickets.user_id
          )
        ON CONFLICT DO NOTHING;
    END IF;
END $$;
