-- Migration: Create core schema for multi-tenant foundation
-- Description: Creates the fundamental multi-tenant structure with organizations, users, roles, and permissions
-- Created: 2025-10-21

-- Create the core schema
CREATE SCHEMA IF NOT EXISTS core;

-- Set search path to include core schema
SET search_path TO core, public, extensions;

-- =====================================================
-- ENUMS
-- =====================================================

CREATE TYPE core.user_status AS ENUM ('active', 'inactive', 'suspended', 'pending');
CREATE TYPE core.organization_status AS ENUM ('active', 'inactive', 'suspended', 'trial');
CREATE TYPE core.invitation_status AS ENUM ('pending', 'accepted', 'expired', 'cancelled');
CREATE TYPE core.subscription_status AS ENUM ('active', 'cancelled', 'expired', 'trial', 'past_due');
CREATE TYPE core.system_event_level AS ENUM ('info', 'warning', 'error', 'critical');

-- =====================================================
-- ORGANIZATIONS (Multi-tenant base)
-- =====================================================

CREATE TABLE core.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (length(name) >= 2),
  slug TEXT UNIQUE NOT NULL CHECK (slug ~ '^[a-z0-9][a-z0-9-]*[a-z0-9]$'),
  description TEXT,
  status core.organization_status NOT NULL DEFAULT 'trial',
  
  -- Contact information
  email TEXT CHECK (email ~ '^[^@]+@[^@]+\.[^@]+$'),
  phone TEXT,
  website TEXT,
  
  -- Address
  country TEXT,
  state TEXT,
  city TEXT,
  address TEXT,
  postal_code TEXT,
  
  -- Business information
  tax_id TEXT,
  industry TEXT,
  size_category TEXT CHECK (size_category IN ('startup', 'small', 'medium', 'large', 'enterprise')),
  
  -- Settings (JSONB for flexibility)
  settings JSONB NOT NULL DEFAULT '{}',
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Soft delete
  deleted_at TIMESTAMPTZ,
  
  -- Constraints
  CONSTRAINT valid_slug_length CHECK (length(slug) >= 3 AND length(slug) <= 50),
  CONSTRAINT valid_name_length CHECK (length(name) <= 100)
);

-- =====================================================
-- USERS (Extension of Supabase Auth)
-- =====================================================

CREATE TABLE core.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Profile information
  first_name TEXT CHECK (length(first_name) <= 50),
  last_name TEXT CHECK (length(last_name) <= 50),
  full_name TEXT GENERATED ALWAYS AS (
    CASE 
      WHEN first_name IS NOT NULL AND last_name IS NOT NULL 
      THEN first_name || ' ' || last_name
      WHEN first_name IS NOT NULL 
      THEN first_name
      ELSE last_name
    END
  ) STORED,
  
  -- Contact
  phone TEXT,
  avatar_url TEXT,
  
  -- Status and preferences
  status core.user_status NOT NULL DEFAULT 'active',
  locale TEXT NOT NULL DEFAULT 'es-CL',
  timezone TEXT NOT NULL DEFAULT 'America/Santiago',
  
  -- User preferences (theme, notifications, etc.)
  preferences JSONB NOT NULL DEFAULT '{"theme": "light", "notifications": {"email": true, "push": true}}',
  
  -- Activity tracking
  last_seen_at TIMESTAMPTZ,
  last_active_organization_id UUID REFERENCES core.organizations(id),
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_locale CHECK (locale ~ '^[a-z]{2}-[A-Z]{2}$')
);

-- =====================================================
-- ROLES AND PERMISSIONS
-- =====================================================

CREATE TABLE core.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (length(name) >= 2 AND length(name) <= 50),
  slug TEXT UNIQUE NOT NULL CHECK (slug ~ '^[a-z][a-z0-9_]*[a-z0-9]$'),
  description TEXT,
  
  -- Role hierarchy (for inheritance)
  parent_role_id UUID REFERENCES core.roles(id),
  level INTEGER NOT NULL DEFAULT 0 CHECK (level >= 0 AND level <= 10),
  
  -- Permissions (JSONB for flexibility)
  permissions JSONB NOT NULL DEFAULT '{}',
  
  -- System role (cannot be deleted)
  is_system BOOLEAN NOT NULL DEFAULT false,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT no_self_reference CHECK (id != parent_role_id)
);

-- =====================================================
-- ORGANIZATION USERS (M:N Relationship)
-- =====================================================

CREATE TABLE core.organization_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES core.roles(id),
  
  -- Status
  status core.user_status NOT NULL DEFAULT 'active',
  
  -- Joining information
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  invited_by UUID REFERENCES core.users(id),
  
  -- Additional permissions (organization-specific)
  additional_permissions JSONB NOT NULL DEFAULT '{}',
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Unique constraint: user can only have one active role per organization
  CONSTRAINT unique_active_user_per_org UNIQUE (organization_id, user_id),
  
  -- Indexes for performance
  CONSTRAINT org_user_valid_combination CHECK (organization_id != user_id::text::uuid)
);

-- =====================================================
-- TEAMS (Within Organizations)
-- =====================================================

CREATE TABLE core.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  
  -- Team information
  name TEXT NOT NULL CHECK (length(name) >= 2 AND length(name) <= 100),
  description TEXT,
  color TEXT CHECK (color ~ '^#[0-9A-Fa-f]{6}$'), -- Hex color
  
  -- Team lead
  lead_user_id UUID REFERENCES core.users(id),
  
  -- Settings
  settings JSONB NOT NULL DEFAULT '{}',
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Team name must be unique within organization
  CONSTRAINT unique_team_name_per_org UNIQUE (organization_id, name)
);

-- =====================================================
-- TEAM MEMBERS
-- =====================================================

CREATE TABLE core.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES core.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
  
  -- Member role within team (optional, different from organization role)
  team_role TEXT CHECK (team_role IN ('member', 'lead', 'admin')),
  
  -- Joining information
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  added_by UUID REFERENCES core.users(id),
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- User can only be in a team once
  CONSTRAINT unique_team_member UNIQUE (team_id, user_id)
);

-- =====================================================
-- APPLICATIONS (Ecosystem services)
-- =====================================================

CREATE TABLE core.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Application information
  name TEXT NOT NULL CHECK (length(name) >= 2 AND length(name) <= 100),
  slug TEXT UNIQUE NOT NULL CHECK (slug ~ '^[a-z][a-z0-9_]*[a-z0-9]$'),
  description TEXT,
  
  -- Technical details
  version TEXT NOT NULL DEFAULT '1.0.0',
  api_endpoint TEXT,
  
  -- Categorization
  category TEXT NOT NULL CHECK (category IN ('core', 'business', 'ai', 'integration', 'analytics')),
  tags TEXT[] DEFAULT '{}',
  
  -- Status and availability
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_beta BOOLEAN NOT NULL DEFAULT false,
  requires_subscription BOOLEAN NOT NULL DEFAULT false,
  
  -- Configuration schema (JSON Schema for validation)
  config_schema JSONB,
  default_config JSONB NOT NULL DEFAULT '{}',
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- ORGANIZATION APPLICATIONS (Which apps each org has enabled)
-- =====================================================

CREATE TABLE core.organization_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  application_id UUID NOT NULL REFERENCES core.applications(id) ON DELETE CASCADE,
  
  -- Application-specific configuration for this organization
  config JSONB NOT NULL DEFAULT '{}',
  
  -- Status
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  
  -- Usage tracking
  enabled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  disabled_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Unique constraint: one configuration per app per organization
  CONSTRAINT unique_org_application UNIQUE (organization_id, application_id)
);

-- =====================================================
-- SUBSCRIPTION PLANS
-- =====================================================

CREATE TABLE core.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Plan information
  name TEXT NOT NULL CHECK (length(name) >= 2 AND length(name) <= 100),
  slug TEXT UNIQUE NOT NULL CHECK (slug ~ '^[a-z][a-z0-9_-]*[a-z0-9]$'),
  description TEXT,
  
  -- Pricing
  price_monthly DECIMAL(10,2) NOT NULL DEFAULT 0.00 CHECK (price_monthly >= 0),
  price_yearly DECIMAL(10,2) NOT NULL DEFAULT 0.00 CHECK (price_yearly >= 0),
  currency TEXT NOT NULL DEFAULT 'USD' CHECK (currency ~ '^[A-Z]{3}$'),
  
  -- Plan features and limits
  features JSONB NOT NULL DEFAULT '{}',
  limits JSONB NOT NULL DEFAULT '{}',
  
  -- Plan status
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_popular BOOLEAN NOT NULL DEFAULT false,
  
  -- Ordering and display
  sort_order INTEGER NOT NULL DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- ORGANIZATION SUBSCRIPTIONS
-- =====================================================

CREATE TABLE core.organization_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES core.subscription_plans(id),
  
  -- Subscription details
  status core.subscription_status NOT NULL DEFAULT 'trial',
  
  -- Billing period
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  current_period_end TIMESTAMPTZ NOT NULL,
  trial_end TIMESTAMPTZ,
  
  -- Pricing (stored for history)
  price_monthly DECIMAL(10,2) NOT NULL,
  price_yearly DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  
  -- Payment information (references to billing system)
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  
  -- Usage tracking
  usage_data JSONB NOT NULL DEFAULT '{}',
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  cancelled_at TIMESTAMPTZ,
  
  -- Constraints
  CONSTRAINT valid_period CHECK (current_period_end > current_period_start),
  CONSTRAINT valid_trial CHECK (trial_end IS NULL OR trial_end > created_at)
);

-- =====================================================
-- INVITATIONS
-- =====================================================

CREATE TABLE core.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES core.roles(id),
  
  -- Invitation details
  email TEXT NOT NULL CHECK (email ~ '^[^@]+@[^@]+\.[^@]+$'),
  token TEXT UNIQUE NOT NULL,
  
  -- Status
  status core.invitation_status NOT NULL DEFAULT 'pending',
  
  -- Who sent the invitation
  invited_by UUID NOT NULL REFERENCES core.users(id),
  invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Expiration
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  
  -- Acceptance tracking
  accepted_at TIMESTAMPTZ,
  accepted_by UUID REFERENCES core.users(id),
  
  -- Additional message
  message TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_expiration CHECK (expires_at > invited_at),
  CONSTRAINT accepted_details_consistency CHECK (
    (status = 'accepted' AND accepted_at IS NOT NULL AND accepted_by IS NOT NULL) OR
    (status != 'accepted' AND accepted_at IS NULL AND accepted_by IS NULL)
  )
);

-- =====================================================
-- API KEYS
-- =====================================================

CREATE TABLE core.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  
  -- Key information
  name TEXT NOT NULL CHECK (length(name) >= 2 AND length(name) <= 100),
  key_hash TEXT NOT NULL UNIQUE, -- Hashed version of the key
  key_prefix TEXT NOT NULL, -- First few characters for identification (e.g., "sk_...")
  
  -- Permissions and scopes
  scopes TEXT[] NOT NULL DEFAULT '{}',
  permissions JSONB NOT NULL DEFAULT '{}',
  
  -- Usage tracking
  last_used_at TIMESTAMPTZ,
  usage_count INTEGER NOT NULL DEFAULT 0,
  
  -- Rate limiting
  rate_limit_per_hour INTEGER DEFAULT 1000,
  
  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Expiration
  expires_at TIMESTAMPTZ,
  
  -- Created by
  created_by UUID NOT NULL REFERENCES core.users(id),
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  revoked_by UUID REFERENCES core.users(id),
  
  -- Constraints
  CONSTRAINT valid_key_prefix CHECK (key_prefix ~ '^[a-z]{2,4}_[a-zA-Z0-9]{4}$'),
  CONSTRAINT valid_expiration_api CHECK (expires_at IS NULL OR expires_at > created_at)
);

-- =====================================================
-- SYSTEM EVENTS (Audit trail)
-- =====================================================

CREATE TABLE core.system_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES core.organizations(id), -- NULL for system-wide events
  
  -- Event details
  event_type TEXT NOT NULL,
  event_level core.system_event_level NOT NULL DEFAULT 'info',
  message TEXT NOT NULL,
  
  -- Context
  user_id UUID REFERENCES core.users(id),
  resource_type TEXT,
  resource_id UUID,
  
  -- Additional data
  metadata JSONB NOT NULL DEFAULT '{}',
  
  -- Request context
  ip_address INET,
  user_agent TEXT,
  request_id UUID,
  
  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Indexes will be created separately for performance
  CONSTRAINT valid_event_type CHECK (length(event_type) >= 2)
);

-- =====================================================
-- INDEXES for Performance
-- =====================================================

-- Organizations
CREATE INDEX idx_organizations_status ON core.organizations(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_organizations_slug ON core.organizations(slug) WHERE deleted_at IS NULL;

-- Users
CREATE INDEX idx_users_status ON core.users(status);
CREATE INDEX idx_users_last_seen ON core.users(last_seen_at);
CREATE INDEX idx_users_organization ON core.users(last_active_organization_id);

-- Organization Users (critical for multi-tenancy)
CREATE INDEX idx_org_users_org_id ON core.organization_users(organization_id);
CREATE INDEX idx_org_users_user_id ON core.organization_users(user_id);
CREATE INDEX idx_org_users_role_id ON core.organization_users(role_id);

-- Teams
CREATE INDEX idx_teams_organization ON core.teams(organization_id);
CREATE INDEX idx_team_members_team ON core.team_members(team_id);
CREATE INDEX idx_team_members_user ON core.team_members(user_id);

-- Applications
CREATE INDEX idx_org_applications_org ON core.organization_applications(organization_id);
CREATE INDEX idx_org_applications_app ON core.organization_applications(application_id);
CREATE INDEX idx_applications_category ON core.applications(category) WHERE is_active = true;

-- Subscriptions
CREATE INDEX idx_org_subscriptions_org ON core.organization_subscriptions(organization_id);
CREATE INDEX idx_org_subscriptions_status ON core.organization_subscriptions(status);
CREATE INDEX idx_org_subscriptions_period ON core.organization_subscriptions(current_period_end);

-- Invitations
CREATE INDEX idx_invitations_org ON core.invitations(organization_id);
CREATE INDEX idx_invitations_email ON core.invitations(email);
CREATE INDEX idx_invitations_token ON core.invitations(token);
CREATE INDEX idx_invitations_status ON core.invitations(status);
CREATE INDEX idx_invitations_expires ON core.invitations(expires_at);

-- API Keys
CREATE INDEX idx_api_keys_org ON core.api_keys(organization_id);
CREATE INDEX idx_api_keys_hash ON core.api_keys(key_hash);
CREATE INDEX idx_api_keys_prefix ON core.api_keys(key_prefix);
CREATE INDEX idx_api_keys_active ON core.api_keys(organization_id, is_active) WHERE is_active = true;

-- System Events (partitioned by date for performance)
CREATE INDEX idx_system_events_org_created ON core.system_events(organization_id, created_at DESC);
CREATE INDEX idx_system_events_user ON core.system_events(user_id, created_at DESC);
CREATE INDEX idx_system_events_type ON core.system_events(event_type, created_at DESC);
CREATE INDEX idx_system_events_level ON core.system_events(event_level, created_at DESC);

-- =====================================================
-- TRIGGERS for Updated Timestamps
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION core.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON core.organizations FOR EACH ROW EXECUTE FUNCTION core.update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON core.users FOR EACH ROW EXECUTE FUNCTION core.update_updated_at_column();
CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON core.roles FOR EACH ROW EXECUTE FUNCTION core.update_updated_at_column();
CREATE TRIGGER update_organization_users_updated_at BEFORE UPDATE ON core.organization_users FOR EACH ROW EXECUTE FUNCTION core.update_updated_at_column();
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON core.teams FOR EACH ROW EXECUTE FUNCTION core.update_updated_at_column();
CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON core.applications FOR EACH ROW EXECUTE FUNCTION core.update_updated_at_column();
CREATE TRIGGER update_organization_applications_updated_at BEFORE UPDATE ON core.organization_applications FOR EACH ROW EXECUTE FUNCTION core.update_updated_at_column();
CREATE TRIGGER update_subscription_plans_updated_at BEFORE UPDATE ON core.subscription_plans FOR EACH ROW EXECUTE FUNCTION core.update_updated_at_column();
CREATE TRIGGER update_organization_subscriptions_updated_at BEFORE UPDATE ON core.organization_subscriptions FOR EACH ROW EXECUTE FUNCTION core.update_updated_at_column();
CREATE TRIGGER update_invitations_updated_at BEFORE UPDATE ON core.invitations FOR EACH ROW EXECUTE FUNCTION core.update_updated_at_column();
CREATE TRIGGER update_api_keys_updated_at BEFORE UPDATE ON core.api_keys FOR EACH ROW EXECUTE FUNCTION core.update_updated_at_column();

-- =====================================================
-- COMMENTS for Documentation
-- =====================================================

COMMENT ON SCHEMA core IS 'Core multi-tenant foundation schema containing organizations, users, roles, and fundamental system entities';

COMMENT ON TABLE core.organizations IS 'Multi-tenant organizations - the primary partitioning entity for the entire system';
COMMENT ON TABLE core.users IS 'Extended user profiles that complement Supabase Auth users with additional business information';
COMMENT ON TABLE core.roles IS 'System roles with hierarchical permissions structure';
COMMENT ON TABLE core.organization_users IS 'Many-to-many relationship between users and organizations with role assignments';
COMMENT ON TABLE core.teams IS 'Teams within organizations for better collaboration and organization';
COMMENT ON TABLE core.applications IS 'Available applications/services in the TuPatrimonio ecosystem';
COMMENT ON TABLE core.subscription_plans IS 'Available subscription plans with features and pricing';
COMMENT ON TABLE core.organization_subscriptions IS 'Active subscriptions for organizations';
COMMENT ON TABLE core.invitations IS 'Pending invitations for users to join organizations';
COMMENT ON TABLE core.api_keys IS 'API keys for programmatic access to organization resources';
COMMENT ON TABLE core.system_events IS 'System-wide audit log for tracking important events and changes';

-- Success message
SELECT 'Core schema created successfully with ' || 
       (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'core') || 
       ' tables' as result;
