-- =====================================================
-- Migration: Create user_has_role function
-- Description: Crea la función helper para verificar roles de usuarios en RLS policies
-- Created: 2026-02-04
-- =====================================================

SET search_path TO public, core, auth;

-- =====================================================
-- FUNCIÓN: Verificar si el usuario actual tiene un rol específico
-- =====================================================

CREATE OR REPLACE FUNCTION public.user_has_role(p_role_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Obtener el usuario autenticado
  v_user_id := auth.uid();
  
  -- Si no hay usuario autenticado, retornar false
  IF v_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Verificar el rol específico
  CASE p_role_name
    WHEN 'org_admin' THEN
      -- Verificar si el usuario es admin en ALGUNA organización activa
      RETURN EXISTS (
        SELECT 1 
        FROM core.organization_users ou
        JOIN core.roles r ON r.id = ou.role_id
        WHERE ou.user_id = v_user_id
          AND ou.status = 'active'
          AND r.level >= 7  -- admin level (7 = org_admin, 10 = platform_admin)
      );
    
    WHEN 'platform_admin' THEN
      -- Usar la función existente is_platform_admin
      RETURN public.is_platform_admin();
    
    WHEN 'org_member' THEN
      -- Verificar si es miembro de alguna organización
      RETURN EXISTS (
        SELECT 1 
        FROM core.organization_users ou
        WHERE ou.user_id = v_user_id
          AND ou.status = 'active'
      );
    
    ELSE
      -- Rol no reconocido
      RETURN false;
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =====================================================
-- FUNCIÓN: Verificar si el usuario tiene un rol en una organización específica
-- =====================================================

CREATE OR REPLACE FUNCTION public.user_has_role_in_org(p_org_id UUID, p_role_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Obtener el usuario autenticado
  v_user_id := auth.uid();
  
  -- Si no hay usuario autenticado, retornar false
  IF v_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Verificar el rol específico en la organización
  CASE p_role_name
    WHEN 'org_admin' THEN
      RETURN EXISTS (
        SELECT 1 
        FROM core.organization_users ou
        JOIN core.roles r ON r.id = ou.role_id
        WHERE ou.user_id = v_user_id
          AND ou.organization_id = p_org_id
          AND ou.status = 'active'
          AND r.level >= 7  -- admin level
      );
    
    WHEN 'org_member' THEN
      RETURN EXISTS (
        SELECT 1 
        FROM core.organization_users ou
        WHERE ou.user_id = v_user_id
          AND ou.organization_id = p_org_id
          AND ou.status = 'active'
      );
    
    ELSE
      -- Rol no reconocido
      RETURN false;
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =====================================================
-- GRANTS
-- =====================================================

GRANT EXECUTE ON FUNCTION public.user_has_role TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_has_role_in_org TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_has_role TO service_role;
GRANT EXECUTE ON FUNCTION public.user_has_role_in_org TO service_role;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON FUNCTION public.user_has_role IS 
  'Verifica si el usuario actual tiene un rol específico en cualquier organización';

COMMENT ON FUNCTION public.user_has_role_in_org IS 
  'Verifica si el usuario actual tiene un rol específico en una organización concreta';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Funciones de verificación de roles creadas exitosamente';
  RAISE NOTICE '';
  RAISE NOTICE 'Funciones creadas:';
  RAISE NOTICE '  - public.user_has_role(role_name)';
  RAISE NOTICE '  - public.user_has_role_in_org(org_id, role_name)';
  RAISE NOTICE '';
  RAISE NOTICE 'Roles soportados:';
  RAISE NOTICE '  - org_admin: Administrador de organización (level >= 7)';
  RAISE NOTICE '  - platform_admin: Administrador de plataforma';
  RAISE NOTICE '  - org_member: Miembro de organización';
END $$;
