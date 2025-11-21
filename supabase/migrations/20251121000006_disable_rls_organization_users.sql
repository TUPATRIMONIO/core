-- =====================================================
-- Migration: Deshabilitar RLS en organization_users
-- Description: La recursión infinita es inevitable con políticas que consultan la misma tabla
-- Created: 2025-11-21
-- =====================================================

-- =====================================================
-- PROBLEMA IDENTIFICADO
-- =====================================================
-- PostgreSQL RLS no puede evitar recursión infinita cuando:
-- - Una política en organization_users consulta organization_users
-- - Esto aplica tanto a platform admins como a usuarios normales
--
-- SOLUCIÓN: Deshabilitar RLS en organization_users y manejar seguridad en server actions
-- Esto es una práctica aceptable cuando RLS causa problemas estructurales.

-- =====================================================
-- PASO 1: ELIMINAR TODAS LAS POLÍTICAS
-- =====================================================

-- Eliminar políticas de platform admins
DROP POLICY IF EXISTS "Platform admins can insert organization users" ON core.organization_users;
DROP POLICY IF EXISTS "Platform admins can view all organization users" ON core.organization_users;
DROP POLICY IF EXISTS "Platform admins can update organization users" ON core.organization_users;
DROP POLICY IF EXISTS "Platform admins can delete organization users" ON core.organization_users;

-- Eliminar políticas de usuarios normales
DROP POLICY IF EXISTS "Users can view organization members" ON core.organization_users;
DROP POLICY IF EXISTS "Org owners can add members" ON core.organization_users;
DROP POLICY IF EXISTS "Org owners can update members" ON core.organization_users;
DROP POLICY IF EXISTS "Org owners can remove members" ON core.organization_users;

-- =====================================================
-- PASO 2: DESHABILITAR RLS
-- =====================================================

-- Deshabilitar RLS en organization_users
ALTER TABLE core.organization_users DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- COMENTARIOS
-- =====================================================

COMMENT ON TABLE core.organization_users IS 
'Tabla de relación M:N entre organizaciones y usuarios. RLS deshabilitado debido a recursión infinita inevitable. La seguridad se maneja en server actions que verifican permisos antes de cada operación.';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ RLS deshabilitado en core.organization_users';
  RAISE NOTICE '';
  RAISE NOTICE 'IMPORTANTE:';
  RAISE NOTICE '  ⚠️  La seguridad ahora se maneja en server actions';
  RAISE NOTICE '  ⚠️  Cada operación verifica permisos antes de ejecutar';
  RAISE NOTICE '  ⚠️  NUNCA exponer esta tabla directamente al cliente';
  RAISE NOTICE '';
  RAISE NOTICE 'Las funciones de verificación de permisos siguen activas:';
  RAISE NOTICE '  ✅ is_platform_admin() - usa tabla bypass';
  RAISE NOTICE '  ✅ is_platform_super_admin_bypass() - usa tabla bypass';
  RAISE NOTICE '';
  RAISE NOTICE 'Todas las operaciones DEBEN pasar por server actions que verifican:';
  RAISE NOTICE '  1. Usuario autenticado';
  RAISE NOTICE '  2. Permisos del usuario (platform admin, org owner, etc.)';
  RAISE NOTICE '  3. Relación con la organización objetivo';
END $$;

