-- =====================================================
-- Migration: Create credits schema
-- Description: Sistema de créditos multi-tenant con cuentas, transacciones, paquetes y precios
-- Created: 2025-11-21
-- =====================================================

-- Create the credits schema
CREATE SCHEMA IF NOT EXISTS credits;

-- Set search path
SET search_path TO credits, core, public, extensions;

-- =====================================================
-- ENUMS
-- =====================================================

CREATE TYPE credits.transaction_type AS ENUM (
  'earned',      -- Créditos ganados (suscripción, compra)
  'spent',       -- Créditos gastados (uso confirmado)
  'reserved',    -- Créditos bloqueados (antes de operación)
  'released',    -- Créditos liberados (operación cancelada)
  'expired',     -- Créditos expirados
  'refunded'     -- Créditos reembolsados
);

-- =====================================================
-- CREDIT ACCOUNTS
-- =====================================================

CREATE TABLE credits.credit_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  
  -- Balance
  balance DECIMAL(12,2) NOT NULL DEFAULT 0.00 CHECK (balance >= 0),
  reserved_balance DECIMAL(12,2) NOT NULL DEFAULT 0.00 CHECK (reserved_balance >= 0),
  
  -- Historical totals
  total_earned DECIMAL(12,2) NOT NULL DEFAULT 0.00 CHECK (total_earned >= 0),
  total_spent DECIMAL(12,2) NOT NULL DEFAULT 0.00 CHECK (total_spent >= 0),
  
  -- Auto-recharge configuration
  auto_recharge_enabled BOOLEAN NOT NULL DEFAULT false,
  auto_recharge_threshold DECIMAL(12,2) CHECK (auto_recharge_threshold >= 0),
  auto_recharge_amount DECIMAL(12,2) CHECK (auto_recharge_amount > 0),
  auto_recharge_payment_method_id UUID, -- FK added after billing schema
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_org_account UNIQUE (organization_id),
  CONSTRAINT valid_reserved CHECK (reserved_balance <= balance)
);

-- =====================================================
-- CREDIT TRANSACTIONS
-- =====================================================

CREATE TABLE credits.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  
  -- Transaction details
  type credits.transaction_type NOT NULL,
  amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  balance_after DECIMAL(12,2) NOT NULL CHECK (balance_after >= 0),
  
  -- Service information
  service_code TEXT, -- ej: 'ai_chat_message', 'ai_document_review_page'
  application_code TEXT, -- ej: 'ai_customer_service', 'ai_document_review'
  reference_id UUID, -- ID de operación relacionada (ej: mensaje de chat, documento)
  
  -- Description and metadata
  description TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES core.users(id)
);

-- =====================================================
-- CREDIT PACKAGES
-- =====================================================

CREATE TABLE credits.credit_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Package information
  name TEXT NOT NULL CHECK (length(name) >= 2 AND length(name) <= 100),
  slug TEXT UNIQUE NOT NULL CHECK (slug ~ '^[a-z][a-z0-9_-]*[a-z0-9]$'),
  description TEXT,
  
  -- Credits amount
  credits_amount DECIMAL(12,2) NOT NULL CHECK (credits_amount > 0),
  
  -- Pricing by currency
  price_usd DECIMAL(10,2) NOT NULL DEFAULT 0.00 CHECK (price_usd >= 0),
  price_clp DECIMAL(10,2) NOT NULL DEFAULT 0.00 CHECK (price_clp >= 0), -- Chile
  price_ars DECIMAL(10,2) NOT NULL DEFAULT 0.00 CHECK (price_ars >= 0), -- Argentina
  price_cop DECIMAL(10,2) NOT NULL DEFAULT 0.00 CHECK (price_cop >= 0), -- Colombia
  price_mxn DECIMAL(10,2) NOT NULL DEFAULT 0.00 CHECK (price_mxn >= 0), -- México
  price_pen DECIMAL(10,2) NOT NULL DEFAULT 0.00 CHECK (price_pen >= 0), -- Perú
  
  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- CREDIT PRICES (Precios por operación de servicios IA)
-- =====================================================

CREATE TABLE credits.credit_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Service identification
  service_code TEXT UNIQUE NOT NULL, -- ej: 'ai_chat_message'
  application_code TEXT NOT NULL, -- ej: 'ai_customer_service'
  operation TEXT NOT NULL, -- ej: 'send_message', 'review_page'
  
  -- Cost
  credit_cost DECIMAL(10,4) NOT NULL CHECK (credit_cost > 0), -- Créditos por operación
  
  -- Description
  description TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Unique constraint
  CONSTRAINT unique_service_operation UNIQUE (service_code, operation)
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Credit accounts
CREATE INDEX idx_credit_accounts_org ON credits.credit_accounts(organization_id);

-- Credit transactions
CREATE INDEX idx_credit_transactions_org ON credits.credit_transactions(organization_id);
CREATE INDEX idx_credit_transactions_type ON credits.credit_transactions(type);
CREATE INDEX idx_credit_transactions_service ON credits.credit_transactions(service_code);
CREATE INDEX idx_credit_transactions_reference ON credits.credit_transactions(reference_id);
CREATE INDEX idx_credit_transactions_created ON credits.credit_transactions(created_at DESC);

-- Credit packages
CREATE INDEX idx_credit_packages_active ON credits.credit_packages(is_active, sort_order);

-- Credit prices
CREATE INDEX idx_credit_prices_service ON credits.credit_prices(service_code);
CREATE INDEX idx_credit_prices_application ON credits.credit_prices(application_code);

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON SCHEMA credits IS 'Sistema de créditos multi-tenant para monetización';
COMMENT ON TABLE credits.credit_accounts IS 'Cuentas de créditos por organización';
COMMENT ON TABLE credits.credit_transactions IS 'Historial de transacciones de créditos';
COMMENT ON TABLE credits.credit_packages IS 'Paquetes de créditos vendibles';
COMMENT ON TABLE credits.credit_prices IS 'Precios por operación de servicios IA';

COMMENT ON COLUMN credits.credit_accounts.balance IS 'Créditos disponibles para usar';
COMMENT ON COLUMN credits.credit_accounts.reserved_balance IS 'Créditos bloqueados en operaciones en curso';
COMMENT ON COLUMN credits.credit_accounts.auto_recharge_enabled IS 'Si está habilitada la recarga automática';
COMMENT ON COLUMN credits.credit_accounts.auto_recharge_threshold IS 'Cantidad mínima de créditos que activa auto-recarga';
COMMENT ON COLUMN credits.credit_accounts.auto_recharge_amount IS 'Cantidad de créditos a recargar automáticamente';

COMMENT ON COLUMN credits.credit_transactions.type IS 'Tipo de transacción: earned, spent, reserved, released, expired, refunded';
COMMENT ON COLUMN credits.credit_transactions.service_code IS 'Código del servicio que consume créditos';
COMMENT ON COLUMN credits.credit_transactions.reference_id IS 'ID de la operación relacionada (ej: mensaje de chat, documento)';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Schema credits creado exitosamente';
  RAISE NOTICE '';
  RAISE NOTICE 'Tablas creadas:';
  RAISE NOTICE '  ✅ credit_accounts - Cuentas de créditos por organización';
  RAISE NOTICE '  ✅ credit_transactions - Historial de transacciones';
  RAISE NOTICE '  ✅ credit_packages - Paquetes de créditos vendibles';
  RAISE NOTICE '  ✅ credit_prices - Precios por operación de servicios IA';
  RAISE NOTICE '';
  RAISE NOTICE 'ENUMs creados:';
  RAISE NOTICE '  ✅ transaction_type - earned, spent, reserved, released, expired, refunded';
END $$;

