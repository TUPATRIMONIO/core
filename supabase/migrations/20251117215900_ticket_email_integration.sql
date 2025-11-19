/**
 * Migración: Integración Email-Ticket Completa
 * 
 * Características:
 * - Relación many-to-many entre tickets y contactos
 * - Historial de emails en tickets
 * - Envío directo de emails desde tickets
 * 
 * Fecha: 17 Noviembre 2025
 */

SET search_path TO crm, core, public, extensions;

-- ============================================================================
-- 1. TABLA PIVOTE: ticket_contacts (Many-to-Many)
-- ============================================================================

CREATE TABLE crm.ticket_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES crm.tickets(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES crm.contacts(id) ON DELETE CASCADE,
  
  -- Rol del contacto en el ticket
  contact_role TEXT DEFAULT 'affected' CHECK (contact_role IN ('reporter', 'affected', 'cc', 'watcher')),
  
  -- Metadatos
  added_at TIMESTAMPTZ DEFAULT NOW(),
  added_by UUID REFERENCES core.users(id),
  
  UNIQUE(ticket_id, contact_id)
);

CREATE INDEX idx_ticket_contacts_ticket ON crm.ticket_contacts(ticket_id);
CREATE INDEX idx_ticket_contacts_contact ON crm.ticket_contacts(contact_id);

COMMENT ON TABLE crm.ticket_contacts IS 'Relación many-to-many entre tickets y contactos';
COMMENT ON COLUMN crm.ticket_contacts.contact_role IS 'reporter: reportó el problema, affected: afectado, cc: en copia, watcher: observador';

-- ============================================================================
-- 2. MIGRAR CONTACTOS EXISTENTES A TABLA PIVOTE
-- ============================================================================

-- Migrar tickets que ya tienen contact_id al nuevo sistema
INSERT INTO crm.ticket_contacts (ticket_id, contact_id, contact_role, added_at)
SELECT 
  id,
  contact_id,
  'reporter',
  created_at
FROM crm.tickets
WHERE contact_id IS NOT NULL
ON CONFLICT (ticket_id, contact_id) DO NOTHING;

-- ============================================================================
-- 3. ACTUALIZAR TABLA EMAILS: Relacionar con tickets
-- ============================================================================

-- Agregar relación directa email-ticket
ALTER TABLE crm.emails ADD COLUMN IF NOT EXISTS ticket_id UUID REFERENCES crm.tickets(id) ON DELETE SET NULL;

-- Crear índice
CREATE INDEX IF NOT EXISTS idx_emails_ticket ON crm.emails(ticket_id) WHERE ticket_id IS NOT NULL;

COMMENT ON COLUMN crm.emails.ticket_id IS 'Ticket relacionado con este email';

-- ============================================================================
-- 4. FUNCIÓN: Obtener historial de emails de un ticket
-- ============================================================================

CREATE OR REPLACE FUNCTION crm.get_ticket_emails(p_ticket_id UUID)
RETURNS TABLE (
  email_id UUID,
  subject TEXT,
  from_email TEXT,
  to_emails TEXT[],
  body_html TEXT,
  body_text TEXT,
  direction TEXT,
  sent_at TIMESTAMPTZ,
  is_read BOOLEAN,
  contact_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.subject,
    e.from_email,
    e.to_emails,
    e.body_html,
    e.body_text,
    e.direction,
    e.sent_at,
    COALESCE(e.is_read, false),
    c.full_name
  FROM crm.emails e
  LEFT JOIN crm.contacts c ON c.id = e.contact_id
  WHERE 
    -- Emails directamente relacionados con el ticket
    e.ticket_id = p_ticket_id 
    OR 
    -- Emails de contactos asociados al ticket
    e.contact_id IN (
      SELECT contact_id 
      FROM crm.ticket_contacts 
      WHERE ticket_id = p_ticket_id
    )
  ORDER BY e.sent_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION crm.get_ticket_emails(UUID) TO authenticated;

-- ============================================================================
-- 5. FUNCIÓN: Obtener contactos de un ticket
-- ============================================================================

CREATE OR REPLACE FUNCTION crm.get_ticket_contacts(p_ticket_id UUID)
RETURNS TABLE (
  contact_id UUID,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  company_name TEXT,
  contact_role TEXT,
  added_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.full_name,
    c.email,
    c.phone,
    c.company_name,
    tc.contact_role,
    tc.added_at
  FROM crm.contacts c
  JOIN crm.ticket_contacts tc ON tc.contact_id = c.id
  WHERE tc.ticket_id = p_ticket_id
  ORDER BY tc.added_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION crm.get_ticket_contacts(UUID) TO authenticated;

-- ============================================================================
-- 6. FUNCIÓN: Agregar contacto a ticket
-- ============================================================================

CREATE OR REPLACE FUNCTION crm.add_contact_to_ticket(
  p_ticket_id UUID,
  p_contact_id UUID,
  p_contact_role TEXT DEFAULT 'affected',
  p_added_by UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO crm.ticket_contacts (
    ticket_id,
    contact_id,
    contact_role,
    added_by
  ) VALUES (
    p_ticket_id,
    p_contact_id,
    p_contact_role,
    p_added_by
  )
  ON CONFLICT (ticket_id, contact_id) DO UPDATE SET
    contact_role = EXCLUDED.contact_role,
    added_by = EXCLUDED.added_by
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION crm.add_contact_to_ticket(UUID, UUID, TEXT, UUID) TO authenticated;

-- ============================================================================
-- 7. FUNCIÓN: Vincular email con ticket automáticamente
-- ============================================================================

CREATE OR REPLACE FUNCTION crm.link_email_to_ticket()
RETURNS TRIGGER AS $$
DECLARE
  v_ticket_id UUID;
  v_contact_tickets UUID[];
BEGIN
  -- Solo procesar si es un email con contacto y no tiene ticket asignado
  IF NEW.contact_id IS NULL OR NEW.ticket_id IS NOT NULL THEN
    RETURN NEW;
  END IF;
  
  -- Buscar tickets activos de este contacto
  SELECT ARRAY_AGG(tc.ticket_id) INTO v_contact_tickets
  FROM crm.ticket_contacts tc
  JOIN crm.tickets t ON t.id = tc.ticket_id
  WHERE tc.contact_id = NEW.contact_id
    AND t.organization_id = NEW.organization_id
    AND t.status NOT IN ('resolved', 'closed')
  ORDER BY t.updated_at DESC;
  
  -- Si hay tickets activos, vincular con el más reciente
  IF array_length(v_contact_tickets, 1) > 0 THEN
    v_ticket_id := v_contact_tickets[1];
    
    -- Actualizar email con ticket
    NEW.ticket_id := v_ticket_id;
    
    -- Actualizar timestamp del ticket
    UPDATE crm.tickets
    SET updated_at = NOW()
    WHERE id = v_ticket_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para vincular emails automáticamente
DROP TRIGGER IF EXISTS trigger_link_email_to_ticket ON crm.emails;
CREATE TRIGGER trigger_link_email_to_ticket
  BEFORE INSERT ON crm.emails
  FOR EACH ROW
  EXECUTE FUNCTION crm.link_email_to_ticket();

-- ============================================================================
-- 8. ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE crm.ticket_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view ticket contacts in their org"
ON crm.ticket_contacts FOR SELECT
USING (
  ticket_id IN (
    SELECT id FROM crm.tickets
    WHERE organization_id IN (
      SELECT organization_id FROM core.organization_users 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  )
);

CREATE POLICY "Users can manage ticket contacts in their org"
ON crm.ticket_contacts FOR ALL
USING (
  ticket_id IN (
    SELECT id FROM crm.tickets
    WHERE organization_id IN (
      SELECT organization_id FROM core.organization_users 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  )
);

-- ============================================================================
-- 9. GRANT PERMISSIONS
-- ============================================================================

GRANT ALL ON crm.ticket_contacts TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA crm TO authenticated;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$ 
BEGIN 
  RAISE NOTICE '🎉 ================================================';
  RAISE NOTICE '✅ Email-Ticket Integration - Completado';
  RAISE NOTICE '🎉 ================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Nuevas características:';
  RAISE NOTICE '  ✅ Relación many-to-many tickets ↔ contactos';
  RAISE NOTICE '  ✅ Historial completo de emails por ticket';
  RAISE NOTICE '  ✅ Vinculación automática email → ticket';
  RAISE NOTICE '  ✅ Múltiples roles de contacto por ticket';
  RAISE NOTICE '';
  RAISE NOTICE 'Funciones disponibles:';
  RAISE NOTICE '  - get_ticket_emails(ticket_id)';
  RAISE NOTICE '  - get_ticket_contacts(ticket_id)';
  RAISE NOTICE '  - add_contact_to_ticket(ticket_id, contact_id, role)';
  RAISE NOTICE '';
  RAISE NOTICE 'Triggers:';
  RAISE NOTICE '  ✅ Auto-vinculación email → ticket activo';
  RAISE NOTICE '';
  RAISE NOTICE '✨ Sistema de tickets con email completo!';
  RAISE NOTICE '';
END $$;

