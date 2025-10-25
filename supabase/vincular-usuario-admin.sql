-- Script para vincular usuario Felipe a la organización platform
-- Usuario ID: 9c70a59b-43ea-4da1-b371-18992d50987f
-- Email: felipeleveke@gmail.com

-- =====================================================
-- PASO 1: Crear perfil en core.users
-- =====================================================

INSERT INTO core.users (id, first_name, last_name, status)
VALUES (
  '9c70a59b-43ea-4da1-b371-18992d50987f',
  'Felipe',
  'Leveke',
  'active'
) ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- PASO 2: Vincular a organización platform
-- =====================================================

INSERT INTO core.organization_users (
  organization_id,
  user_id,
  role_id,
  status
) VALUES (
  (SELECT id FROM core.organizations WHERE slug = 'tupatrimonio-platform'),
  '9c70a59b-43ea-4da1-b371-18992d50987f',
  (SELECT id FROM core.roles WHERE slug = 'platform_super_admin'),
  'active'
);

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

-- Ver tu vinculación
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
WHERE u.id = '9c70a59b-43ea-4da1-b371-18992d50987f';

-- Debe mostrar:
-- email: felipeleveke@gmail.com
-- organization: TuPatrimonio Platform
-- org_type: platform
-- role: Platform Super Admin
-- role_slug: platform_super_admin
-- status: active

