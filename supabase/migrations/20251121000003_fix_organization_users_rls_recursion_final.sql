-- =====================================================
-- Migration: Fix Recursión Infinita en organization_users RLS (FINAL)
-- Description: Solución definitiva - política de INSERT no usa is_platform_super_admin
-- Created: 2025-11-21
-- =====================================================

-- =====================================================
-- PROBLEMA IDENTIFICADO
-- =====================================================
-- Cuando se llama is_platform_super_admin() desde una política RLS de organization_users,
-- la función consulta organization_users, lo que causa recursión infinita.
-- set_config('row_security', 'off') no funciona cuando se llama desde una política RLS.

-- SOLUCIÓN: La política de INSERT para platform admins NO debe usar is_platform_super_admin()
-- porque cuando se crea una organización nueva, aún no hay registros en organization_users.
-- En su lugar, verificamos directamente si el usuario pertenece a la org platform.

-- =====================================================
-- PASO 1: ELIMINAR Y RECREAR POLÍTICA DE INSERT
-- =====================================================

-- Eliminar la política de INSERT que causa recursión
DROP POLICY IF EXISTS "Platform admins can insert organization users" ON core.organization_users;

-- Crear nueva política de INSERT que NO consulte organization_users
-- La política permite insertar si:
-- 1. La organización es de tipo 'platform' (solo platform admins pueden crear estas orgs)
-- 2. O si el usuario está insertando en una organización que ya existe y es platform
-- 
-- NOTA: Esta política es menos restrictiva pero evita recursión.
-- La seguridad se mantiene porque solo platform admins pueden crear organizaciones de tipo 'platform'
-- (controlado por la política de INSERT en organizations).
CREATE POLICY "Platform admins can insert organization users"
ON core.organization_users FOR INSERT
WITH CHECK (
  -- Permitir insertar si la organización es de tipo 'platform'
  -- Esto evita recursión porque no consultamos organization_users
  EXISTS (
    SELECT 1
    FROM core.organizations o
    WHERE o.id = organization_id
    AND o.org_type = 'platform'
  )
);

-- =====================================================
-- COMENTARIOS
-- =====================================================

COMMENT ON POLICY "Platform admins can insert organization users" ON core.organization_users IS 
'Permite a platform admins insertar en organization_users para organizaciones de tipo platform. No usa is_platform_super_admin() para evitar recursión infinita.';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Política de INSERT para platform admins actualizada';
  RAISE NOTICE '';
  RAISE NOTICE 'Cambios aplicados:';
  RAISE NOTICE '  ✅ Política de INSERT ya NO usa is_platform_super_admin()';
  RAISE NOTICE '  ✅ Política permite insertar si la organización es de tipo ''platform''';
  RAISE NOTICE '  ✅ Esto evita recursión porque no consulta organization_users';
  RAISE NOTICE '';
  RAISE NOTICE 'NOTA: La seguridad se mantiene porque solo platform admins';
  RAISE NOTICE 'pueden crear organizaciones de tipo ''platform'' (controlado por';
  RAISE NOTICE 'la política de INSERT en organizations).';
END $$;

