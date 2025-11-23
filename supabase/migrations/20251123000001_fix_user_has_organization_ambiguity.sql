-- =====================================================
-- Migration: Fix ambiguous column references in functions
-- Description: Usar alias de tabla para evitar ambigüedad sin cambiar firma de función
-- Created: 2025-11-23
-- =====================================================

-- =====================================================
-- PROBLEMA IDENTIFICADO
-- =====================================================
-- Error: "column reference user_id is ambiguous"
-- Causa: El parámetro user_id tiene el mismo nombre que columnas en las tablas
-- Solución: Usar alias de tabla explícitos (ou.user_id) en lugar de nombre calificado de función
--
-- Nota: NO cambiamos el nombre del parámetro para evitar romper políticas RLS que dependen de estas funciones

-- =====================================================
-- 1. FIX: user_has_organization
-- =====================================================

CREATE OR REPLACE FUNCTION public.user_has_organization(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM core.organization_users ou
    WHERE ou.user_id = user_has_organization.user_id
    AND ou.status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 2. FIX: get_user_active_organization
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
      WHEN o.id = (SELECT u.last_active_organization_id FROM core.users u WHERE u.id = get_user_active_organization.user_id)
      THEN 1 
      ELSE 2 
    END,
    ou.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 3. FIX: is_platform_super_admin
-- =====================================================

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

-- =====================================================
-- 4. FIX: can_access_crm
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

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Todas las funciones corregidas con alias de tabla explícitos';
  RAISE NOTICE '';
  RAISE NOTICE 'Funciones actualizadas:';
  RAISE NOTICE '  ✅ user_has_organization - usa ou.user_id';
  RAISE NOTICE '  ✅ get_user_active_organization - usa ou.user_id y u.id';
  RAISE NOTICE '  ✅ is_platform_super_admin - usa ou.user_id';
  RAISE NOTICE '  ✅ can_access_crm - usa ou.user_id';
  RAISE NOTICE '';
  RAISE NOTICE 'Los alias de tabla evitan ambigüedad sin cambiar la firma de las funciones';
  RAISE NOTICE 'Las políticas RLS que dependen de estas funciones siguen funcionando';
END $$;
