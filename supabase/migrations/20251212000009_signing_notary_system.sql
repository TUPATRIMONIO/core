-- =====================================================
-- Migration: Signing notary system (offices, services, assignments)
-- Description: Base para asignación ponderada y panel de notarías
-- Created: 2025-12-12
-- =====================================================

SET search_path TO signing, core, public, extensions;

-- =====================================================
-- TABLE: signing.notary_offices
-- =====================================================

CREATE TABLE IF NOT EXISTS signing.notary_offices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,

  name TEXT NOT NULL CHECK (length(name) >= 2 AND length(name) <= 120),
  country_code TEXT NOT NULL CHECK (length(country_code) = 2),
  city TEXT,
  address TEXT,

  email TEXT NOT NULL CHECK (email ~ '^[^@]+@[^@]+\.[^@]+$'),
  phone TEXT,

  is_active BOOLEAN NOT NULL DEFAULT true,
  accepts_new_documents BOOLEAN NOT NULL DEFAULT true,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_notary_office_org UNIQUE (organization_id)
);

CREATE INDEX IF NOT EXISTS idx_notary_offices_country ON signing.notary_offices(country_code, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_notary_offices_org ON signing.notary_offices(organization_id);

DROP TRIGGER IF EXISTS update_notary_offices_updated_at ON signing.notary_offices;
CREATE TRIGGER update_notary_offices_updated_at
  BEFORE UPDATE ON signing.notary_offices
  FOR EACH ROW EXECUTE FUNCTION signing.update_updated_at();

-- =====================================================
-- TABLE: signing.notary_services
-- =====================================================

CREATE TABLE IF NOT EXISTS signing.notary_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notary_office_id UUID NOT NULL REFERENCES signing.notary_offices(id) ON DELETE CASCADE,

  -- Producto de notaría (signing.products con category='notary_service')
  product_id UUID NOT NULL REFERENCES signing.products(id) ON DELETE CASCADE,

  -- Peso entero (proporción = weight / suma_total_pesos)
  weight INTEGER NOT NULL DEFAULT 1 CHECK (weight >= 1),

  max_daily_documents INTEGER,
  current_daily_count INTEGER NOT NULL DEFAULT 0,

  is_active BOOLEAN NOT NULL DEFAULT true,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_notary_service UNIQUE (notary_office_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_notary_services_product ON signing.notary_services(product_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_notary_services_office ON signing.notary_services(notary_office_id, is_active) WHERE is_active = true;

DROP TRIGGER IF EXISTS update_notary_services_updated_at ON signing.notary_services;
CREATE TRIGGER update_notary_services_updated_at
  BEFORE UPDATE ON signing.notary_services
  FOR EACH ROW EXECUTE FUNCTION signing.update_updated_at();

-- =====================================================
-- TABLE: signing.notary_assignments
-- =====================================================

CREATE TABLE IF NOT EXISTS signing.notary_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES signing.documents(id) ON DELETE CASCADE,
  notary_office_id UUID NOT NULL REFERENCES signing.notary_offices(id) ON DELETE RESTRICT,
  product_id UUID NOT NULL REFERENCES signing.products(id) ON DELETE RESTRICT,

  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',
    'received',
    'in_progress',
    'needs_correction',
    'needs_documents',
    'completed',
    'rejected'
  )),

  notes TEXT,
  rejection_reason TEXT,
  correction_request TEXT,

  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  received_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  notarized_file_path TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_document_assignment UNIQUE (document_id)
);

CREATE INDEX IF NOT EXISTS idx_notary_assignments_notary ON signing.notary_assignments(notary_office_id, status);
CREATE INDEX IF NOT EXISTS idx_notary_assignments_document ON signing.notary_assignments(document_id);

DROP TRIGGER IF EXISTS update_notary_assignments_updated_at ON signing.notary_assignments;
CREATE TRIGGER update_notary_assignments_updated_at
  BEFORE UPDATE ON signing.notary_assignments
  FOR EACH ROW EXECUTE FUNCTION signing.update_updated_at();

-- =====================================================
-- RLS
-- =====================================================

ALTER TABLE signing.notary_offices ENABLE ROW LEVEL SECURITY;
ALTER TABLE signing.notary_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE signing.notary_assignments ENABLE ROW LEVEL SECURITY;

-- notary_offices
DROP POLICY IF EXISTS "Notary org users can view own notary office" ON signing.notary_offices;
CREATE POLICY "Notary org users can view own notary office"
ON signing.notary_offices FOR SELECT
USING (signing.user_belongs_to_org(organization_id));

DROP POLICY IF EXISTS "Notary org admins can manage own notary office" ON signing.notary_offices;
CREATE POLICY "Notary org admins can manage own notary office"
ON signing.notary_offices FOR ALL
USING (signing.user_is_org_admin(organization_id));

DROP POLICY IF EXISTS "Platform admins can manage notary offices" ON signing.notary_offices;
CREATE POLICY "Platform admins can manage notary offices"
ON signing.notary_offices FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM core.organization_users ou
    JOIN core.organizations o ON o.id = ou.organization_id
    JOIN core.roles r ON r.id = ou.role_id
    WHERE ou.user_id = auth.uid()
      AND ou.status = 'active'
      AND o.org_type = 'platform'
      AND r.level >= 9
  )
);

-- notary_services
DROP POLICY IF EXISTS "Notary org users can view own notary services" ON signing.notary_services;
CREATE POLICY "Notary org users can view own notary services"
ON signing.notary_services FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM signing.notary_offices no
    WHERE no.id = notary_office_id
      AND signing.user_belongs_to_org(no.organization_id)
  )
);

DROP POLICY IF EXISTS "Notary org admins can manage own notary services" ON signing.notary_services;
CREATE POLICY "Notary org admins can manage own notary services"
ON signing.notary_services FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM signing.notary_offices no
    WHERE no.id = notary_office_id
      AND signing.user_is_org_admin(no.organization_id)
  )
);

-- notary_assignments
DROP POLICY IF EXISTS "Notary org users can view assignments" ON signing.notary_assignments;
CREATE POLICY "Notary org users can view assignments"
ON signing.notary_assignments FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM signing.notary_offices no
    WHERE no.id = notary_office_id
      AND signing.user_belongs_to_org(no.organization_id)
  )
);

DROP POLICY IF EXISTS "Notary org users can update assignments" ON signing.notary_assignments;
CREATE POLICY "Notary org users can update assignments"
ON signing.notary_assignments FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM signing.notary_offices no
    WHERE no.id = notary_office_id
      AND signing.user_belongs_to_org(no.organization_id)
  )
);

-- Clients can view their document assignments (read-only)
DROP POLICY IF EXISTS "Clients can view assignments for own org documents" ON signing.notary_assignments;
CREATE POLICY "Clients can view assignments for own org documents"
ON signing.notary_assignments FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM signing.documents d
    WHERE d.id = document_id
      AND signing.user_belongs_to_org(d.organization_id)
  )
);

-- service_role full access (already granted by schema grants)

-- =====================================================
-- GRANTS
-- =====================================================

GRANT SELECT ON signing.notary_offices TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON signing.notary_services TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON signing.notary_assignments TO authenticated;

DO $$
BEGIN
  RAISE NOTICE '✅ Notary system base creado: notary_offices, notary_services, notary_assignments';
END $$;

