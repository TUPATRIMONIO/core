-- =====================================================
-- Migration: Extender Applications con Control de Visibilidad
-- Description: Agregar campos de visibilidad a core.applications y crear sistema de overrides
-- Created: 2025-12-05
-- =====================================================

SET search_path TO core, public, extensions;

-- =====================================================
-- 1. EXTENDER core.applications CON CAMPOS DE VISIBILIDAD
-- =====================================================

-- Agregar campo visibility_level
ALTER TABLE core.applications 
ADD COLUMN IF NOT EXISTS visibility_level TEXT DEFAULT 'public' 
CHECK (visibility_level IN ('public', 'platform_only', 'beta', 'restricted'));

COMMENT ON COLUMN core.applications.visibility_level IS 
'Nivel de visibilidad: public (todos), platform_only (solo admins), beta (beta testers), restricted (solo con override)';

-- Agregar campo allowed_countries
ALTER TABLE core.applications 
ADD COLUMN IF NOT EXISTS allowed_countries TEXT[] DEFAULT '{}';

COMMENT ON COLUMN core.applications.allowed_countries IS 
'Array de códigos de países permitidos (ej: [cl, mx]). Vacío = todos los países';

-- Agregar campo required_subscription_tiers
ALTER TABLE core.applications 
ADD COLUMN IF NOT EXISTS required_subscription_tiers TEXT[] DEFAULT '{}';

COMMENT ON COLUMN core.applications.required_subscription_tiers IS 
'Array de tiers de suscripción requeridos (ej: [pro, enterprise]). Vacío = todos los planes';

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_applications_visibility ON core.applications(visibility_level);
CREATE INDEX IF NOT EXISTS idx_applications_countries ON core.applications USING GIN(allowed_countries);
CREATE INDEX IF NOT EXISTS idx_applications_tiers ON core.applications USING GIN(required_subscription_tiers);

-- =====================================================
-- 2. TABLA: application_overrides
-- =====================================================

CREATE TABLE IF NOT EXISTS core.application_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relaciones
  application_id UUID NOT NULL REFERENCES core.applications(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  
  -- Override
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  
  -- Acceso temporal
  expires_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraint: una organización solo puede tener un override por aplicación
  CONSTRAINT unique_org_application_override UNIQUE (application_id, organization_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_application_overrides_app ON core.application_overrides(application_id);
CREATE INDEX IF NOT EXISTS idx_application_overrides_org ON core.application_overrides(organization_id);
CREATE INDEX IF NOT EXISTS idx_application_overrides_expires ON core.application_overrides(expires_at) WHERE expires_at IS NOT NULL;

-- Comentarios
COMMENT ON TABLE core.application_overrides IS 'Excepciones específicas por organización para aplicaciones';
COMMENT ON COLUMN core.application_overrides.expires_at IS 'Fecha de expiración para acceso temporal beta';

-- Trigger para actualizar updated_at
CREATE TRIGGER update_application_overrides_updated_at
  BEFORE UPDATE ON core.application_overrides
  FOR EACH ROW
  EXECUTE FUNCTION core.update_updated_at_column();

-- =====================================================
-- 3. FUNCIÓN: Verificar acceso a aplicación
-- =====================================================

CREATE OR REPLACE FUNCTION core.can_access_application(
  p_application_slug TEXT,
  p_organization_id UUID DEFAULT NULL,
  p_user_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_app core.applications%ROWTYPE;
  v_org_country TEXT;
  v_org_is_beta BOOLEAN;
  v_org_subscription_tier TEXT;
  v_has_override BOOLEAN;
  v_override_enabled BOOLEAN;
  v_override_expires TIMESTAMPTZ;
  v_is_platform_admin BOOLEAN;
BEGIN
  -- Obtener la aplicación
  SELECT * INTO v_app
  FROM core.applications
  WHERE slug = p_application_slug;
  
  -- Si no existe la aplicación, no hay acceso
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Si no está activa, no hay acceso (excepto override)
  IF NOT v_app.is_active THEN
    -- Verificar si hay override que la habilite
    IF p_organization_id IS NOT NULL THEN
      SELECT is_enabled, expires_at INTO v_override_enabled, v_override_expires
      FROM core.application_overrides
      WHERE application_id = v_app.id
        AND organization_id = p_organization_id;
      
      IF FOUND AND v_override_enabled THEN
        -- Verificar si el override no ha expirado
        IF v_override_expires IS NULL OR v_override_expires > NOW() THEN
          RETURN true;
        END IF;
      END IF;
    END IF;
    
    RETURN false;
  END IF;
  
  -- Verificar si el usuario es platform admin (acceso total)
  IF p_user_id IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1
      FROM core.organization_users ou
      JOIN core.organizations o ON o.id = ou.organization_id
      JOIN core.roles r ON r.id = ou.role_id
      WHERE ou.user_id = p_user_id
        AND o.org_type = 'platform'
        AND r.slug IN ('platform_super_admin', 'marketing_admin')
        AND ou.status = 'active'
    ) INTO v_is_platform_admin;
    
    IF v_is_platform_admin THEN
      RETURN true;
    END IF;
  END IF;
  
  -- Verificar nivel de visibilidad (si es NULL, tratar como 'public' para compatibilidad)
  CASE COALESCE(v_app.visibility_level, 'public')
    WHEN 'public' THEN
      -- Público: todos pueden acceder (verificar restricciones adicionales)
      NULL; -- Continuar con otras verificaciones
      
    WHEN 'platform_only' THEN
      -- Solo platform admins
      IF NOT v_is_platform_admin THEN
        RETURN false;
      END IF;
      
    WHEN 'beta' THEN
      -- Solo beta testers o platform admins
      IF NOT v_is_platform_admin THEN
        IF p_organization_id IS NULL THEN
          RETURN false;
        END IF;
        
        -- Verificar si la organización es beta tester
        SELECT is_beta_tester INTO v_org_is_beta
        FROM core.organizations
        WHERE id = p_organization_id;
        
        IF NOT COALESCE(v_org_is_beta, false) THEN
          -- Verificar si hay override
          SELECT is_enabled INTO v_has_override
          FROM core.application_overrides
          WHERE application_id = v_app.id
            AND organization_id = p_organization_id
            AND is_enabled = true
            AND (expires_at IS NULL OR expires_at > NOW());
          
          IF NOT COALESCE(v_has_override, false) THEN
            RETURN false;
          END IF;
        END IF;
      END IF;
      
    WHEN 'restricted' THEN
      -- Restringido: solo con override explícito
      IF p_organization_id IS NULL THEN
        RETURN false;
      END IF;
      
      SELECT is_enabled INTO v_has_override
      FROM core.application_overrides
      WHERE application_id = v_app.id
        AND organization_id = p_organization_id
        AND is_enabled = true
        AND (expires_at IS NULL OR expires_at > NOW());
      
      IF NOT COALESCE(v_has_override, false) THEN
        RETURN false;
      END IF;
  END CASE;
  
  -- Verificar restricción por país
  IF v_app.allowed_countries IS NOT NULL AND array_length(v_app.allowed_countries, 1) > 0 AND p_organization_id IS NOT NULL THEN
    SELECT country INTO v_org_country
    FROM core.organizations
    WHERE id = p_organization_id;
    
    IF v_org_country IS NOT NULL AND NOT (LOWER(v_org_country) = ANY(v_app.allowed_countries)) THEN
      RETURN false;
    END IF;
  END IF;
  
  -- Verificar restricción por tier de suscripción
  IF v_app.required_subscription_tiers IS NOT NULL AND array_length(v_app.required_subscription_tiers, 1) > 0 AND p_organization_id IS NOT NULL THEN
    -- Obtener el tier de la suscripción activa
    SELECT sp.slug INTO v_org_subscription_tier
    FROM core.organization_subscriptions os
    JOIN core.subscription_plans sp ON sp.id = os.plan_id
    WHERE os.organization_id = p_organization_id
      AND os.status = 'active'
    ORDER BY os.created_at DESC
    LIMIT 1;
    
    IF v_org_subscription_tier IS NOT NULL AND NOT (v_org_subscription_tier = ANY(v_app.required_subscription_tiers)) THEN
      RETURN false;
    END IF;
  END IF;
  
  -- Verificar override que deshabilite la aplicación
  IF p_organization_id IS NOT NULL THEN
    SELECT is_enabled INTO v_override_enabled
    FROM core.application_overrides
    WHERE application_id = v_app.id
      AND organization_id = p_organization_id;
    
    IF FOUND AND NOT v_override_enabled THEN
      RETURN false;
    END IF;
  END IF;
  
  -- Si llegamos aquí, tiene acceso
  RETURN true;
END;
$$;

COMMENT ON FUNCTION core.can_access_application IS 'Verifica si un usuario/organización puede acceder a una aplicación específica';

-- Función: Obtener lista de aplicaciones habilitadas para una organización
CREATE OR REPLACE FUNCTION core.get_enabled_applications(
  p_organization_id UUID,
  p_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  slug TEXT,
  name TEXT,
  category TEXT,
  visibility_level TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.slug,
    a.name,
    a.category,
    a.visibility_level
  FROM core.applications a
  WHERE core.can_access_application(a.slug, p_organization_id, p_user_id)
  ORDER BY a.category, a.name;
END;
$$;

COMMENT ON FUNCTION core.get_enabled_applications IS 'Retorna la lista de aplicaciones habilitadas para una organización/usuario';

-- =====================================================
-- 4. RLS POLICIES
-- =====================================================

ALTER TABLE core.application_overrides ENABLE ROW LEVEL SECURITY;

-- Políticas para application_overrides
-- Todos pueden leer sus propios overrides
CREATE POLICY "Users can read their organization overrides"
  ON core.application_overrides FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id
      FROM core.organization_users
      WHERE user_id = auth.uid()
        AND status = 'active'
    )
  );

-- Solo platform admins pueden crear/modificar overrides
CREATE POLICY "Platform admins can manage overrides"
  ON core.application_overrides FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM core.organization_users ou
      JOIN core.organizations o ON o.id = ou.organization_id
      JOIN core.roles r ON r.id = ou.role_id
      WHERE ou.user_id = auth.uid()
        AND o.org_type = 'platform'
        AND r.slug IN ('platform_super_admin', 'marketing_admin')
        AND ou.status = 'active'
    )
  );

-- =====================================================
-- 5. PERMISSIONS
-- =====================================================

GRANT SELECT ON core.application_overrides TO authenticated;
GRANT EXECUTE ON FUNCTION core.can_access_application TO authenticated;
GRANT EXECUTE ON FUNCTION core.get_enabled_applications TO authenticated;

-- =====================================================
-- 6. WRAPPERS EN PUBLIC PARA RPC
-- =====================================================

-- can_access_application
CREATE OR REPLACE FUNCTION public.can_access_application(
  p_application_slug TEXT,
  p_organization_id UUID DEFAULT NULL,
  p_user_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN core.can_access_application(p_application_slug, p_organization_id, p_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION public.can_access_application(TEXT, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_application(TEXT, UUID, UUID) TO service_role;

-- get_enabled_applications
CREATE OR REPLACE FUNCTION public.get_enabled_applications(
  p_organization_id UUID,
  p_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  slug TEXT,
  name TEXT,
  category TEXT,
  visibility_level TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM core.get_enabled_applications(p_organization_id, p_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION public.get_enabled_applications(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_enabled_applications(UUID, UUID) TO service_role;

-- =====================================================
-- 7. EXPOSER VISTAS PÚBLICAS
-- =====================================================

-- Vista pública de application_overrides
CREATE OR REPLACE VIEW public.application_overrides AS
SELECT 
  id,
  application_id,
  organization_id,
  is_enabled,
  expires_at,
  created_at,
  updated_at
FROM core.application_overrides;

COMMENT ON VIEW public.application_overrides IS 'Vista pública de core.application_overrides - Las RLS policies del schema core se aplican automáticamente';

-- =====================================================
-- 8. ACTUALIZAR APLICACIONES EXISTENTES CON VISIBILIDAD
-- =====================================================

-- Marketing Site: público
UPDATE core.applications 
SET visibility_level = 'public',
    allowed_countries = ARRAY[]::TEXT[]
WHERE slug = 'marketing_site';

-- CRM Sales: público pero requiere suscripción
UPDATE core.applications 
SET visibility_level = 'public',
    required_subscription_tiers = ARRAY['starter', 'pro', 'enterprise']::TEXT[]
WHERE slug = 'crm_sales';

-- Apps en beta: marcar como beta
UPDATE core.applications 
SET visibility_level = 'beta',
    is_beta = true
WHERE slug IN ('signatures', 'verifications', 'ai_customer_service', 'ai_document_review', 'analytics');

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Sistema de visibilidad integrado en core.applications';
  RAISE NOTICE '';
  RAISE NOTICE 'Campos agregados a core.applications:';
  RAISE NOTICE '  ✅ visibility_level';
  RAISE NOTICE '  ✅ allowed_countries';
  RAISE NOTICE '  ✅ required_subscription_tiers';
  RAISE NOTICE '';
  RAISE NOTICE 'Tabla creada:';
  RAISE NOTICE '  ✅ core.application_overrides';
  RAISE NOTICE '';
  RAISE NOTICE 'Funciones creadas:';
  RAISE NOTICE '  ✅ core.can_access_application(slug, org_id, user_id)';
  RAISE NOTICE '  ✅ core.get_enabled_applications(org_id, user_id)';
  RAISE NOTICE '';
  RAISE NOTICE 'Wrappers públicos:';
  RAISE NOTICE '  ✅ public.can_access_application()';
  RAISE NOTICE '  ✅ public.get_enabled_applications()';
END $$;

