-- =====================================================
-- Migration: Credits Functions
-- Description: Funciones SQL para gestión de créditos (reservar, confirmar, liberar, agregar)
-- Created: 2025-11-21
-- =====================================================

SET search_path TO credits, billing, core, public, extensions;

-- =====================================================
-- FUNCTION: reserve_credits
-- Description: Bloquea créditos antes de una operación
-- =====================================================

CREATE OR REPLACE FUNCTION credits.reserve_credits(
  org_id UUID,
  amount DECIMAL,
  service_code_param TEXT DEFAULT NULL,
  reference_id_param UUID DEFAULT NULL,
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
  
  -- Create account if doesn't exist
  IF NOT FOUND THEN
    INSERT INTO credits.credit_accounts (organization_id, balance, reserved_balance)
    VALUES (org_id, 0.00, 0.00)
    RETURNING * INTO account_record;
  END IF;
  
  -- Check available balance
  new_balance := account_record.balance - account_record.reserved_balance - amount;
  
  IF new_balance < 0 THEN
    RAISE EXCEPTION 'Insufficient credits. Available: %, Required: %', 
      (account_record.balance - account_record.reserved_balance), amount;
  END IF;
  
  -- Update reserved balance
  UPDATE credits.credit_accounts
  SET reserved_balance = reserved_balance + amount,
      updated_at = NOW()
  WHERE id = account_record.id;
  
  -- Create transaction record
  INSERT INTO credits.credit_transactions (
    organization_id,
    type,
    amount,
    balance_after,
    service_code,
    reference_id,
    description
  ) VALUES (
    org_id,
    'reserved',
    amount,
    account_record.balance - account_record.reserved_balance - amount,
    service_code_param,
    reference_id_param,
    description_param
  ) RETURNING id INTO transaction_id;
  
  RETURN transaction_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCTION: confirm_credits
-- Description: Confirma uso de créditos (desbloquea y resta del balance)
-- =====================================================

CREATE OR REPLACE FUNCTION credits.confirm_credits(
  org_id UUID,
  transaction_id_param UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  transaction_record credits.credit_transactions%ROWTYPE;
  account_record credits.credit_accounts%ROWTYPE;
BEGIN
  -- Get transaction
  SELECT * INTO transaction_record
  FROM credits.credit_transactions
  WHERE id = transaction_id_param
  AND organization_id = org_id
  AND type = 'reserved'
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transaction not found or already processed';
  END IF;
  
  -- Get account
  SELECT * INTO account_record
  FROM credits.credit_accounts
  WHERE organization_id = org_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Credit account not found';
  END IF;
  
  -- Check reserved balance
  IF account_record.reserved_balance < transaction_record.amount THEN
    RAISE EXCEPTION 'Reserved balance insufficient';
  END IF;
  
  -- Update account: subtract from balance and reserved_balance
  UPDATE credits.credit_accounts
  SET balance = balance - transaction_record.amount,
      reserved_balance = reserved_balance - transaction_record.amount,
      total_spent = total_spent + transaction_record.amount,
      updated_at = NOW()
  WHERE id = account_record.id;
  
  -- Update transaction to 'spent'
  UPDATE credits.credit_transactions
  SET type = 'spent',
      balance_after = account_record.balance - transaction_record.amount - account_record.reserved_balance + transaction_record.amount
  WHERE id = transaction_id_param;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCTION: release_credits
-- Description: Libera créditos bloqueados (operación cancelada)
-- =====================================================

CREATE OR REPLACE FUNCTION credits.release_credits(
  org_id UUID,
  transaction_id_param UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  transaction_record credits.credit_transactions%ROWTYPE;
  account_record credits.credit_accounts%ROWTYPE;
BEGIN
  -- Get transaction
  SELECT * INTO transaction_record
  FROM credits.credit_transactions
  WHERE id = transaction_id_param
  AND organization_id = org_id
  AND type = 'reserved'
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transaction not found or already processed';
  END IF;
  
  -- Get account
  SELECT * INTO account_record
  FROM credits.credit_accounts
  WHERE organization_id = org_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Credit account not found';
  END IF;
  
  -- Check reserved balance
  IF account_record.reserved_balance < transaction_record.amount THEN
    RAISE EXCEPTION 'Reserved balance insufficient';
  END IF;
  
  -- Update account: release reserved balance
  UPDATE credits.credit_accounts
  SET reserved_balance = reserved_balance - transaction_record.amount,
      updated_at = NOW()
  WHERE id = account_record.id;
  
  -- Update transaction to 'released'
  UPDATE credits.credit_transactions
  SET type = 'released',
      balance_after = account_record.balance - account_record.reserved_balance + transaction_record.amount
  WHERE id = transaction_id_param;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCTION: add_credits
-- Description: Agrega créditos a una cuenta (suscripción o compra)
-- =====================================================

CREATE OR REPLACE FUNCTION credits.add_credits(
  org_id UUID,
  amount DECIMAL,
  source_param TEXT DEFAULT 'manual',
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
  
  -- Create transaction record
  INSERT INTO credits.credit_transactions (
    organization_id,
    type,
    amount,
    balance_after,
    description,
    metadata
  ) VALUES (
    org_id,
    'earned',
    amount,
    new_balance,
    COALESCE(description_param, 'Credits added from ' || source_param),
    metadata_param
  ) RETURNING id INTO transaction_id;
  
  RETURN transaction_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCTION: check_auto_recharge
-- Description: Verifica si necesita auto-recarga y la ejecuta si aplica
-- =====================================================

CREATE OR REPLACE FUNCTION credits.check_auto_recharge(
  org_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  account_record credits.credit_accounts%ROWTYPE;
  payment_method_record billing.payment_methods%ROWTYPE;
  available_balance DECIMAL;
BEGIN
  -- Get account
  SELECT * INTO account_record
  FROM credits.credit_accounts
  WHERE organization_id = org_id;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Check if auto-recharge is enabled
  IF NOT account_record.auto_recharge_enabled THEN
    RETURN false;
  END IF;
  
  -- Check if threshold is set
  IF account_record.auto_recharge_threshold IS NULL THEN
    RETURN false;
  END IF;
  
  -- Calculate available balance
  available_balance := account_record.balance - account_record.reserved_balance;
  
  -- Check if below threshold
  IF available_balance > account_record.auto_recharge_threshold THEN
    RETURN false;
  END IF;
  
  -- Get payment method
  IF account_record.auto_recharge_payment_method_id IS NULL THEN
    RETURN false;
  END IF;
  
  SELECT * INTO payment_method_record
  FROM billing.payment_methods
  WHERE id = account_record.auto_recharge_payment_method_id
  AND organization_id = org_id
  AND deleted_at IS NULL;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Auto-recharge should be triggered (actual payment processing happens in application layer)
  -- This function just checks if it should happen
  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCTION: get_balance
-- Description: Obtiene balance disponible de una organización
-- =====================================================

CREATE OR REPLACE FUNCTION credits.get_balance(
  org_id UUID
)
RETURNS DECIMAL AS $$
DECLARE
  account_record credits.credit_accounts%ROWTYPE;
BEGIN
  SELECT * INTO account_record
  FROM credits.credit_accounts
  WHERE organization_id = org_id;
  
  IF NOT FOUND THEN
    RETURN 0.00;
  END IF;
  
  RETURN GREATEST(0.00, account_record.balance - account_record.reserved_balance);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON FUNCTION credits.reserve_credits IS 'Bloquea créditos antes de una operación. Retorna transaction_id.';
COMMENT ON FUNCTION credits.confirm_credits IS 'Confirma uso de créditos (desbloquea y resta del balance).';
COMMENT ON FUNCTION credits.release_credits IS 'Libera créditos bloqueados cuando una operación se cancela.';
COMMENT ON FUNCTION credits.add_credits IS 'Agrega créditos a una cuenta (suscripción o compra).';
COMMENT ON FUNCTION credits.check_auto_recharge IS 'Verifica si necesita auto-recarga basado en threshold.';
COMMENT ON FUNCTION credits.get_balance IS 'Obtiene balance disponible (balance - reserved_balance).';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Funciones de créditos creadas exitosamente';
  RAISE NOTICE '';
  RAISE NOTICE 'Funciones creadas:';
  RAISE NOTICE '  ✅ reserve_credits() - Bloquea créditos antes de operación';
  RAISE NOTICE '  ✅ confirm_credits() - Confirma uso y resta créditos';
  RAISE NOTICE '  ✅ release_credits() - Libera créditos bloqueados';
  RAISE NOTICE '  ✅ add_credits() - Agrega créditos a cuenta';
  RAISE NOTICE '  ✅ check_auto_recharge() - Verifica si necesita auto-recarga';
  RAISE NOTICE '  ✅ get_balance() - Obtiene balance disponible';
END $$;

