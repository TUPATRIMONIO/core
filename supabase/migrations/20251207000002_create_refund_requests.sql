-- =====================================================
-- Migration: Create refund requests system
-- Description: Sistema de solicitudes de reembolso para pedidos
-- Created: 2025-12-07
-- =====================================================

SET search_path TO billing, credits, core, public, extensions;

-- =====================================================
-- ENUMS
-- =====================================================

CREATE TYPE billing.refund_destination AS ENUM (
  'payment_method',  -- Reembolso a tarjeta original
  'wallet'           -- Reembolso a monedero digital (créditos)
);

CREATE TYPE billing.refund_status AS ENUM (
  'pending',      -- Pendiente de aprobación
  'approved',     -- Aprobado, listo para procesar
  'processing',   -- En proceso de reembolso
  'completed',    -- Reembolso completado
  'rejected'      -- Rechazado
);

-- =====================================================
-- REFUND REQUESTS TABLE
-- =====================================================

CREATE TABLE billing.refund_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES billing.orders(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  requested_by UUID REFERENCES core.users(id) ON DELETE SET NULL,
  
  -- Montos
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL CHECK (currency ~ '^[A-Z]{3}$'),
  
  -- Destino del reembolso
  refund_destination billing.refund_destination NOT NULL,
  
  -- Estado
  status billing.refund_status NOT NULL DEFAULT 'pending',
  
  -- Provider information
  provider TEXT, -- stripe, transbank_webpay, transbank_oneclick
  provider_refund_id TEXT, -- ID del reembolso en el proveedor
  
  -- Metadata
  reason TEXT,
  notes TEXT,
  processed_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_refund_requests_order ON billing.refund_requests(order_id);
CREATE INDEX idx_refund_requests_org ON billing.refund_requests(organization_id);
CREATE INDEX idx_refund_requests_status ON billing.refund_requests(status);
CREATE INDEX idx_refund_requests_created ON billing.refund_requests(created_at DESC);
CREATE INDEX idx_refund_requests_provider_refund_id ON billing.refund_requests(provider_refund_id) WHERE provider_refund_id IS NOT NULL;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION billing.update_refund_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_refund_requests_updated_at
  BEFORE UPDATE ON billing.refund_requests
  FOR EACH ROW
  EXECUTE FUNCTION billing.update_refund_requests_updated_at();

-- =====================================================
-- VIEWS
-- =====================================================

-- Vista pública para obtener solicitudes de reembolso con información relacionada
CREATE OR REPLACE VIEW public.refund_requests AS
SELECT 
  rr.id,
  rr.order_id,
  rr.organization_id,
  rr.requested_by,
  rr.amount,
  rr.currency,
  rr.refund_destination,
  rr.status,
  rr.provider,
  rr.provider_refund_id,
  rr.reason,
  rr.notes,
  rr.processed_at,
  rr.created_at,
  rr.updated_at,
  o.order_number,
  o.status as order_status,
  org.name as organization_name
FROM billing.refund_requests rr
JOIN billing.orders o ON o.id = rr.order_id
JOIN core.organizations org ON org.id = rr.organization_id;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE billing.refund_requests IS 'Solicitudes de reembolso para pedidos';
COMMENT ON COLUMN billing.refund_requests.refund_destination IS 'Destino del reembolso: payment_method (tarjeta) o wallet (monedero)';
COMMENT ON COLUMN billing.refund_requests.status IS 'Estado de la solicitud: pending, approved, processing, completed, rejected';
COMMENT ON COLUMN billing.refund_requests.provider IS 'Proveedor de pago original: stripe, transbank_webpay, transbank_oneclick';
COMMENT ON COLUMN billing.refund_requests.provider_refund_id IS 'ID del reembolso en el proveedor de pago';

-- =====================================================
-- GRANTS
-- =====================================================

GRANT SELECT ON public.refund_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE ON billing.refund_requests TO service_role;

-- =====================================================
-- FUNCTION: add_refund_credits
-- Description: Agrega créditos como reembolso (tipo refunded)
-- =====================================================

CREATE OR REPLACE FUNCTION credits.add_refund_credits(
  org_id UUID,
  amount DECIMAL,
  order_id_param UUID DEFAULT NULL,
  metadata_param JSONB DEFAULT '{}'::JSONB,
  description_param TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  account_record credits.credit_accounts%ROWTYPE;
  transaction_id UUID;
  new_balance DECIMAL;
BEGIN
  -- Get or create account
  SELECT * INTO account_record
  FROM credits.credit_accounts
  WHERE organization_id = org_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    INSERT INTO credits.credit_accounts (organization_id, balance, reserved_balance)
    VALUES (org_id, 0.00, 0.00)
    RETURNING * INTO account_record;
  END IF;
  
  -- Calculate new balance
  new_balance := account_record.balance + amount;
  
  -- Update account
  UPDATE credits.credit_accounts
  SET balance = new_balance,
      total_earned = total_earned + amount,
      updated_at = NOW()
  WHERE id = account_record.id;
  
  -- Create transaction record with type 'refunded'
  INSERT INTO credits.credit_transactions (
    organization_id,
    type,
    amount,
    balance_after,
    reference_id,
    description,
    metadata
  ) VALUES (
    org_id,
    'refunded',
    amount,
    new_balance,
    order_id_param,
    COALESCE(description_param, 'Reembolso a créditos'),
    metadata_param
  ) RETURNING id INTO transaction_id;
  
  RETURN transaction_id;
END;
$$ LANGUAGE plpgsql;

-- Grant execute
GRANT EXECUTE ON FUNCTION credits.add_refund_credits(UUID, DECIMAL, UUID, JSONB, TEXT) TO service_role;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Tabla billing.refund_requests creada exitosamente';
  RAISE NOTICE '';
  RAISE NOTICE 'Tipos creados:';
  RAISE NOTICE '  ✅ refund_destination: payment_method, wallet';
  RAISE NOTICE '  ✅ refund_status: pending, approved, processing, completed, rejected';
  RAISE NOTICE '';
  RAISE NOTICE 'Función creada:';
  RAISE NOTICE '  ✅ credits.add_refund_credits() - Agrega créditos como reembolso';
END $$;

