-- =====================================================
-- Migration: Add message_id column to emails table
-- Description: Agrega columna para guardar el Message-ID original del header del email
-- Created: 2025-12-11
-- =====================================================

SET search_path TO crm, core, public, extensions;

-- =====================================================
-- AGREGAR COLUMNA message_id
-- =====================================================

ALTER TABLE crm.emails ADD COLUMN IF NOT EXISTS message_id TEXT;

COMMENT ON COLUMN crm.emails.message_id IS 'Message-ID original del header del email (diferente de gmail_message_id, usado para threading)';

-- =====================================================
-- ÍNDICE para búsquedas rápidas por message_id
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_emails_message_id ON crm.emails(organization_id, message_id) WHERE message_id IS NOT NULL;

-- =====================================================
-- ACTUALIZAR VISTA PÚBLICA
-- =====================================================

-- Eliminar la vista existente primero para evitar conflictos con el orden de columnas
-- Usar CASCADE para eliminar dependencias (políticas RLS, etc.) que se recrearán después
DROP VIEW IF EXISTS public.emails CASCADE;

CREATE VIEW public.emails AS
SELECT 
  e.id,
  e.organization_id,
  e.contact_id,
  e.gmail_message_id,
  e.message_id,
  e.thread_id,
  e.from_email,
  e.to_emails,
  e.cc_emails,
  e.bcc_emails,
  e.subject,
  e.body_text,
  e.body_html,
  e.direction,
  e.status,
  e.sent_at,
  e.delivered_at,
  e.opened_at,
  e.replied_at,
  e.attachments,
  e.sent_by,
  e.created_at,
  e.updated_at,
  e.ticket_id,
  e.sent_from_account_id,
  e.received_in_account_id,
  e.thread_id_crm,
  e.parent_email_id,
  e.is_read,
  e.labels,
  e.has_attachments,
  e.snippet,
  e.in_reply_to,
  e.references
FROM crm.emails e;

-- Re-aplicar permisos (los mismos que tenía la vista original)
GRANT SELECT ON public.emails TO authenticated;
GRANT SELECT ON public.emails TO service_role;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Columna message_id agregada a crm.emails';
  RAISE NOTICE '✅ Vista pública actualizada';
END $$;

