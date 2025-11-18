-- Migration: Core Robust Multi-tenancy
-- Description: Sistema completo de multi-tenancy con créditos, pagos multimoneda, y permisos granulares
-- Created: 2025-11-18

-- =====================================================
-- 1. MODIFICAR TABLAS EXISTENTES
-- =====================================================

-- Agregar 'notary' como tipo de organización
ALTER TABLE core.organizations
DROP CONSTRAINT IF EXISTS organizations_org_type_check;

ALTER TABLE core.organizations
ADD CONSTRAINT organizations_org_type_check
CHECK (org_type IN ('personal', 'business', 'platform', 'notary'));

-- Agregar campos a users
ALTER TABLE core.users
ADD COLUMN IF NOT EXISTS default_currency TEXT DEFAULT 'CLP',
ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'CL';

-- =====================================================
-- 2. ENUMS NUEVOS
-- =====================================================

CREATE TYPE core.credit_transaction_type AS ENUM (
  'purchase',      -- Compra de créditos
  'bonus',         -- Bonificación
  'spend',         -- Gasto en servicio
  'refund',        -- Devolución
  'adjustment',    -- Ajuste manual
  'transfer_in',   -- Transferencia recibida
  'transfer_out',  -- Transferencia enviada
  'subscription'   -- Créditos de suscripción mensual
);

CREATE TYPE core.payment_status AS ENUM (
  'pending',
  'processing',
  'completed',
  'failed',
  'refunded',
  'partially_refunded',
  'cancelled'
);

CREATE TYPE core.product_type AS ENUM (
  'signature',       -- Tipos de firma
  'notary_service',  -- Servicios notariales
  'ai_service',      -- Servicios de IA
  'subscription',    -- Planes de suscripción
  'credit_package',  -- Paquetes de créditos
  'other'
);

-- =====================================================
-- 3. CURRENCIES - Monedas soportadas
-- =====================================================

CREATE TABLE core.currencies (
  code TEXT PRIMARY KEY CHECK (code ~ '^[A-Z]{3}$'),
  name TEXT NOT NULL,
  symbol TEXT NOT NULL,
  decimal_places INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0
);

INSERT INTO core.currencies (code, name, symbol, decimal_places, sort_order) VALUES
('CLP', 'Peso Chileno', '$', 0, 1),
('MXN', 'Peso Mexicano', '$', 2, 2),
('COP', 'Peso Colombiano', '$', 0, 3),
('PEN', 'Sol Peruano', 'S/', 2, 4),
('ARS', 'Peso Argentino', '$', 2, 5),
('USD', 'Dólar Estadounidense', '$', 2, 6);

-- =====================================================
-- 4. CREDIT_PACKAGES - Paquetes de créditos
-- =====================================================

CREATE TABLE core.credit_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,

  -- Créditos que otorga
  credits INTEGER NOT NULL CHECK (credits > 0),
  bonus_credits INTEGER DEFAULT 0,

  -- Estado
  is_active BOOLEAN DEFAULT true,
  is_popular BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 5. CREDIT_PACKAGE_PRICES - Precios multimoneda
-- =====================================================

CREATE TABLE core.credit_package_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL REFERENCES core.credit_packages(id) ON DELETE CASCADE,
  currency TEXT NOT NULL REFERENCES core.currencies(code),
  price INTEGER NOT NULL CHECK (price > 0),

  CONSTRAINT unique_package_currency UNIQUE (package_id, currency)
);

-- =====================================================
-- 6. ORGANIZATION_CREDITS - Balance por organización
-- =====================================================

CREATE TABLE core.organization_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID UNIQUE NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,

  -- Balance actual
  balance INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),

  -- Tracking
  total_purchased INTEGER NOT NULL DEFAULT 0,
  total_spent INTEGER NOT NULL DEFAULT 0,
  total_bonus INTEGER NOT NULL DEFAULT 0,
  total_from_subscriptions INTEGER NOT NULL DEFAULT 0,

  -- Configuración
  allow_transfers BOOLEAN DEFAULT false,  -- Permitir transferir créditos

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 7. CREDIT_TRANSACTIONS - Historial de movimientos
-- =====================================================

CREATE TABLE core.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,

  -- Tipo y monto
  type core.credit_transaction_type NOT NULL,
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,

  -- Referencia
  reference_type TEXT,
  reference_id UUID,

  -- Para transferencias
  related_organization_id UUID REFERENCES core.organizations(id),

  -- Descripción
  description TEXT,

  -- Quién
  created_by UUID REFERENCES core.users(id),

  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_credit_tx_org ON core.credit_transactions(organization_id, created_at DESC);
CREATE INDEX idx_credit_tx_type ON core.credit_transactions(organization_id, type);

-- =====================================================
-- 8. PAYMENT_PROVIDERS - Proveedores de pago
-- =====================================================

CREATE TABLE core.payment_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,

  -- Dónde opera
  supported_countries TEXT[] NOT NULL,
  supported_currencies TEXT[] NOT NULL,

  -- Configuración (API keys, etc.)
  config JSONB,

  -- Estado
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO core.payment_providers (name, slug, supported_countries, supported_currencies) VALUES
('Stripe', 'stripe', ARRAY['CL', 'MX', 'CO', 'PE', 'AR', 'US'], ARRAY['CLP', 'MXN', 'COP', 'PEN', 'ARS', 'USD']),
('Flow', 'flow', ARRAY['CL'], ARRAY['CLP']),
('Webpay', 'webpay', ARRAY['CL'], ARRAY['CLP']),
('DLocalGo', 'dlocalgo', ARRAY['CL', 'MX', 'CO', 'PE', 'AR', 'BR'], ARRAY['CLP', 'MXN', 'COP', 'PEN', 'ARS', 'BRL', 'USD']);

-- =====================================================
-- 9. PAYMENTS - Pagos realizados
-- =====================================================

CREATE TABLE core.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES core.organizations(id),

  -- Proveedor
  provider_id UUID NOT NULL REFERENCES core.payment_providers(id),
  provider_payment_id TEXT,
  provider_response JSONB,

  -- Monto
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL REFERENCES core.currencies(code),

  -- Estado
  status core.payment_status NOT NULL DEFAULT 'pending',

  -- Qué se pagó
  payment_type TEXT NOT NULL,
  reference_id UUID,

  -- Tracking
  paid_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,

  -- Usuario
  paid_by UUID REFERENCES core.users(id),

  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_org ON core.payments(organization_id, created_at DESC);
CREATE INDEX idx_payments_status ON core.payments(status, created_at DESC);
CREATE INDEX idx_payments_provider ON core.payments(provider_id, provider_payment_id);

-- =====================================================
-- 10. PAYMENT_ATTEMPTS - Intentos de pago (analytics)
-- =====================================================

CREATE TABLE core.payment_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES core.payments(id) ON DELETE CASCADE,

  -- Intento
  attempt_number INTEGER NOT NULL DEFAULT 1,
  status core.payment_status NOT NULL,

  -- Respuesta del proveedor
  provider_response JSONB,
  error_code TEXT,
  error_message TEXT,

  -- Timing
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payment_attempts ON core.payment_attempts(payment_id, attempt_number);

-- =====================================================
-- 11. PRODUCTS - Catálogo de productos/servicios
-- =====================================================

CREATE TABLE core.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,

  -- Tipo
  type core.product_type NOT NULL,

  -- Precio en créditos
  credit_price INTEGER CHECK (credit_price > 0),

  -- Descuento por pagar con créditos (%)
  credit_discount_percent INTEGER DEFAULT 0 CHECK (credit_discount_percent >= 0 AND credit_discount_percent <= 100),

  -- Estado
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,

  -- Schema al que pertenece
  schema_name TEXT,

  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 12. PRODUCT_PRICES - Precios multimoneda
-- =====================================================

CREATE TABLE core.product_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES core.products(id) ON DELETE CASCADE,
  currency TEXT NOT NULL REFERENCES core.currencies(code),
  price INTEGER NOT NULL CHECK (price > 0),

  CONSTRAINT unique_product_currency UNIQUE (product_id, currency)
);

-- =====================================================
-- 13. USER_PERMISSIONS - Permisos granulares
-- =====================================================

CREATE TABLE core.user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,

  -- Permisos específicos (override del rol)
  permissions JSONB NOT NULL DEFAULT '{}',

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES core.users(id),

  CONSTRAINT unique_user_org_permissions UNIQUE (organization_id, user_id)
);

-- =====================================================
-- 14. FEATURES - Feature flags
-- =====================================================

CREATE TABLE core.features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,

  -- A qué pertenece
  schema_name TEXT,

  -- Estado
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 15. PLAN_FEATURES - Features por plan de suscripción
-- =====================================================

CREATE TABLE core.plan_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES core.subscription_plans(id) ON DELETE CASCADE,
  feature_id UUID NOT NULL REFERENCES core.features(id) ON DELETE CASCADE,

  -- Límites (NULL = ilimitado)
  usage_limit INTEGER,

  -- Créditos mensuales que otorga este feature (opcional)
  monthly_credits INTEGER DEFAULT 0,

  CONSTRAINT unique_plan_feature UNIQUE (plan_id, feature_id)
);

-- =====================================================
-- 16. API_USAGE_LOGS - Metering
-- =====================================================

CREATE TABLE core.api_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  organization_id UUID NOT NULL REFERENCES core.organizations(id),
  user_id UUID REFERENCES core.users(id),
  api_key_id UUID REFERENCES core.api_keys(id),

  -- Request
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,

  -- Response
  status_code INTEGER,
  response_time_ms INTEGER,

  -- Billing
  billable BOOLEAN DEFAULT false,
  product_id UUID REFERENCES core.products(id),
  credits_charged INTEGER DEFAULT 0,

  -- Metadata
  request_id UUID,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_api_usage_org_date ON core.api_usage_logs(organization_id, created_at DESC);
CREATE INDEX idx_api_usage_billing ON core.api_usage_logs(organization_id, billable, created_at) WHERE billable = true;

-- =====================================================
-- 17. ROLES BASE PARA ORGANIZACIONES
-- =====================================================

INSERT INTO core.roles (name, slug, description, level, is_system, permissions) VALUES
(
  'Organization Owner',
  'org_owner',
  'Dueño de la organización - Control total',
  9,
  true,
  jsonb_build_object(
    'organization', jsonb_build_object('*', true),
    'billing', jsonb_build_object('*', true),
    'members', jsonb_build_object('*', true),
    'settings', jsonb_build_object('*', true)
  )
),
(
  'Organization Admin',
  'org_admin',
  'Administrador de organización',
  8,
  true,
  jsonb_build_object(
    'organization', jsonb_build_object('edit', true, 'view', true),
    'members', jsonb_build_object('invite', true, 'remove', true, 'edit_permissions', true),
    'billing', jsonb_build_object('view', true)
  )
),
(
  'Organization Member',
  'org_member',
  'Miembro básico de organización',
  3,
  true,
  jsonb_build_object(
    'organization', jsonb_build_object('view', true)
  )
)
ON CONFLICT (slug) DO UPDATE SET
  description = EXCLUDED.description,
  permissions = EXCLUDED.permissions;

-- =====================================================
-- 18. FUNCIONES HELPER
-- =====================================================

-- Obtener organizaciones del usuario actual
CREATE OR REPLACE FUNCTION core.get_user_organization_ids()
RETURNS SETOF UUID AS $$
BEGIN
  RETURN QUERY
  SELECT organization_id
  FROM core.organization_users
  WHERE user_id = auth.uid()
  AND status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Verificar permiso específico
CREATE OR REPLACE FUNCTION core.has_permission(
  p_user_id UUID,
  p_org_id UUID,
  p_schema TEXT,
  p_action TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  role_perms JSONB;
  user_perms JSONB;
  has_perm BOOLEAN;
BEGIN
  -- 1. Obtener permisos del rol
  SELECT r.permissions INTO role_perms
  FROM core.organization_users ou
  JOIN core.roles r ON r.id = ou.role_id
  WHERE ou.user_id = p_user_id
    AND ou.organization_id = p_org_id
    AND ou.status = 'active';

  -- 2. Obtener permisos específicos del usuario
  SELECT permissions INTO user_perms
  FROM core.user_permissions
  WHERE user_id = p_user_id
    AND organization_id = p_org_id;

  -- 3. Verificar: user_perms > role_perms
  IF user_perms IS NOT NULL THEN
    has_perm := (user_perms -> p_schema ->> p_action)::boolean;
    IF has_perm IS NOT NULL THEN
      RETURN has_perm;
    END IF;
  END IF;

  IF role_perms IS NOT NULL THEN
    IF (role_perms -> p_schema ->> '*')::boolean = true THEN
      RETURN true;
    END IF;
    has_perm := (role_perms -> p_schema ->> p_action)::boolean;
    RETURN COALESCE(has_perm, false);
  END IF;

  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Verificar si usuario es admin de su org actual
CREATE OR REPLACE FUNCTION core.is_org_admin(p_org_id UUID DEFAULT NULL)
RETURNS BOOLEAN AS $$
DECLARE
  check_org_id UUID;
BEGIN
  -- Si no se pasa org_id, usar la activa del usuario
  IF p_org_id IS NULL THEN
    SELECT last_active_organization_id INTO check_org_id
    FROM core.users
    WHERE id = auth.uid();
  ELSE
    check_org_id := p_org_id;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM core.organization_users ou
    JOIN core.roles r ON r.id = ou.role_id
    WHERE ou.user_id = auth.uid()
      AND ou.organization_id = check_org_id
      AND ou.status = 'active'
      AND r.level >= 8
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =====================================================
-- 19. TRIGGER: CREAR USUARIO Y ORG AL REGISTRARSE
-- =====================================================

CREATE OR REPLACE FUNCTION core.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_org_id UUID;
  owner_role_id UUID;
BEGIN
  -- 1. Crear usuario en core.users
  INSERT INTO core.users (id, created_at, updated_at)
  VALUES (NEW.id, NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;

  -- 2. Crear organización personal
  INSERT INTO core.organizations (
    name,
    slug,
    org_type,
    status,
    email
  ) VALUES (
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'personal-' || NEW.id,
    'personal',
    'active',
    NEW.email
  )
  RETURNING id INTO new_org_id;

  -- 3. Obtener rol de owner
  SELECT id INTO owner_role_id
  FROM core.roles
  WHERE slug = 'org_owner';

  -- 4. Vincular usuario a su organización
  INSERT INTO core.organization_users (
    organization_id,
    user_id,
    role_id,
    status
  ) VALUES (
    new_org_id,
    NEW.id,
    owner_role_id,
    'active'
  );

  -- 5. Crear balance de créditos
  INSERT INTO core.organization_credits (organization_id)
  VALUES (new_org_id);

  -- 6. Actualizar last_active_organization_id
  UPDATE core.users
  SET last_active_organization_id = new_org_id
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION core.handle_new_user();

-- =====================================================
-- 20. FUNCIONES DE CRÉDITOS
-- =====================================================

-- Gastar créditos
CREATE OR REPLACE FUNCTION core.spend_credits(
  p_org_id UUID,
  p_amount INTEGER,
  p_description TEXT,
  p_reference_type TEXT DEFAULT NULL,
  p_reference_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  current_balance INTEGER;
  new_balance INTEGER;
BEGIN
  SELECT balance INTO current_balance
  FROM core.organization_credits
  WHERE organization_id = p_org_id
  FOR UPDATE;

  IF current_balance IS NULL OR current_balance < p_amount THEN
    RETURN false;
  END IF;

  new_balance := current_balance - p_amount;

  UPDATE core.organization_credits
  SET
    balance = new_balance,
    total_spent = total_spent + p_amount,
    updated_at = NOW()
  WHERE organization_id = p_org_id;

  INSERT INTO core.credit_transactions (
    organization_id,
    type,
    amount,
    balance_after,
    reference_type,
    reference_id,
    description,
    created_by
  ) VALUES (
    p_org_id,
    'spend',
    -p_amount,
    new_balance,
    p_reference_type,
    p_reference_id,
    p_description,
    auth.uid()
  );

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Agregar créditos
CREATE OR REPLACE FUNCTION core.add_credits(
  p_org_id UUID,
  p_amount INTEGER,
  p_type core.credit_transaction_type,
  p_description TEXT,
  p_reference_type TEXT DEFAULT NULL,
  p_reference_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  current_balance INTEGER;
  new_balance INTEGER;
BEGIN
  SELECT balance INTO current_balance
  FROM core.organization_credits
  WHERE organization_id = p_org_id
  FOR UPDATE;

  IF current_balance IS NULL THEN
    RETURN false;
  END IF;

  new_balance := current_balance + p_amount;

  UPDATE core.organization_credits
  SET
    balance = new_balance,
    total_purchased = CASE WHEN p_type = 'purchase' THEN total_purchased + p_amount ELSE total_purchased END,
    total_bonus = CASE WHEN p_type = 'bonus' THEN total_bonus + p_amount ELSE total_bonus END,
    total_from_subscriptions = CASE WHEN p_type = 'subscription' THEN total_from_subscriptions + p_amount ELSE total_from_subscriptions END,
    updated_at = NOW()
  WHERE organization_id = p_org_id;

  INSERT INTO core.credit_transactions (
    organization_id,
    type,
    amount,
    balance_after,
    reference_type,
    reference_id,
    description,
    created_by
  ) VALUES (
    p_org_id,
    p_type,
    p_amount,
    new_balance,
    p_reference_type,
    p_reference_id,
    p_description,
    auth.uid()
  );

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Transferir créditos entre organizaciones
CREATE OR REPLACE FUNCTION core.transfer_credits(
  p_from_org_id UUID,
  p_to_org_id UUID,
  p_amount INTEGER,
  p_description TEXT DEFAULT 'Transferencia de créditos'
)
RETURNS BOOLEAN AS $$
DECLARE
  from_balance INTEGER;
  from_allows_transfer BOOLEAN;
  to_balance INTEGER;
BEGIN
  -- Verificar que la org origen permite transferencias
  SELECT balance, allow_transfers INTO from_balance, from_allows_transfer
  FROM core.organization_credits
  WHERE organization_id = p_from_org_id
  FOR UPDATE;

  IF NOT from_allows_transfer THEN
    RAISE EXCEPTION 'Organization does not allow credit transfers';
  END IF;

  IF from_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient credits';
  END IF;

  -- Obtener balance destino
  SELECT balance INTO to_balance
  FROM core.organization_credits
  WHERE organization_id = p_to_org_id
  FOR UPDATE;

  IF to_balance IS NULL THEN
    RAISE EXCEPTION 'Target organization not found';
  END IF;

  -- Descontar de origen
  UPDATE core.organization_credits
  SET balance = balance - p_amount, updated_at = NOW()
  WHERE organization_id = p_from_org_id;

  INSERT INTO core.credit_transactions (
    organization_id, type, amount, balance_after,
    related_organization_id, description, created_by
  ) VALUES (
    p_from_org_id, 'transfer_out', -p_amount, from_balance - p_amount,
    p_to_org_id, p_description, auth.uid()
  );

  -- Agregar a destino
  UPDATE core.organization_credits
  SET balance = balance + p_amount, updated_at = NOW()
  WHERE organization_id = p_to_org_id;

  INSERT INTO core.credit_transactions (
    organization_id, type, amount, balance_after,
    related_organization_id, description, created_by
  ) VALUES (
    p_to_org_id, 'transfer_in', p_amount, to_balance + p_amount,
    p_from_org_id, p_description, auth.uid()
  );

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Obtener balance de créditos
CREATE OR REPLACE FUNCTION core.get_credit_balance(p_org_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT balance
    FROM core.organization_credits
    WHERE organization_id = p_org_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =====================================================
-- 21. HABILITAR RLS EN TABLAS DE CORE
-- =====================================================

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
ALTER TABLE core.currencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.credit_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.credit_package_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.organization_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.payment_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.payment_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.product_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.features ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.plan_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.api_usage_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 22. RLS POLICIES
-- =====================================================

-- Organizations
CREATE POLICY "Users view their organizations"
ON core.organizations FOR SELECT
USING (id IN (SELECT core.get_user_organization_ids()));

CREATE POLICY "Org admins can update their organization"
ON core.organizations FOR UPDATE
USING (core.is_org_admin(id));

-- Users
CREATE POLICY "Users can view themselves"
ON core.users FOR SELECT
USING (id = auth.uid());

CREATE POLICY "Users can view org members"
ON core.users FOR SELECT
USING (
  id IN (
    SELECT ou.user_id
    FROM core.organization_users ou
    WHERE ou.organization_id IN (SELECT core.get_user_organization_ids())
  )
);

CREATE POLICY "Users can update themselves"
ON core.users FOR UPDATE
USING (id = auth.uid());

-- Roles (lectura pública para mostrar en UI)
CREATE POLICY "Anyone can view roles"
ON core.roles FOR SELECT
USING (true);

-- Organization Users
CREATE POLICY "Users view their org memberships"
ON core.organization_users FOR SELECT
USING (organization_id IN (SELECT core.get_user_organization_ids()));

CREATE POLICY "Org admins manage memberships"
ON core.organization_users FOR ALL
USING (core.is_org_admin(organization_id));

-- Teams
CREATE POLICY "Users view their org teams"
ON core.teams FOR SELECT
USING (organization_id IN (SELECT core.get_user_organization_ids()));

CREATE POLICY "Org admins manage teams"
ON core.teams FOR ALL
USING (core.is_org_admin(organization_id));

-- Team Members
CREATE POLICY "Users view their org team members"
ON core.team_members FOR SELECT
USING (
  team_id IN (
    SELECT id FROM core.teams
    WHERE organization_id IN (SELECT core.get_user_organization_ids())
  )
);

-- Applications (lectura pública)
CREATE POLICY "Anyone can view active applications"
ON core.applications FOR SELECT
USING (is_active = true);

-- Organization Applications
CREATE POLICY "Users view their org applications"
ON core.organization_applications FOR SELECT
USING (organization_id IN (SELECT core.get_user_organization_ids()));

CREATE POLICY "Org admins manage org applications"
ON core.organization_applications FOR ALL
USING (core.is_org_admin(organization_id));

-- Subscription Plans (lectura pública)
CREATE POLICY "Anyone can view active plans"
ON core.subscription_plans FOR SELECT
USING (is_active = true);

-- Organization Subscriptions
CREATE POLICY "Users view their org subscriptions"
ON core.organization_subscriptions FOR SELECT
USING (organization_id IN (SELECT core.get_user_organization_ids()));

-- Invitations
CREATE POLICY "Users view invitations to their orgs"
ON core.invitations FOR SELECT
USING (organization_id IN (SELECT core.get_user_organization_ids()));

CREATE POLICY "Org admins manage invitations"
ON core.invitations FOR ALL
USING (core.is_org_admin(organization_id));

-- API Keys
CREATE POLICY "Users view their org API keys"
ON core.api_keys FOR SELECT
USING (organization_id IN (SELECT core.get_user_organization_ids()));

CREATE POLICY "Org admins manage API keys"
ON core.api_keys FOR ALL
USING (core.is_org_admin(organization_id));

-- System Events
CREATE POLICY "Users view their org events"
ON core.system_events FOR SELECT
USING (organization_id IN (SELECT core.get_user_organization_ids()));

-- Currencies (lectura pública)
CREATE POLICY "Anyone can view currencies"
ON core.currencies FOR SELECT
USING (is_active = true);

-- Credit Packages (lectura pública)
CREATE POLICY "Anyone can view active credit packages"
ON core.credit_packages FOR SELECT
USING (is_active = true);

-- Credit Package Prices (lectura pública)
CREATE POLICY "Anyone can view credit package prices"
ON core.credit_package_prices FOR SELECT
USING (true);

-- Organization Credits
CREATE POLICY "Users view their org credits"
ON core.organization_credits FOR SELECT
USING (organization_id IN (SELECT core.get_user_organization_ids()));

-- Credit Transactions
CREATE POLICY "Users view their org credit transactions"
ON core.credit_transactions FOR SELECT
USING (organization_id IN (SELECT core.get_user_organization_ids()));

-- Payment Providers (lectura pública)
CREATE POLICY "Anyone can view active payment providers"
ON core.payment_providers FOR SELECT
USING (is_active = true);

-- Payments
CREATE POLICY "Users view their org payments"
ON core.payments FOR SELECT
USING (organization_id IN (SELECT core.get_user_organization_ids()));

CREATE POLICY "Users can create payments"
ON core.payments FOR INSERT
WITH CHECK (organization_id IN (SELECT core.get_user_organization_ids()));

-- Payment Attempts
CREATE POLICY "Users view their payment attempts"
ON core.payment_attempts FOR SELECT
USING (
  payment_id IN (
    SELECT id FROM core.payments
    WHERE organization_id IN (SELECT core.get_user_organization_ids())
  )
);

-- Products (lectura pública)
CREATE POLICY "Anyone can view active products"
ON core.products FOR SELECT
USING (is_active = true);

-- Product Prices (lectura pública)
CREATE POLICY "Anyone can view product prices"
ON core.product_prices FOR SELECT
USING (true);

-- User Permissions
CREATE POLICY "Users view their permissions"
ON core.user_permissions FOR SELECT
USING (user_id = auth.uid() OR core.is_org_admin(organization_id));

CREATE POLICY "Org admins manage user permissions"
ON core.user_permissions FOR ALL
USING (core.is_org_admin(organization_id));

-- Features (lectura pública)
CREATE POLICY "Anyone can view features"
ON core.features FOR SELECT
USING (is_active = true);

-- Plan Features
CREATE POLICY "Anyone can view plan features"
ON core.plan_features FOR SELECT
USING (true);

-- API Usage Logs
CREATE POLICY "Users view their org usage logs"
ON core.api_usage_logs FOR SELECT
USING (organization_id IN (SELECT core.get_user_organization_ids()));

-- =====================================================
-- 23. TRIGGERS PARA UPDATED_AT
-- =====================================================

CREATE TRIGGER update_credit_packages_updated_at
  BEFORE UPDATE ON core.credit_packages
  FOR EACH ROW EXECUTE FUNCTION core.update_updated_at_column();

CREATE TRIGGER update_organization_credits_updated_at
  BEFORE UPDATE ON core.organization_credits
  FOR EACH ROW EXECUTE FUNCTION core.update_updated_at_column();

CREATE TRIGGER update_payment_providers_updated_at
  BEFORE UPDATE ON core.payment_providers
  FOR EACH ROW EXECUTE FUNCTION core.update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON core.payments
  FOR EACH ROW EXECUTE FUNCTION core.update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON core.products
  FOR EACH ROW EXECUTE FUNCTION core.update_updated_at_column();

CREATE TRIGGER update_user_permissions_updated_at
  BEFORE UPDATE ON core.user_permissions
  FOR EACH ROW EXECUTE FUNCTION core.update_updated_at_column();

-- =====================================================
-- 24. GRANTS
-- =====================================================

GRANT USAGE ON SCHEMA core TO authenticated;
GRANT USAGE ON SCHEMA core TO anon;

GRANT SELECT ON ALL TABLES IN SCHEMA core TO authenticated;
GRANT INSERT, UPDATE, DELETE ON core.payments TO authenticated;
GRANT INSERT ON core.api_usage_logs TO authenticated;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA core TO authenticated;

GRANT EXECUTE ON FUNCTION core.get_user_organization_ids() TO authenticated;
GRANT EXECUTE ON FUNCTION core.has_permission(UUID, UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION core.is_org_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION core.spend_credits(UUID, INTEGER, TEXT, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION core.add_credits(UUID, INTEGER, core.credit_transaction_type, TEXT, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION core.transfer_credits(UUID, UUID, INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION core.get_credit_balance(UUID) TO authenticated;

-- =====================================================
-- 25. CREAR BALANCE DE CRÉDITOS PARA ORGS EXISTENTES
-- =====================================================

INSERT INTO core.organization_credits (organization_id)
SELECT id FROM core.organizations
WHERE id NOT IN (SELECT organization_id FROM core.organization_credits)
ON CONFLICT (organization_id) DO NOTHING;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '🎉 ================================================';
  RAISE NOTICE '✅ Core Robust Multi-tenancy Migration Complete';
  RAISE NOTICE '🎉 ================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Nuevas tablas creadas:';
  RAISE NOTICE '  ✅ core.currencies - Monedas soportadas';
  RAISE NOTICE '  ✅ core.credit_packages - Paquetes de créditos';
  RAISE NOTICE '  ✅ core.credit_package_prices - Precios multimoneda';
  RAISE NOTICE '  ✅ core.organization_credits - Balance por org';
  RAISE NOTICE '  ✅ core.credit_transactions - Historial';
  RAISE NOTICE '  ✅ core.payment_providers - Stripe, Flow, etc.';
  RAISE NOTICE '  ✅ core.payments - Pagos realizados';
  RAISE NOTICE '  ✅ core.payment_attempts - Intentos fallidos';
  RAISE NOTICE '  ✅ core.products - Catálogo';
  RAISE NOTICE '  ✅ core.product_prices - Precios multimoneda';
  RAISE NOTICE '  ✅ core.user_permissions - Permisos granulares';
  RAISE NOTICE '  ✅ core.features - Feature flags';
  RAISE NOTICE '  ✅ core.plan_features - Features por plan';
  RAISE NOTICE '  ✅ core.api_usage_logs - Metering';
  RAISE NOTICE '';
  RAISE NOTICE 'Funciones creadas:';
  RAISE NOTICE '  ✅ core.get_user_organization_ids()';
  RAISE NOTICE '  ✅ core.has_permission()';
  RAISE NOTICE '  ✅ core.is_org_admin()';
  RAISE NOTICE '  ✅ core.spend_credits()';
  RAISE NOTICE '  ✅ core.add_credits()';
  RAISE NOTICE '  ✅ core.transfer_credits()';
  RAISE NOTICE '  ✅ core.get_credit_balance()';
  RAISE NOTICE '  ✅ core.handle_new_user() - Trigger para nuevos usuarios';
  RAISE NOTICE '';
  RAISE NOTICE 'RLS habilitado en todas las tablas de core';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  Próximos pasos:';
  RAISE NOTICE '  1. Aplicar migración: supabase db push';
  RAISE NOTICE '  2. Configurar API keys de payment providers';
  RAISE NOTICE '  3. Crear paquetes de créditos iniciales';
  RAISE NOTICE '  4. Crear productos con precios';
  RAISE NOTICE '';
END $$;
