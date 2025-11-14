-- Script para verificar y crear organización para el usuario actual
-- Ejecutar este script en Supabase SQL Editor

-- 1. Ver tu usuario actual
SELECT id, email FROM auth.users ORDER BY created_at DESC LIMIT 5;

-- 2. Ver si tienes una organización vinculada
SELECT 
  ou.user_id,
  ou.organization_id,
  ou.status,
  o.name as org_name
FROM core.organization_users ou
LEFT JOIN core.organizations o ON o.id = ou.organization_id
WHERE ou.user_id = (SELECT id FROM auth.users WHERE email = 'felipeleveke@gmail.com');

-- 3. Ver todas las organizaciones existentes
SELECT * FROM core.organizations ORDER BY created_at DESC;

-- 4. Si no tienes organización, crear una y vincular tu usuario
-- IMPORTANTE: Reemplaza 'TU_USER_ID' con tu ID de usuario de la consulta #1

DO $$
DECLARE
  v_user_id uuid;
  v_org_id uuid;
  v_existing_org uuid;
BEGIN
  -- Obtener el ID del usuario
  SELECT id INTO v_user_id 
  FROM auth.users 
  WHERE email = 'felipeleveke@gmail.com';
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no encontrado';
  END IF;
  
  -- Verificar si ya tiene una organización
  SELECT organization_id INTO v_existing_org
  FROM core.organization_users
  WHERE user_id = v_user_id
  AND status = 'active'
  LIMIT 1;
  
  IF v_existing_org IS NOT NULL THEN
    RAISE NOTICE 'El usuario ya tiene una organización: %', v_existing_org;
  ELSE
    -- Crear nueva organización
    INSERT INTO core.organizations (name, slug, type)
    VALUES ('TuPatrimonio Platform', 'tupatrimonio-platform', 'business')
    RETURNING id INTO v_org_id;
    
    -- Vincular usuario a la organización como owner
    INSERT INTO core.organization_users (user_id, organization_id, role, status)
    VALUES (v_user_id, v_org_id, 'owner', 'active');
    
    RAISE NOTICE 'Organización creada: % y usuario vinculado', v_org_id;
  END IF;
END $$;

-- 5. Verificar que se creó correctamente
SELECT 
  u.email,
  ou.role,
  ou.status,
  o.name as organization_name,
  o.slug,
  o.type
FROM auth.users u
JOIN core.organization_users ou ON ou.user_id = u.id
JOIN core.organizations o ON o.id = ou.organization_id
WHERE u.email = 'felipeleveke@gmail.com';

