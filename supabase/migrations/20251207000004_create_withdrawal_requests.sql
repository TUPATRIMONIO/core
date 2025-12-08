-- =====================================================
-- Migration: Create withdrawal requests system
-- Description: Sistema de solicitudes de retiro de monedero digital
-- Created: 2025-12-07
-- =====================================================

SET search_path TO credits, billing, core, public, extensions;

-- =====================================================
-- ENUMS
-- =====================================================

CREATE TYPE credits.withdrawal_status AS ENUM (
  'pending',      -- Pendiente de aprobación
  'approved',     -- Aprobado, listo para procesar
  'processing',   -- En proceso de transferencia
  'completed',    -- Retiro completado
  'rejected'      -- Rechazado
);

-- =====================================================
-- WITHDRAWAL REQUESTS TABLE
-- =====================================================

CREATE TABLE credits.withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  requested_by UUID REFERENCES core.users(id) ON DELETE SET NULL,
  
  -- Montos
  credits_amount INTEGER NOT NULL CHECK (credits_amount > 0),
  currency TEXT NOT NULL CHECK (currency ~ '^[A-Z]{3}$'), -- Moneda destino
  exchange_rate DECIMAL(10,6), -- Tasa de cambio créditos -> moneda
  final_amount DECIMAL(10,2), -- Monto final en moneda destino
  
  -- Datos bancarios
  bank_name TEXT,
  bank_country TEXT,
  account_number TEXT,
  account_holder TEXT,
  
  -- Estado
  status credits.withdrawal_status DEFAULT 'pending',
  
  -- Metadata
  notes TEXT,
  processed_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_withdrawal_requests_org ON credits.withdrawal_requests(organization_id);
CREATE INDEX idx_withdrawal_requests_status ON credits.withdrawal_requests(status);
CREATE INDEX idx_withdrawal_requests_created ON credits.withdrawal_requests(created_at DESC);
CREATE INDEX idx_withdrawal_requests_requested_by ON credits.withdrawal_requests(requested_by);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION credits.update_withdrawal_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_withdrawal_requests_updated_at
  BEFORE UPDATE ON credits.withdrawal_requests
  FOR EACH ROW
  EXECUTE FUNCTION credits.update_withdrawal_requests_updated_at();

-- =====================================================
-- VIEWS
-- =====================================================

-- Vista pública para obtener solicitudes de retiro con información relacionada
CREATE OR REPLACE VIEW public.withdrawal_requests AS
SELECT 
  wr.id,
  wr.organization_id,
  wr.requested_by,
  wr.credits_amount,
  wr.currency,
  wr.exchange_rate,
  wr.final_amount,
  wr.bank_name,
  wr.bank_country,
  wr.account_number,
  wr.account_holder,
  wr.status,
  wr.notes,
  wr.processed_at,
  wr.created_at,
  wr.updated_at,
  org.name as organization_name,
  au.email as requested_by_email,
  u.full_name as requested_by_name
FROM credits.withdrawal_requests wr
JOIN core.organizations org ON org.id = wr.organization_id
LEFT JOIN core.users u ON u.id = wr.requested_by
LEFT JOIN auth.users au ON au.id = u.id;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE credits.withdrawal_requests IS 'Solicitudes de retiro de monedero digital';
COMMENT ON COLUMN credits.withdrawal_requests.credits_amount IS 'Cantidad de créditos a retirar';
COMMENT ON COLUMN credits.withdrawal_requests.currency IS 'Moneda destino del retiro';
COMMENT ON COLUMN credits.withdrawal_requests.exchange_rate IS 'Tasa de cambio créditos -> moneda destino';
COMMENT ON COLUMN credits.withdrawal_requests.final_amount IS 'Monto final en moneda destino';
COMMENT ON COLUMN credits.withdrawal_requests.status IS 'Estado de la solicitud: pending, approved, processing, completed, rejected';

-- =====================================================
-- GRANTS
-- =====================================================

GRANT SELECT ON public.withdrawal_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE ON credits.withdrawal_requests TO service_role;

-- =====================================================
-- FUNCTION: spend_credits (para retiros)
-- Description: Descuenta créditos de una cuenta (usado para retiros)
-- =====================================================

CREATE OR REPLACE FUNCTION credits.spend_credits(
  org_id UUID,
  amount DECIMAL,
  description_param TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  account_record credits.credit_accounts%ROWTYPE;
  transaction_id UUID;
  new_balance DECIMAL;
BEGIN
  -- Get account
  SELECT * INTO account_record
  FROM credits.credit_accounts
  WHERE organization_id = org_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Credit account not found';
  END IF;
  
  -- Check balance
  IF account_record.balance < amount THEN
    RAISE EXCEPTION 'Insufficient credits. Available: %, Required: %', 
      account_record.balance, amount;
  END IF;
  
  -- Calculate new balance
  new_balance := account_record.balance - amount;
  
  -- Update account
  UPDATE credits.credit_accounts
  SET balance = new_balance,
      total_spent = total_spent + amount,
      updated_at = NOW()
  WHERE id = account_record.id;
  
  -- Create transaction record
  INSERT INTO credits.credit_transactions (
    organization_id,
    type,
    amount,
    balance_after,
    description
  ) VALUES (
    org_id,
    'spent',
    amount,
    new_balance,
    COALESCE(description_param, 'Credits spent')
  ) RETURNING id INTO transaction_id;
  
  RETURN transaction_id;
END;
$$ LANGUAGE plpgsql;

-- Grant execute
GRANT EXECUTE ON FUNCTION credits.spend_credits(UUID, DECIMAL, TEXT) TO service_role;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Tabla credits.withdrawal_requests creada exitosamente';
  RAISE NOTICE '';
  RAISE NOTICE 'Tipo creado:';
  RAISE NOTICE '  ✅ withdrawal_status: pending, approved, processing, completed, rejected';
  RAISE NOTICE '';
  RAISE NOTICE 'Función creada:';
  RAISE NOTICE '  ✅ credits.spend_credits() - Descuenta créditos para retiros';
END $$;

