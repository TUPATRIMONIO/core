-- =====================================================
-- Migration: Update public view for tickets
-- Description: Agrega source_email_thread_id a la vista pública
-- Created: 2025-12-10
-- =====================================================

SET search_path TO crm, billing, core, public, extensions;

-- =====================================================
-- VISTA PÚBLICA: tickets
-- =====================================================

CREATE OR REPLACE VIEW public.tickets AS
SELECT 
  t.id,
  t.organization_id,
  t.ticket_number,
  t.subject,
  t.description,
  t.status,
  t.priority,
  t.category,
  t.contact_id,
  t.company_id,
  t.related_deal_id,
  t.order_id,
  t.assigned_to,
  t.team_id,
  t.due_date,
  t.first_response_at,
  t.resolved_at,
  t.closed_at,
  t.tags,
  t.custom_fields,
  t.created_at,
  t.updated_at,
  t.created_by,
  t.source_email_thread_id
FROM crm.tickets t;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Vista pública public.tickets actualizada con source_email_thread_id';
END $$;
