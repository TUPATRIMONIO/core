-- Migration: Limpiar sistema de roles duplicado y unificar en core
-- Description: Elimina marketing.user_roles y migra todo a core.roles + core.organization_users
-- Created: 2024-11-12

-- =====================================================
-- 1. MIGRAR DATOS EXISTENTES (si los hay)
-- =====================================================

-- Primero, verificar si hay usuarios en marketing.user_roles que no estén en la org platform
DO $$
DECLARE
  platform_org_id UUID;
  admin_role_id UUID;
  editor_role_id UUID;
  user_record RECORD;
BEGIN
  -- Obtener IDs necesarios
  SELECT id INTO platform_org_id 
  FROM core.organizations 
  WHERE org_type = 'platform' 
  LIMIT 1;

  SELECT id INTO admin_role_id 
  FROM core.roles 
  WHERE slug = 'platform_super_admin' 
  LIMIT 1;

  SELECT id INTO editor_role_id 
  FROM core.roles 
  WHERE slug = 'marketing_admin' 
  LIMIT 1;

  -- Si no existe la org platform o los roles, no podemos migrar
  IF platform_org_id IS NULL OR admin_role_id IS NULL OR editor_role_id IS NULL THEN
    RAISE NOTICE 'Platform organization or roles not found. Skipping data migration.';
    RETURN;
  END IF;

  -- Migrar usuarios con roles
  FOR user_record IN 
    SELECT user_id, role 
    FROM marketing.user_roles 
    WHERE role IN ('admin', 'super_admin', 'editor')
  LOOP
    -- Determinar el rol destino
    DECLARE
      target_role_id UUID;
    BEGIN
      IF user_record.role IN ('admin', 'super_admin') THEN
        target_role_id := admin_role_id;
      ELSE
        target_role_id := editor_role_id;
      END IF;

      -- Insertar en core.organization_users (skip si ya existe)
      INSERT INTO core.organization_users (
        organization_id,
        user_id,
        role_id,
        status
      ) VALUES (
        platform_org_id,
        user_record.user_id,
        target_role_id,
        'active'
      )
      ON CONFLICT (organization_id, user_id) DO NOTHING;

      RAISE NOTICE 'Migrated user % with role % to core.organization_users', 
        user_record.user_id, user_record.role;
    END;
  END LOOP;

  RAISE NOTICE '✅ User data migration completed';
END $$;

-- =====================================================
-- 2. ACTUALIZAR FUNCIÓN can_access_admin
-- =====================================================

-- Eliminar función antigua
DROP FUNCTION IF EXISTS can_access_admin(uuid);
DROP FUNCTION IF EXISTS public.can_access_admin(uuid);

-- Crear nueva función que usa core.organization_users
CREATE OR REPLACE FUNCTION public.can_access_admin(user_id uuid)
RETURNS boolean AS $$
DECLARE
  is_admin boolean;
BEGIN
  -- Verificar si el usuario pertenece a la org platform con rol admin
  SELECT EXISTS (
    SELECT 1
    FROM core.organization_users ou
    JOIN core.organizations o ON o.id = ou.organization_id
    JOIN core.roles r ON r.id = ou.role_id
    WHERE ou.user_id = can_access_admin.user_id
      AND o.org_type = 'platform'
      AND r.slug IN ('platform_super_admin', 'marketing_admin')
      AND ou.status = 'active'
  ) INTO is_admin;
  
  RETURN COALESCE(is_admin, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Otorgar permisos de ejecución
GRANT EXECUTE ON FUNCTION public.can_access_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_admin(uuid) TO anon;

COMMENT ON FUNCTION public.can_access_admin IS 
'Verifica si un usuario tiene permisos de administrador usando el sistema core.roles. Compatible con la función anterior pero usando el sistema unificado.';

-- =====================================================
-- 3. ACTUALIZAR POLÍTICAS RLS
-- =====================================================

-- Función helper para verificar admin en políticas RLS
CREATE OR REPLACE FUNCTION marketing.user_is_platform_admin()
RETURNS boolean AS $$
BEGIN
  RETURN public.can_access_admin(auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION marketing.user_is_platform_admin IS
'Helper function para RLS policies. Verifica si el usuario actual es platform admin.';

-- NOTA: La tabla marketing.page_management fue deprecada y eliminada
-- No es necesario actualizar políticas RLS para esa tabla

-- =====================================================
-- 4. ELIMINAR TABLA marketing.user_roles
-- =====================================================

-- Eliminar políticas de user_roles
DROP POLICY IF EXISTS "user_roles_admin_only" ON marketing.user_roles;
DROP POLICY IF EXISTS "user_roles_self_read" ON marketing.user_roles;

-- Eliminar triggers
DROP TRIGGER IF EXISTS update_user_roles_updated_at ON marketing.user_roles;

-- Eliminar índices
DROP INDEX IF EXISTS marketing.idx_user_roles_user_id;
DROP INDEX IF EXISTS marketing.idx_user_roles_role;

-- Eliminar tabla
DROP TABLE IF EXISTS marketing.user_roles CASCADE;

-- =====================================================
-- 5. LIMPIAR FUNCIONES OBSOLETAS
-- =====================================================

-- NOTA: La tabla marketing.page_management fue deprecada
-- Eliminar funciones que la referencian si existen
DROP FUNCTION IF EXISTS marketing.can_access_page(text, uuid);
DROP FUNCTION IF EXISTS marketing.get_page_status(text, text);
DROP FUNCTION IF EXISTS marketing.get_public_pages();

-- Notificación de progreso
DO $$ 
BEGIN 
  RAISE NOTICE '✅ Tabla marketing.user_roles eliminada';
  RAISE NOTICE '✅ Funciones obsoletas eliminadas';
END $$;

-- =====================================================
-- 6. CREAR FUNCIONES PARA CRM
-- =====================================================

-- Función para verificar acceso al CRM
CREATE OR REPLACE FUNCTION public.can_access_crm(user_id uuid)
RETURNS boolean AS $$
BEGIN
  -- Por ahora, CRM es accesible solo para platform admins
  -- En el futuro se puede extender para incluir roles de sales
  RETURN public.can_access_admin(user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION public.can_access_crm(uuid) TO authenticated;

COMMENT ON FUNCTION public.can_access_crm IS
'Verifica si un usuario puede acceder al CRM. Actualmente solo platform admins.';

-- =====================================================
-- 7. CREAR ROL OPCIONAL PARA SALES (futuro)
-- =====================================================

-- Insertar rol de sales/CRM (opcional, no asignado a nadie por defecto)
INSERT INTO core.roles (name, slug, description, level, is_system, permissions) VALUES
(
  'Sales Manager',
  'sales_manager',
  'Gestión de CRM y leads - Sin acceso a contenido marketing',
  5,
  true,
  jsonb_build_object(
    'crm', jsonb_build_object(
      'leads', true,
      'contacts', true,
      'waitlist', true,
      'messages', true,
      'send_emails', true
    )
  )
) ON CONFLICT (slug) DO NOTHING;

COMMENT ON TABLE core.roles IS 
'Sistema de roles unificado. Incluye platform_super_admin, marketing_admin, y sales_manager';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '🎉 ============================================';
  RAISE NOTICE '✅ Migración completada exitosamente';
  RAISE NOTICE '🎉 ============================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Cambios realizados:';
  RAISE NOTICE '  ✅ Datos migrados de marketing.user_roles → core.organization_users';
  RAISE NOTICE '  ✅ Función can_access_admin() actualizada para usar core.roles';
  RAISE NOTICE '  ✅ Función can_access_crm() creada para gestión de CRM';
  RAISE NOTICE '  ✅ Políticas RLS actualizadas para usar sistema core';
  RAISE NOTICE '  ✅ Tabla marketing.user_roles eliminada';
  RAISE NOTICE '  ✅ Rol sales_manager creado (opcional para futuro)';
  RAISE NOTICE '';
  RAISE NOTICE 'Sistema de roles unificado:';
  RAISE NOTICE '  - platform_super_admin (nivel 10): Acceso total';
  RAISE NOTICE '  - marketing_admin (nivel 7): Gestión de contenido';
  RAISE NOTICE '  - sales_manager (nivel 5): Gestión de CRM (futuro)';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  Acción requerida:';
  RAISE NOTICE '  1. Actualizar código TypeScript para eliminar referencias a marketing.user_roles';
  RAISE NOTICE '  2. Verificar que can_access_admin() funciona correctamente';
  RAISE NOTICE '  3. Probar acceso al dashboard con usuarios admin existentes';
  RAISE NOTICE '';
END $$;

