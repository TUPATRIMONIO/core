-- =====================================================
-- Migration: Create document_types catalog
-- Description: Catálogo de tipos de documento legal por país
-- Created: 2025-12-31
-- =====================================================

SET search_path TO signing, core, public, extensions;

-- =====================================================
-- TABLE: signing.document_types
-- =====================================================

CREATE TABLE IF NOT EXISTS signing.document_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificación
  slug TEXT NOT NULL CHECK (slug ~ '^[a-z][a-z0-9_]*[a-z0-9]$'),
  name TEXT NOT NULL CHECK (length(name) >= 2 AND length(name) <= 120),
  description TEXT,
  
  -- País
  country_code TEXT NOT NULL CHECK (length(country_code) = 2),
  
  -- Requisitos específicos por tipo (JSONB para flexibilidad)
  requirements JSONB NOT NULL DEFAULT '{}',
  
  -- Metadata
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraint único por país y slug
  CONSTRAINT unique_document_type_per_country UNIQUE (country_code, slug)
);

-- Índices
CREATE INDEX idx_document_types_country ON signing.document_types(country_code, is_active) WHERE is_active = true;
CREATE INDEX idx_document_types_display_order ON signing.document_types(country_code, display_order);

-- Trigger para updated_at
CREATE TRIGGER update_document_types_updated_at
  BEFORE UPDATE ON signing.document_types
  FOR EACH ROW
  EXECUTE FUNCTION signing.update_updated_at();

-- =====================================================
-- RLS
-- =====================================================

ALTER TABLE signing.document_types ENABLE ROW LEVEL SECURITY;

-- Política: Cualquiera puede ver tipos activos
CREATE POLICY "Anyone can view active document types"
  ON signing.document_types FOR SELECT
  USING (is_active = true);

-- Política: Solo platform admins pueden gestionar
CREATE POLICY "Platform admins can manage document types"
  ON signing.document_types FOR ALL
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

-- =====================================================
-- Vista pública
-- =====================================================

CREATE OR REPLACE VIEW public.signing_document_types AS
SELECT 
  id,
  slug,
  name,
  description,
  country_code,
  requirements,
  display_order,
  is_active,
  created_at,
  updated_at
FROM signing.document_types
WHERE is_active = true;

GRANT SELECT ON public.signing_document_types TO anon, authenticated;

-- =====================================================
-- SEED: Tipos de documento para Chile (CL)
-- =====================================================

INSERT INTO signing.document_types (
  slug,
  name,
  description,
  country_code,
  requirements,
  display_order
) VALUES
  (
    'contrato',
    'Contrato',
    'Acuerdo entre dos o más partes con obligaciones recíprocas',
    'CL',
    '{"requires_parties": true, "requires_consideration": true, "common_clauses": ["objeto", "obligaciones", "plazo", "penalizaciones"]}',
    10
  ),
  (
    'poder',
    'Poder',
    'Documento que autoriza a una persona a actuar en representación de otra',
    'CL',
    '{"requires_principal": true, "requires_attorney": true, "requires_scope": true, "can_be_revoked": true}',
    20
  ),
  (
    'mandato',
    'Mandato',
    'Contrato donde una parte confía la gestión de uno o más negocios a otra',
    'CL',
    '{"requires_mandante": true, "requires_mandatario": true, "requires_scope": true}',
    30
  ),
  (
    'finiquito',
    'Finiquito',
    'Documento que extingue obligaciones laborales o contractuales',
    'CL',
    '{"requires_parties": true, "requires_settlement_amount": false, "final_document": true}',
    40
  ),
  (
    'promesa',
    'Promesa de Compraventa',
    'Compromiso de comprar o vender un bien en el futuro',
    'CL',
    '{"requires_buyer": true, "requires_seller": true, "requires_property_description": true, "requires_price": true}',
    50
  ),
  (
    'cesion',
    'Cesión de Derechos',
    'Transferencia de derechos de una persona a otra',
    'CL',
    '{"requires_cedente": true, "requires_cesionario": true, "requires_rights_description": true}',
    60
  ),
  (
    'convenio',
    'Convenio',
    'Acuerdo entre partes para resolver un conflicto o establecer condiciones',
    'CL',
    '{"requires_parties": true, "requires_agreement_terms": true}',
    70
  ),
  (
    'compromiso',
    'Compromiso Arbitral',
    'Acuerdo para someter una controversia a arbitraje',
    'CL',
    '{"requires_parties": true, "requires_arbitrator": false, "requires_dispute_description": true}',
    80
  ),
  (
    'otro',
    'Otro',
    'Otro tipo de documento legal',
    'CL',
    '{}',
    999
  )
ON CONFLICT (country_code, slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  requirements = EXCLUDED.requirements,
  display_order = EXCLUDED.display_order,
  is_active = true,
  updated_at = NOW();

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Tabla document_types creada y seed aplicado para Chile';
END $$;

