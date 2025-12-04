-- =====================================================
-- Migration: Sistema de Feature Flags
-- Description: Sistema completo de control de visibilidad de features, apps y servicios
-- Created: 2025-12-04
-- =====================================================

SET search_path TO core, public, extensions;

-- =====================================================
-- 1. ENUMS
-- =====================================================

CREATE TYPE core.feature_category AS ENUM ('app', 'feature', 'service', 'page', 'integration');
CREATE TYPE core.visibility_level AS ENUM ('public', 'platform_only', 'beta', 'restricted');

-- =====================================================
-- 2. TABLA: feature_flags
-- =====================================================

CREATE TABLE core.feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificación
  slug TEXT UNIQUE NOT NULL CHECK (slug ~ '^[a-z][a-z0-9_]*[a-z0-9]$'),
  name TEXT NOT NULL CHECK (length(name) >= 2 AND length(name) <= 100),
  description TEXT,
  
  -- Categorización
  category core.feature_category NOT NULL DEFAULT 'feature',
  
  -- Estado global
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  
  -- Nivel de visibilidad
  visibility_level core.visibility_level NOT NULL DEFAULT 'restricted',
  
  -- Restricciones geográficas
  allowed_countries TEXT[] DEFAULT '{}',
  
  -- Restricciones por suscripción
  required_subscription_tiers TEXT[] DEFAULT '{}',
  
  -- Beta testing
  beta_end_date TIMESTAMPTZ,
  
  -- Configuración adicional (JSONB)
  config JSONB NOT NULL DEFAULT '{}',
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_beta_end_date CHECK (
    beta_end_date IS NULL OR beta_end_date > created_at
  )
);

-- Índices
CREATE INDEX idx_feature_flags_slug ON core.feature_flags(slug);
CREATE INDEX idx_feature_flags_category ON core.feature_flags(category);
CREATE INDEX idx_feature_flags_enabled ON core.feature_flags(is_enabled) WHERE is_enabled = true;
CREATE INDEX idx_feature_flags_visibility ON core.feature_flags(visibility_level);
CREATE INDEX idx_feature_flags_countries ON core.feature_flags USING GIN(allowed_countries);

-- Comentarios
COMMENT ON TABLE core.feature_flags IS 'Sistema de control de visibilidad de features y aplicaciones';
COMMENT ON COLUMN core.feature_flags.slug IS 'Identificador único del feature (ej: crm_sales, signatures)';
COMMENT ON COLUMN core.feature_flags.visibility_level IS 'Nivel de visibilidad: public, platform_only, beta, restricted';
COMMENT ON COLUMN core.feature_flags.allowed_countries IS 'Array de códigos de países permitidos (ej: [cl, mx])';
COMMENT ON COLUMN core.feature_flags.required_subscription_tiers IS 'Array de tiers requeridos (ej: [pro, enterprise])';
COMMENT ON COLUMN core.feature_flags.config IS 'Configuración adicional en formato JSONB';

-- =====================================================
-- 3. TABLA: feature_flag_overrides
-- =====================================================

CREATE TABLE core.feature_flag_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relaciones
  feature_flag_id UUID NOT NULL REFERENCES core.feature_flags(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  
  -- Override
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  
  -- Acceso temporal
  expires_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraint: una organización solo puede tener un override por feature
  CONSTRAINT unique_org_feature_override UNIQUE (feature_flag_id, organization_id)
);

-- Índices
CREATE INDEX idx_feature_flag_overrides_feature ON core.feature_flag_overrides(feature_flag_id);
CREATE INDEX idx_feature_flag_overrides_org ON core.feature_flag_overrides(organization_id);
CREATE INDEX idx_feature_flag_overrides_expires ON core.feature_flag_overrides(expires_at) WHERE expires_at IS NOT NULL;

-- Comentarios
COMMENT ON TABLE core.feature_flag_overrides IS 'Excepciones específicas por organización para feature flags';
COMMENT ON COLUMN core.feature_flag_overrides.expires_at IS 'Fecha de expiración para acceso beta temporal';

-- =====================================================
-- 4. MODIFICAR: core.organizations
-- =====================================================

-- Agregar campo is_beta_tester si no existe
ALTER TABLE core.organizations 
ADD COLUMN IF NOT EXISTS is_beta_tester BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN core.organizations.is_beta_tester IS 'Indica si la organización tiene acceso a features en beta';

-- =====================================================
-- 5. FUNCIONES HELPER
-- =====================================================

-- Función: Verificar si un usuario/organización puede acceder a un feature
CREATE OR REPLACE FUNCTION core.can_access_feature(
  p_feature_slug TEXT,
  p_organization_id UUID DEFAULT NULL,
  p_user_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_feature core.feature_flags%ROWTYPE;
  v_org_country TEXT;
  v_org_is_beta BOOLEAN;
  v_org_subscription_tier TEXT;
  v_has_override BOOLEAN;
  v_override_enabled BOOLEAN;
  v_override_expires TIMESTAMPTZ;
  v_is_platform_admin BOOLEAN;
BEGIN
  -- Obtener el feature flag
  SELECT * INTO v_feature
  FROM core.feature_flags
  WHERE slug = p_feature_slug;
  
  -- Si no existe el feature, no hay acceso
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Si está deshabilitado globalmente, no hay acceso (excepto override)
  IF NOT v_feature.is_enabled THEN
    -- Verificar si hay override que lo habilite
    IF p_organization_id IS NOT NULL THEN
      SELECT is_enabled, expires_at INTO v_override_enabled, v_override_expires
      FROM core.feature_flag_overrides
      WHERE feature_flag_id = v_feature.id
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
  
  -- Verificar nivel de visibilidad
  CASE v_feature.visibility_level
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
          FROM core.feature_flag_overrides
          WHERE feature_flag_id = v_feature.id
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
      FROM core.feature_flag_overrides
      WHERE feature_flag_id = v_feature.id
        AND organization_id = p_organization_id
        AND is_enabled = true
        AND (expires_at IS NULL OR expires_at > NOW());
      
      IF NOT COALESCE(v_has_override, false) THEN
        RETURN false;
      END IF;
  END CASE;
  
  -- Verificar restricción por país
  IF array_length(v_feature.allowed_countries, 1) > 0 AND p_organization_id IS NOT NULL THEN
    SELECT country INTO v_org_country
    FROM core.organizations
    WHERE id = p_organization_id;
    
    IF v_org_country IS NOT NULL AND NOT (v_org_country = ANY(v_feature.allowed_countries)) THEN
      RETURN false;
    END IF;
  END IF;
  
  -- Verificar restricción por tier de suscripción
  IF array_length(v_feature.required_subscription_tiers, 1) > 0 AND p_organization_id IS NOT NULL THEN
    -- Obtener el tier de la suscripción activa
    SELECT sp.slug INTO v_org_subscription_tier
    FROM core.organization_subscriptions os
    JOIN core.subscription_plans sp ON sp.id = os.plan_id
    WHERE os.organization_id = p_organization_id
      AND os.status = 'active'
    ORDER BY os.created_at DESC
    LIMIT 1;
    
    IF v_org_subscription_tier IS NOT NULL AND NOT (v_org_subscription_tier = ANY(v_feature.required_subscription_tiers)) THEN
      RETURN false;
    END IF;
  END IF;
  
  -- Verificar override que deshabilite el feature
  IF p_organization_id IS NOT NULL THEN
    SELECT is_enabled INTO v_override_enabled
    FROM core.feature_flag_overrides
    WHERE feature_flag_id = v_feature.id
      AND organization_id = p_organization_id;
    
    IF FOUND AND NOT v_override_enabled THEN
      RETURN false;
    END IF;
  END IF;
  
  -- Si llegamos aquí, tiene acceso
  RETURN true;
END;
$$;

COMMENT ON FUNCTION core.can_access_feature IS 'Verifica si un usuario/organización puede acceder a un feature específico';

-- Función: Obtener lista de features habilitados para una organización
CREATE OR REPLACE FUNCTION core.get_enabled_features(
  p_organization_id UUID,
  p_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
  slug TEXT,
  name TEXT,
  category core.feature_category,
  visibility_level core.visibility_level
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ff.slug,
    ff.name,
    ff.category,
    ff.visibility_level
  FROM core.feature_flags ff
  WHERE core.can_access_feature(ff.slug, p_organization_id, p_user_id)
  ORDER BY ff.category, ff.name;
END;
$$;

COMMENT ON FUNCTION core.get_enabled_features IS 'Retorna la lista de features habilitados para una organización/usuario';

-- =====================================================
-- 6. TRIGGERS
-- =====================================================

-- Trigger para actualizar updated_at
CREATE TRIGGER update_feature_flags_updated_at
  BEFORE UPDATE ON core.feature_flags
  FOR EACH ROW
  EXECUTE FUNCTION core.update_updated_at_column();

CREATE TRIGGER update_feature_flag_overrides_updated_at
  BEFORE UPDATE ON core.feature_flag_overrides
  FOR EACH ROW
  EXECUTE FUNCTION core.update_updated_at_column();

-- =====================================================
-- 7. RLS POLICIES
-- =====================================================

ALTER TABLE core.feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.feature_flag_overrides ENABLE ROW LEVEL SECURITY;

-- Políticas para feature_flags
-- Todos pueden leer (necesario para verificar acceso)
CREATE POLICY "Anyone can read feature flags"
  ON core.feature_flags FOR SELECT
  TO authenticated
  USING (true);

-- Solo platform admins pueden modificar
CREATE POLICY "Platform admins can manage feature flags"
  ON core.feature_flags FOR ALL
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

-- Políticas para feature_flag_overrides
-- Todos pueden leer sus propios overrides
CREATE POLICY "Users can read their organization overrides"
  ON core.feature_flag_overrides FOR SELECT
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
  ON core.feature_flag_overrides FOR ALL
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
-- 8. PERMISSIONS
-- =====================================================

-- Grant permissions
GRANT SELECT ON core.feature_flags TO authenticated;
GRANT SELECT ON core.feature_flag_overrides TO authenticated;
GRANT EXECUTE ON FUNCTION core.can_access_feature TO authenticated;
GRANT EXECUTE ON FUNCTION core.get_enabled_features TO authenticated;

-- =====================================================
-- 9. EXPOSER VISTAS PÚBLICAS
-- =====================================================

-- Vista pública de feature_flags
CREATE OR REPLACE VIEW public.feature_flags AS
SELECT 
  id,
  slug,
  name,
  description,
  category,
  is_enabled,
  visibility_level,
  allowed_countries,
  required_subscription_tiers,
  beta_end_date,
  config,
  created_at,
  updated_at
FROM core.feature_flags;

COMMENT ON VIEW public.feature_flags IS 'Vista pública de core.feature_flags - Las RLS policies del schema core se aplican automáticamente';

-- Vista pública de feature_flag_overrides
CREATE OR REPLACE VIEW public.feature_flag_overrides AS
SELECT 
  id,
  feature_flag_id,
  organization_id,
  is_enabled,
  expires_at,
  created_at,
  updated_at
FROM core.feature_flag_overrides;

COMMENT ON VIEW public.feature_flag_overrides IS 'Vista pública de core.feature_flag_overrides - Las RLS policies del schema core se aplican automáticamente';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Sistema de Feature Flags creado exitosamente';
  RAISE NOTICE '';
  RAISE NOTICE 'Tablas creadas:';
  RAISE NOTICE '  ✅ core.feature_flags';
  RAISE NOTICE '  ✅ core.feature_flag_overrides';
  RAISE NOTICE '';
  RAISE NOTICE 'Funciones creadas:';
  RAISE NOTICE '  ✅ core.can_access_feature(slug, org_id, user_id)';
  RAISE NOTICE '  ✅ core.get_enabled_features(org_id, user_id)';
  RAISE NOTICE '';
  RAISE NOTICE 'Campo agregado:';
  RAISE NOTICE '  ✅ core.organizations.is_beta_tester';
  RAISE NOTICE '';
  RAISE NOTICE 'Vistas públicas:';
  RAISE NOTICE '  ✅ public.feature_flags';
  RAISE NOTICE '  ✅ public.feature_flag_overrides';
END $$;





