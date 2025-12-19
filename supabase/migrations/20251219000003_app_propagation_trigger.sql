-- =====================================================
-- Migration: Trigger para Propagar Cambios de is_active
-- Description: Cuando una app se desactiva/activa en admin, propagar a organization_applications
-- Created: 2025-12-19
-- =====================================================

-- =====================================================
-- 1. FUNCIÓN TRIGGER: Propagar Cambios de is_active
-- =====================================================

CREATE OR REPLACE FUNCTION core.propagate_application_active_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo actuar si is_active cambió
  IF OLD.is_active IS DISTINCT FROM NEW.is_active THEN
    IF NEW.is_active = false THEN
      -- Desactivar la app para TODAS las organizaciones
      UPDATE core.organization_applications
      SET 
        is_enabled = false,
        updated_at = NOW()
      WHERE application_id = NEW.id
        AND is_enabled = true;
      
      RAISE NOTICE 'App % desactivada globalmente. organization_applications actualizadas.', NEW.slug;
    ELSE
      -- Cuando se reactiva una app, NO reactivar automáticamente para las orgs
      -- Esto es intencional: el admin debe reactivar manualmente por org si lo desea
      RAISE NOTICE 'App % reactivada. Las organizaciones deben habilitarla individualmente.', NEW.slug;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 2. CREAR TRIGGER EN applications
-- =====================================================

-- Eliminar trigger si existe
DROP TRIGGER IF EXISTS trigger_propagate_app_active_status ON core.applications;

-- Crear trigger
CREATE TRIGGER trigger_propagate_app_active_status
  AFTER UPDATE OF is_active ON core.applications
  FOR EACH ROW
  EXECUTE FUNCTION core.propagate_application_active_status();

COMMENT ON FUNCTION core.propagate_application_active_status IS
'Cuando is_active cambia a false en applications, desactiva la app para todas las organizaciones.
Cuando se reactiva (is_active=true), las organizaciones deben habilitarla manualmente.';

-- =====================================================
-- 3. FUNCIÓN HELPER: Toggle App para Organización
-- =====================================================

CREATE OR REPLACE FUNCTION public.toggle_organization_app(
  p_organization_id UUID,
  p_application_id UUID,
  p_is_enabled BOOLEAN
)
RETURNS JSONB AS $$
DECLARE
  app_record RECORD;
  result JSONB;
BEGIN
  -- Verificar que la app existe y está activa globalmente
  SELECT id, slug, name, is_active, default_config
  INTO app_record
  FROM core.applications
  WHERE id = p_application_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Aplicación no encontrada');
  END IF;
  
  IF NOT app_record.is_active AND p_is_enabled THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'No se puede habilitar una aplicación que está desactivada globalmente'
    );
  END IF;
  
  -- Upsert en organization_applications
  INSERT INTO core.organization_applications (
    organization_id,
    application_id,
    is_enabled,
    config,
    enabled_at
  )
  VALUES (
    p_organization_id,
    p_application_id,
    p_is_enabled,
    app_record.default_config,
    CASE WHEN p_is_enabled THEN NOW() ELSE NULL END
  )
  ON CONFLICT (organization_id, application_id) DO UPDATE SET
    is_enabled = p_is_enabled,
    updated_at = NOW(),
    enabled_at = CASE WHEN p_is_enabled THEN COALESCE(core.organization_applications.enabled_at, NOW()) ELSE NULL END;
  
  RETURN jsonb_build_object(
    'success', true,
    'organization_id', p_organization_id,
    'application_id', p_application_id,
    'application_slug', app_record.slug,
    'is_enabled', p_is_enabled
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.toggle_organization_app(UUID, UUID, BOOLEAN) TO authenticated;

COMMENT ON FUNCTION public.toggle_organization_app IS
'Habilita o deshabilita una aplicación para una organización específica.
Solo permite habilitar si la app está activa globalmente.';

-- =====================================================
-- 4. FUNCIÓN: Obtener Apps de una Organización
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_organization_apps(
  p_organization_id UUID
)
RETURNS TABLE (
  application_id UUID,
  application_slug TEXT,
  application_name TEXT,
  application_description TEXT,
  application_category TEXT,
  is_globally_active BOOLEAN,
  is_enabled_for_org BOOLEAN,
  enabled_at TIMESTAMPTZ,
  config JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id as application_id,
    a.slug as application_slug,
    a.name as application_name,
    a.description as application_description,
    a.category as application_category,
    a.is_active as is_globally_active,
    COALESCE(oa.is_enabled, false) as is_enabled_for_org,
    oa.enabled_at,
    COALESCE(oa.config, a.default_config) as config
  FROM core.applications a
  LEFT JOIN core.organization_applications oa 
    ON oa.application_id = a.id 
    AND oa.organization_id = p_organization_id
  ORDER BY a.category, a.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION public.get_organization_apps(UUID) TO authenticated;

COMMENT ON FUNCTION public.get_organization_apps IS
'Retorna todas las aplicaciones con su estado para una organización específica.';

-- =====================================================
-- 5. FUNCIÓN: Obtener Organizaciones por App
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_application_organizations(
  p_application_id UUID
)
RETURNS TABLE (
  organization_id UUID,
  organization_name TEXT,
  organization_slug TEXT,
  organization_type TEXT,
  organization_status TEXT,
  is_enabled BOOLEAN,
  enabled_at TIMESTAMPTZ,
  config JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id as organization_id,
    o.name as organization_name,
    o.slug as organization_slug,
    o.org_type as organization_type,
    o.status::TEXT as organization_status,
    COALESCE(oa.is_enabled, false) as is_enabled,
    oa.enabled_at,
    oa.config
  FROM core.organizations o
  LEFT JOIN core.organization_applications oa 
    ON oa.organization_id = o.id 
    AND oa.application_id = p_application_id
  WHERE o.deleted_at IS NULL
    AND o.org_type != 'platform'  -- Excluir la org platform
  ORDER BY oa.is_enabled DESC NULLS LAST, o.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION public.get_application_organizations(UUID) TO authenticated;

COMMENT ON FUNCTION public.get_application_organizations IS
'Retorna todas las organizaciones con su estado para una aplicación específica.';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Sistema de gestión de apps por organización configurado';
  RAISE NOTICE '';
  RAISE NOTICE 'Trigger creado:';
  RAISE NOTICE '  ✅ trigger_propagate_app_active_status - Propaga desactivación global';
  RAISE NOTICE '';
  RAISE NOTICE 'Funciones helper:';
  RAISE NOTICE '  ✅ toggle_organization_app(org_id, app_id, enabled) - Toggle individual';
  RAISE NOTICE '  ✅ get_organization_apps(org_id) - Lista apps de una org';
  RAISE NOTICE '  ✅ get_application_organizations(app_id) - Lista orgs de una app';
  RAISE NOTICE '';
  RAISE NOTICE 'Comportamiento:';
  RAISE NOTICE '  - Al desactivar app en admin → Se desactiva para TODAS las orgs';
  RAISE NOTICE '  - Al reactivar app en admin → Las orgs deben habilitarla manualmente';
  RAISE NOTICE '  - No se puede habilitar app para org si está desactivada globalmente';
END $$;
