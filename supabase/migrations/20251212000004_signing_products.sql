-- =====================================================
-- Migration: Signing products catalog (multi-country)
-- Description: Catálogo de servicios de firma/notaría con reglas de identificador
-- Created: 2025-12-12
-- =====================================================

SET search_path TO signing, core, public, extensions;

-- =====================================================
-- TABLE: signing.products
-- =====================================================

CREATE TABLE IF NOT EXISTS signing.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identidad del producto
  slug TEXT UNIQUE NOT NULL CHECK (slug ~ '^[a-z][a-z0-9_]*[a-z0-9]$'),
  name TEXT NOT NULL CHECK (length(name) >= 2 AND length(name) <= 120),
  description TEXT,

  -- Clasificación
  category TEXT NOT NULL CHECK (category IN ('signature_type', 'notary_service')),
  country_code TEXT NOT NULL CHECK (length(country_code) = 2), -- ISO 3166-1 alpha-2

  -- Precio
  base_price DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (base_price >= 0),
  currency TEXT NOT NULL DEFAULT 'CLP' CHECK (currency ~ '^[A-Z]{3}$'),
  billing_unit TEXT NOT NULL DEFAULT 'per_document' CHECK (billing_unit IN ('per_document', 'per_signer')),

  -- Reglas de identificador del firmante
  identifier_type TEXT NOT NULL DEFAULT 'any' CHECK (identifier_type IN ('rut_only', 'any')),

  -- Si es servicio notarial, mapear al enum existente
  notary_service signing.notary_service_type,

  -- UI
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Metadata
  metadata JSONB NOT NULL DEFAULT '{}',

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_signing_products_country ON signing.products(country_code, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_signing_products_category ON signing.products(category, country_code, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_signing_products_display_order ON signing.products(country_code, category, display_order);

-- updated_at trigger
DROP TRIGGER IF EXISTS update_products_updated_at ON signing.products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON signing.products
  FOR EACH ROW EXECUTE FUNCTION signing.update_updated_at();

-- =====================================================
-- RLS
-- =====================================================

ALTER TABLE signing.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active signing products" ON signing.products;
CREATE POLICY "Anyone can view active signing products"
ON signing.products FOR SELECT
USING (is_active = true);

DROP POLICY IF EXISTS "Platform admins can manage signing products" ON signing.products;
CREATE POLICY "Platform admins can manage signing products"
ON signing.products FOR ALL
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

GRANT SELECT ON signing.products TO anon, authenticated;
GRANT ALL ON signing.products TO service_role;

-- =====================================================
-- Public view
-- =====================================================

CREATE OR REPLACE VIEW public.signing_products AS
SELECT * FROM signing.products;

GRANT SELECT ON public.signing_products TO anon, authenticated;
ALTER VIEW public.signing_products SET (security_invoker = true);

-- =====================================================
-- Seed: Chile (CL)
-- NOTE: Ajusta los precios reales cuando estén definidos
-- =====================================================

-- Signature types (per signer)
INSERT INTO signing.products (
  slug,
  name,
  description,
  category,
  country_code,
  base_price,
  currency,
  billing_unit,
  identifier_type,
  display_order
) VALUES
  (
    'fes_cl',
    'Firma Electrónica Simple (FES)',
    'Firma simple aplicable a múltiples países. Ideal para acuerdos básicos.',
    'signature_type',
    'CL',
    0,
    'CLP',
    'per_signer',
    'any',
    10
  ),
  (
    'fea_cl',
    'Firma Electrónica Avanzada (FEA)',
    'Firma avanzada en Chile. Requiere RUT chileno y validación de identidad.',
    'signature_type',
    'CL',
    0,
    'CLP',
    'per_signer',
    'rut_only',
    20
  ),
  (
    'fes_claveunica_cl',
    'FES + ClaveÚnica',
    'Firma simple con autenticación ClaveÚnica (Chile). Requiere RUT chileno.',
    'signature_type',
    'CL',
    0,
    'CLP',
    'per_signer',
    'rut_only',
    30
  ),
  (
    'fesb_cl',
    'Firma Electrónica Simple Biométrica (FESB)',
    'Firma simple biométrica (multi-país). Puede usar distintos identificadores.',
    'signature_type',
    'CL',
    0,
    'CLP',
    'per_signer',
    'any',
    40
  )
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  country_code = EXCLUDED.country_code,
  base_price = EXCLUDED.base_price,
  currency = EXCLUDED.currency,
  billing_unit = EXCLUDED.billing_unit,
  identifier_type = EXCLUDED.identifier_type,
  display_order = EXCLUDED.display_order,
  is_active = true,
  updated_at = NOW();

-- Notary services (per document)
INSERT INTO signing.products (
  slug,
  name,
  description,
  category,
  country_code,
  base_price,
  currency,
  billing_unit,
  identifier_type,
  notary_service,
  display_order
) VALUES
  (
    'legalized_copy_cl',
    'Copia Legalizada',
    'Servicio notarial de copia legalizada.',
    'notary_service',
    'CL',
    0,
    'CLP',
    'per_document',
    'any',
    'legalized_copy',
    10
  ),
  (
    'protocolization_cl',
    'Protocolización',
    'Servicio notarial de protocolización.',
    'notary_service',
    'CL',
    0,
    'CLP',
    'per_document',
    'any',
    'protocolization',
    20
  )
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  country_code = EXCLUDED.country_code,
  base_price = EXCLUDED.base_price,
  currency = EXCLUDED.currency,
  billing_unit = EXCLUDED.billing_unit,
  identifier_type = EXCLUDED.identifier_type,
  notary_service = EXCLUDED.notary_service,
  display_order = EXCLUDED.display_order,
  is_active = true,
  updated_at = NOW();

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ signing.products creado y seed aplicado (CL)';
END $$;

