-- Script de ejemplo para crear usuarios admin de plataforma
-- INSTRUCCIONES:
-- 1. Reemplaza los valores entre << >> con tus datos reales
-- 2. Ejecuta en Supabase SQL Editor
-- 3. Guarda este archivo con tus valores reales en un lugar SEGURO (no commitear)

-- =====================================================
-- PASO 1: Obtener IDs necesarios
-- =====================================================

-- Ejecuta primero para obtener los IDs:
SELECT 
  'PLATFORM_ORG_ID' as tipo,
  id as valor
FROM core.organizations 
WHERE slug = 'tupatrimonio-platform'

UNION ALL

SELECT 
  'SUPER_ADMIN_ROLE_ID' as tipo,
  id as valor
FROM core.roles 
WHERE slug = 'platform_super_admin'

UNION ALL

SELECT 
  'MARKETING_ADMIN_ROLE_ID' as tipo,
  id as valor
FROM core.roles 
WHERE slug = 'marketing_admin';

-- =====================================================
-- PASO 2: Crea el usuario en Supabase Auth Dashboard
-- =====================================================
-- Ve a Authentication > Users > Add user
-- Email: <<TU_EMAIL@tupatrimonio.app>>
-- Password: <<GENERA_PASSWORD_SEGURO>>
-- ✅ Auto Confirm User
-- Anota el User ID que aparece

-- =====================================================
-- PASO 3: Crear perfil y vincular (REEMPLAZA LOS VALORES)
-- =====================================================

-- Crear perfil de usuario
INSERT INTO core.users (id, first_name, last_name, status)
VALUES (
  '<<USER_ID_DE_AUTH>>',  -- Reemplazar con el ID del usuario creado en Auth
  '<<TU_NOMBRE>>',         -- Tu nombre
  '<<TU_APELLIDO>>',       -- Tu apellido
  'active'
) ON CONFLICT (id) DO NOTHING;

-- Vincular a organización platform como Super Admin
INSERT INTO core.organization_users (
  organization_id,
  user_id,
  role_id,
  status
) VALUES (
  '<<PLATFORM_ORG_ID>>',       -- ID de la org platform (del PASO 1)
  '<<USER_ID_DE_AUTH>>',       -- ID del usuario creado
  '<<SUPER_ADMIN_ROLE_ID>>',   -- ID del rol super admin (del PASO 1)
  'active'
);

-- =====================================================
-- PASO 4: Verificar que funcionó
-- =====================================================

-- Ver tus roles y organizaciones
SELECT 
  u.email,
  o.name as organization,
  o.org_type,
  r.name as role,
  r.slug as role_slug,
  ou.status
FROM core.organization_users ou
JOIN core.organizations o ON o.id = ou.organization_id
JOIN core.roles r ON r.id = ou.role_id
JOIN auth.users u ON u.id = ou.user_id
WHERE ou.user_id = auth.uid();

-- Verificar función is_platform_admin() (debe retornar true)
SELECT marketing.is_platform_admin() as soy_admin;

-- =====================================================
-- OPCIONAL: Agregar más usuarios (Editores de blog)
-- =====================================================

-- Después de crear el usuario en Auth Dashboard, ejecuta:
/*
INSERT INTO core.users (id, first_name, last_name, status)
VALUES (
  '<<NUEVO_USER_ID>>',
  '<<NOMBRE_EDITOR>>',
  '<<APELLIDO_EDITOR>>',
  'active'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO core.organization_users (organization_id, user_id, role_id, status)
VALUES (
  '<<PLATFORM_ORG_ID>>',
  '<<NUEVO_USER_ID>>',
  '<<MARKETING_ADMIN_ROLE_ID>>',  -- Marketing Admin (menos permisos que Super Admin)
  'active'
);
*/

-- =====================================================
-- TESTS DE VALIDACIÓN
-- =====================================================

-- Test 1: Insertar post de prueba (debe funcionar como admin)
/*
INSERT INTO marketing.blog_posts (
  title,
  slug,
  content,
  published,
  author_name
) VALUES (
  'Test Post - Verificación Permisos',
  'test-post-verificacion-' || gen_random_uuid(),
  'Este es un post de prueba para verificar permisos admin.',
  false,
  'Admin Test'
);
*/

-- Test 2: Limpiar post de prueba
/*
DELETE FROM marketing.blog_posts 
WHERE title = 'Test Post - Verificación Permisos';
*/

-- =====================================================
-- ✅ CHECKLIST
-- =====================================================
-- [ ] Obtuve todos los IDs necesarios
-- [ ] Creé el usuario en Auth Dashboard
-- [ ] Ejecuté INSERT en core.users
-- [ ] Ejecuté INSERT en core.organization_users
-- [ ] Verifiqué con SELECT que aparezco con el rol correcto
-- [ ] Función is_platform_admin() retorna true
-- [ ] Puedo insertar/actualizar posts del blog

