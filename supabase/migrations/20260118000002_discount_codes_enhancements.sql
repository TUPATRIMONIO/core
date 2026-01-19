-- =====================================================
-- Migration: Discount codes enhancements
-- Description: Allow $0 orders and user-specific codes
-- Created: 2026-01-18
-- =====================================================

SET search_path TO billing, core, public, extensions;

-- =====================================================
-- ADD USER RESTRICTIONS TO DISCOUNT CODES
-- =====================================================

-- Add column for allowed users (NULL = all users can use)
ALTER TABLE billing.discount_codes
ADD COLUMN IF NOT EXISTS allowed_user_ids UUID[];

-- Add column for allowed organizations (NULL = all orgs can use)
ALTER TABLE billing.discount_codes
ADD COLUMN IF NOT EXISTS allowed_organization_ids UUID[];

CREATE INDEX IF NOT EXISTS idx_discount_codes_allowed_users ON billing.discount_codes USING GIN (allowed_user_ids);
CREATE INDEX IF NOT EXISTS idx_discount_codes_allowed_orgs ON billing.discount_codes USING GIN (allowed_organization_ids);

-- =====================================================
-- UPDATE VALIDATION FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION billing.validate_discount_code(
  p_code TEXT,
  p_order_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_code RECORD;
  v_order RECORD;
  v_base_amount DECIMAL(10,2);
  v_discount_amount DECIMAL(10,2);
  v_final_amount DECIMAL(10,2);
  v_user_id UUID;
  v_existing_usage INTEGER;
BEGIN
  IF p_code IS NULL OR length(trim(p_code)) = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Código inválido');
  END IF;

  v_user_id := auth.uid();

  SELECT * INTO v_code
  FROM billing.discount_codes
  WHERE code = UPPER(trim(p_code))
  AND is_active = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Código no válido');
  END IF;

  SELECT * INTO v_order
  FROM billing.orders
  WHERE id = p_order_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Orden no encontrada');
  END IF;

  IF v_order.status != 'pending_payment' THEN
    RETURN jsonb_build_object('success', false, 'error', 'La orden no está disponible para descuentos');
  END IF;

  -- Check user restrictions
  IF v_code.allowed_user_ids IS NOT NULL AND array_length(v_code.allowed_user_ids, 1) > 0 THEN
    IF v_user_id IS NULL OR NOT (v_user_id = ANY(v_code.allowed_user_ids)) THEN
      RETURN jsonb_build_object('success', false, 'error', 'Este código no está disponible para tu cuenta');
    END IF;
  END IF;

  -- Check organization restrictions
  IF v_code.allowed_organization_ids IS NOT NULL AND array_length(v_code.allowed_organization_ids, 1) > 0 THEN
    IF NOT (v_order.organization_id = ANY(v_code.allowed_organization_ids)) THEN
      RETURN jsonb_build_object('success', false, 'error', 'Este código no está disponible para tu organización');
    END IF;
  END IF;

  IF v_code.valid_from IS NOT NULL AND NOW() < v_code.valid_from THEN
    RETURN jsonb_build_object('success', false, 'error', 'Este código aún no está activo');
  END IF;

  IF v_code.valid_until IS NOT NULL AND NOW() > v_code.valid_until THEN
    RETURN jsonb_build_object('success', false, 'error', 'Este código ya expiró');
  END IF;

  IF v_code.product_types IS NOT NULL AND array_length(v_code.product_types, 1) > 0 THEN
    IF NOT (v_order.product_type = ANY(v_code.product_types)) THEN
      RETURN jsonb_build_object('success', false, 'error', 'Este código no aplica a este producto');
    END IF;
  END IF;

  v_base_amount := COALESCE(v_order.original_amount, v_order.amount);

  IF v_code.min_purchase_amount IS NOT NULL AND v_base_amount < v_code.min_purchase_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'El monto mínimo no cumple el requisito del código');
  END IF;

  IF v_code.type = 'fixed_amount' THEN
    IF v_code.currency IS NULL OR v_code.currency != v_order.currency THEN
      RETURN jsonb_build_object('success', false, 'error', 'El código no es válido para la moneda de la orden');
    END IF;
    v_discount_amount := v_code.value;
  ELSE
    v_discount_amount := (v_base_amount * v_code.value) / 100;
  END IF;

  IF v_code.max_discount_amount IS NOT NULL THEN
    v_discount_amount := LEAST(v_discount_amount, v_code.max_discount_amount);
  END IF;

  -- Allow discount up to 100% (final amount can be 0)
  v_discount_amount := LEAST(v_discount_amount, v_base_amount);
  v_final_amount := GREATEST(v_base_amount - v_discount_amount, 0);

  -- Usage limit validations
  IF v_code.usage_limit_type = 'single_use' THEN
    SELECT COUNT(*) INTO v_existing_usage
    FROM billing.discount_usage
    WHERE discount_code_id = v_code.id;
    IF v_existing_usage > 0 THEN
      RETURN jsonb_build_object('success', false, 'error', 'Este código ya fue utilizado');
    END IF;
  ELSIF v_code.usage_limit_type = 'per_user' THEN
    SELECT COUNT(*) INTO v_existing_usage
    FROM billing.discount_usage
    WHERE discount_code_id = v_code.id
    AND (
      (user_id IS NOT NULL AND user_id = v_user_id) OR
      (user_id IS NULL AND organization_id = v_order.organization_id)
    );
    IF v_existing_usage > 0 THEN
      RETURN jsonb_build_object('success', false, 'error', 'Este código ya fue usado en tu cuenta');
    END IF;
  ELSIF v_code.usage_limit_type = 'global_limit' THEN
    IF v_code.max_uses IS NULL OR v_code.current_uses >= v_code.max_uses THEN
      RETURN jsonb_build_object('success', false, 'error', 'Este código llegó a su límite de usos');
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'discount_code_id', v_code.id,
    'code', v_code.code,
    'type', v_code.type,
    'value', v_code.value,
    'currency', v_code.currency,
    'original_amount', v_base_amount,
    'discount_amount', v_discount_amount,
    'final_amount', v_final_amount,
    'is_free', v_final_amount = 0
  );
END;
$$ LANGUAGE plpgsql;

-- Update public wrapper
CREATE OR REPLACE FUNCTION public.validate_discount_code(
  p_code TEXT,
  p_order_id UUID
) RETURNS JSONB AS $$
BEGIN
  RETURN billing.validate_discount_code(p_code, p_order_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- RECREATE VIEW TO INCLUDE NEW COLUMNS
-- =====================================================

CREATE OR REPLACE VIEW public.discount_codes AS
SELECT * FROM billing.discount_codes;

ALTER VIEW public.discount_codes SET (security_invoker = true);

