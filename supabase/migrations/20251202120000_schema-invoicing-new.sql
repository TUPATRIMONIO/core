-- =====================================================
-- Migration: Create new invoicing schema
-- Description: Servicio independiente de facturación externa (Haulmer + Stripe)
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

CREATE TYPE invoicing.document_status AS ENUM (
  'pending',      -- Pendiente de emisión
  'processing',   -- En proceso
  'issued',       -- Emitido exitosamente
  'failed',       -- Falló la emisión
  'voided'        -- Anulado
);

CREATE TYPE invoicing.provider_type AS ENUM (
  'haulmer',      -- Haulmer/OpenFactura (Chile)
  'stripe'        -- Stripe (Internacional)
);

CREATE TYPE invoicing.customer_type AS ENUM (
  'persona_natural',  -- Persona natural
  'empresa'           -- Empresa
);

CREATE TYPE invoicing.request_status AS ENUM (
  'pending',      -- Pendiente
  'processing',   -- Procesando
  'completed',    -- Completado
  'failed'        -- Fallido
);

-- =====================================================
-- CUSTOMERS (Receptores de documentos)
-- =====================================================

CREATE TABLE invoicing.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  
  -- Identificación
  tax_id TEXT NOT NULL, -- RUT (Chile) o Tax ID (otros países)
  name TEXT NOT NULL,
  email TEXT,
  
  -- Dirección
  address TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT NOT NULL CHECK (length(country) = 2), -- ISO 3166-1 alpha-2
  
  -- Tipo de cliente
  customer_type invoicing.customer_type NOT NULL DEFAULT 'empresa',
  
  -- Información adicional (para facturas chilenas)
  giro TEXT, -- Giro comercial (Chile)
  
  -- Metadata
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_customer_per_org UNIQUE (organization_id, tax_id, country)
);

-- =====================================================
-- DOCUMENTS (Documentos emitidos)
-- =====================================================

CREATE TABLE invoicing.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES invoicing.customers(id) ON DELETE RESTRICT,
  
  -- Número de documento (auto-generado)
  document_number TEXT UNIQUE NOT NULL, -- ej: INV-2025-00001, BOL-2025-00001
  
  -- Tipo y proveedor
  document_type invoicing.document_type NOT NULL,
  provider invoicing.provider_type NOT NULL,
  
  -- Estado
  status invoicing.document_status NOT NULL DEFAULT 'pending',
  
  -- Montos
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0.00 CHECK (subtotal >= 0),
  tax DECIMAL(10,2) NOT NULL DEFAULT 0.00 CHECK (tax >= 0),
  total DECIMAL(10,2) NOT NULL DEFAULT 0.00 CHECK (total >= 0),
  currency TEXT NOT NULL DEFAULT 'USD' CHECK (currency ~ '^[A-Z]{3}$'),
  
  -- ID externo del documento
  external_id TEXT, -- Folio (Haulmer) o Invoice ID (Stripe)
  
  -- URLs de documentos
  pdf_url TEXT,
  xml_url TEXT, -- Solo para Haulmer
  
  -- Fechas
  issued_at TIMESTAMPTZ,
  voided_at TIMESTAMPTZ,
  
  -- Referencia opcional a orden de compra
  order_id UUID REFERENCES billing.orders(id) ON DELETE SET NULL,
  
  -- Metadata
  metadata JSONB NOT NULL DEFAULT '{}',
  provider_response JSONB NOT NULL DEFAULT '{}', -- Respuesta completa del proveedor
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_total CHECK (total = subtotal + tax),
  CONSTRAINT valid_provider_document_type CHECK (
    (provider = 'haulmer' AND document_type IN ('factura_electronica', 'boleta_electronica')) OR
    (provider = 'stripe' AND document_type = 'stripe_invoice')
  )
);

-- =====================================================
-- DOCUMENT ITEMS (Líneas de detalle)
-- =====================================================

CREATE TABLE invoicing.document_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES invoicing.documents(id) ON DELETE CASCADE,
  
  -- Detalle del item
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1.00 CHECK (quantity > 0),
  unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
  total DECIMAL(10,2) NOT NULL CHECK (total >= 0),
  
  -- Impuestos
  tax_exempt BOOLEAN NOT NULL DEFAULT false,
  tax_rate DECIMAL(5,4) CHECK (tax_rate >= 0 AND tax_rate <= 1), -- ej: 0.19 para 19%
  
  -- Metadata
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_item_total CHECK (total = quantity * unit_price)
);

-- =====================================================
-- EMISSION REQUESTS (Cola de solicitudes)
-- =====================================================

CREATE TABLE invoicing.emission_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  document_id UUID REFERENCES invoicing.documents(id) ON DELETE SET NULL,
  
  -- Estado
  status invoicing.request_status NOT NULL DEFAULT 'pending',
  
  -- Reintentos
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  last_error TEXT,
  last_error_at TIMESTAMPTZ,
  
  -- Datos de la solicitud (snapshot completo)
  request_data JSONB NOT NULL DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- =====================================================
-- API KEYS (Acceso para sistemas externos)
-- =====================================================

CREATE TABLE invoicing.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  
  -- Key hash (nunca guardar la key en plano)
  key_hash TEXT NOT NULL UNIQUE, -- Hash SHA-256 de la key
  
  -- Metadata
  name TEXT NOT NULL, -- Nombre descriptivo de la key
  permissions JSONB NOT NULL DEFAULT '{"documents": ["create", "read"], "customers": ["create", "read"]}',
  
  -- Rate limiting
  rate_limit_per_minute INTEGER NOT NULL DEFAULT 60,
  
  -- Expiración
  expires_at TIMESTAMPTZ,
  
  -- Uso
  last_used_at TIMESTAMPTZ,
  usage_count INTEGER NOT NULL DEFAULT 0,
  
  -- Estado
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- SETTINGS (Configuración por organización)
-- =====================================================

CREATE TABLE invoicing.settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL UNIQUE REFERENCES core.organizations(id) ON DELETE CASCADE,
  
  -- Proveedores habilitados
  haulmer_enabled BOOLEAN NOT NULL DEFAULT false,
  stripe_enabled BOOLEAN NOT NULL DEFAULT true,
  
  -- Configuración por defecto
  default_document_type invoicing.document_type NOT NULL DEFAULT 'stripe_invoice',
  default_currency TEXT NOT NULL DEFAULT 'USD',
  
  -- Configuración específica por proveedor
  haulmer_config JSONB NOT NULL DEFAULT '{}',
  stripe_config JSONB NOT NULL DEFAULT '{}',
  
  -- Auto-emisión
  auto_emit_on_order_completion BOOLEAN NOT NULL DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Customers
CREATE INDEX idx_customers_org ON invoicing.customers(organization_id);
CREATE INDEX idx_customers_tax_id ON invoicing.customers(tax_id, country);
CREATE INDEX idx_customers_email ON invoicing.customers(email) WHERE email IS NOT NULL;

-- Documents
CREATE INDEX idx_documents_org ON invoicing.documents(organization_id);
CREATE INDEX idx_documents_customer ON invoicing.documents(customer_id);
CREATE INDEX idx_documents_number ON invoicing.documents(document_number);
CREATE INDEX idx_documents_status ON invoicing.documents(status);
CREATE INDEX idx_documents_provider ON invoicing.documents(provider, external_id) WHERE external_id IS NOT NULL;
CREATE INDEX idx_documents_order ON invoicing.documents(order_id) WHERE order_id IS NOT NULL;
CREATE INDEX idx_documents_created ON invoicing.documents(created_at DESC);

-- Document items
CREATE INDEX idx_document_items_document ON invoicing.document_items(document_id);

-- Emission requests
CREATE INDEX idx_emission_requests_org ON invoicing.emission_requests(organization_id);
CREATE INDEX idx_emission_requests_document ON invoicing.emission_requests(document_id) WHERE document_id IS NOT NULL;
CREATE INDEX idx_emission_requests_status ON invoicing.emission_requests(status) WHERE status IN ('pending', 'processing');

-- API keys
CREATE INDEX idx_api_keys_org ON invoicing.api_keys(organization_id);
CREATE INDEX idx_api_keys_hash ON invoicing.api_keys(key_hash);
CREATE INDEX idx_api_keys_active ON invoicing.api_keys(is_active) WHERE is_active = true;

-- Settings
CREATE INDEX idx_settings_org ON invoicing.settings(organization_id);

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

CREATE TRIGGER trigger_customers_updated_at
  BEFORE UPDATE ON invoicing.customers
  FOR EACH ROW
  EXECUTE FUNCTION invoicing.update_updated_at();

CREATE TRIGGER trigger_documents_updated_at
  BEFORE UPDATE ON invoicing.documents
  FOR EACH ROW
  EXECUTE FUNCTION invoicing.update_updated_at();

CREATE TRIGGER trigger_api_keys_updated_at
  BEFORE UPDATE ON invoicing.api_keys
  FOR EACH ROW
  EXECUTE FUNCTION invoicing.update_updated_at();

CREATE TRIGGER trigger_settings_updated_at
  BEFORE UPDATE ON invoicing.settings
  FOR EACH ROW
  EXECUTE FUNCTION invoicing.update_updated_at();

CREATE TRIGGER trigger_emission_requests_updated_at
  BEFORE UPDATE ON invoicing.emission_requests
  FOR EACH ROW
  EXECUTE FUNCTION invoicing.update_updated_at();

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON SCHEMA invoicing IS 'Servicio independiente de facturación externa (Haulmer + Stripe)';
COMMENT ON TABLE invoicing.customers IS 'Receptores de documentos tributarios';
COMMENT ON TABLE invoicing.documents IS 'Documentos tributarios emitidos (facturas, boletas, invoices)';
COMMENT ON TABLE invoicing.document_items IS 'Líneas de detalle de cada documento';
COMMENT ON TABLE invoicing.emission_requests IS 'Cola de solicitudes de emisión (para retry y async)';
COMMENT ON TABLE invoicing.api_keys IS 'API Keys para acceso externo al servicio';
COMMENT ON TABLE invoicing.settings IS 'Configuración de facturación por organización';

COMMENT ON COLUMN invoicing.customers.tax_id IS 'RUT (Chile) o Tax ID (otros países)';
COMMENT ON COLUMN invoicing.documents.document_number IS 'Número único de documento (INV-YYYY-NNNNN, BOL-YYYY-NNNNN)';
COMMENT ON COLUMN invoicing.documents.external_id IS 'ID del documento en el proveedor externo (folio o invoice_id)';
COMMENT ON COLUMN invoicing.api_keys.key_hash IS 'Hash SHA-256 de la API key (nunca guardar la key en plano)';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Schema invoicing creado exitosamente';
  RAISE NOTICE '';
  RAISE NOTICE 'Tablas creadas:';
  RAISE NOTICE '  ✅ customers - Receptores de documentos';
  RAISE NOTICE '  ✅ documents - Documentos emitidos';
  RAISE NOTICE '  ✅ document_items - Líneas de detalle';
  RAISE NOTICE '  ✅ emission_requests - Cola de solicitudes';
  RAISE NOTICE '  ✅ api_keys - API Keys para acceso externo';
  RAISE NOTICE '  ✅ settings - Configuración por organización';
  RAISE NOTICE '';
  RAISE NOTICE 'ENUMs creados:';
  RAISE NOTICE '  ✅ document_type - factura_electronica, boleta_electronica, stripe_invoice';
  RAISE NOTICE '  ✅ document_status - pending, processing, issued, failed, voided';
  RAISE NOTICE '  ✅ provider_type - haulmer, stripe';
  RAISE NOTICE '  ✅ customer_type - persona_natural, empresa';
  RAISE NOTICE '  ✅ request_status - pending, processing, completed, failed';
END $$;

