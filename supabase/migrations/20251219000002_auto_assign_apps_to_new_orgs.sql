-- =====================================================
-- Migration: Auto-assign Apps to New Organizations
-- Description: Actualizar funciones de creación de org para asignar apps automáticamente
-- Created: 2025-12-19
-- =====================================================

-- =====================================================
-- 1. FUNCIÓN HELPER: Asignar Apps a Nueva Organización
-- =====================================================

-- Esta función asigna todas las apps activas a una organización
-- Se puede llamar después de crear una org o manualmente para orgs existentes
CREATE OR REPLACE FUNCTION public.assign_default_apps_to_org(
  p_organization_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  app_record RECORD;
  assigned_count INTEGER := 0;
BEGIN
  -- Iterar sobre todas las apps activas
  FOR app_record IN 
    SELECT id, slug, default_config 
    FROM core.applications 
    WHERE is_active = true
  LOOP
    -- Insertar si no existe, actualizar si ya existe
    INSERT INTO core.organization_applications (
      organization_id,
      application_id,
      is_enabled,
      config,
      enabled_at
    )
    VALUES (
      p_organization_id,
      app_record.id,
      true,
      app_record.default_config,
      NOW()
    )
    ON CONFLICT (organization_id, application_id) DO UPDATE SET
      is_enabled = true,
      config = COALESCE(core.organization_applications.config, app_record.default_config),
      updated_at = NOW();
    
    assigned_count := assigned_count + 1;
  END LOOP;
  
  RETURN assigned_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.assign_default_apps_to_org(UUID) TO authenticated;

COMMENT ON FUNCTION public.assign_default_apps_to_org IS
'Asigna todas las apps activas a una organización. Útil para nuevas orgs o para reparar orgs existentes sin apps.';

-- =====================================================
-- 2. ACTUALIZAR create_business_organization
-- =====================================================

CREATE OR REPLACE FUNCTION public.create_business_organization(
  user_id UUID,
  user_email TEXT,
  org_name TEXT,
  org_industry TEXT DEFAULT NULL,
  org_size TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  new_org_id UUID;
  owner_role_id UUID;
  safe_slug TEXT;
BEGIN
  -- Crear entrada en core.users si no existe
  INSERT INTO core.users (id, status)
  VALUES (
    create_business_organization.user_id,
    'active'
  )
  ON CONFLICT (id) DO UPDATE SET
    status = EXCLUDED.status;

  -- Generar slug seguro desde nombre de empresa
  safe_slug := lower(regexp_replace(org_name, '[^a-zA-Z0-9]+', '-', 'g'));
  safe_slug := regexp_replace(safe_slug, '^-+|-+$', '', 'g');
  safe_slug := substring(safe_slug, 1, 50);
  
  -- Hacer slug único si ya existe
  IF EXISTS (SELECT 1 FROM core.organizations WHERE slug = safe_slug) THEN
    safe_slug := safe_slug || '-' || substring(create_business_organization.user_id::text, 1, 8);
  END IF;

  -- Crear organización empresarial
  INSERT INTO core.organizations (
    name,
    slug,
    org_type,
    status,
    industry,
    size_category,
    settings
  ) VALUES (
    org_name,
    safe_slug,
    'business',
    'trial',
    org_industry,
    CASE 
      WHEN org_size IN ('startup', 'small', 'medium', 'large', 'enterprise') THEN org_size
      ELSE NULL
    END,
    jsonb_build_object(
      'is_personal_org', false,
      'user_type', 'b2b',
      'size_text', org_size
    )
  )
  RETURNING id INTO new_org_id;
  
  -- Obtener rol de owner
  SELECT id INTO owner_role_id
  FROM core.roles
  WHERE slug = 'org_owner'
  LIMIT 1;
  
  -- Asignar usuario como owner
  INSERT INTO core.organization_users (
    organization_id,
    user_id,
    role_id,
    status
  ) VALUES (
    new_org_id,
    create_business_organization.user_id,
    owner_role_id,
    'active'
  );
  
  -- =====================================================
  -- NUEVO: Asignar TODAS las apps activas automáticamente
  -- =====================================================
  PERFORM public.assign_default_apps_to_org(new_org_id);
  
  -- Crear settings de CRM (si la app existe)
  IF EXISTS (
    SELECT 1 FROM core.organization_applications oa
    JOIN core.applications a ON a.id = oa.application_id
    WHERE oa.organization_id = new_org_id AND a.slug = 'crm_sales' AND oa.is_enabled = true
  ) THEN
    INSERT INTO crm.settings (organization_id)
    VALUES (new_org_id)
    ON CONFLICT (organization_id) DO NOTHING;
  END IF;
  
  -- Actualizar last_active_organization_id del usuario
  UPDATE core.users
  SET last_active_organization_id = new_org_id
  WHERE id = create_business_organization.user_id;
  
  RETURN new_org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 3. ACTUALIZAR create_personal_organization
-- =====================================================

CREATE OR REPLACE FUNCTION public.create_personal_organization(
  user_id UUID,
  user_email TEXT,
  user_first_name TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  new_org_id UUID;
  owner_role_id UUID;
BEGIN
  -- Verificar si ya tiene organización personal
  IF EXISTS (
    SELECT 1 FROM core.organizations o
    JOIN core.organization_users ou ON o.id = ou.organization_id
    WHERE ou.user_id = create_personal_organization.user_id
    AND o.org_type = 'personal'
    AND o.deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'El usuario ya tiene una organización personal';
  END IF;

  -- Crear entrada en core.users si no existe
  INSERT INTO core.users (id, status)
  VALUES (
    create_personal_organization.user_id,
    'active'
  )
  ON CONFLICT (id) DO UPDATE SET
    status = EXCLUDED.status;

  -- Crear organización personal
  INSERT INTO core.organizations (
    name,
    slug,
    org_type,
    status,
    settings
  ) VALUES (
    COALESCE(user_first_name, 'Cuenta Personal'),
    'personal-' || create_personal_organization.user_id,
    'personal',
    'active',
    jsonb_build_object(
      'is_personal_org', true,
      'user_type', 'b2c'
    )
  )
  RETURNING id INTO new_org_id;
  
  -- Obtener rol de owner
  SELECT id INTO owner_role_id
  FROM core.roles
  WHERE slug = 'org_owner'
  LIMIT 1;
  
  -- Asignar usuario como owner
  INSERT INTO core.organization_users (
    organization_id,
    user_id,
    role_id,
    status
  ) VALUES (
    new_org_id,
    create_personal_organization.user_id,
    owner_role_id,
    'active'
  );
  
  -- =====================================================
  -- NUEVO: Asignar TODAS las apps activas automáticamente
  -- =====================================================
  PERFORM public.assign_default_apps_to_org(new_org_id);
  
  -- Crear settings de CRM (si la app existe)
  IF EXISTS (
    SELECT 1 FROM core.organization_applications oa
    JOIN core.applications a ON a.id = oa.application_id
    WHERE oa.organization_id = new_org_id AND a.slug = 'crm_sales' AND oa.is_enabled = true
  ) THEN
    INSERT INTO crm.settings (organization_id)
    VALUES (new_org_id)
    ON CONFLICT (organization_id) DO NOTHING;
  END IF;
  
  -- Actualizar last_active_organization_id del usuario
  UPDATE core.users
  SET last_active_organization_id = new_org_id
  WHERE id = create_personal_organization.user_id;
  
  RETURN new_org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
DECLARE
  active_apps INTEGER;
BEGIN 
  SELECT COUNT(*) INTO active_apps FROM core.applications WHERE is_active = true;
  
  RAISE NOTICE '✅ Funciones de creación de organización actualizadas';
  RAISE NOTICE '';
  RAISE NOTICE 'Cambios realizados:';
  RAISE NOTICE '  ✅ Nueva función: assign_default_apps_to_org()';
  RAISE NOTICE '  ✅ create_business_organization() ahora asigna % apps activas', active_apps;
  RAISE NOTICE '  ✅ create_personal_organization() ahora asigna % apps activas', active_apps;
  RAISE NOTICE '';
  RAISE NOTICE 'Para asignar apps a orgs existentes:';
  RAISE NOTICE '  SELECT assign_default_apps_to_org(''org-uuid-here'');';
END $$;

