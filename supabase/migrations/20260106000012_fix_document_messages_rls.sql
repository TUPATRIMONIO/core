-- =====================================================
-- Migration: Fix RLS for Document Messages Access
-- Description: Allow document_reviewer and platform_admin to manage messages
-- Created: 2026-01-06
-- =====================================================

-- Permitir que document_reviewer y platform_admin puedan ver todos los mensajes
DROP POLICY IF EXISTS "Document reviewers can view all messages" ON signing.document_messages;
CREATE POLICY "Document reviewers can view all messages"
ON signing.document_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM core.organization_users ou
    JOIN core.roles r ON r.id = ou.role_id
    WHERE ou.user_id = auth.uid()
      AND ou.status = 'active'
      AND (
        r.slug = 'document_reviewer'
        OR r.level >= 9  -- platform_admin
      )
  )
);

-- Permitir que document_reviewer y platform_admin puedan insertar mensajes en cualquier documento
DROP POLICY IF EXISTS "Document reviewers can insert messages everywhere" ON signing.document_messages;
CREATE POLICY "Document reviewers can insert messages everywhere"
ON signing.document_messages FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM core.organization_users ou
    JOIN core.roles r ON r.id = ou.role_id
    WHERE ou.user_id = auth.uid()
      AND ou.status = 'active'
      AND (
        r.slug = 'document_reviewer'
        OR r.level >= 9  -- platform_admin
      )
  )
);

DO $$
BEGIN
  RAISE NOTICE '✅ RLS policies actualizadas para document_messages';
END $$;




