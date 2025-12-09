-- =====================================================
-- Migration: Create public view for tickets
-- Description: Expone la tabla crm.tickets como vista pública para acceso desde el cliente Supabase
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
  t.created_by
FROM crm.tickets t;

-- =====================================================
-- PERMISOS
-- =====================================================

-- Permitir lectura a usuarios autenticados
GRANT SELECT ON public.tickets TO authenticated;

-- Permitir todas las operaciones a service_role
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tickets TO service_role;

-- =====================================================
-- COMENTARIOS
-- =====================================================

COMMENT ON VIEW public.tickets IS 'Vista pública de tickets del CRM';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Vista pública public.tickets creada exitosamente';
  RAISE NOTICE 'La tabla crm.tickets ahora es accesible desde el cliente Supabase';
END $$;

