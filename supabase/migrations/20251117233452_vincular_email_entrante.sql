/**
 * Migración: Vincular Emails Entrantes a Tickets
 * 
 * Cuando un email entrante (respuesta del cliente) tiene el mismo thread_id
 * que un email enviado desde un ticket, se vincula automáticamente al ticket.
 * 
 * Fecha: 17 Noviembre 2025
 */

SET search_path TO crm, core, public, extensions;

-- ============================================================================
-- FUNCIÓN: Vincular Email Entrante a Ticket por Thread ID
-- ============================================================================

CREATE OR REPLACE FUNCTION crm.link_inbound_email_to_ticket()
RETURNS TRIGGER AS $$
DECLARE
  v_ticket_id UUID;
BEGIN
  -- Solo procesar emails entrantes
  IF NEW.direction != 'inbound' THEN
    RETURN NEW;
  END IF;
  
  -- Si ya tiene ticket_id, no hacer nada
  IF NEW.ticket_id IS NOT NULL THEN
    RETURN NEW;
  END IF;
  
  -- Buscar ticket por thread_id del email enviado
  -- Buscar en emails enviados que tengan el mismo thread_id
  SELECT e.ticket_id INTO v_ticket_id
  FROM crm.emails e
  WHERE e.thread_id = NEW.thread_id
    AND e.direction = 'outbound'
    AND e.ticket_id IS NOT NULL
    AND e.organization_id = NEW.organization_id
  ORDER BY e.sent_at DESC
  LIMIT 1;
  
  -- Si se encontró un ticket, vincular el email entrante
  IF v_ticket_id IS NOT NULL THEN
    UPDATE crm.emails
    SET ticket_id = v_ticket_id
    WHERE id = NEW.id;
    
    RAISE NOTICE 'Email % vinculado al ticket % por thread_id %', NEW.id, v_ticket_id, NEW.thread_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION crm.link_inbound_email_to_ticket IS 'Vincula automáticamente emails entrantes a tickets cuando comparten thread_id con emails enviados';

-- ============================================================================
-- TRIGGER: Vincular Email Entrante al Insertar
-- ============================================================================

-- Eliminar trigger anterior si existe
DROP TRIGGER IF EXISTS trigger_link_inbound_email_to_ticket ON crm.emails;

-- Crear trigger
CREATE TRIGGER trigger_link_inbound_email_to_ticket
  AFTER INSERT ON crm.emails
  FOR EACH ROW
  EXECUTE FUNCTION crm.link_inbound_email_to_ticket();

-- ============================================================================
-- FUNCIÓN: Vincular Emails Existentes a Tickets
-- ============================================================================

CREATE OR REPLACE FUNCTION crm.link_existing_inbound_emails_to_tickets()
RETURNS INTEGER AS $$
DECLARE
  v_linked_count INTEGER := 0;
  v_email_record RECORD;
  v_ticket_id UUID;
BEGIN
  -- Procesar todos los emails entrantes que no tienen ticket_id
  FOR v_email_record IN
    SELECT e.id, e.thread_id, e.organization_id
    FROM crm.emails e
    WHERE e.direction = 'inbound'
      AND e.ticket_id IS NULL
      AND e.thread_id IS NOT NULL
  LOOP
    -- Buscar ticket por thread_id del email enviado
    SELECT e2.ticket_id INTO v_ticket_id
    FROM crm.emails e2
    WHERE e2.thread_id = v_email_record.thread_id
      AND e2.direction = 'outbound'
      AND e2.ticket_id IS NOT NULL
      AND e2.organization_id = v_email_record.organization_id
    ORDER BY e2.sent_at DESC
    LIMIT 1;
    
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

COMMENT ON FUNCTION crm.link_existing_inbound_emails_to_tickets IS 'Vincula emails entrantes existentes que aún no tienen ticket_id asignado';

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
  RAISE NOTICE 'Emails vinculados: %', v_linked;
END $$;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migración completada: Vincular Emails Entrantes a Tickets';
  RAISE NOTICE '  ✅ Función crm.link_inbound_email_to_ticket() creada';
  RAISE NOTICE '  ✅ Trigger trigger_link_inbound_email_to_ticket creado';
  RAISE NOTICE '  ✅ Función crm.link_existing_inbound_emails_to_tickets() creada';
  RAISE NOTICE '  ✅ Emails existentes vinculados automáticamente';
END $$;


