/**
 * Migración: Sistema CRM Universal Configurable
 * 
 * Características:
 * - Propiedades personalizables por entidad (entity_properties)
 * - Pipelines estructurados con stages (pipeline_stages)
 * - Permisos granulares por pipeline (pipeline_permissions)
 * - Integración email-to-ticket automática
 * - Sistema universal aplicable a todas las entidades
 * 
 * Fecha: 17 Noviembre 2025
 */

SET search_path TO crm, core, public, extensions;

-- ============================================================================
-- 1. NUEVOS ENUMS
-- ============================================================================

-- Tipos de propiedades personalizables
CREATE TYPE crm.property_type AS ENUM (
  'text',           -- Texto libre
  'number',         -- Número
  'date',           -- Fecha
  'boolean',        -- Sí/No
  'single_select',  -- Lista de opción única
  'multi_select',   -- Lista de múltiples opciones
  'user',           -- Usuario de la organización
  'contact',        -- Relación con contacto
  'company',        -- Relación con empresa
  'file',           -- Archivo adjunto
  'url'             -- URL
);

-- Tipos de entidades del CRM
CREATE TYPE crm.entity_type AS ENUM (
  'ticket',
  'contact',
  'company',
  'deal',
  'product',
  'quote'
);

COMMENT ON TYPE crm.property_type IS 'Tipos de propiedades personalizables para entidades del CRM';
COMMENT ON TYPE crm.entity_type IS 'Entidades del CRM que soportan propiedades personalizables y pipelines';

-- ============================================================================
-- 2. TABLA: entity_properties
-- ============================================================================

CREATE TABLE crm.entity_properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  
  -- Entidad a la que aplica
  entity_type crm.entity_type NOT NULL,
  
  -- Información de la propiedad
  property_name TEXT NOT NULL CHECK (length(property_name) >= 2 AND length(property_name) <= 100),
  property_key TEXT NOT NULL CHECK (property_key ~ '^[a-z][a-z0-9_]*$'), -- snake_case
  property_type crm.property_type NOT NULL,
  
  -- Opciones (para select)
  options JSONB DEFAULT '[]', -- ["Opción 1", "Opción 2"]
  
  -- Configuración
  is_required BOOLEAN DEFAULT false,
  default_value TEXT,
  description TEXT,
  
  -- Display
  display_order INTEGER DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES core.users(id),
  
  UNIQUE(organization_id, entity_type, property_key)
);

CREATE INDEX idx_entity_properties_org_type ON crm.entity_properties(organization_id, entity_type);
CREATE INDEX idx_entity_properties_visible ON crm.entity_properties(organization_id, entity_type, is_visible) WHERE is_visible = true;

COMMENT ON TABLE crm.entity_properties IS 'Propiedades personalizables creadas por organization owner para cada tipo de entidad';
COMMENT ON COLUMN crm.entity_properties.property_key IS 'Clave única en snake_case para usar en custom_fields JSONB';
COMMENT ON COLUMN crm.entity_properties.options IS 'Array de opciones para single_select y multi_select';

-- ============================================================================
-- 3. TABLA: pipeline_stages
-- ============================================================================

CREATE TABLE crm.pipeline_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id UUID NOT NULL REFERENCES crm.pipelines(id) ON DELETE CASCADE,
  
  -- Información
  name TEXT NOT NULL CHECK (length(name) >= 2 AND length(name) <= 100),
  slug TEXT NOT NULL CHECK (slug ~ '^[a-z][a-z0-9_]*$'),
  
  -- Display
  color TEXT NOT NULL DEFAULT '#3b82f6',
  display_order INTEGER NOT NULL DEFAULT 0,
  
  -- Para deals: probabilidad de cierre
  probability INTEGER CHECK (probability >= 0 AND probability <= 100),
  
  -- Estado final (won/lost/resolved)
  is_final BOOLEAN DEFAULT false,
  final_type TEXT CHECK (final_type IN ('won', 'lost', 'resolved', 'closed', NULL)),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(pipeline_id, slug),
  UNIQUE(pipeline_id, display_order)
);

CREATE INDEX idx_pipeline_stages_pipeline ON crm.pipeline_stages(pipeline_id, display_order);
CREATE INDEX idx_pipeline_stages_final ON crm.pipeline_stages(pipeline_id, is_final) WHERE is_final = true;

COMMENT ON TABLE crm.pipeline_stages IS 'Etapas de cada pipeline, reemplaza campo JSONB stages por tabla estructurada';
COMMENT ON COLUMN crm.pipeline_stages.probability IS 'Probabilidad de cierre para deals (0-100)';
COMMENT ON COLUMN crm.pipeline_stages.final_type IS 'Tipo de etapa final: won (ganado), lost (perdido), resolved (resuelto), closed (cerrado)';

-- ============================================================================
-- 4. TABLA: pipeline_permissions
-- ============================================================================

CREATE TABLE crm.pipeline_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id UUID NOT NULL REFERENCES crm.pipelines(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
  
  -- Permisos generales sobre el pipeline
  can_view BOOLEAN DEFAULT true,
  can_create BOOLEAN DEFAULT false,
  can_edit BOOLEAN DEFAULT false,
  can_delete BOOLEAN DEFAULT false,
  
  -- Restricciones por etapa (array de stage slugs)
  allowed_stages TEXT[] DEFAULT '{}', -- Si vacío = todas las etapas
  
  -- Metadata
  granted_by UUID REFERENCES core.users(id),
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(pipeline_id, user_id)
);

CREATE INDEX idx_pipeline_permissions_user ON crm.pipeline_permissions(user_id);
CREATE INDEX idx_pipeline_permissions_pipeline ON crm.pipeline_permissions(pipeline_id);

COMMENT ON TABLE crm.pipeline_permissions IS 'Permisos granulares por usuario y pipeline';
COMMENT ON COLUMN crm.pipeline_permissions.allowed_stages IS 'Array de slugs de stages permitidos. Si está vacío, se permiten todas las etapas';

-- ============================================================================
-- 5. ACTUALIZAR TABLA: pipelines
-- ============================================================================

-- Agregar nuevas columnas
ALTER TABLE crm.pipelines 
  ADD COLUMN IF NOT EXISTS entity_type crm.entity_type,
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#3b82f6';

-- Actualizar pipelines existentes con entity_type
UPDATE crm.pipelines SET entity_type = 'deal' WHERE type = 'deals' AND entity_type IS NULL;
UPDATE crm.pipelines SET entity_type = 'ticket' WHERE type = 'tickets' AND entity_type IS NULL;

-- Hacer entity_type NOT NULL después de migrar data
ALTER TABLE crm.pipelines ALTER COLUMN entity_type SET NOT NULL;
ALTER TABLE crm.pipelines ALTER COLUMN entity_type SET DEFAULT 'deal';

-- Actualizar constraint único
ALTER TABLE crm.pipelines DROP CONSTRAINT IF EXISTS unique_pipeline_name_per_org;
ALTER TABLE crm.pipelines 
  ADD CONSTRAINT unique_pipeline_name_per_org 
  UNIQUE (organization_id, entity_type, name);

-- Índices adicionales
CREATE INDEX IF NOT EXISTS idx_pipelines_entity_type ON crm.pipelines(organization_id, entity_type, is_active);

COMMENT ON COLUMN crm.pipelines.entity_type IS 'Tipo de entidad a la que aplica este pipeline';
COMMENT ON COLUMN crm.pipelines.category IS 'Categoría del pipeline (ej: technical, billing para tickets)';

-- ============================================================================
-- 6. ACTUALIZAR TABLAS DE ENTIDADES: Agregar pipeline_id y stage_id
-- ============================================================================

-- TICKETS
ALTER TABLE crm.tickets
  ADD COLUMN IF NOT EXISTS source_email_thread_id UUID REFERENCES crm.email_threads(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS pipeline_id UUID REFERENCES crm.pipelines(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS stage_id UUID REFERENCES crm.pipeline_stages(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_tickets_email_thread ON crm.tickets(source_email_thread_id) WHERE source_email_thread_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tickets_pipeline ON crm.tickets(pipeline_id) WHERE pipeline_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tickets_stage ON crm.tickets(stage_id) WHERE stage_id IS NOT NULL;

COMMENT ON COLUMN crm.tickets.source_email_thread_id IS 'Email thread que originó este ticket (si aplica)';
COMMENT ON COLUMN crm.tickets.pipeline_id IS 'Pipeline al que pertenece este ticket';
COMMENT ON COLUMN crm.tickets.stage_id IS 'Etapa actual del ticket en el pipeline';

-- DEALS
ALTER TABLE crm.deals
  ADD COLUMN IF NOT EXISTS pipeline_id UUID REFERENCES crm.pipelines(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS stage_id UUID REFERENCES crm.pipeline_stages(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_deals_pipeline ON crm.deals(pipeline_id) WHERE pipeline_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_deals_stage ON crm.deals(stage_id) WHERE stage_id IS NOT NULL;

-- CONTACTS
ALTER TABLE crm.contacts
  ADD COLUMN IF NOT EXISTS pipeline_id UUID REFERENCES crm.pipelines(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS stage_id UUID REFERENCES crm.pipeline_stages(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_contacts_pipeline ON crm.contacts(pipeline_id) WHERE pipeline_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contacts_stage ON crm.contacts(stage_id) WHERE stage_id IS NOT NULL;

-- COMPANIES
ALTER TABLE crm.companies
  ADD COLUMN IF NOT EXISTS pipeline_id UUID REFERENCES crm.pipelines(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS stage_id UUID REFERENCES crm.pipeline_stages(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_companies_pipeline ON crm.companies(pipeline_id) WHERE pipeline_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_companies_stage ON crm.companies(stage_id) WHERE stage_id IS NOT NULL;

-- PRODUCTS
ALTER TABLE crm.products
  ADD COLUMN IF NOT EXISTS pipeline_id UUID REFERENCES crm.pipelines(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS stage_id UUID REFERENCES crm.pipeline_stages(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_products_pipeline ON crm.products(pipeline_id) WHERE pipeline_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_stage ON crm.products(stage_id) WHERE stage_id IS NOT NULL;

-- QUOTES
ALTER TABLE crm.quotes
  ADD COLUMN IF NOT EXISTS pipeline_id UUID REFERENCES crm.pipelines(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS stage_id UUID REFERENCES crm.pipeline_stages(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_quotes_pipeline ON crm.quotes(pipeline_id) WHERE pipeline_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_quotes_stage ON crm.quotes(stage_id) WHERE stage_id IS NOT NULL;

-- ============================================================================
-- 7. TRIGGERS PARA UPDATED_AT
-- ============================================================================

-- Reutilizar función existente crm.update_updated_at()
CREATE TRIGGER update_entity_properties_updated_at 
  BEFORE UPDATE ON crm.entity_properties 
  FOR EACH ROW EXECUTE FUNCTION crm.update_updated_at();

CREATE TRIGGER update_pipeline_stages_updated_at 
  BEFORE UPDATE ON crm.pipeline_stages 
  FOR EACH ROW EXECUTE FUNCTION crm.update_updated_at();

CREATE TRIGGER update_pipeline_permissions_updated_at 
  BEFORE UPDATE ON crm.pipeline_permissions 
  FOR EACH ROW EXECUTE FUNCTION crm.update_updated_at();

-- ============================================================================
-- 8. ROW LEVEL SECURITY
-- ============================================================================

-- Habilitar RLS
ALTER TABLE crm.entity_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm.pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm.pipeline_permissions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLÍTICAS RLS: entity_properties
-- =====================================================

CREATE POLICY "Users can view entity properties in their org"
ON crm.entity_properties FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM core.organization_users 
    WHERE user_id = auth.uid() AND status = 'active'
  )
);

CREATE POLICY "Org owners can manage entity properties"
ON crm.entity_properties FOR ALL
USING (
  organization_id IN (
    SELECT ou.organization_id FROM core.organization_users ou
    JOIN core.roles r ON r.id = ou.role_id
    WHERE ou.user_id = auth.uid() 
    AND ou.status = 'active'
    AND r.level >= 8  -- owner level
  )
);

-- =====================================================
-- POLÍTICAS RLS: pipeline_stages
-- =====================================================

CREATE POLICY "Users can view pipeline stages in their org"
ON crm.pipeline_stages FOR SELECT
USING (
  pipeline_id IN (
    SELECT id FROM crm.pipelines
    WHERE organization_id IN (
      SELECT organization_id FROM core.organization_users 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  )
);

CREATE POLICY "Org owners and admins can manage pipeline stages"
ON crm.pipeline_stages FOR ALL
USING (
  pipeline_id IN (
    SELECT p.id FROM crm.pipelines p
    JOIN core.organization_users ou ON ou.organization_id = p.organization_id
    JOIN core.roles r ON r.id = ou.role_id
    WHERE ou.user_id = auth.uid() 
    AND ou.status = 'active'
    AND r.level >= 7  -- admin level
  )
);

-- =====================================================
-- POLÍTICAS RLS: pipeline_permissions
-- =====================================================

CREATE POLICY "Users can view their own pipeline permissions"
ON crm.pipeline_permissions FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Org owners and admins can manage pipeline permissions"
ON crm.pipeline_permissions FOR ALL
USING (
  pipeline_id IN (
    SELECT p.id FROM crm.pipelines p
    JOIN core.organization_users ou ON ou.organization_id = p.organization_id
    JOIN core.roles r ON r.id = ou.role_id
    WHERE ou.user_id = auth.uid() 
    AND ou.status = 'active'
    AND r.level >= 7  -- admin level
  )
);

-- ============================================================================
-- 9. FUNCIONES AUXILIARES
-- ============================================================================

-- Función para obtener propiedades de una entidad
CREATE OR REPLACE FUNCTION crm.get_entity_properties(
  p_organization_id UUID,
  p_entity_type crm.entity_type
)
RETURNS SETOF crm.entity_properties AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM crm.entity_properties
  WHERE organization_id = p_organization_id
    AND entity_type = p_entity_type
    AND is_visible = true
  ORDER BY display_order ASC, created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION crm.get_entity_properties(UUID, crm.entity_type) TO authenticated;

-- Función para obtener stages de un pipeline
CREATE OR REPLACE FUNCTION crm.get_pipeline_stages(p_pipeline_id UUID)
RETURNS SETOF crm.pipeline_stages AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM crm.pipeline_stages
  WHERE pipeline_id = p_pipeline_id
  ORDER BY display_order ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION crm.get_pipeline_stages(UUID) TO authenticated;

-- Función para verificar si usuario tiene permiso en pipeline
CREATE OR REPLACE FUNCTION crm.user_can_access_pipeline(
  p_user_id UUID,
  p_pipeline_id UUID,
  p_action TEXT  -- 'view', 'create', 'edit', 'delete'
)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_role_level INTEGER;
  v_has_permission BOOLEAN := false;
BEGIN
  -- Verificar si es owner/admin (acceso total)
  SELECT r.level INTO v_user_role_level
  FROM core.organization_users ou
  JOIN core.roles r ON r.id = ou.role_id
  JOIN crm.pipelines p ON p.organization_id = ou.organization_id
  WHERE ou.user_id = p_user_id
    AND p.id = p_pipeline_id
    AND ou.status = 'active';
  
  IF v_user_role_level >= 7 THEN
    RETURN true;
  END IF;
  
  -- Verificar permisos específicos
  CASE p_action
    WHEN 'view' THEN
      SELECT can_view INTO v_has_permission
      FROM crm.pipeline_permissions
      WHERE user_id = p_user_id AND pipeline_id = p_pipeline_id;
    WHEN 'create' THEN
      SELECT can_create INTO v_has_permission
      FROM crm.pipeline_permissions
      WHERE user_id = p_user_id AND pipeline_id = p_pipeline_id;
    WHEN 'edit' THEN
      SELECT can_edit INTO v_has_permission
      FROM crm.pipeline_permissions
      WHERE user_id = p_user_id AND pipeline_id = p_pipeline_id;
    WHEN 'delete' THEN
      SELECT can_delete INTO v_has_permission
      FROM crm.pipeline_permissions
      WHERE user_id = p_user_id AND pipeline_id = p_pipeline_id;
  END CASE;
  
  RETURN COALESCE(v_has_permission, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION crm.user_can_access_pipeline(UUID, UUID, TEXT) TO authenticated;

-- ============================================================================
-- 10. GRANT PERMISSIONS
-- ============================================================================

GRANT ALL ON crm.entity_properties TO authenticated;
GRANT ALL ON crm.pipeline_stages TO authenticated;
GRANT ALL ON crm.pipeline_permissions TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA crm TO authenticated;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$ 
BEGIN 
  RAISE NOTICE '🎉 ================================================';
  RAISE NOTICE '✅ Sistema CRM Universal - Base de Datos';
  RAISE NOTICE '🎉 ================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Nuevas tablas creadas:';
  RAISE NOTICE '  ✅ crm.entity_properties - Propiedades personalizables';
  RAISE NOTICE '  ✅ crm.pipeline_stages - Etapas estructuradas';
  RAISE NOTICE '  ✅ crm.pipeline_permissions - Permisos granulares';
  RAISE NOTICE '';
  RAISE NOTICE 'Tablas actualizadas con pipeline_id y stage_id:';
  RAISE NOTICE '  ✅ crm.tickets (+ source_email_thread_id)';
  RAISE NOTICE '  ✅ crm.deals';
  RAISE NOTICE '  ✅ crm.contacts';
  RAISE NOTICE '  ✅ crm.companies';
  RAISE NOTICE '  ✅ crm.products';
  RAISE NOTICE '  ✅ crm.quotes';
  RAISE NOTICE '';
  RAISE NOTICE 'Nuevos ENUMs:';
  RAISE NOTICE '  - crm.property_type (11 tipos)';
  RAISE NOTICE '  - crm.entity_type (6 entidades)';
  RAISE NOTICE '';
  RAISE NOTICE 'Funciones auxiliares:';
  RAISE NOTICE '  ✅ get_entity_properties()';
  RAISE NOTICE '  ✅ get_pipeline_stages()';
  RAISE NOTICE '  ✅ user_can_access_pipeline()';
  RAISE NOTICE '';
  RAISE NOTICE '✨ Base de datos lista para sistema universal!';
  RAISE NOTICE '';
END $$;

