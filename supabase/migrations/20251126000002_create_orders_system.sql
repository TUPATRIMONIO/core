-- =====================================================
-- Migration: Create orders system
-- Description: Sistema de órdenes de compra para checkout tipo carrito
-- Created: 2025-01-01
-- =====================================================

-- Set search path
SET search_path TO billing, credits, core, public, extensions;

-- =====================================================
-- ENUMS
-- =====================================================

CREATE TYPE billing.order_status AS ENUM (
  'pending_payment',  -- Pendiente de pago
  'paid',            -- Pagada
  'cancelled',       -- Cancelada
  'refunded',        -- Reembolsada
  'completed'        -- Completada (producto entregado/procesado)
);

-- =====================================================
-- ORDERS TABLE
-- =====================================================

CREATE TABLE billing.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  
  -- Order details
  order_number TEXT UNIQUE NOT NULL, -- ej: ORD-2025-00001
  status billing.order_status NOT NULL DEFAULT 'pending_payment',
  
  -- Product information
  product_type TEXT NOT NULL, -- credits, electronic_signature, notary_service, company_modification, advisory, subscription, etc.
  product_id UUID, -- Referencia al producto específico (nullable para productos futuros)
  product_data JSONB NOT NULL DEFAULT '{}', -- Snapshot del producto al momento de la compra
  
  -- Amounts
  amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
  currency TEXT NOT NULL DEFAULT 'USD' CHECK (currency ~ '^[A-Z]{3}$'),
  
  -- Related records
  invoice_id UUID REFERENCES billing.invoices(id) ON DELETE SET NULL,
  payment_id UUID REFERENCES billing.payments(id) ON DELETE SET NULL,
  
  -- Expiration
  expires_at TIMESTAMPTZ, -- Para órdenes pendientes (ej: 24 horas)
  
  -- Metadata
  metadata JSONB NOT NULL DEFAULT '{}', -- Datos adicionales específicos del producto
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_orders_org ON billing.orders(organization_id);
CREATE INDEX idx_orders_status ON billing.orders(status);
CREATE INDEX idx_orders_number ON billing.orders(order_number);
CREATE INDEX idx_orders_expires ON billing.orders(expires_at) WHERE expires_at IS NOT NULL AND status = 'pending_payment';
CREATE INDEX idx_orders_product_type ON billing.orders(product_type);
CREATE INDEX idx_orders_created ON billing.orders(created_at DESC);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Generate order number (ORD-YYYY-NNNNN)
CREATE OR REPLACE FUNCTION billing.generate_order_number(org_id UUID)
RETURNS TEXT AS $$
DECLARE
  org_slug TEXT;
  year_part TEXT;
  seq_num INTEGER;
  order_num TEXT;
  max_attempts INTEGER := 10;
  attempt INTEGER := 0;
  lock_key BIGINT;
BEGIN
  -- Obtener slug de la organización
  SELECT slug INTO org_slug
  FROM core.organizations
  WHERE id = org_id;
  
  IF org_slug IS NULL THEN
    RAISE EXCEPTION 'Organization not found: %', org_id;
  END IF;
  
  -- Convertir slug a formato para número de orden (mayúsculas, sin espacios)
  org_slug := UPPER(REPLACE(org_slug, ' ', '-'));
  
  -- Obtener año actual
  year_part := TO_CHAR(NOW(), 'YYYY');
  
  -- Usar hash del org_id para crear un lock único
  -- hashtext está disponible en PostgreSQL estándar y genera un hash entero
  lock_key := hashtext(org_id::TEXT || 'order_number')::BIGINT;
  
  -- Intentar generar número único con lock
  WHILE attempt < max_attempts LOOP
    BEGIN
      -- Adquirir lock exclusivo para esta organización
      PERFORM pg_advisory_xact_lock(lock_key);
      
      -- Obtener siguiente número secuencial para esta organización y año
      SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM LENGTH(org_slug) + 6) AS INTEGER)), 0) + 1
      INTO seq_num
      FROM billing.orders
      WHERE order_number LIKE org_slug || '-ORD-' || year_part || '-%';
      
      -- Generar número de orden
      order_num := org_slug || '-ORD-' || year_part || '-' || LPAD(seq_num::TEXT, 5, '0');
      
      -- Verificar que no existe (double-check)
      IF NOT EXISTS (SELECT 1 FROM billing.orders WHERE order_number = order_num) THEN
        RETURN order_num;
      END IF;
      
      -- Si existe, incrementar y reintentar
      seq_num := seq_num + 1;
      attempt := attempt + 1;
      
    EXCEPTION WHEN OTHERS THEN
      attempt := attempt + 1;
      IF attempt >= max_attempts THEN
        RAISE EXCEPTION 'Failed to generate unique order number after % attempts', max_attempts;
      END IF;
      -- Esperar un poco antes de reintentar
      PERFORM pg_sleep(0.1 * attempt);
    END;
  END LOOP;
  
  RAISE EXCEPTION 'Failed to generate unique order number after % attempts', max_attempts;
END;
$$ LANGUAGE plpgsql;

-- Wrapper público para generate_order_number
CREATE OR REPLACE FUNCTION public.generate_order_number(org_id UUID)
RETURNS TEXT AS $$
BEGIN
  RETURN billing.generate_order_number(org_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.generate_order_number(UUID) TO authenticated;

COMMENT ON FUNCTION public.generate_order_number(UUID) IS
'Genera número de orden único por organización en formato {ORG_SLUG}-ORD-{YEAR}-{NUMBER}';

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION billing.update_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_orders_updated_at
  BEFORE UPDATE ON billing.orders
  FOR EACH ROW
  EXECUTE FUNCTION billing.update_orders_updated_at();

-- Auto-set cancelled_at when status changes to cancelled
CREATE OR REPLACE FUNCTION billing.set_orders_cancelled_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    NEW.cancelled_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_orders_cancelled_at
  BEFORE UPDATE ON billing.orders
  FOR EACH ROW
  EXECUTE FUNCTION billing.set_orders_cancelled_at();

-- Auto-set completed_at when status changes to completed
CREATE OR REPLACE FUNCTION billing.set_orders_completed_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    NEW.completed_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_orders_completed_at
  BEFORE UPDATE ON billing.orders
  FOR EACH ROW
  EXECUTE FUNCTION billing.set_orders_completed_at();

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE billing.orders IS 'Órdenes de compra para checkout tipo carrito';
COMMENT ON COLUMN billing.orders.order_number IS 'Número único de orden en formato {ORG_SLUG}-ORD-{YEAR}-{NUMBER}';
COMMENT ON COLUMN billing.orders.product_type IS 'Tipo de producto: credits, electronic_signature, notary_service, company_modification, advisory, subscription, etc.';
COMMENT ON COLUMN billing.orders.product_data IS 'Snapshot del producto al momento de la compra (precio, descripción, etc.)';
COMMENT ON COLUMN billing.orders.expires_at IS 'Fecha de expiración para órdenes pendientes (típicamente 24 horas)';
COMMENT ON COLUMN billing.orders.metadata IS 'Datos adicionales específicos del producto (configuraciones, opciones, etc.)';

