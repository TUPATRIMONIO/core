/**
 * Migración: Add Sender Identities for Multi-Sender SendGrid Support
 * 
 * Permite que cada organización configure múltiples identidades de remitente
 * para diferentes propósitos (transactional, marketing).
 * 
 * Fecha: 17 Diciembre 2025
 */

-- ============================================================================
-- 1. CREAR ENUM PARA PROPÓSITO DE REMITENTE
-- ============================================================================

CREATE TYPE communications.sender_purpose AS ENUM (
  'transactional',  -- Notificaciones, pedidos, alertas
  'marketing'       -- Campañas, newsletters, promociones
);

-- ============================================================================
-- 2. CREAR TABLA SENDER_IDENTITIES
-- ============================================================================

CREATE TABLE communications.sender_identities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Multi-tenancy
  organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  
  -- Cuenta SendGrid asociada
  sendgrid_account_id UUID NOT NULL REFERENCES communications.sendgrid_accounts(id) ON DELETE CASCADE,
  
  -- Propósito del remitente
  purpose communications.sender_purpose NOT NULL,
  
  -- Identidad del remitente
  from_email TEXT NOT NULL CHECK (from_email ~ '^[^@]+@[^@]+\.[^@]+$'),
  from_name TEXT NOT NULL CHECK (length(from_name) <= 100),
  reply_to_email TEXT CHECK (reply_to_email IS NULL OR reply_to_email ~ '^[^@]+@[^@]+\.[^@]+$'),
  
  -- Estado
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES core.users(id),
  
  -- Constraints
  CONSTRAINT unique_org_sender_purpose UNIQUE (organization_id, purpose)
);

COMMENT ON TABLE communications.sender_identities IS 'Identidades de remitente por organización y propósito';
COMMENT ON COLUMN communications.sender_identities.purpose IS 'Propósito del remitente: transactional (notificaciones, pedidos) o marketing (campañas, newsletters)';
COMMENT ON COLUMN communications.sender_identities.from_email IS 'Email del remitente verificado en SendGrid';
COMMENT ON COLUMN communications.sender_identities.is_default IS 'Si es true, se usa como remitente por defecto cuando no se especifica propósito';

-- ============================================================================
-- 3. ÍNDICES
-- ============================================================================

CREATE INDEX idx_sender_identities_org ON communications.sender_identities(organization_id);
CREATE INDEX idx_sender_identities_account ON communications.sender_identities(sendgrid_account_id);
CREATE INDEX idx_sender_identities_purpose ON communications.sender_identities(organization_id, purpose) WHERE is_active = true;
CREATE INDEX idx_sender_identities_default ON communications.sender_identities(organization_id, is_default) WHERE is_default = true AND is_active = true;

-- ============================================================================
-- 4. TRIGGER PARA UPDATED_AT
-- ============================================================================

CREATE TRIGGER trigger_sender_identities_updated_at
  BEFORE UPDATE ON communications.sender_identities
  FOR EACH ROW
  EXECUTE FUNCTION communications.update_updated_at();

-- ============================================================================
-- 5. TRIGGER: Asegurar solo un remitente por defecto por organización
-- ============================================================================

CREATE OR REPLACE FUNCTION communications.ensure_single_default_sender()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    -- Desactivar otros remitentes por defecto de la misma organización
    UPDATE communications.sender_identities
    SET is_default = false
    WHERE organization_id = NEW.organization_id
      AND id != NEW.id
      AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ensure_single_default_sender
  AFTER INSERT OR UPDATE OF is_default ON communications.sender_identities
  FOR EACH ROW
  WHEN (NEW.is_default = true)
  EXECUTE FUNCTION communications.ensure_single_default_sender();

-- ============================================================================
-- 6. ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE communications.sender_identities ENABLE ROW LEVEL SECURITY;

-- SELECT: Ver remitentes de su organización
CREATE POLICY "Users can view own org sender identities"
ON communications.sender_identities
FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id 
    FROM core.organization_users 
    WHERE user_id = auth.uid() 
    AND status = 'active'
  )
);

-- INSERT/UPDATE/DELETE: Solo admins pueden gestionar
CREATE POLICY "Admins can manage sender identities"
ON communications.sender_identities
FOR ALL
USING (
  organization_id IN (
    SELECT ou.organization_id 
    FROM core.organization_users ou
    JOIN core.roles r ON r.id = ou.role_id
    WHERE ou.user_id = auth.uid() 
    AND ou.status = 'active'
    AND r.level >= 7 -- Admin o superior
  )
);

-- Platform admins pueden ver todos
CREATE POLICY "Platform admins can view all sender identities"
ON communications.sender_identities
FOR SELECT
USING (public.is_platform_super_admin(auth.uid()));

-- ============================================================================
-- 7. MIGRAR DATOS EXISTENTES
-- ============================================================================

-- Migrar from_email y from_name existentes a sender_identities como 'marketing'
INSERT INTO communications.sender_identities (
  organization_id,
  sendgrid_account_id,
  purpose,
  from_email,
  from_name,
  is_default,
  is_active,
  created_by
)
SELECT 
  sa.organization_id,
  sa.id as sendgrid_account_id,
  'marketing'::communications.sender_purpose,
  sa.from_email,
  sa.from_name,
  true as is_default,
  true as is_active,
  sa.created_by
FROM communications.sendgrid_accounts sa
WHERE sa.is_active = true
ON CONFLICT (organization_id, purpose) DO NOTHING;

-- ============================================================================
-- 8. FUNCIONES HELPER
-- ============================================================================

-- Obtener remitente por propósito
CREATE OR REPLACE FUNCTION communications.get_sender_by_purpose(
  org_id UUID,
  sender_purpose communications.sender_purpose DEFAULT 'marketing'
)
RETURNS TABLE (
  id UUID,
  organization_id UUID,
  sendgrid_account_id UUID,
  purpose communications.sender_purpose,
  from_email TEXT,
  from_name TEXT,
  reply_to_email TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    si.id,
    si.organization_id,
    si.sendgrid_account_id,
    si.purpose,
    si.from_email,
    si.from_name,
    si.reply_to_email
  FROM communications.sender_identities si
  WHERE si.organization_id = org_id
    AND si.purpose = sender_purpose
    AND si.is_active = true;
    
  -- Si no encuentra por propósito, retornar el default
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT 
      si.id,
      si.organization_id,
      si.sendgrid_account_id,
      si.purpose,
      si.from_email,
      si.from_name,
      si.reply_to_email
    FROM communications.sender_identities si
    WHERE si.organization_id = org_id
      AND si.is_default = true
      AND si.is_active = true
    LIMIT 1;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION communications.get_sender_by_purpose IS 'Obtiene el remitente para un propósito específico, o el default si no existe';

-- Listar todos los remitentes de una organización
CREATE OR REPLACE FUNCTION communications.list_sender_identities(org_id UUID)
RETURNS TABLE (
  id UUID,
  purpose communications.sender_purpose,
  from_email TEXT,
  from_name TEXT,
  reply_to_email TEXT,
  is_default BOOLEAN,
  is_active BOOLEAN,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    si.id,
    si.purpose,
    si.from_email,
    si.from_name,
    si.reply_to_email,
    si.is_default,
    si.is_active,
    si.created_at
  FROM communications.sender_identities si
  WHERE si.organization_id = org_id
  ORDER BY si.is_default DESC, si.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION communications.list_sender_identities IS 'Lista todas las identidades de remitente de una organización';

-- ============================================================================
-- 9. LOG DE MIGRACIÓN
-- ============================================================================

DO $$
DECLARE
  migrated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO migrated_count FROM communications.sender_identities;
  RAISE NOTICE '✅ Migración completada: sender_identities';
  RAISE NOTICE '  📧 Remitentes migrados: %', migrated_count;
  RAISE NOTICE '  🏷️ Propósitos disponibles: transactional, marketing';
END;
$$;
