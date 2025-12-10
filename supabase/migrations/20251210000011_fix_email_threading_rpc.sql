-- =====================================================
-- Migration: Fix Email Threading RPC
-- Description: Ensure get_ticket_for_gmail_thread works correctly by checking direct link
-- Created: 2025-12-10
-- =====================================================

SET search_path TO crm, core, public, extensions;

-- ============================================================================
-- FUNCIÓN MEJORADA: Obtener Ticket por Gmail Thread
-- ============================================================================

CREATE OR REPLACE FUNCTION crm.get_ticket_for_gmail_thread(
  p_organization_id UUID,
  p_gmail_thread_id TEXT
)
RETURNS UUID AS $$
DECLARE
  v_ticket_id UUID;
BEGIN
  -- 1. Intentar buscar ticket directamente vinculado al thread
  SELECT t.id INTO v_ticket_id
  FROM crm.tickets t
  JOIN crm.email_threads et ON t.source_email_thread_id = et.id
  WHERE et.gmail_thread_id = p_gmail_thread_id
    AND et.organization_id = p_organization_id
  LIMIT 1;

  IF v_ticket_id IS NOT NULL THEN
    RETURN v_ticket_id;
  END IF;

  -- 2. Fallback: Buscar en emails individuales si no hay link directo en tickets
  SELECT ticket_id INTO v_ticket_id
  FROM crm.emails
  WHERE thread_id = p_gmail_thread_id
    AND organization_id = p_organization_id
    AND ticket_id IS NOT NULL
  ORDER BY created_at ASC
  LIMIT 1;

  RETURN v_ticket_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION crm.get_ticket_for_gmail_thread IS 'Obtiene el ticket asociado a un thread de Gmail, verificando link directo y emails';

GRANT EXECUTE ON FUNCTION crm.get_ticket_for_gmail_thread(UUID, TEXT) TO authenticated;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Función crm.get_ticket_for_gmail_thread actualizada';
END $$;
