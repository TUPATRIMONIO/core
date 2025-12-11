-- =====================================================
-- Script: Convertir Usuario en Platform Admin
-- Descripción: Convierte un usuario existente en platform_admin
-- =====================================================
-- 
-- INSTRUCCIONES:
-- 1. Reemplaza 'EMAIL_DEL_USUARIO@ejemplo.com' con el email del usuario
--    O reemplaza 'USER_ID_AQUI' con el UUID del usuario
-- 2. Ejecuta este script en Supabase SQL Editor
-- 3. El trigger automáticamente sincronizará a la tabla _bypass.platform_admins
--
-- =====================================================

-- OPCIÓN 1: Buscar usuario por EMAIL
-- Descomenta y reemplaza el email:
/*
DO $$
DECLARE
  v_user_id UUID;
  v_platform_org_id UUID;
  v_super_admin_role_id UUID;
BEGIN
  -- Buscar usuario por email
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'EMAIL_DEL_USUARIO@ejemplo.com';
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no encontrado con ese email';
  END IF;
  
  -- Obtener IDs necesarios
  SELECT id INTO v_platform_org_id
  FROM core.organizations
  WHERE slug = 'tupatrimonio-platform'
  LIMIT 1;
  
  SELECT id INTO v_super_admin_role_id
  FROM core.roles
  WHERE slug = 'platform_super_admin'
  LIMIT 1;
  
  -- Crear perfil si no existe
  INSERT INTO core.users (id, status)
  VALUES (v_user_id, 'active')
  ON CONFLICT (id) DO UPDATE SET status = 'active';
  
  -- Vincular a organización platform como Super Admin
  INSERT INTO core.organization_users (
    organization_id,
    user_id,
    role_id,
    status
  ) VALUES (
    v_platform_org_id,
    v_user_id,
    v_super_admin_role_id,
    'active'
  )
  ON CONFLICT (organization_id, user_id) 
  DO UPDATE SET 
    role_id = v_super_admin_role_id,
    status = 'active';
  
  -- Actualizar última org activa
  UPDATE core.users
  SET last_active_organization_id = v_platform_org_id
  WHERE id = v_user_id;
  
  RAISE NOTICE '✅ Usuario convertido a platform_admin exitosamente';
  RAISE NOTICE '   User ID: %', v_user_id;
  RAISE NOTICE '   Email: %', (SELECT email FROM auth.users WHERE id = v_user_id);
END $$;
*/

-- =====================================================
-- OPCIÓN 2: Usar USER_ID directamente (MÁS RÁPIDO)
-- =====================================================
-- Descomenta y reemplaza el USER_ID:

DO $$
DECLARE
  v_user_id UUID := 'USER_ID_AQUI';  -- ⚠️ REEMPLAZA CON EL UUID DEL USUARIO
  v_platform_org_id UUID;
  v_super_admin_role_id UUID;
  v_user_email TEXT;
BEGIN
  -- Verificar que el usuario existe
  SELECT email INTO v_user_email
  FROM auth.users
  WHERE id = v_user_id;
  
  IF v_user_email IS NULL THEN
    RAISE EXCEPTION 'Usuario no encontrado con ese ID: %', v_user_id;
  END IF;
  
  -- Obtener IDs necesarios
  SELECT id INTO v_platform_org_id
  FROM core.organizations
  WHERE slug = 'tupatrimonio-platform'
  LIMIT 1;
  
  IF v_platform_org_id IS NULL THEN
    RAISE EXCEPTION 'Organización platform no encontrada. Verifica las migraciones.';
  END IF;
  
  SELECT id INTO v_super_admin_role_id
  FROM core.roles
  WHERE slug = 'platform_super_admin'
  LIMIT 1;
  
  IF v_super_admin_role_id IS NULL THEN
    RAISE EXCEPTION 'Rol platform_super_admin no encontrado. Verifica las migraciones.';
  END IF;
  
  -- Crear perfil si no existe
  INSERT INTO core.users (id, status)
  VALUES (v_user_id, 'active')
  ON CONFLICT (id) DO UPDATE SET status = 'active';
  
  -- Vincular a organización platform como Super Admin
  INSERT INTO core.organization_users (
    organization_id,
    user_id,
    role_id,
    status
  ) VALUES (
    v_platform_org_id,
    v_user_id,
    v_super_admin_role_id,
    'active'
  )
  ON CONFLICT (organization_id, user_id) 
  DO UPDATE SET 
    role_id = v_super_admin_role_id,
    status = 'active';
  
  -- Actualizar última org activa
  UPDATE core.users
  SET last_active_organization_id = v_platform_org_id
  WHERE id = v_user_id;
  
  RAISE NOTICE '';
  RAISE NOTICE '✅ Usuario convertido a platform_admin exitosamente';
  RAISE NOTICE '   User ID: %', v_user_id;
  RAISE NOTICE '   Email: %', v_user_email;
  RAISE NOTICE '   El trigger automáticamente lo agregó a _bypass.platform_admins';
  RAISE NOTICE '';
END $$;

-- =====================================================
-- VERIFICACIÓN: Verificar que funcionó
-- =====================================================

-- Ver el usuario y sus roles
SELECT 
  u.email,
  u.id as user_id,
  o.name as organization,
  o.org_type,
  r.name as role,
  r.slug as role_slug,
  ou.status,
  ou.created_at as vinculado_desde
FROM core.organization_users ou
JOIN core.organizations o ON o.id = ou.organization_id
JOIN core.roles r ON r.id = ou.role_id
JOIN auth.users u ON u.id = ou.user_id
WHERE u.email = 'EMAIL_DEL_USUARIO@ejemplo.com'  -- ⚠️ Cambia el email aquí
   OR u.id = 'USER_ID_AQUI';  -- ⚠️ O cambia el ID aquí

-- Verificar que está en la tabla de bypass
SELECT 
  pa.user_id,
  u.email,
  pa.synced_at
FROM _bypass.platform_admins pa
JOIN auth.users u ON u.id = pa.user_id
WHERE u.email = 'EMAIL_DEL_USUARIO@ejemplo.com'  -- ⚠️ Cambia el email aquí
   OR u.id = 'USER_ID_AQUI';  -- ⚠️ O cambia el ID aquí

-- =====================================================
-- NOTA IMPORTANTE
-- =====================================================
-- El trigger sync_platform_admins_trigger automáticamente:
-- - Agrega el usuario a _bypass.platform_admins cuando se vincula
-- - Lo remueve si se desactiva o elimina de organization_users
-- - No necesitas hacer nada manual en la tabla _bypass













