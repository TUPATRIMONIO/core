-- =====================================================
-- Migration: Create invoicing schema
-- Description: Schema separado para emisión de documentos tributarios externos (Haulmer DTEs, Stripe Invoices)
-- Created: 2025-12-02
-- =====================================================

-- Create the invoicing schema
CREATE SCHEMA IF NOT EXISTS invoicing;

-- Set search path
SET search_path TO invoicing, billing, credits, core, public, extensions;

-- =====================================================
-- ENUMS
-- =====================================================

CREATE TYPE invoicing.document_type AS ENUM (
  'factura_electronica',    -- Factura electrónica (Haulmer TipoDTE: 33)
  'boleta_electronica',     -- Boleta electrónica (Haulmer TipoDTE: 39)
  'stripe_invoice'          -- Invoice de Stripe
);

CREATE TYPE invoicing.request_status AS ENUM (
  'pending',      -- Pendiente de procesar
  'processing',   -- En proceso
  'completed',    -- Completado exitosamente
  'failed'        -- Falló
);

CREATE TYPE invoicing.provider_type AS ENUM (
  'haulmer',      -- Haulmer/OpenFactura (Chile)
  'stripe'       -- Stripe (Internacional)
);

-- =====================================================
-- EMISSION CONFIG
-- =====================================================

CREATE TABLE invoicing.emission_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL UNIQUE REFERENCES core.organizations(id) ON DELETE CASCADE,
  
  -- Configuración de emisión automática
  auto_emit_on_completion BOOLEAN NOT NULL DEFAULT true,
  default_document_type invoicing.document_type NOT NULL DEFAULT 'stripe_invoice',
  
  -- Proveedores habilitados
  haulmer_enabled BOOLEAN NOT NULL DEFAULT false,
  stripe_enabled BOOLEAN NOT NULL DEFAULT true,
  
  -- Configuración específica por proveedor
  haulmer_config JSONB NOT NULL DEFAULT '{}', -- Configuración adicional de Haulmer
  stripe_config JSONB NOT NULL DEFAULT '{}', -- Configuración adicional de Stripe
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- DOCUMENT REQUESTS (Cola de solicitudes)
-- =====================================================

CREATE TABLE invoicing.document_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES billing.orders(id) ON DELETE CASCADE,
  invoice_id UUID NOT NULL REFERENCES billing.invoices(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  
  -- Tipo de documento y proveedor
  document_type invoicing.document_type NOT NULL,
  provider invoicing.provider_type NOT NULL,
  
  -- Estado de la solicitud
  status invoicing.request_status NOT NULL DEFAULT 'pending',
  
  -- Reintentos y errores
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  last_error TEXT,
  last_error_at TIMESTAMPTZ,
  
  -- Datos de la solicitud (snapshot de la orden/invoice)
  request_data JSONB NOT NULL DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Constraints
  CONSTRAINT valid_provider_document_type CHECK (
    (provider = 'haulmer' AND document_type IN ('factura_electronica', 'boleta_electronica')) OR
    (provider = 'stripe' AND document_type = 'stripe_invoice')
  )
);

-- =====================================================
-- ISSUED DOCUMENTS (Documentos emitidos exitosamente)
-- =====================================================

CREATE TABLE invoicing.issued_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES invoicing.document_requests(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES billing.orders(id) ON DELETE CASCADE,
  invoice_id UUID NOT NULL REFERENCES billing.invoices(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  
  -- Tipo de documento y proveedor
  document_type invoicing.document_type NOT NULL,
  provider invoicing.provider_type NOT NULL,
  
  -- ID externo del documento
  external_id TEXT NOT NULL, -- Folio (Haulmer) o Invoice ID (Stripe)
  
  -- URLs de documentos
  pdf_url TEXT,
  xml_url TEXT, -- Solo para Haulmer
  
  -- Metadata completa de la respuesta del proveedor
  provider_response JSONB NOT NULL DEFAULT '{}',
  
  -- Estado del documento en el proveedor
  provider_status TEXT,
  
  -- Timestamps
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_external_document UNIQUE (provider, external_id)
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Emission config
CREATE INDEX idx_emission_config_org ON invoicing.emission_config(organization_id);

-- Document requests
CREATE INDEX idx_document_requests_order ON invoicing.document_requests(order_id);
CREATE INDEX idx_document_requests_invoice ON invoicing.document_requests(invoice_id);
CREATE INDEX idx_document_requests_org ON invoicing.document_requests(organization_id);
CREATE INDEX idx_document_requests_status ON invoicing.document_requests(status) WHERE status IN ('pending', 'processing');
CREATE INDEX idx_document_requests_created ON invoicing.document_requests(created_at DESC);

-- Issued documents
CREATE INDEX idx_issued_documents_request ON invoicing.issued_documents(request_id);
CREATE INDEX idx_issued_documents_order ON invoicing.issued_documents(order_id);
CREATE INDEX idx_issued_documents_invoice ON invoicing.issued_documents(invoice_id);
CREATE INDEX idx_issued_documents_org ON invoicing.issued_documents(organization_id);
CREATE INDEX idx_issued_documents_provider ON invoicing.issued_documents(provider, external_id);
CREATE INDEX idx_issued_documents_issued ON invoicing.issued_documents(issued_at DESC);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION invoicing.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_emission_config_updated_at
  BEFORE UPDATE ON invoicing.emission_config
  FOR EACH ROW
  EXECUTE FUNCTION invoicing.update_updated_at();

CREATE TRIGGER trigger_document_requests_updated_at
  BEFORE UPDATE ON invoicing.document_requests
  FOR EACH ROW
  EXECUTE FUNCTION invoicing.update_updated_at();

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON SCHEMA invoicing IS 'Schema para emisión de documentos tributarios externos (Haulmer DTEs, Stripe Invoices)';
COMMENT ON TABLE invoicing.emission_config IS 'Configuración de emisión de documentos por organización';
COMMENT ON TABLE invoicing.document_requests IS 'Cola de solicitudes de emisión de documentos';
COMMENT ON TABLE invoicing.issued_documents IS 'Documentos emitidos exitosamente en proveedores externos';

COMMENT ON COLUMN invoicing.emission_config.auto_emit_on_completion IS 'Si true, emite automáticamente cuando una orden se completa';
COMMENT ON COLUMN invoicing.emission_config.default_document_type IS 'Tipo de documento por defecto a emitir';
COMMENT ON COLUMN invoicing.document_requests.request_data IS 'Snapshot de datos de la orden/invoice al momento de la solicitud';
COMMENT ON COLUMN invoicing.issued_documents.provider_response IS 'Respuesta completa del proveedor (JSON)';
COMMENT ON COLUMN invoicing.issued_documents.external_id IS 'ID del documento en el proveedor externo (folio o invoice_id)';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Schema invoicing creado exitosamente';
  RAISE NOTICE '';
  RAISE NOTICE 'Tablas creadas:';
  RAISE NOTICE '  ✅ emission_config - Configuración por organización';
  RAISE NOTICE '  ✅ document_requests - Cola de solicitudes';
  RAISE NOTICE '  ✅ issued_documents - Documentos emitidos';
  RAISE NOTICE '';
  RAISE NOTICE 'ENUMs creados:';
  RAISE NOTICE '  ✅ document_type - factura_electronica, boleta_electronica, stripe_invoice';
  RAISE NOTICE '  ✅ request_status - pending, processing, completed, failed';
  RAISE NOTICE '  ✅ provider_type - haulmer, stripe';
END $$;

