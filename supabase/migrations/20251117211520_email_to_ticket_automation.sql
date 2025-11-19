/**
 * Migración: Automatización Email-to-Ticket
 * 
 * Características:
 * - Crear tickets automáticamente al recibir emails
 * - Actualizar tickets existentes cuando llegan respuestas
 * - Vincular tickets con email threads
 * 
 * Fecha: 17 Noviembre 2025
 */

SET search_path TO crm, core, public, extensions;

-- ============================================================================
-- FUNCIÓN: Crear Ticket desde Email
-- ============================================================================

CREATE OR REPLACE FUNCTION crm.create_ticket_from_email(
  p_organization_id UUID,
  p_email_thread_id UUID,
  p_contact_id UUID,
  p_subject TEXT,
  p_description TEXT
)
RETURNS UUID AS $$
DECLARE
  v_ticket_id UUID;
  v_default_pipeline_id UUID;
  v_first_stage_id UUID;
  v_ticket_number TEXT;
BEGIN
  -- Buscar pipeline por defecto para tickets
  SELECT id INTO v_default_pipeline_id
  FROM crm.pipelines
  WHERE organization_id = p_organization_id
    AND entity_type = 'ticket'
    AND is_default = true
    AND is_active = true
  LIMIT 1;
  
  -- Si no hay pipeline por defecto, tomar el primero activo
  IF v_default_pipeline_id IS NULL THEN
    SELECT id INTO v_default_pipeline_id
    FROM crm.pipelines
    WHERE organization_id = p_organization_id
      AND entity_type = 'ticket'
      AND is_active = true
    ORDER BY created_at ASC
    LIMIT 1;
  END IF;
  
  -- Obtener primera etapa del pipeline
  IF v_default_pipeline_id IS NOT NULL THEN
    SELECT id INTO v_first_stage_id
    FROM crm.pipeline_stages
    WHERE pipeline_id = v_default_pipeline_id
    ORDER BY display_order ASC
    LIMIT 1;
  END IF;
  
  -- Generar número de ticket
  SELECT 'TICK-' || LPAD(
    (COALESCE(MAX(CAST(SUBSTRING(ticket_number FROM '[0-9]+$') AS INTEGER)), 0) + 1)::TEXT,
    5,
    '0'
  ) INTO v_ticket_number
  FROM crm.tickets
  WHERE organization_id = p_organization_id;
  
  -- Crear ticket
  INSERT INTO crm.tickets (
    organization_id,
    ticket_number,
    subject,
    description,
    contact_id,
    source_email_thread_id,
    pipeline_id,
    stage_id,
    status,
    priority,
    category
  ) VALUES (
    p_organization_id,
    v_ticket_number,
    COALESCE(p_subject, 'Sin asunto'),
    COALESCE(p_description, ''),
    p_contact_id,
    p_email_thread_id,
    v_default_pipeline_id,
    v_first_stage_id,
    'new',
    'medium',
    'general'
  )
  RETURNING id INTO v_ticket_id;
  
  RETURN v_ticket_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION crm.create_ticket_from_email IS 'Crea un ticket automáticamente desde un email entrante';

GRANT EXECUTE ON FUNCTION crm.create_ticket_from_email(UUID, UUID, UUID, TEXT, TEXT) TO authenticated;

-- ============================================================================
-- TRIGGER: Handle Incoming Email
-- ============================================================================

CREATE OR REPLACE FUNCTION crm.handle_incoming_email()
RETURNS TRIGGER AS $$
DECLARE
  v_existing_ticket UUID;
  v_new_ticket_id UUID;
  v_contact_id UUID;
BEGIN
  -- Solo procesar emails entrantes
  IF NEW.direction != 'inbound' THEN
    RETURN NEW;
  END IF;
  
  -- Si no tiene thread_id_crm, no podemos procesar
  IF NEW.thread_id_crm IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Verificar si el thread ya tiene ticket asociado
  SELECT t.id INTO v_existing_ticket
  FROM crm.tickets t
  WHERE t.source_email_thread_id = NEW.thread_id_crm
    AND t.organization_id = NEW.organization_id
  LIMIT 1;
  
  IF v_existing_ticket IS NOT NULL THEN
    -- ACTUALIZAR TICKET EXISTENTE
    UPDATE crm.tickets
    SET 
      updated_at = NOW(),
      description = description || E'\n\n---\n**Actualización por email (' || 
        TO_CHAR(NEW.sent_at, 'DD/MM/YYYY HH24:MI') || '):**\n' || 
        COALESCE(NEW.snippet, LEFT(NEW.body_text, 500))
    WHERE id = v_existing_ticket;
    
    -- Crear actividad de seguimiento
    INSERT INTO crm.activities (
      organization_id,
      ticket_id,
      contact_id,
      type,
      subject,
      description,
      performed_at
    ) VALUES (
      NEW.organization_id,
      v_existing_ticket,
      NEW.contact_id,
      'email',
      'Email recibido: ' || COALESCE(NEW.subject, 'Sin asunto'),
      COALESCE(NEW.snippet, LEFT(NEW.body_text, 500)),
      COALESCE(NEW.sent_at, NOW())
    );
    
    RAISE NOTICE 'Ticket % actualizado con email %', v_existing_ticket, NEW.id;
  ELSE
    -- CREAR NUEVO TICKET
    -- Solo si el email viene de un contacto (no interno)
    IF NEW.contact_id IS NOT NULL THEN
      v_contact_id := NEW.contact_id;
    ELSE
      -- Intentar encontrar o crear contacto desde email
      SELECT id INTO v_contact_id
      FROM crm.contacts
      WHERE organization_id = NEW.organization_id
        AND email ILIKE NEW.from_email
      LIMIT 1;
      
      -- Si no existe contacto, crear uno básico
      IF v_contact_id IS NULL THEN
        INSERT INTO crm.contacts (
          organization_id,
          email,
          full_name,
          lifecycle_stage
        ) VALUES (
          NEW.organization_id,
          NEW.from_email,
          SPLIT_PART(NEW.from_email, '@', 1), -- Usar parte antes del @ como nombre
          'lead'
        )
        RETURNING id INTO v_contact_id;
        
        RAISE NOTICE 'Contacto creado automáticamente: %', v_contact_id;
      END IF;
    END IF;
    
    -- Crear ticket
    v_new_ticket_id := crm.create_ticket_from_email(
      NEW.organization_id,
      NEW.thread_id_crm,
      v_contact_id,
      COALESCE(NEW.subject, 'Email de ' || NEW.from_email),
      COALESCE(NEW.body_text, NEW.snippet, '')
    );
    
    -- Crear actividad inicial
    IF v_new_ticket_id IS NOT NULL THEN
      INSERT INTO crm.activities (
        organization_id,
        ticket_id,
        contact_id,
        type,
        subject,
        description,
        performed_at
      ) VALUES (
        NEW.organization_id,
        v_new_ticket_id,
        v_contact_id,
        'email',
        'Ticket creado desde email',
        'Ticket creado automáticamente desde email entrante',
        COALESCE(NEW.sent_at, NOW())
      );
      
      RAISE NOTICE 'Nuevo ticket creado: % desde email %', v_new_ticket_id, NEW.id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION crm.handle_incoming_email IS 'Trigger que crea o actualiza tickets automáticamente al recibir emails';

-- Eliminar trigger anterior si existe
DROP TRIGGER IF EXISTS trigger_handle_incoming_email ON crm.emails;

-- Crear trigger
CREATE TRIGGER trigger_handle_incoming_email
  AFTER INSERT ON crm.emails
  FOR EACH ROW
  EXECUTE FUNCTION crm.handle_incoming_email();

-- ============================================================================
-- FUNCIÓN: Obtener Tickets de un Email Thread
-- ============================================================================

CREATE OR REPLACE FUNCTION crm.get_tickets_from_email_thread(
  p_email_thread_id UUID
)
RETURNS SETOF crm.tickets AS $$
BEGIN
  RETURN QUERY
  SELECT t.* 
  FROM crm.tickets t
  WHERE t.source_email_thread_id = p_email_thread_id
  ORDER BY t.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION crm.get_tickets_from_email_thread IS 'Obtiene todos los tickets asociados a un email thread';

GRANT EXECUTE ON FUNCTION crm.get_tickets_from_email_thread(UUID) TO authenticated;

-- ============================================================================
-- FUNCIÓN: Vincular Ticket Existente con Email Thread
-- ============================================================================

CREATE OR REPLACE FUNCTION crm.link_ticket_to_email_thread(
  p_ticket_id UUID,
  p_email_thread_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE crm.tickets
  SET source_email_thread_id = p_email_thread_id
  WHERE id = p_ticket_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION crm.link_ticket_to_email_thread IS 'Vincula manualmente un ticket existente con un email thread';

GRANT EXECUTE ON FUNCTION crm.link_ticket_to_email_thread(UUID, UUID) TO authenticated;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$ 
BEGIN 
  RAISE NOTICE '🎉 ================================================';
  RAISE NOTICE '✅ Email-to-Ticket Automation - Completado';
  RAISE NOTICE '🎉 ================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Funciones creadas:';
  RAISE NOTICE '  ✅ crm.create_ticket_from_email()';
  RAISE NOTICE '  ✅ crm.handle_incoming_email() [TRIGGER]';
  RAISE NOTICE '  ✅ crm.get_tickets_from_email_thread()';
  RAISE NOTICE '  ✅ crm.link_ticket_to_email_thread()';
  RAISE NOTICE '';
  RAISE NOTICE 'Comportamiento:';
  RAISE NOTICE '  📧 Email entrante → Crear ticket automático';
  RAISE NOTICE '  📧 Respuesta en thread → Actualizar ticket';
  RAISE NOTICE '  📧 Sin contacto → Crear contacto automático';
  RAISE NOTICE '';
  RAISE NOTICE '✨ Sistema email-to-ticket operativo!';
  RAISE NOTICE '';
END $$;

