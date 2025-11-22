-- =====================================================
-- Migration: Create billing schema
-- Description: Sistema de facturación multi-tenant con métodos de pago, facturas, pagos e impuestos
-- Created: 2025-11-21
-- =====================================================

-- Create the billing schema
CREATE SCHEMA IF NOT EXISTS billing;

-- Set search path
SET search_path TO billing, credits, core, public, extensions;

-- =====================================================
-- ENUMS
-- =====================================================

CREATE TYPE billing.payment_method_type AS ENUM (
  'stripe_card',           -- Tarjeta guardada en Stripe
  'dlocal_card',           -- Tarjeta guardada en dLocal
  'dlocal_bank_transfer',  -- Transferencia bancaria dLocal
  'dlocal_cash'            -- Pago en efectivo dLocal
);

CREATE TYPE billing.invoice_status AS ENUM (
  'draft',         -- Borrador
  'open',          -- Abierta (pendiente de pago)
  'paid',          -- Pagada
  'void',          -- Anulada
  'uncollectible'  -- Incobrable
);

CREATE TYPE billing.invoice_type AS ENUM (
  'subscription',   -- Factura de suscripción
  'credit_purchase', -- Compra de créditos
  'one_time'        -- Pago único
);

CREATE TYPE billing.payment_status AS ENUM (
  'pending',     -- Pendiente
  'processing',  -- Procesando
  'succeeded',   -- Exitoso
  'failed',      -- Fallido
  'refunded'     -- Reembolsado
);

-- =====================================================
-- PAYMENT METHODS
-- =====================================================

CREATE TABLE billing.payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  
  -- Payment method details
  type billing.payment_method_type NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('stripe', 'dlocal')),
  provider_payment_method_id TEXT NOT NULL, -- ID en Stripe/dLocal
  
  -- Card details (if applicable)
  is_default BOOLEAN NOT NULL DEFAULT false,
  last4 TEXT, -- Últimos 4 dígitos
  brand TEXT, -- Visa, Mastercard, etc.
  exp_month INTEGER CHECK (exp_month >= 1 AND exp_month <= 12),
  exp_year INTEGER CHECK (exp_year >= 2020),
  
  -- Billing details
  billing_details JSONB NOT NULL DEFAULT '{}',
  metadata JSONB NOT NULL DEFAULT '{}',
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  
  -- Constraints
  CONSTRAINT unique_provider_payment_method UNIQUE (provider, provider_payment_method_id)
);

-- =====================================================
-- INVOICES
-- =====================================================

CREATE TABLE billing.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  
  -- Invoice details
  invoice_number TEXT UNIQUE NOT NULL, -- ej: INV-2025-00001
  status billing.invoice_status NOT NULL DEFAULT 'draft',
  type billing.invoice_type NOT NULL,
  
  -- Amounts
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0.00 CHECK (subtotal >= 0),
  tax DECIMAL(10,2) NOT NULL DEFAULT 0.00 CHECK (tax >= 0),
  total DECIMAL(10,2) NOT NULL DEFAULT 0.00 CHECK (total >= 0),
  currency TEXT NOT NULL DEFAULT 'USD' CHECK (currency ~ '^[A-Z]{3}$'),
  
  -- Dates
  due_date TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  
  -- Provider information
  provider_invoice_id TEXT, -- Stripe/dLocal invoice ID
  pdf_url TEXT, -- URL del PDF generado
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_total CHECK (total = subtotal + tax)
);

-- =====================================================
-- INVOICE LINE ITEMS
-- =====================================================

CREATE TABLE billing.invoice_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES billing.invoices(id) ON DELETE CASCADE,
  
  -- Line item details
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1.00 CHECK (quantity > 0),
  unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
  total DECIMAL(10,2) NOT NULL CHECK (total >= 0),
  type TEXT, -- ej: 'subscription', 'credits', 'tax'
  
  -- Metadata
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_line_total CHECK (total = quantity * unit_price)
);

-- =====================================================
-- PAYMENTS
-- =====================================================

CREATE TABLE billing.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES billing.invoices(id) ON DELETE SET NULL,
  
  -- Payment details
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'USD' CHECK (currency ~ '^[A-Z]{3}$'),
  status billing.payment_status NOT NULL DEFAULT 'pending',
  
  -- Provider information
  provider TEXT NOT NULL CHECK (provider IN ('stripe', 'dlocal')),
  provider_payment_id TEXT NOT NULL, -- ID en Stripe/dLocal
  
  -- Payment method
  payment_method_id UUID REFERENCES billing.payment_methods(id) ON DELETE SET NULL,
  
  -- Failure information
  failure_reason TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  
  -- Constraints
  CONSTRAINT unique_provider_payment UNIQUE (provider, provider_payment_id)
);

-- =====================================================
-- TAX RATES
-- =====================================================

CREATE TABLE billing.tax_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Tax details
  country_code TEXT NOT NULL CHECK (length(country_code) = 2), -- ISO 3166-1 alpha-2
  rate DECIMAL(5,4) NOT NULL CHECK (rate >= 0 AND rate <= 1), -- ej: 0.19 para 19% IVA
  tax_name TEXT NOT NULL, -- ej: 'IVA', 'VAT', 'GST'
  
  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_country_tax UNIQUE (country_code, tax_name)
);

-- =====================================================
-- ADD FOREIGN KEY FOR AUTO-RECHARGE
-- =====================================================

-- Add FK constraint for auto_recharge_payment_method_id in credit_accounts
ALTER TABLE credits.credit_accounts
ADD CONSTRAINT fk_auto_recharge_payment_method
FOREIGN KEY (auto_recharge_payment_method_id)
REFERENCES billing.payment_methods(id)
ON DELETE SET NULL;

-- =====================================================
-- INDEXES
-- =====================================================

-- Payment methods
CREATE INDEX idx_payment_methods_org ON billing.payment_methods(organization_id);
CREATE INDEX idx_payment_methods_default ON billing.payment_methods(organization_id, is_default) WHERE is_default = true AND deleted_at IS NULL;
CREATE INDEX idx_payment_methods_deleted ON billing.payment_methods(deleted_at) WHERE deleted_at IS NULL;

-- Invoices
CREATE INDEX idx_invoices_org ON billing.invoices(organization_id);
CREATE INDEX idx_invoices_status ON billing.invoices(status);
CREATE INDEX idx_invoices_number ON billing.invoices(invoice_number);
CREATE INDEX idx_invoices_created ON billing.invoices(created_at DESC);

-- Invoice line items
CREATE INDEX idx_invoice_line_items_invoice ON billing.invoice_line_items(invoice_id);

-- Payments
CREATE INDEX idx_payments_org ON billing.payments(organization_id);
CREATE INDEX idx_payments_invoice ON billing.payments(invoice_id);
CREATE INDEX idx_payments_status ON billing.payments(status);
CREATE INDEX idx_payments_provider ON billing.payments(provider, provider_payment_id);

-- Tax rates
CREATE INDEX idx_tax_rates_country ON billing.tax_rates(country_code, is_active) WHERE is_active = true;

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Generate invoice number (INV-YYYY-NNNNN)
CREATE OR REPLACE FUNCTION billing.generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
  year_part TEXT;
  seq_num INTEGER;
  invoice_num TEXT;
BEGIN
  year_part := TO_CHAR(NOW(), 'YYYY');
  
  -- Get next sequence number for this year
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 9) AS INTEGER)), 0) + 1
  INTO seq_num
  FROM billing.invoices
  WHERE invoice_number LIKE 'INV-' || year_part || '-%';
  
  invoice_num := 'INV-' || year_part || '-' || LPAD(seq_num::TEXT, 5, '0');
  
  RETURN invoice_num;
END;
$$ LANGUAGE plpgsql;

-- Get tax rate for country
CREATE OR REPLACE FUNCTION billing.get_tax_rate(country_code_param TEXT)
RETURNS DECIMAL AS $$
DECLARE
  tax_rate DECIMAL;
BEGIN
  SELECT rate INTO tax_rate
  FROM billing.tax_rates
  WHERE country_code = UPPER(country_code_param)
  AND is_active = true
  ORDER BY created_at DESC
  LIMIT 1;
  
  RETURN COALESCE(tax_rate, 0.00);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON SCHEMA billing IS 'Sistema de facturación multi-tenant';
COMMENT ON TABLE billing.payment_methods IS 'Métodos de pago guardados por organización';
COMMENT ON TABLE billing.invoices IS 'Facturas generadas';
COMMENT ON TABLE billing.invoice_line_items IS 'Líneas de detalle de facturas';
COMMENT ON TABLE billing.payments IS 'Pagos procesados';
COMMENT ON TABLE billing.tax_rates IS 'Tasas de impuestos por país';

COMMENT ON COLUMN billing.payment_methods.provider IS 'Proveedor: stripe o dlocal';
COMMENT ON COLUMN billing.payment_methods.provider_payment_method_id IS 'ID del método de pago en el proveedor';
COMMENT ON COLUMN billing.invoices.invoice_number IS 'Número único de factura (INV-YYYY-NNNNN)';
COMMENT ON COLUMN billing.invoices.provider_invoice_id IS 'ID de factura en Stripe/dLocal';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Schema billing creado exitosamente';
  RAISE NOTICE '';
  RAISE NOTICE 'Tablas creadas:';
  RAISE NOTICE '  ✅ payment_methods - Métodos de pago guardados';
  RAISE NOTICE '  ✅ invoices - Facturas generadas';
  RAISE NOTICE '  ✅ invoice_line_items - Líneas de detalle';
  RAISE NOTICE '  ✅ payments - Pagos procesados';
  RAISE NOTICE '  ✅ tax_rates - Tasas de impuestos';
  RAISE NOTICE '';
  RAISE NOTICE 'ENUMs creados:';
  RAISE NOTICE '  ✅ payment_method_type - stripe_card, dlocal_card, dlocal_bank_transfer, dlocal_cash';
  RAISE NOTICE '  ✅ invoice_status - draft, open, paid, void, uncollectible';
  RAISE NOTICE '  ✅ invoice_type - subscription, credit_purchase, one_time';
  RAISE NOTICE '  ✅ payment_status - pending, processing, succeeded, failed, refunded';
  RAISE NOTICE '';
  RAISE NOTICE 'Funciones creadas:';
  RAISE NOTICE '  ✅ generate_invoice_number() - Genera número secuencial de factura';
  RAISE NOTICE '  ✅ get_tax_rate(country_code) - Obtiene tasa de impuesto por país';
END $$;

