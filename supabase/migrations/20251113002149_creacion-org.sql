-- Migration: Sistema de Onboarding y Creación Automática de Organizaciones
-- Description: Flujo completo para crear organizaciones personales/empresariales al registrarse
-- Created: 2024-11-13

-- =====================================================
-- 1. CREAR ROL org_owner SI NO EXISTE
-- =====================================================

INSERT INTO core.roles (name, slug, description, level, is_system, permissions) VALUES
(
  'Organization Owner',
  'org_owner',
  'Dueño de la organización - Acceso total a su organización',
  8,
  true,
  jsonb_build_object(
    '*', true,
    'crm', jsonb_build_object('*', true),
    'organization', jsonb_build_object('manage', true, 'delete', true),
    'users', jsonb_build_object('invite', true, 'manage', true),
    'billing', jsonb_build_object('*', true)
  )
) ON CONFLICT (slug) DO UPDATE SET
  description = EXCLUDED.description,
  permissions = EXCLUDED.permissions;

-- =====================================================
-- 2. FUNCIÓN: Crear Organización Personal (B2C)
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
  crm_app_id UUID;
BEGIN
  -- Verificar que el usuario no tenga ya una org personal
  IF EXISTS (
    SELECT 1 FROM core.organization_users ou
    JOIN core.organizations o ON o.id = ou.organization_id
    WHERE ou.user_id = create_personal_organization.user_id
    AND o.org_type = 'personal'
  ) THEN
    RAISE EXCEPTION 'User already has a personal organization';
  END IF;

  -- Crear entrada en core.users si no existe
  INSERT INTO core.users (id, first_name, status)
  VALUES (
    create_personal_organization.user_id,
    user_first_name,
    'active'
  )
  ON CONFLICT (id) DO UPDATE SET
    first_name = COALESCE(EXCLUDED.first_name, core.users.first_name),
    status = EXCLUDED.status;

  -- Crear organización personal
  INSERT INTO core.organizations (
    name,
    slug,
    org_type,
    status,
    email,
    settings
  ) VALUES (
    COALESCE(user_first_name, user_email),
    'personal-' || create_personal_organization.user_id,
    'personal',
    'trial',
    user_email,
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
  
  -- Asignar usuario como owner de su org personal
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
  
  -- Habilitar CRM para esta org (con límites de plan personal)
  SELECT id INTO crm_app_id
  FROM core.applications
  WHERE slug = 'crm_sales'
  LIMIT 1;
  
  IF crm_app_id IS NOT NULL THEN
    INSERT INTO core.organization_applications (
      organization_id,
      application_id,
      is_enabled,
      config
    ) VALUES (
      new_org_id,
      crm_app_id,
      true,
      jsonb_build_object(
        'max_contacts', 100,        -- Límite para plan personal
        'max_users', 1,              -- Solo el owner
        'email_integration', true,
        'custom_fields', true,
        'api_access', false,
        'automations', false
      )
    );
    
    -- Crear settings de CRM
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

GRANT EXECUTE ON FUNCTION public.create_personal_organization(UUID, TEXT, TEXT) TO authenticated;

COMMENT ON FUNCTION public.create_personal_organization IS
'Crea una organización personal automáticamente para usuario B2C. Incluye org, rol owner, y CRM con límites de plan personal.';

-- =====================================================
-- 3. FUNCIÓN: Crear Organización Empresarial (B2B)
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
  crm_app_id UUID;
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
    org_size,
    jsonb_build_object(
      'is_personal_org', false,
      'user_type', 'b2b'
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
  
  -- Habilitar CRM para esta org (con límites de plan business)
  SELECT id INTO crm_app_id
  FROM core.applications
  WHERE slug = 'crm_sales'
  LIMIT 1;
  
  IF crm_app_id IS NOT NULL THEN
    INSERT INTO core.organization_applications (
      organization_id,
      application_id,
      is_enabled,
      config
    ) VALUES (
      new_org_id,
      crm_app_id,
      true,
      jsonb_build_object(
        'max_contacts', 1000,        -- Límite para plan business
        'max_users', 5,               -- Hasta 5 usuarios
        'email_integration', true,
        'custom_fields', true,
        'api_access', true,
        'automations', false
      )
    );
    
    -- Crear settings de CRM
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

GRANT EXECUTE ON FUNCTION public.create_business_organization(UUID, TEXT, TEXT, TEXT, TEXT) TO authenticated;

COMMENT ON FUNCTION public.create_business_organization IS
'Crea una organización empresarial para usuario B2B. Incluye org, rol owner, y CRM con límites de plan business.';

-- =====================================================
-- 4. ACTUALIZAR can_access_crm PARA INCLUIR org_owner
-- =====================================================

CREATE OR REPLACE FUNCTION public.can_access_crm(user_id uuid)
RETURNS boolean AS $$
DECLARE
  has_access boolean;
BEGIN
  -- Verificar si el usuario tiene acceso al CRM:
  -- 1. Platform admins (siempre tienen acceso)
  -- 2. Org owner de cualquier org con CRM habilitado
  -- 3. CRM manager o sales rep
  
  SELECT EXISTS (
    SELECT 1
    FROM core.organization_users ou
    JOIN core.organizations o ON o.id = ou.organization_id
    JOIN core.roles r ON r.id = ou.role_id
    LEFT JOIN core.organization_applications oa ON oa.organization_id = o.id
    LEFT JOIN core.applications a ON a.id = oa.application_id AND a.slug = 'crm_sales'
    WHERE ou.user_id = can_access_crm.user_id
    AND ou.status = 'active'
    AND (
      -- Platform admins
      (o.org_type = 'platform' AND r.slug IN ('platform_super_admin', 'marketing_admin'))
      OR
      -- Org owner con CRM habilitado
      (r.slug = 'org_owner' AND oa.is_enabled = true)
      OR
      -- Roles específicos de CRM
      r.slug IN ('crm_manager', 'sales_rep', 'sales_manager')
    )
  ) INTO has_access;
  
  RETURN COALESCE(has_access, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.can_access_crm IS
'Verifica acceso al CRM: platform admins, org owners con CRM habilitado, o roles de CRM específicos';

-- =====================================================
-- 5. FUNCIÓN: Verificar si usuario completó onboarding
-- =====================================================

CREATE OR REPLACE FUNCTION public.user_has_organization(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM core.organization_users
    WHERE user_id = user_has_organization.user_id
    AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.user_has_organization(UUID) TO authenticated;

COMMENT ON FUNCTION public.user_has_organization IS
'Verifica si un usuario ya completó el onboarding y tiene una organización asignada';

-- =====================================================
-- 6. FUNCIÓN HELPER: Obtener org activa del usuario
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_user_active_organization(user_id UUID)
RETURNS TABLE (
  organization_id UUID,
  organization_name TEXT,
  organization_slug TEXT,
  organization_type TEXT,
  role_slug TEXT,
  role_level INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.name,
    o.slug,
    o.org_type,
    r.slug,
    r.level
  FROM core.organization_users ou
  JOIN core.organizations o ON o.id = ou.organization_id
  JOIN core.roles r ON r.id = ou.role_id
  WHERE ou.user_id = get_user_active_organization.user_id
  AND ou.status = 'active'
  ORDER BY 
    CASE 
      WHEN o.id = (SELECT last_active_organization_id FROM core.users WHERE id = get_user_active_organization.user_id)
      THEN 1 
      ELSE 2 
    END,
    ou.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_user_active_organization(UUID) TO authenticated;

COMMENT ON FUNCTION public.get_user_active_organization IS
'Obtiene la organización activa del usuario (última usada o la primera)';

-- =====================================================
-- 7. ACTUALIZAR RLS POLICIES PARA SUPER ADMIN
-- =====================================================

-- Función helper para verificar si es super admin
CREATE OR REPLACE FUNCTION public.is_platform_super_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM core.organization_users ou
    JOIN core.organizations o ON o.id = ou.organization_id
    JOIN core.roles r ON r.id = ou.role_id
    WHERE ou.user_id = is_platform_super_admin.user_id
    AND o.org_type = 'platform'
    AND r.slug = 'platform_super_admin'
    AND ou.status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION public.is_platform_super_admin(UUID) TO authenticated;

-- Política de super admin para ver TODO en CRM
-- Agregar a cada tabla de CRM

-- Contacts: Super admin puede ver todos
DROP POLICY IF EXISTS "Super admin can view all contacts" ON crm.contacts;
CREATE POLICY "Super admin can view all contacts"
ON crm.contacts FOR SELECT
USING (public.is_platform_super_admin(auth.uid()));

-- Companies: Super admin puede ver todas
DROP POLICY IF EXISTS "Super admin can view all companies" ON crm.companies;
CREATE POLICY "Super admin can view all companies"
ON crm.companies FOR SELECT
USING (public.is_platform_super_admin(auth.uid()));

-- Deals: Super admin puede ver todos
DROP POLICY IF EXISTS "Super admin can view all deals" ON crm.deals;
CREATE POLICY "Super admin can view all deals"
ON crm.deals FOR SELECT
USING (public.is_platform_super_admin(auth.uid()));

-- Tickets: Super admin puede ver todos
DROP POLICY IF EXISTS "Super admin can view all tickets" ON crm.tickets;
CREATE POLICY "Super admin can view all tickets"
ON crm.tickets FOR SELECT
USING (public.is_platform_super_admin(auth.uid()));

-- Products: Super admin puede ver todos
DROP POLICY IF EXISTS "Super admin can view all products" ON crm.products;
CREATE POLICY "Super admin can view all products"
ON crm.products FOR SELECT
USING (public.is_platform_super_admin(auth.uid()));

-- Quotes: Super admin puede ver todas
DROP POLICY IF EXISTS "Super admin can view all quotes" ON crm.quotes;
CREATE POLICY "Super admin can view all quotes"
ON crm.quotes FOR SELECT
USING (public.is_platform_super_admin(auth.uid()));

-- Activities: Super admin puede ver todas
DROP POLICY IF EXISTS "Super admin can view all activities" ON crm.activities;
CREATE POLICY "Super admin can view all activities"
ON crm.activities FOR SELECT
USING (public.is_platform_super_admin(auth.uid()));

-- Emails: Super admin puede ver todos
DROP POLICY IF EXISTS "Super admin can view all emails" ON crm.emails;
CREATE POLICY "Super admin can view all emails"
ON crm.emails FOR SELECT
USING (public.is_platform_super_admin(auth.uid()));

-- Notes: Super admin puede ver todas
DROP POLICY IF EXISTS "Super admin can view all notes" ON crm.notes;
CREATE POLICY "Super admin can view all notes"
ON crm.notes FOR SELECT
USING (public.is_platform_super_admin(auth.uid()));

-- Pipelines: Super admin puede ver todos
DROP POLICY IF EXISTS "Super admin can view all pipelines" ON crm.pipelines;
CREATE POLICY "Super admin can view all pipelines"
ON crm.pipelines FOR SELECT
USING (public.is_platform_super_admin(auth.uid()));

-- Settings: Super admin puede ver todos
DROP POLICY IF EXISTS "Super admin can view all settings" ON crm.settings;
CREATE POLICY "Super admin can view all settings"
ON crm.settings FOR SELECT
USING (public.is_platform_super_admin(auth.uid()));

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '🎉 ================================================';
  RAISE NOTICE '✅ Sistema de Onboarding Creado';
  RAISE NOTICE '🎉 ================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Funciones creadas:';
  RAISE NOTICE '  ✅ create_personal_organization() - Org personal B2C';
  RAISE NOTICE '  ✅ create_business_organization() - Org empresarial B2B';
  RAISE NOTICE '  ✅ user_has_organization() - Verifica onboarding';
  RAISE NOTICE '  ✅ get_user_active_organization() - Obtiene org activa';
  RAISE NOTICE '  ✅ is_platform_super_admin() - Verifica super admin';
  RAISE NOTICE '';
  RAISE NOTICE 'Roles actualizados:';
  RAISE NOTICE '  ✅ org_owner - Dueño de organización con acceso total';
  RAISE NOTICE '';
  RAISE NOTICE 'Permisos:';
  RAISE NOTICE '  ✅ can_access_crm() actualizado para org_owner';
  RAISE NOTICE '  ✅ Super admin puede ver TODOS los datos de TODAS las orgs';
  RAISE NOTICE '  ✅ Users normales solo ven datos de SU org';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  Próximos pasos:';
  RAISE NOTICE '  1. Crear página /onboarding en frontend';
  RAISE NOTICE '  2. Crear API routes /api/onboarding/*';
  RAISE NOTICE '  3. Modificar signUp para redirigir a /onboarding';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Onboarding multi-tenant B2C + B2B listo!';
  RAISE NOTICE '';
END $$;

