-- =====================================================
-- Migration: Roles Base Completos para Sistema Multi-Tenant
-- Description: Crear roles faltantes y actualizar permisos de roles existentes
-- Created: 2025-11-20
-- =====================================================

-- =====================================================
-- 1. CREAR ROLES FALTANTES
-- =====================================================

-- Rol: org_admin (nivel 6)
-- Admin de organización sin acceso a billing
INSERT INTO core.roles (name, slug, description, level, is_system, permissions) VALUES
(
  'Organization Admin',
  'org_admin',
  'Administrador de organización - Gestiona usuarios y configuración sin acceso a facturación',
  6,
  true,
  jsonb_build_object(
    'organization', jsonb_build_object(
      'view', true,
      'update', true,
      'settings', true
    ),
    'users', jsonb_build_object(
      'view', true,
      'invite', true,
      'manage', true,
      'remove', true
    ),
    'teams', jsonb_build_object(
      'view', true,
      'create', true,
      'update', true,
      'delete', true
    ),
    'crm', jsonb_build_object(
      'view', true,
      'contacts', true,
      'companies', true,
      'deals', true,
      'tickets', true,
      'reports', true
    ),
    'applications', jsonb_build_object(
      'view', true
    )
  )
) ON CONFLICT (slug) DO UPDATE SET
  description = EXCLUDED.description,
  permissions = EXCLUDED.permissions;

-- Rol: org_member (nivel 3)
-- Miembro básico de organización
INSERT INTO core.roles (name, slug, description, level, is_system, permissions) VALUES
(
  'Organization Member',
  'org_member',
  'Miembro básico de organización - Acceso limitado de solo lectura',
  3,
  true,
  jsonb_build_object(
    'organization', jsonb_build_object(
      'view', true
    ),
    'users', jsonb_build_object(
      'view', true
    ),
    'crm', jsonb_build_object(
      'view', true,
      'contacts', true,
      'companies', true
    )
  )
) ON CONFLICT (slug) DO UPDATE SET
  description = EXCLUDED.description,
  permissions = EXCLUDED.permissions;

-- Rol: crm_manager (nivel 5)
-- Manager de CRM con todas las funciones
INSERT INTO core.roles (name, slug, description, level, is_system, permissions) VALUES
(
  'CRM Manager',
  'crm_manager',
  'Gestor de CRM - Acceso completo a todas las funciones de CRM y reportes',
  5,
  true,
  jsonb_build_object(
    'crm', jsonb_build_object(
      '*', true,
      'contacts', true,
      'companies', true,
      'deals', true,
      'tickets', true,
      'products', true,
      'quotes', true,
      'activities', true,
      'emails', true,
      'notes', true,
      'pipelines', true,
      'reports', true,
      'export', true,
      'import', true,
      'bulk_actions', true,
      'settings', true
    ),
    'users', jsonb_build_object(
      'view', true
    ),
    'teams', jsonb_build_object(
      'view', true
    )
  )
) ON CONFLICT (slug) DO UPDATE SET
  description = EXCLUDED.description,
  permissions = EXCLUDED.permissions;

-- Rol: sales_rep (nivel 4)
-- Representante de ventas con acceso limitado
INSERT INTO core.roles (name, slug, description, level, is_system, permissions) VALUES
(
  'Sales Representative',
  'sales_rep',
  'Representante de ventas - Gestiona contactos, deals y cotizaciones asignados',
  4,
  true,
  jsonb_build_object(
    'crm', jsonb_build_object(
      'view', true,
      'contacts', true,
      'companies', true,
      'deals', jsonb_build_object(
        'view', true,
        'create', true,
        'update_own', true,
        'view_all', true
      ),
      'tickets', jsonb_build_object(
        'view_own', true,
        'create', true
      ),
      'products', jsonb_build_object(
        'view', true
      ),
      'quotes', jsonb_build_object(
        'view', true,
        'create', true,
        'update_own', true
      ),
      'activities', jsonb_build_object(
        'view', true,
        'create', true,
        'update_own', true
      ),
      'emails', jsonb_build_object(
        'view', true,
        'send', true
      ),
      'notes', jsonb_build_object(
        'view', true,
        'create', true,
        'update_own', true
      ),
      'reports', jsonb_build_object(
        'view_own', true
      )
    )
  )
) ON CONFLICT (slug) DO UPDATE SET
  description = EXCLUDED.description,
  permissions = EXCLUDED.permissions;

-- Rol: support_agent (nivel 4)
-- Agente de soporte para tickets
INSERT INTO core.roles (name, slug, description, level, is_system, permissions) VALUES
(
  'Support Agent',
  'support_agent',
  'Agente de soporte - Gestiona tickets y comunicación con clientes',
  4,
  true,
  jsonb_build_object(
    'crm', jsonb_build_object(
      'view', true,
      'contacts', jsonb_build_object(
        'view', true,
        'update', true
      ),
      'companies', jsonb_build_object(
        'view', true
      ),
      'tickets', jsonb_build_object(
        'view', true,
        'create', true,
        'update', true,
        'assign', true,
        'resolve', true,
        'reopen', true
      ),
      'activities', jsonb_build_object(
        'view', true,
        'create', true
      ),
      'emails', jsonb_build_object(
        'view', true,
        'send', true,
        'reply', true
      ),
      'notes', jsonb_build_object(
        'view', true,
        'create', true,
        'update_own', true
      ),
      'reports', jsonb_build_object(
        'view_tickets', true
      )
    )
  )
) ON CONFLICT (slug) DO UPDATE SET
  description = EXCLUDED.description,
  permissions = EXCLUDED.permissions;

-- =====================================================
-- 2. ACTUALIZAR PERMISOS DE ROLES EXISTENTES
-- =====================================================

-- Actualizar platform_super_admin con permisos más explícitos
UPDATE core.roles
SET permissions = jsonb_build_object(
  'platform', jsonb_build_object('*', true),
  'marketing', jsonb_build_object('*', true),
  'crm', jsonb_build_object('*', true),
  'signatures', jsonb_build_object('*', true),
  'verifications', jsonb_build_object('*', true),
  'ai_customer_service', jsonb_build_object('*', true),
  'ai_document_review', jsonb_build_object('*', true),
  'analytics', jsonb_build_object('*', true),
  'users', jsonb_build_object('*', true),
  'organizations', jsonb_build_object('*', true),
  'roles', jsonb_build_object('*', true),
  'applications', jsonb_build_object('*', true),
  'subscriptions', jsonb_build_object('*', true),
  'system', jsonb_build_object('*', true)
)
WHERE slug = 'platform_super_admin';

-- Actualizar marketing_admin con permisos más específicos
UPDATE core.roles
SET permissions = jsonb_build_object(
  'marketing', jsonb_build_object(
    'blog_posts', true,
    'blog_categories', true,
    'kb_articles', true,
    'kb_categories', true,
    'faqs', true,
    'testimonials', true,
    'case_studies', true,
    'newsletter', true,
    'contacts', true,
    'waitlist', true,
    'reviews', true,
    'media', true
  ),
  'analytics', jsonb_build_object(
    'view_marketing', true
  )
)
WHERE slug = 'marketing_admin';

-- Actualizar org_owner con permisos más completos
UPDATE core.roles
SET permissions = jsonb_build_object(
  '*', true,
  'organization', jsonb_build_object(
    '*', true,
    'manage', true,
    'delete', true,
    'settings', true
  ),
  'users', jsonb_build_object(
    '*', true,
    'invite', true,
    'manage', true,
    'remove', true
  ),
  'teams', jsonb_build_object('*', true),
  'billing', jsonb_build_object(
    '*', true,
    'view', true,
    'update', true,
    'cancel', true
  ),
  'crm', jsonb_build_object('*', true),
  'signatures', jsonb_build_object('*', true),
  'verifications', jsonb_build_object('*', true),
  'applications', jsonb_build_object(
    'view', true,
    'enable', true,
    'disable', true,
    'configure', true
  ),
  'api_keys', jsonb_build_object(
    'view', true,
    'create', true,
    'revoke', true
  ),
  'analytics', jsonb_build_object(
    'view_organization', true
  )
)
WHERE slug = 'org_owner';

-- Actualizar sales_manager con permisos alineados
UPDATE core.roles
SET permissions = jsonb_build_object(
  'crm', jsonb_build_object(
    'leads', true,
    'contacts', true,
    'companies', true,
    'deals', true,
    'tickets', jsonb_build_object(
      'view', true
    ),
    'products', true,
    'quotes', true,
    'activities', true,
    'emails', true,
    'send_emails', true,
    'notes', true,
    'reports', true,
    'export', true
  ),
  'users', jsonb_build_object(
    'view', true
  ),
  'teams', jsonb_build_object(
    'view', true,
    'manage_sales', true
  )
)
WHERE slug = 'sales_manager';

-- =====================================================
-- 3. FUNCIÓN HELPER: Verificar Permisos
-- =====================================================

-- Función para verificar si usuario tiene un permiso específico
CREATE OR REPLACE FUNCTION public.user_has_permission(
  user_id UUID,
  org_id UUID,
  permission_path TEXT[]
)
RETURNS BOOLEAN AS $$
DECLARE
  user_permissions JSONB;
  current_permission JSONB;
  path_element TEXT;
BEGIN
  -- Obtener permisos del rol del usuario en la organización
  SELECT r.permissions INTO user_permissions
  FROM core.organization_users ou
  JOIN core.roles r ON r.id = ou.role_id
  WHERE ou.user_id = user_has_permission.user_id
  AND ou.organization_id = org_id
  AND ou.status = 'active'
  LIMIT 1;
  
  IF user_permissions IS NULL THEN
    RETURN false;
  END IF;
  
  -- Si tiene permiso wildcard en root, tiene todos los permisos
  IF user_permissions->>'*' = 'true' THEN
    RETURN true;
  END IF;
  
  -- Navegar por el path de permisos
  current_permission := user_permissions;
  
  FOREACH path_element IN ARRAY permission_path
  LOOP
    -- Verificar wildcard en este nivel
    IF current_permission->>'*' = 'true' THEN
      RETURN true;
    END IF;
    
    -- Navegar al siguiente nivel
    current_permission := current_permission->path_element;
    
    IF current_permission IS NULL THEN
      RETURN false;
    END IF;
    
    -- Si el valor es true boolean, tiene el permiso
    IF jsonb_typeof(current_permission) = 'boolean' AND current_permission::text = 'true' THEN
      RETURN true;
    END IF;
  END LOOP;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION public.user_has_permission(UUID, UUID, TEXT[]) TO authenticated;

COMMENT ON FUNCTION public.user_has_permission IS
'Verifica si un usuario tiene un permiso específico en una organización navegando por el path de permisos JSONB';

-- Función shortcut para verificar permisos del usuario actual
CREATE OR REPLACE FUNCTION public.current_user_has_permission(
  org_id UUID,
  permission_path TEXT[]
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN public.user_has_permission(auth.uid(), org_id, permission_path);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION public.current_user_has_permission(UUID, TEXT[]) TO authenticated;

COMMENT ON FUNCTION public.current_user_has_permission IS
'Shortcut para verificar permisos del usuario autenticado actual';

-- =====================================================
-- 4. ACTUALIZAR FUNCIÓN can_access_crm
-- =====================================================

-- Actualizar para incluir los nuevos roles de CRM
CREATE OR REPLACE FUNCTION public.can_access_crm(user_id uuid)
RETURNS boolean AS $$
DECLARE
  has_access boolean;
BEGIN
  -- Verificar si el usuario tiene acceso al CRM:
  -- 1. Platform admins (siempre tienen acceso)
  -- 2. Org owner de cualquier org con CRM habilitado
  -- 3. CRM manager, sales manager, sales rep o support agent
  
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
      -- Org owner/admin con CRM habilitado
      (r.slug IN ('org_owner', 'org_admin') AND oa.is_enabled = true)
      OR
      -- Roles específicos de CRM
      r.slug IN ('crm_manager', 'sales_rep', 'sales_manager', 'support_agent')
    )
  ) INTO has_access;
  
  RETURN COALESCE(has_access, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.can_access_crm IS
'Verifica acceso al CRM: platform admins, org owners/admins con CRM habilitado, o roles de CRM específicos';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Roles base creados y actualizados exitosamente';
  RAISE NOTICE '';
  RAISE NOTICE 'Nuevos roles creados:';
  RAISE NOTICE '  ✅ org_admin (nivel 6) - Admin sin billing';
  RAISE NOTICE '  ✅ org_member (nivel 3) - Miembro básico';
  RAISE NOTICE '  ✅ crm_manager (nivel 5) - Manager CRM completo';
  RAISE NOTICE '  ✅ sales_rep (nivel 4) - Representante ventas';
  RAISE NOTICE '  ✅ support_agent (nivel 4) - Agente soporte';
  RAISE NOTICE '';
  RAISE NOTICE 'Roles actualizados:';
  RAISE NOTICE '  ✅ platform_super_admin - Permisos explícitos completos';
  RAISE NOTICE '  ✅ marketing_admin - Permisos específicos de marketing';
  RAISE NOTICE '  ✅ org_owner - Permisos completos con billing';
  RAISE NOTICE '  ✅ sales_manager - Permisos alineados con nuevos roles';
  RAISE NOTICE '';
  RAISE NOTICE 'Funciones helper:';
  RAISE NOTICE '  ✅ user_has_permission() - Verificar permisos específicos';
  RAISE NOTICE '  ✅ current_user_has_permission() - Shortcut para usuario actual';
  RAISE NOTICE '  ✅ can_access_crm() - Actualizada con nuevos roles';
  RAISE NOTICE '';
  RAISE NOTICE 'Jerarquía de roles:';
  RAISE NOTICE '  10: platform_super_admin';
  RAISE NOTICE '   8: org_owner';
  RAISE NOTICE '   7: marketing_admin';
  RAISE NOTICE '   6: org_admin';
  RAISE NOTICE '   5: crm_manager, sales_manager';
  RAISE NOTICE '   4: sales_rep, support_agent';
  RAISE NOTICE '   3: org_member';
END $$;

