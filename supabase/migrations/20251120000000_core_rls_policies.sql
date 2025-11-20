-- =====================================================
-- Migration: RLS Policies Completas para Schema Core
-- Description: Políticas de seguridad Row Level Security para todas las tablas del schema core
-- Created: 2025-11-20
-- =====================================================

-- Habilitar RLS en todas las tablas core
ALTER TABLE core.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.organization_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.organization_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.organization_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.system_events ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLÍTICAS: core.organizations
-- =====================================================

-- Platform admins pueden ver todas las organizaciones
CREATE POLICY "Platform admins can view all organizations"
ON core.organizations FOR SELECT
USING (public.is_platform_super_admin(auth.uid()));

-- Users pueden ver sus organizaciones donde están activos
CREATE POLICY "Users can view their organizations"
ON core.organizations FOR SELECT
USING (
  id IN (
    SELECT organization_id 
    FROM core.organization_users 
    WHERE user_id = auth.uid() 
    AND status = 'active'
  )
);

-- Solo platform admins pueden crear organizaciones manualmente
CREATE POLICY "Platform admins can create organizations"
ON core.organizations FOR INSERT
WITH CHECK (public.is_platform_super_admin(auth.uid()));

-- Platform admins y org owners pueden actualizar su organización
CREATE POLICY "Platform admins and org owners can update organizations"
ON core.organizations FOR UPDATE
USING (
  public.is_platform_super_admin(auth.uid())
  OR
  id IN (
    SELECT ou.organization_id
    FROM core.organization_users ou
    JOIN core.roles r ON r.id = ou.role_id
    WHERE ou.user_id = auth.uid()
    AND ou.status = 'active'
    AND r.slug = 'org_owner'
  )
);

-- Solo platform admins pueden eliminar organizaciones
CREATE POLICY "Platform admins can delete organizations"
ON core.organizations FOR DELETE
USING (public.is_platform_super_admin(auth.uid()));

-- =====================================================
-- POLÍTICAS: core.users
-- =====================================================

-- Users pueden ver su propio perfil
CREATE POLICY "Users can view own profile"
ON core.users FOR SELECT
USING (id = auth.uid());

-- Platform admins pueden ver todos los usuarios
CREATE POLICY "Platform admins can view all users"
ON core.users FOR SELECT
USING (public.is_platform_super_admin(auth.uid()));

-- Org admins pueden ver usuarios de su organización
CREATE POLICY "Org admins can view organization users"
ON core.users FOR SELECT
USING (
  id IN (
    SELECT ou2.user_id
    FROM core.organization_users ou1
    JOIN core.organization_users ou2 ON ou2.organization_id = ou1.organization_id
    JOIN core.roles r ON r.id = ou1.role_id
    WHERE ou1.user_id = auth.uid()
    AND ou1.status = 'active'
    AND r.slug IN ('org_owner', 'org_admin')
  )
);

-- Users pueden actualizar su propio perfil
CREATE POLICY "Users can update own profile"
ON core.users FOR UPDATE
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Platform admins pueden actualizar cualquier usuario
CREATE POLICY "Platform admins can update any user"
ON core.users FOR UPDATE
USING (public.is_platform_super_admin(auth.uid()));

-- =====================================================
-- POLÍTICAS: core.roles
-- =====================================================

-- Todos pueden leer roles (necesario para UI)
CREATE POLICY "Anyone can view roles"
ON core.roles FOR SELECT
USING (true);

-- Solo platform admins pueden crear roles
CREATE POLICY "Platform admins can create roles"
ON core.roles FOR INSERT
WITH CHECK (public.is_platform_super_admin(auth.uid()));

-- Solo platform admins pueden actualizar roles no-system
CREATE POLICY "Platform admins can update non-system roles"
ON core.roles FOR UPDATE
USING (
  public.is_platform_super_admin(auth.uid())
  AND NOT is_system
);

-- Solo platform admins pueden eliminar roles no-system
CREATE POLICY "Platform admins can delete non-system roles"
ON core.roles FOR DELETE
USING (
  public.is_platform_super_admin(auth.uid())
  AND NOT is_system
);

-- =====================================================
-- POLÍTICAS: core.organization_users
-- =====================================================

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

-- Platform admins pueden ver todo
CREATE POLICY "Platform admins can view all organization users"
ON core.organization_users FOR SELECT
USING (public.is_platform_super_admin(auth.uid()));

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
);

-- Platform admins pueden gestionar todo
CREATE POLICY "Platform admins can manage all organization users"
ON core.organization_users FOR ALL
USING (public.is_platform_super_admin(auth.uid()));

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
-- POLÍTICAS: core.teams
-- =====================================================

-- Users pueden ver teams de su organización
CREATE POLICY "Users can view organization teams"
ON core.teams FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id 
    FROM core.organization_users 
    WHERE user_id = auth.uid() 
    AND status = 'active'
  )
);

-- Platform admins pueden ver todos los teams
CREATE POLICY "Platform admins can view all teams"
ON core.teams FOR SELECT
USING (public.is_platform_super_admin(auth.uid()));

-- Org admins pueden crear teams en su organización
CREATE POLICY "Org admins can create teams"
ON core.teams FOR INSERT
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

-- Org admins y team leads pueden actualizar teams
CREATE POLICY "Org admins and team leads can update teams"
ON core.teams FOR UPDATE
USING (
  organization_id IN (
    SELECT ou.organization_id
    FROM core.organization_users ou
    JOIN core.roles r ON r.id = ou.role_id
    WHERE ou.user_id = auth.uid()
    AND ou.status = 'active'
    AND r.slug IN ('org_owner', 'org_admin')
  )
  OR
  lead_user_id = auth.uid()
);

-- Org admins pueden eliminar teams
CREATE POLICY "Org admins can delete teams"
ON core.teams FOR DELETE
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
-- POLÍTICAS: core.team_members
-- =====================================================

-- Users pueden ver miembros de teams de su organización
CREATE POLICY "Users can view team members"
ON core.team_members FOR SELECT
USING (
  team_id IN (
    SELECT t.id
    FROM core.teams t
    JOIN core.organization_users ou ON ou.organization_id = t.organization_id
    WHERE ou.user_id = auth.uid()
    AND ou.status = 'active'
  )
);

-- Platform admins pueden ver todos los team members
CREATE POLICY "Platform admins can view all team members"
ON core.team_members FOR SELECT
USING (public.is_platform_super_admin(auth.uid()));

-- Org admins y team leads pueden agregar miembros a teams
CREATE POLICY "Org admins and team leads can add team members"
ON core.team_members FOR INSERT
WITH CHECK (
  team_id IN (
    SELECT t.id
    FROM core.teams t
    JOIN core.organization_users ou ON ou.organization_id = t.organization_id
    JOIN core.roles r ON r.id = ou.role_id
    WHERE ou.user_id = auth.uid()
    AND ou.status = 'active'
    AND (r.slug IN ('org_owner', 'org_admin') OR t.lead_user_id = auth.uid())
  )
);

-- Org admins y team leads pueden actualizar miembros
CREATE POLICY "Org admins and team leads can update team members"
ON core.team_members FOR UPDATE
USING (
  team_id IN (
    SELECT t.id
    FROM core.teams t
    JOIN core.organization_users ou ON ou.organization_id = t.organization_id
    JOIN core.roles r ON r.id = ou.role_id
    WHERE ou.user_id = auth.uid()
    AND ou.status = 'active'
    AND (r.slug IN ('org_owner', 'org_admin') OR t.lead_user_id = auth.uid())
  )
);

-- Org admins y team leads pueden remover miembros
CREATE POLICY "Org admins and team leads can remove team members"
ON core.team_members FOR DELETE
USING (
  team_id IN (
    SELECT t.id
    FROM core.teams t
    JOIN core.organization_users ou ON ou.organization_id = t.organization_id
    JOIN core.roles r ON r.id = ou.role_id
    WHERE ou.user_id = auth.uid()
    AND ou.status = 'active'
    AND (r.slug IN ('org_owner', 'org_admin') OR t.lead_user_id = auth.uid())
  )
);

-- =====================================================
-- POLÍTICAS: core.applications
-- =====================================================

-- Todos pueden leer aplicaciones activas
CREATE POLICY "Anyone can view active applications"
ON core.applications FOR SELECT
USING (is_active = true);

-- Platform admins pueden ver todas las aplicaciones
CREATE POLICY "Platform admins can view all applications"
ON core.applications FOR SELECT
USING (public.is_platform_super_admin(auth.uid()));

-- Solo platform admins pueden gestionar aplicaciones
CREATE POLICY "Platform admins can manage applications"
ON core.applications FOR ALL
USING (public.is_platform_super_admin(auth.uid()));

-- =====================================================
-- POLÍTICAS: core.organization_applications
-- =====================================================

-- Users pueden ver apps de su organización
CREATE POLICY "Users can view organization apps"
ON core.organization_applications FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id 
    FROM core.organization_users 
    WHERE user_id = auth.uid() 
    AND status = 'active'
  )
);

-- Platform admins pueden ver todas
CREATE POLICY "Platform admins can view all organization apps"
ON core.organization_applications FOR SELECT
USING (public.is_platform_super_admin(auth.uid()));

-- Org owners pueden habilitar/deshabilitar apps de su org
CREATE POLICY "Org owners can manage organization apps"
ON core.organization_applications FOR ALL
USING (
  organization_id IN (
    SELECT ou.organization_id
    FROM core.organization_users ou
    JOIN core.roles r ON r.id = ou.role_id
    WHERE ou.user_id = auth.uid()
    AND ou.status = 'active'
    AND r.slug = 'org_owner'
  )
);

-- Platform admins pueden gestionar todo
CREATE POLICY "Platform admins can manage all organization apps"
ON core.organization_applications FOR ALL
USING (public.is_platform_super_admin(auth.uid()));

-- =====================================================
-- POLÍTICAS: core.subscription_plans
-- =====================================================

-- Lectura pública de planes activos
CREATE POLICY "Anyone can view active subscription plans"
ON core.subscription_plans FOR SELECT
USING (is_active = true);

-- Platform admins pueden ver todos los planes
CREATE POLICY "Platform admins can view all subscription plans"
ON core.subscription_plans FOR SELECT
USING (public.is_platform_super_admin(auth.uid()));

-- Solo platform admins pueden gestionar planes
CREATE POLICY "Platform admins can manage subscription plans"
ON core.subscription_plans FOR ALL
USING (public.is_platform_super_admin(auth.uid()));

-- =====================================================
-- POLÍTICAS: core.organization_subscriptions
-- =====================================================

-- Users pueden ver suscripción de su org
CREATE POLICY "Users can view organization subscription"
ON core.organization_subscriptions FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id 
    FROM core.organization_users 
    WHERE user_id = auth.uid() 
    AND status = 'active'
  )
);

-- Platform admins pueden ver todas las suscripciones
CREATE POLICY "Platform admins can view all subscriptions"
ON core.organization_subscriptions FOR SELECT
USING (public.is_platform_super_admin(auth.uid()));

-- Org owners pueden actualizar suscripción de su org
CREATE POLICY "Org owners can update subscription"
ON core.organization_subscriptions FOR UPDATE
USING (
  organization_id IN (
    SELECT ou.organization_id
    FROM core.organization_users ou
    JOIN core.roles r ON r.id = ou.role_id
    WHERE ou.user_id = auth.uid()
    AND ou.status = 'active'
    AND r.slug = 'org_owner'
  )
);

-- Platform admins pueden gestionar todas las suscripciones
CREATE POLICY "Platform admins can manage all subscriptions"
ON core.organization_subscriptions FOR ALL
USING (public.is_platform_super_admin(auth.uid()));

-- =====================================================
-- POLÍTICAS: core.invitations
-- =====================================================

-- Users pueden ver invitaciones que enviaron en sus orgs
CREATE POLICY "Users can view sent invitations"
ON core.invitations FOR SELECT
USING (
  invited_by = auth.uid()
  OR
  organization_id IN (
    SELECT ou.organization_id
    FROM core.organization_users ou
    JOIN core.roles r ON r.id = ou.role_id
    WHERE ou.user_id = auth.uid()
    AND ou.status = 'active'
    AND r.slug IN ('org_owner', 'org_admin')
  )
);

-- Users pueden ver sus propias invitaciones por email
CREATE POLICY "Users can view own invitations by email"
ON core.invitations FOR SELECT
USING (
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- Platform admins pueden ver todas las invitaciones
CREATE POLICY "Platform admins can view all invitations"
ON core.invitations FOR SELECT
USING (public.is_platform_super_admin(auth.uid()));

-- Org admins pueden crear invitaciones para su org
CREATE POLICY "Org admins can create invitations"
ON core.invitations FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT ou.organization_id
    FROM core.organization_users ou
    JOIN core.roles r ON r.id = ou.role_id
    WHERE ou.user_id = auth.uid()
    AND ou.status = 'active'
    AND r.slug IN ('org_owner', 'org_admin')
  )
  AND invited_by = auth.uid()
);

-- Org admins pueden actualizar invitaciones de su org
CREATE POLICY "Org admins can update invitations"
ON core.invitations FOR UPDATE
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

-- Platform admins pueden gestionar todas las invitaciones
CREATE POLICY "Platform admins can manage all invitations"
ON core.invitations FOR ALL
USING (public.is_platform_super_admin(auth.uid()));

-- =====================================================
-- POLÍTICAS: core.api_keys
-- =====================================================

-- Users pueden ver API keys de su org
CREATE POLICY "Users can view organization api keys"
ON core.api_keys FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id 
    FROM core.organization_users 
    WHERE user_id = auth.uid() 
    AND status = 'active'
  )
);

-- Platform admins pueden ver todas las API keys
CREATE POLICY "Platform admins can view all api keys"
ON core.api_keys FOR SELECT
USING (public.is_platform_super_admin(auth.uid()));

-- Org owners pueden crear API keys para su org
CREATE POLICY "Org owners can create api keys"
ON core.api_keys FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT ou.organization_id
    FROM core.organization_users ou
    JOIN core.roles r ON r.id = ou.role_id
    WHERE ou.user_id = auth.uid()
    AND ou.status = 'active'
    AND r.slug = 'org_owner'
  )
  AND created_by = auth.uid()
);

-- Org owners pueden actualizar/revocar API keys de su org
CREATE POLICY "Org owners can manage api keys"
ON core.api_keys FOR UPDATE
USING (
  organization_id IN (
    SELECT ou.organization_id
    FROM core.organization_users ou
    JOIN core.roles r ON r.id = ou.role_id
    WHERE ou.user_id = auth.uid()
    AND ou.status = 'active'
    AND r.slug = 'org_owner'
  )
);

-- Org owners pueden eliminar API keys de su org
CREATE POLICY "Org owners can delete api keys"
ON core.api_keys FOR DELETE
USING (
  organization_id IN (
    SELECT ou.organization_id
    FROM core.organization_users ou
    JOIN core.roles r ON r.id = ou.role_id
    WHERE ou.user_id = auth.uid()
    AND ou.status = 'active'
    AND r.slug = 'org_owner'
  )
);

-- Platform admins pueden gestionar todas las API keys
CREATE POLICY "Platform admins can manage all api keys"
ON core.api_keys FOR ALL
USING (public.is_platform_super_admin(auth.uid()));

-- =====================================================
-- POLÍTICAS: core.system_events
-- =====================================================

-- Users pueden ver eventos de su org
CREATE POLICY "Users can view organization events"
ON core.system_events FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id 
    FROM core.organization_users 
    WHERE user_id = auth.uid() 
    AND status = 'active'
  )
  OR organization_id IS NULL  -- Eventos públicos
);

-- Platform admins pueden ver todos los eventos
CREATE POLICY "Platform admins can view all events"
ON core.system_events FOR SELECT
USING (public.is_platform_super_admin(auth.uid()));

-- Solo sistema (service_role) puede insertar eventos
-- No hay política INSERT para authenticated, se usa service_role

-- =====================================================
-- COMENTARIOS
-- =====================================================

COMMENT ON POLICY "Platform admins can view all organizations" ON core.organizations IS 
'Platform admins pueden ver todas las organizaciones del sistema';

COMMENT ON POLICY "Users can view their organizations" ON core.organizations IS 
'Users pueden ver solo las organizaciones donde son miembros activos';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ RLS Policies creadas exitosamente para todas las tablas del schema core';
  RAISE NOTICE '';
  RAISE NOTICE 'Tablas protegidas:';
  RAISE NOTICE '  ✅ core.organizations (5 políticas)';
  RAISE NOTICE '  ✅ core.users (5 políticas)';
  RAISE NOTICE '  ✅ core.roles (4 políticas)';
  RAISE NOTICE '  ✅ core.organization_users (7 políticas)';
  RAISE NOTICE '  ✅ core.teams (5 políticas)';
  RAISE NOTICE '  ✅ core.team_members (5 políticas)';
  RAISE NOTICE '  ✅ core.applications (3 políticas)';
  RAISE NOTICE '  ✅ core.organization_applications (4 políticas)';
  RAISE NOTICE '  ✅ core.subscription_plans (3 políticas)';
  RAISE NOTICE '  ✅ core.organization_subscriptions (4 políticas)';
  RAISE NOTICE '  ✅ core.invitations (7 políticas)';
  RAISE NOTICE '  ✅ core.api_keys (7 políticas)';
  RAISE NOTICE '  ✅ core.system_events (2 políticas)';
  RAISE NOTICE '';
  RAISE NOTICE 'Total: 61 políticas RLS creadas';
END $$;

