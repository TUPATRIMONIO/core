/**
 * Migración: Mejorar Vinculación de Emails Entrantes a Tickets
 * 
 * Mejoras:
 * - Búsqueda por thread_id, gmail_message_id e in_reply_to
 * - Logs de depuración
 * - Búsqueda más robusta
 * 
 * Fecha: 18 Noviembre 2025
 */

SET search_path TO crm, core, public, extensions;

-- ============================================================================
-- FUNCIÓN: Vincular Email Entrante a Ticket (Mejorada)
-- ============================================================================

CREATE OR REPLACE FUNCTION crm.link_inbound_email_to_ticket()
RETURNS TRIGGER AS $$
DECLARE
  v_ticket_id UUID;
  v_message_id TEXT;
BEGIN
  -- Solo procesar emails entrantes
  IF NEW.direction != 'inbound' THEN
    RETURN NEW;
  END IF;
  
  -- Si ya tiene ticket_id, no hacer nada
  IF NEW.ticket_id IS NOT NULL THEN
    RETURN NEW;
  END IF;
  
  -- Intentar buscar por thread_id primero
  SELECT e.ticket_id INTO v_ticket_id
  FROM crm.emails e
  WHERE e.thread_id = NEW.thread_id
    AND e.direction = 'outbound'
    AND e.ticket_id IS NOT NULL
    AND e.organization_id = NEW.organization_id
  ORDER BY e.sent_at DESC
  LIMIT 1;
  
  -- Si no se encontró, intentar por in_reply_to (Message-ID del email original)
  IF v_ticket_id IS NULL AND NEW.in_reply_to IS NOT NULL THEN
    -- Extraer message-id del header in-reply-to (formato: <message-id@domain>)
    v_message_id := REGEXP_REPLACE(NEW.in_reply_to, '[<>]', '', 'g');
    
    -- Buscar email enviado cuyo gmail_message_id coincida
    SELECT e.ticket_id INTO v_ticket_id
    FROM crm.emails e
    WHERE e.gmail_message_id = v_message_id
      AND e.direction = 'outbound'
      AND e.ticket_id IS NOT NULL
      AND e.organization_id = NEW.organization_id
    ORDER BY e.sent_at DESC
    LIMIT 1;
    
    -- Si aún no se encontró, buscar por thread_id usando el message-id
    IF v_ticket_id IS NULL THEN
      SELECT e.ticket_id INTO v_ticket_id
      FROM crm.emails e
      WHERE e.thread_id = v_message_id
        AND e.direction = 'outbound'
        AND e.ticket_id IS NOT NULL
        AND e.organization_id = NEW.organization_id
      ORDER BY e.sent_at DESC
      LIMIT 1;
    END IF;
  END IF;
  
  -- Si aún no se encontró y hay gmail_message_id, buscar emails enviados con el mismo thread_id
  -- que puedan tener un gmail_message_id relacionado
  IF v_ticket_id IS NULL AND NEW.gmail_message_id IS NOT NULL THEN
    -- Buscar en el mismo thread (Gmail agrupa por thread automáticamente)
    SELECT e.ticket_id INTO v_ticket_id
    FROM crm.emails e
    WHERE e.thread_id = NEW.thread_id
      AND e.direction = 'outbound'
      AND e.ticket_id IS NOT NULL
      AND e.organization_id = NEW.organization_id
    ORDER BY e.sent_at DESC
    LIMIT 1;
  END IF;
  
  -- Si se encontró un ticket, vincular el email entrante
  IF v_ticket_id IS NOT NULL THEN
    UPDATE crm.emails
    SET ticket_id = v_ticket_id
    WHERE id = NEW.id;
    
    RAISE NOTICE '[Trigger] Email % vinculado al ticket % (thread_id: %, in_reply_to: %)', 
      NEW.id, v_ticket_id, NEW.thread_id, NEW.in_reply_to;
  ELSE
    RAISE NOTICE '[Trigger] Email % NO vinculado - thread_id: %, in_reply_to: %, gmail_message_id: %', 
      NEW.id, NEW.thread_id, NEW.in_reply_to, NEW.gmail_message_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION crm.link_inbound_email_to_ticket IS 'Vincula automáticamente emails entrantes a tickets usando múltiples métodos de búsqueda';

-- ============================================================================
-- FUNCIÓN: Vincular Emails Existentes (Mejorada)
-- ============================================================================

CREATE OR REPLACE FUNCTION crm.link_existing_inbound_emails_to_tickets()
RETURNS INTEGER AS $$
DECLARE
  v_linked_count INTEGER := 0;
  v_email_record RECORD;
  v_ticket_id UUID;
  v_message_id TEXT;
BEGIN
  -- Procesar todos los emails entrantes que no tienen ticket_id
  FOR v_email_record IN
    SELECT e.id, e.thread_id, e.organization_id, e.in_reply_to, e.gmail_message_id
    FROM crm.emails e
    WHERE e.direction = 'inbound'
      AND e.ticket_id IS NULL
      AND (e.thread_id IS NOT NULL OR e.in_reply_to IS NOT NULL)
  LOOP
    v_ticket_id := NULL;
    
    -- Buscar por thread_id primero
    SELECT e2.ticket_id INTO v_ticket_id
    FROM crm.emails e2
    WHERE e2.thread_id = v_email_record.thread_id
      AND e2.direction = 'outbound'
      AND e2.ticket_id IS NOT NULL
      AND e2.organization_id = v_email_record.organization_id
    ORDER BY e2.sent_at DESC
    LIMIT 1;
    
    -- Si no se encontró, intentar por in_reply_to
    IF v_ticket_id IS NULL AND v_email_record.in_reply_to IS NOT NULL THEN
      v_message_id := REGEXP_REPLACE(v_email_record.in_reply_to, '[<>]', '', 'g');
      
      SELECT e2.ticket_id INTO v_ticket_id
      FROM crm.emails e2
      WHERE (e2.gmail_message_id = v_message_id OR e2.thread_id = v_message_id)
        AND e2.direction = 'outbound'
        AND e2.ticket_id IS NOT NULL
        AND e2.organization_id = v_email_record.organization_id
      ORDER BY e2.sent_at DESC
      LIMIT 1;
    END IF;
    
    -- Si se encontró un ticket, vincular el email entrante
    IF v_ticket_id IS NOT NULL THEN
      UPDATE crm.emails
      SET ticket_id = v_ticket_id
      WHERE id = v_email_record.id;
      
      v_linked_count := v_linked_count + 1;
    END IF;
  END LOOP;
  
  RETURN v_linked_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION crm.link_existing_inbound_emails_to_tickets IS 'Vincula emails entrantes existentes usando múltiples métodos de búsqueda';

GRANT EXECUTE ON FUNCTION crm.link_existing_inbound_emails_to_tickets() TO authenticated;

-- ============================================================================
-- EJECUTAR: Vincular Emails Existentes
-- ============================================================================

-- Vincular emails entrantes existentes que aún no tienen ticket_id
DO $$
DECLARE
  v_linked INTEGER;
BEGIN
  SELECT crm.link_existing_inbound_emails_to_tickets() INTO v_linked;
  RAISE NOTICE '[Migración] Emails vinculados: %', v_linked;
END $$;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migración completada: Mejorar Vinculación de Emails Entrantes';
  RAISE NOTICE '  ✅ Función crm.link_inbound_email_to_ticket() mejorada';
  RAISE NOTICE '  ✅ Búsqueda por thread_id, in_reply_to y gmail_message_id';
  RAISE NOTICE '  ✅ Logs de depuración agregados';
  RAISE NOTICE '  ✅ Función crm.link_existing_inbound_emails_to_tickets() mejorada';
END $$;


