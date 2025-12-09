-- =====================================================
-- Migration: Create public views for contacts and emails
-- Description: Expone las tablas crm.contacts y crm.emails como vistas públicas
-- Created: 2025-12-10
-- =====================================================

SET search_path TO crm, core, public, extensions;

-- =====================================================
-- VISTA PÚBLICA: contacts
-- =====================================================

CREATE OR REPLACE VIEW public.contacts AS
SELECT 
  c.id,
  c.organization_id,
  c.email,
  c.first_name,
  c.last_name,
  c.full_name,
  c.phone,
  c.mobile,
  c.website,
  c.company_name,
  c.job_title,
  c.industry,
  c.company_size,
  c.address,
  c.city,
  c.state,
  c.country,
  c.postal_code,
  c.status,
  c.source,
  c.assigned_to,
  c.tags,
  c.custom_fields,
  c.notes,
  c.last_contacted_at,
  c.last_activity_at,
  c.linkedin_url,
  c.twitter_handle,
  c.created_at,
  c.updated_at,
  c.created_by
FROM crm.contacts c;

-- =====================================================
-- VISTA PÚBLICA: emails
-- =====================================================

CREATE OR REPLACE VIEW public.emails AS
SELECT 
  e.id,
  e.organization_id,
  e.contact_id,
  e.gmail_message_id,
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

-- =====================================================
-- VISTA PÚBLICA: activities
-- =====================================================

CREATE OR REPLACE VIEW public.activities AS
SELECT 
  a.id,
  a.organization_id,
  a.contact_id,
  a.type,
  a.subject,
  a.description,
  a.performed_by,
  a.performed_at,
  a.duration_minutes,
  a.outcome,
  a.email_id,
  a.calendar_event_id,
  a.attachments,
  a.ticket_id,
  a.deal_id,
  a.created_at,
  a.updated_at
FROM crm.activities a;

-- =====================================================
-- PERMISOS
-- =====================================================

-- Contacts
GRANT SELECT ON public.contacts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contacts TO service_role;

-- Emails
GRANT SELECT ON public.emails TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.emails TO service_role;

-- Activities
GRANT SELECT ON public.activities TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.activities TO service_role;

-- =====================================================
-- COMENTARIOS
-- =====================================================

COMMENT ON VIEW public.contacts IS 'Vista pública de contactos del CRM';
COMMENT ON VIEW public.emails IS 'Vista pública de emails del CRM';
COMMENT ON VIEW public.activities IS 'Vista pública de actividades del CRM';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Vistas públicas creadas exitosamente';
  RAISE NOTICE '  - public.contacts';
  RAISE NOTICE '  - public.emails';
  RAISE NOTICE '  - public.activities';
END $$;

