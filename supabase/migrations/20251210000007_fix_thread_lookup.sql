-- =====================================================
-- Migration: Fix thread lookup for email deduplication
-- Description: Crea función RPC robusta para buscar tickets por gmail thread_id
-- Created: 2025-12-10
-- =====================================================

SET search_path TO crm, core, public, extensions;

-- =====================================================
-- FUNCIÓN: get_ticket_for_gmail_thread
-- Busca directamente en crm.emails por thread_id
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_ticket_for_gmail_thread(
  p_organization_id UUID,
  p_gmail_thread_id TEXT
)
RETURNS UUID AS $$
DECLARE
  v_ticket_id UUID;
BEGIN
  -- Buscar directamente en crm.emails por thread_id (gmail thread id)
  SELECT e.ticket_id INTO v_ticket_id
  FROM crm.emails e
  WHERE e.organization_id = p_organization_id
    AND e.thread_id = p_gmail_thread_id
    AND e.ticket_id IS NOT NULL
  ORDER BY e.created_at ASC
  LIMIT 1;

  RETURN v_ticket_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_ticket_for_gmail_thread(UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_ticket_for_gmail_thread(UUID, TEXT) TO authenticated;

-- =====================================================
-- FUNCIÓN: get_ticket_for_contact_subject
-- Busca ticket por contacto y subject
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_ticket_for_contact_subject(
  p_organization_id UUID,
  p_contact_email TEXT,
  p_subject TEXT
)
RETURNS UUID AS $$
DECLARE
  v_ticket_id UUID;
  v_contact_id UUID;
  v_clean_subject TEXT;
BEGIN
  -- Buscar contacto
  SELECT id INTO v_contact_id
  FROM crm.contacts
  WHERE organization_id = p_organization_id
    AND LOWER(email) = LOWER(p_contact_email)
  LIMIT 1;

  IF v_contact_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Limpiar subject (quitar Re:, Fwd:, etc.)
  v_clean_subject := TRIM(REGEXP_REPLACE(p_subject, '^(Re:|Fwd:|RE:|FW:|re:|fwd:)\s*', '', 'gi'));

  -- Buscar ticket con subject similar del mismo contacto
  SELECT t.id INTO v_ticket_id
  FROM crm.tickets t
  WHERE t.organization_id = p_organization_id
    AND t.contact_id = v_contact_id
    AND (
      LOWER(TRIM(REGEXP_REPLACE(t.subject, '^(Re:|Fwd:|RE:|FW:|re:|fwd:)\s*', '', 'gi'))) = LOWER(v_clean_subject)
      OR LOWER(t.subject) LIKE '%' || LOWER(v_clean_subject) || '%'
      OR LOWER(v_clean_subject) LIKE '%' || LOWER(TRIM(REGEXP_REPLACE(t.subject, '^(Re:|Fwd:|RE:|FW:|re:|fwd:)\s*', '', 'gi'))) || '%'
    )
  ORDER BY t.created_at ASC
  LIMIT 1;

  RETURN v_ticket_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_ticket_for_contact_subject(UUID, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_ticket_for_contact_subject(UUID, TEXT, TEXT) TO authenticated;

-- =====================================================
-- LIMPIAR DUPLICADOS ACTUALES
-- =====================================================

-- Consolidar emails por thread al ticket más antiguo
WITH first_ticket AS (
  SELECT DISTINCT ON (thread_id)
    thread_id,
    ticket_id as keep_ticket_id
  FROM crm.emails
  WHERE thread_id IS NOT NULL AND ticket_id IS NOT NULL
  ORDER BY thread_id, created_at ASC
)
UPDATE crm.emails e
SET ticket_id = ft.keep_ticket_id
FROM first_ticket ft
WHERE e.thread_id = ft.thread_id
  AND e.ticket_id IS NOT NULL
  AND e.ticket_id != ft.keep_ticket_id;

-- Eliminar tickets huérfanos (sin emails)
DELETE FROM crm.activities WHERE ticket_id IN (
  SELECT t.id FROM crm.tickets t
  WHERE NOT EXISTS (SELECT 1 FROM crm.emails e WHERE e.ticket_id = t.id)
);

DELETE FROM crm.tickets t
WHERE NOT EXISTS (SELECT 1 FROM crm.emails e WHERE e.ticket_id = t.id);

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
DECLARE
  v_count INT;
BEGIN 
  SELECT COUNT(*) INTO v_count FROM crm.tickets;
  RAISE NOTICE '✅ Funciones RPC creadas para búsqueda de threads';
  RAISE NOTICE '✅ Duplicados consolidados. Tickets restantes: %', v_count;
END $$;


