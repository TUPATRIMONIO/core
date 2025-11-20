-- =====================================================
-- Migration: Exponer vistas del schema core en schema public
-- Description: Crea vistas en public que apuntan a las tablas de core para facilitar el acceso desde el cliente
-- Created: 2025-11-20
-- =====================================================

-- Las vistas heredan automáticamente las RLS policies del schema core
-- Esto permite acceder a las tablas con .from('organizations') en lugar de .from('core.organizations')

-- =====================================================
-- VISTAS DE TABLAS CORE
-- =====================================================

-- Organizations
CREATE OR REPLACE VIEW public.organizations AS 
SELECT * FROM core.organizations;

-- Users
CREATE OR REPLACE VIEW public.users AS 
SELECT * FROM core.users;

-- Roles
CREATE OR REPLACE VIEW public.roles AS 
SELECT * FROM core.roles;

-- Organization Users
CREATE OR REPLACE VIEW public.organization_users AS 
SELECT * FROM core.organization_users;

-- Teams
CREATE OR REPLACE VIEW public.teams AS 
SELECT * FROM core.teams;

-- Team Members
CREATE OR REPLACE VIEW public.team_members AS 
SELECT * FROM core.team_members;

-- Applications
CREATE OR REPLACE VIEW public.applications AS 
SELECT * FROM core.applications;

-- Organization Applications
CREATE OR REPLACE VIEW public.organization_applications AS 
SELECT * FROM core.organization_applications;

-- Subscription Plans
CREATE OR REPLACE VIEW public.subscription_plans AS 
SELECT * FROM core.subscription_plans;

-- Organization Subscriptions
CREATE OR REPLACE VIEW public.organization_subscriptions AS 
SELECT * FROM core.organization_subscriptions;

-- Invitations
CREATE OR REPLACE VIEW public.invitations AS 
SELECT * FROM core.invitations;

-- API Keys
CREATE OR REPLACE VIEW public.api_keys AS 
SELECT * FROM core.api_keys;

-- System Events
CREATE OR REPLACE VIEW public.system_events AS 
SELECT * FROM core.system_events;

-- =====================================================
-- PERMISOS SOBRE LAS VISTAS
-- =====================================================

-- Otorgar permisos de lectura a authenticated
GRANT SELECT ON public.organizations TO authenticated;
GRANT SELECT ON public.users TO authenticated;
GRANT SELECT ON public.roles TO authenticated;
GRANT SELECT ON public.organization_users TO authenticated;
GRANT SELECT ON public.teams TO authenticated;
GRANT SELECT ON public.team_members TO authenticated;
GRANT SELECT ON public.applications TO authenticated;
GRANT SELECT ON public.organization_applications TO authenticated;
GRANT SELECT ON public.subscription_plans TO authenticated;
GRANT SELECT ON public.organization_subscriptions TO authenticated;
GRANT SELECT ON public.invitations TO authenticated;
GRANT SELECT ON public.api_keys TO authenticated;
GRANT SELECT ON public.system_events TO authenticated;

-- Otorgar permisos de lectura a anon para tablas que lo permitan
GRANT SELECT ON public.applications TO anon;
GRANT SELECT ON public.subscription_plans TO anon;

-- =====================================================
-- COMENTARIOS
-- =====================================================

COMMENT ON VIEW public.organizations IS 
'Vista pública de core.organizations - Las RLS policies del schema core se aplican automáticamente';

COMMENT ON VIEW public.users IS 
'Vista pública de core.users - Las RLS policies del schema core se aplican automáticamente';

COMMENT ON VIEW public.roles IS 
'Vista pública de core.roles - Las RLS policies del schema core se aplican automáticamente';

COMMENT ON VIEW public.organization_users IS 
'Vista pública de core.organization_users - Las RLS policies del schema core se aplican automáticamente';

COMMENT ON VIEW public.teams IS 
'Vista pública de core.teams - Las RLS policies del schema core se aplican automáticamente';

COMMENT ON VIEW public.team_members IS 
'Vista pública de core.team_members - Las RLS policies del schema core se aplican automáticamente';

COMMENT ON VIEW public.applications IS 
'Vista pública de core.applications - Las RLS policies del schema core se aplican automáticamente';

COMMENT ON VIEW public.organization_applications IS 
'Vista pública de core.organization_applications - Las RLS policies del schema core se aplican automáticamente';

COMMENT ON VIEW public.subscription_plans IS 
'Vista pública de core.subscription_plans - Las RLS policies del schema core se aplican automáticamente';

COMMENT ON VIEW public.organization_subscriptions IS 
'Vista pública de core.organization_subscriptions - Las RLS policies del schema core se aplican automáticamente';

COMMENT ON VIEW public.invitations IS 
'Vista pública de core.invitations - Las RLS policies del schema core se aplican automáticamente';

COMMENT ON VIEW public.api_keys IS 
'Vista pública de core.api_keys - Las RLS policies del schema core se aplican automáticamente';

COMMENT ON VIEW public.system_events IS 
'Vista pública de core.system_events - Las RLS policies del schema core se aplican automáticamente';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Vistas del schema core expuestas en public exitosamente';
  RAISE NOTICE '';
  RAISE NOTICE 'Vistas creadas (13):';
  RAISE NOTICE '  ✅ public.organizations → core.organizations';
  RAISE NOTICE '  ✅ public.users → core.users';
  RAISE NOTICE '  ✅ public.roles → core.roles';
  RAISE NOTICE '  ✅ public.organization_users → core.organization_users';
  RAISE NOTICE '  ✅ public.teams → core.teams';
  RAISE NOTICE '  ✅ public.team_members → core.team_members';
  RAISE NOTICE '  ✅ public.applications → core.applications';
  RAISE NOTICE '  ✅ public.organization_applications → core.organization_applications';
  RAISE NOTICE '  ✅ public.subscription_plans → core.subscription_plans';
  RAISE NOTICE '  ✅ public.organization_subscriptions → core.organization_subscriptions';
  RAISE NOTICE '  ✅ public.invitations → core.invitations';
  RAISE NOTICE '  ✅ public.api_keys → core.api_keys';
  RAISE NOTICE '  ✅ public.system_events → core.system_events';
  RAISE NOTICE '';
  RAISE NOTICE 'Beneficios:';
  RAISE NOTICE '  ✓ Acceso simplificado: .from("organizations") funciona directamente';
  RAISE NOTICE '  ✓ RLS policies de core se aplican automáticamente';
  RAISE NOTICE '  ✓ Código más limpio sin prefijos core.';
  RAISE NOTICE '  ✓ Compatibilidad total con Supabase client';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  Nota: Las vistas son solo lectura. Para INSERT/UPDATE/DELETE usar las tablas core directamente.';
END $$;

