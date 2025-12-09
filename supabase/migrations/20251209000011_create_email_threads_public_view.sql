-- =====================================================
-- Migration: Create public view for email_threads
-- Description: Expone la tabla crm.email_threads como vista pública
-- Created: 2025-12-10
-- =====================================================

SET search_path TO crm, core, public, extensions;

-- =====================================================
-- VISTA PÚBLICA: email_threads
-- =====================================================

CREATE OR REPLACE VIEW public.email_threads AS
SELECT 
  et.id,
  et.organization_id,
  et.gmail_thread_id,
  et.contact_id,
  et.company_id,
  et.deal_id,
  et.subject,
  et.snippet,
  et.participants,
  et.status,
  et.is_read,
  et.has_attachments,
  et.email_count,
  et.last_email_at,
  et.last_email_from,
  et.labels,
  et.created_at,
  et.updated_at
FROM crm.email_threads et;

-- =====================================================
-- PERMISOS
-- =====================================================

-- Permitir lectura a usuarios autenticados
GRANT SELECT ON public.email_threads TO authenticated;

-- Permitir todas las operaciones a service_role
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_threads TO service_role;

-- =====================================================
-- COMENTARIOS
-- =====================================================

COMMENT ON VIEW public.email_threads IS 'Vista pública de hilos de conversación de emails';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Vista pública public.email_threads creada exitosamente';
END $$;

