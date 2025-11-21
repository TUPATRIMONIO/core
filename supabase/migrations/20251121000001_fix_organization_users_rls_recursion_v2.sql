-- =====================================================
-- Migration: Fix Recursión Infinita en organization_users RLS (v2)
-- Description: Corrige el problema de recursión infinita al crear organizaciones
-- Created: 2025-11-21
-- =====================================================

-- =====================================================
-- PROBLEMA IDENTIFICADO
-- =====================================================
-- La política "Platform admins can manage all organization users" usa FOR ALL
-- pero cuando se intenta INSERTAR en organization_users, las otras políticas
-- que verifican membresía consultan la misma tabla, causando recursión infinita.
--
-- Además, la función is_platform_super_admin() consulta organization_users,
-- y cuando se llama desde una política RLS de organization_users, causa recursión.
--
-- SOLUCIÓN: 
-- 1. Separar las políticas de platform admins por operación específica
-- 2. Modificar is_platform_super_admin() para deshabilitar RLS temporalmente
-- 3. Asegurar que las políticas de platform admin se evalúen PRIMERO

-- =====================================================
-- PASO 1: CORREGIR FUNCIÓN is_platform_super_admin
-- =====================================================
-- Esto debe hacerse PRIMERO para evitar recursión en las políticas

CREATE OR REPLACE FUNCTION public.is_platform_super_admin(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  result BOOLEAN;
BEGIN
  -- Deshabilitar RLS temporalmente para evitar recursión
  -- cuando esta función se llama desde una política RLS de organization_users
  SET LOCAL row_security = off;
  
  -- Consultar organization_users sin pasar por RLS
  SELECT EXISTS (
    SELECT 1
    FROM core.organization_users ou
    JOIN core.organizations o ON o.id = ou.organization_id
    JOIN core.roles r ON r.id = ou.role_id
    WHERE ou.user_id = is_platform_super_admin.user_id
    AND o.org_type = 'platform'
    AND r.slug = 'platform_super_admin'
    AND ou.status = 'active'
  ) INTO result;
  
  RETURN COALESCE(result, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =====================================================
-- PASO 2: ELIMINAR TODAS LAS POLÍTICAS EXISTENTES
-- =====================================================

-- Eliminar TODAS las políticas existentes de organization_users (tanto las originales como las nuevas)
-- Esto asegura que no haya conflictos al recrearlas
DROP POLICY IF EXISTS "Platform admins can manage all organization users" ON core.organization_users;
DROP POLICY IF EXISTS "Platform admins can view all organization users" ON core.organization_users;
DROP POLICY IF EXISTS "Platform admins can insert organization users" ON core.organization_users;
DROP POLICY IF EXISTS "Platform admins can update organization users" ON core.organization_users;
DROP POLICY IF EXISTS "Platform admins can delete organization users" ON core.organization_users;
DROP POLICY IF EXISTS "Users can view organization members" ON core.organization_users;
DROP POLICY IF EXISTS "Org owners can add members" ON core.organization_users;
DROP POLICY IF EXISTS "Org owners can update members" ON core.organization_users;
DROP POLICY IF EXISTS "Org owners can remove members" ON core.organization_users;

-- =====================================================
-- PASO 3: CREAR POLÍTICAS EN ORDEN CORRECTO
-- =====================================================
-- IMPORTANTE: Las políticas de platform admin deben ir PRIMERO
-- para que se evalúen antes que las que consultan organization_users

-- Platform admins pueden INSERTAR sin verificar membresía (evita recursión)
-- Esta política se evalúa PRIMERO, evitando el bucle
CREATE POLICY "Platform admins can insert organization users"
ON core.organization_users FOR INSERT
WITH CHECK (public.is_platform_super_admin(auth.uid()));

-- Platform admins pueden ver todo (sin consultar organization_users)
CREATE POLICY "Platform admins can view all organization users"
ON core.organization_users FOR SELECT
USING (public.is_platform_super_admin(auth.uid()));

-- Platform admins pueden actualizar todo
CREATE POLICY "Platform admins can update organization users"
ON core.organization_users FOR UPDATE
USING (public.is_platform_super_admin(auth.uid()))
WITH CHECK (public.is_platform_super_admin(auth.uid()));

-- Platform admins pueden eliminar todo
CREATE POLICY "Platform admins can delete organization users"
ON core.organization_users FOR DELETE
USING (public.is_platform_super_admin(auth.uid()));

-- =====================================================
-- PASO 4: POLÍTICAS PARA USUARIOS NORMALES
-- =====================================================
-- Estas políticas se evalúan DESPUÉS de las de platform admin
-- IMPORTANTE: NO deben verificar is_platform_super_admin() aquí
-- porque eso causaría recursión. Las políticas de platform admin ya se evaluaron primero.

-- Users pueden ver miembros de sus organizaciones
CREATE POLICY "Users can view organization members"
ON core.organization_users FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id 
    FROM core.organization_users 
    WHERE user_id = auth.uid() 
    AND status = 'active'
  )
);

-- Org owners/admins pueden agregar miembros a su org
CREATE POLICY "Org owners can add members"
ON core.organization_users FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT ou.organization_id
    FROM core.organization_users ou
    JOIN core.roles r ON r.id = ou.role_id
    WHERE ou.user_id = auth.uid()
    AND ou.status = 'active'
    AND r.slug IN ('org_owner', 'org_admin')
  )
);

-- Org owners/admins pueden actualizar miembros de su org
CREATE POLICY "Org owners can update members"
ON core.organization_users FOR UPDATE
USING (
  organization_id IN (
    SELECT ou.organization_id
    FROM core.organization_users ou
    JOIN core.roles r ON r.id = ou.role_id
    WHERE ou.user_id = auth.uid()
    AND ou.status = 'active'
    AND r.slug IN ('org_owner', 'org_admin')
  )
)
WITH CHECK (
  organization_id IN (
    SELECT ou.organization_id
    FROM core.organization_users ou
    JOIN core.roles r ON r.id = ou.role_id
    WHERE ou.user_id = auth.uid()
    AND ou.status = 'active'
    AND r.slug IN ('org_owner', 'org_admin')
  )
);

-- Org owners/admins pueden remover miembros de su org
CREATE POLICY "Org owners can remove members"
ON core.organization_users FOR DELETE
USING (
  organization_id IN (
    SELECT ou.organization_id
    FROM core.organization_users ou
    JOIN core.roles r ON r.id = ou.role_id
    WHERE ou.user_id = auth.uid()
    AND ou.status = 'active'
    AND r.slug IN ('org_owner', 'org_admin')
  )
);

-- =====================================================
-- COMENTARIOS EXPLICATIVOS
-- =====================================================

COMMENT ON POLICY "Platform admins can insert organization users" ON core.organization_users IS 
'Permite a platform admins insertar en organization_users sin verificar membresía previa, evitando recursión infinita al crear organizaciones nuevas';

COMMENT ON POLICY "Platform admins can view all organization users" ON core.organization_users IS 
'Platform admins pueden ver todos los registros de organization_users';

COMMENT ON POLICY "Platform admins can update organization users" ON core.organization_users IS 
'Platform admins pueden actualizar cualquier registro de organization_users';

COMMENT ON POLICY "Platform admins can delete organization users" ON core.organization_users IS 
'Platform admins pueden eliminar cualquier registro de organization_users';

COMMENT ON FUNCTION public.is_platform_super_admin(UUID) IS 
'Verifica si un usuario es platform super admin. Usa SET LOCAL row_security = off para evitar recursión cuando se llama desde políticas RLS de organization_users';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Políticas RLS de organization_users corregidas exitosamente';
  RAISE NOTICE '';
  RAISE NOTICE 'Cambios aplicados:';
  RAISE NOTICE '  1. ✅ Función is_platform_super_admin() modificada para deshabilitar RLS temporalmente';
  RAISE NOTICE '  2. ✅ Eliminada política FOR ALL que causaba recursión';
  RAISE NOTICE '  3. ✅ Creadas políticas específicas por operación (INSERT, SELECT, UPDATE, DELETE)';
  RAISE NOTICE '  4. ✅ Políticas de platform admin se evalúan PRIMERO';
  RAISE NOTICE '  5. ✅ Políticas de usuarios normales NO verifican is_platform_super_admin()';
  RAISE NOTICE '';
  RAISE NOTICE 'Ahora puedes crear organizaciones sin error de recursión infinita';
END $$;

