-- =====================================================
-- Migration: Update CRM ticket_messages RLS
-- Description: Permitir que usuarios vean mensajes no internos de sus tickets
-- Created: 2026-01-21
-- =====================================================

-- Reemplazar politica de lectura de mensajes
DROP POLICY IF EXISTS "Users can view their own ticket messages in CRM" ON crm.ticket_messages;

CREATE POLICY "Users can view their own ticket messages in CRM"
ON crm.ticket_messages FOR SELECT
USING (
  (
    NOT is_internal
    AND EXISTS (
      SELECT 1
      FROM crm.tickets t
      WHERE t.id = ticket_id
        AND (
          t.user_id = auth.uid()
          OR (t.user_id IS NULL AND t.user_email = (auth.jwt() ->> 'email'))
        )
    )
  )
  OR EXISTS (
    SELECT 1
    FROM crm.tickets t
    JOIN core.organization_users ou ON ou.organization_id = t.organization_id
    WHERE t.id = ticket_id
      AND ou.user_id = auth.uid()
      AND ou.status = 'active'
  )
);
