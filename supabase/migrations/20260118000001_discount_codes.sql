-- =====================================================
-- Migration: Discount codes system
-- Description: Adds discount codes, usage tracking, and order fields
-- Created: 2026-01-18
-- =====================================================

SET search_path TO billing, core, public, extensions;

-- =====================================================
-- TABLE: billing.discount_codes
-- =====================================================

CREATE TABLE IF NOT EXISTS billing.discount_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Code details
  code TEXT UNIQUE NOT NULL CHECK (length(code) >= 3),
  description TEXT,

  -- Discount configuration
  type TEXT NOT NULL CHECK (type IN ('percentage', 'fixed_amount')),
  value DECIMAL(10,2) NOT NULL CHECK (value > 0),
  currency TEXT CHECK (currency ~ '^[A-Z]{3}$'),
  min_purchase_amount DECIMAL(10,2) CHECK (min_purchase_amount >= 0),
  max_discount_amount DECIMAL(10,2) CHECK (max_discount_amount >= 0),

  -- Usage limits
  usage_limit_type TEXT NOT NULL CHECK (usage_limit_type IN ('single_use', 'per_user', 'global_limit', 'unlimited')),
  max_uses INTEGER CHECK (max_uses >= 1),
  current_uses INTEGER NOT NULL DEFAULT 0 CHECK (current_uses >= 0),

  -- Validity window
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,

  -- Product scoping (NULL = all)
  product_types TEXT[],

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Metadata
  created_by UUID REFERENCES core.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT discount_code_type_currency CHECK (
    (type = 'fixed_amount' AND currency IS NOT NULL) OR
    (type = 'percentage' AND currency IS NULL)
  ),
  CONSTRAINT discount_code_percentage_limit CHECK (
    (type = 'percentage' AND value <= 100) OR
    (type = 'fixed_amount')
  )
);

CREATE INDEX IF NOT EXISTS idx_discount_codes_active ON billing.discount_codes(is_active);
CREATE INDEX IF NOT EXISTS idx_discount_codes_validity ON billing.discount_codes(valid_from, valid_until);
CREATE INDEX IF NOT EXISTS idx_discount_codes_usage ON billing.discount_codes(usage_limit_type, current_uses);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION billing.update_discount_codes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_discount_codes_updated_at ON billing.discount_codes;
CREATE TRIGGER trigger_discount_codes_updated_at
  BEFORE UPDATE ON billing.discount_codes
  FOR EACH ROW
  EXECUTE FUNCTION billing.update_discount_codes_updated_at();

-- =====================================================
-- TABLE: billing.discount_usage
-- =====================================================

CREATE TABLE IF NOT EXISTS billing.discount_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discount_code_id UUID NOT NULL REFERENCES billing.discount_codes(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES billing.orders(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES core.users(id) ON DELETE SET NULL,
  discount_amount DECIMAL(10,2) NOT NULL CHECK (discount_amount >= 0),
  currency TEXT NOT NULL CHECK (currency ~ '^[A-Z]{3}$'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_discount_usage_order UNIQUE (order_id)
);

CREATE INDEX IF NOT EXISTS idx_discount_usage_code ON billing.discount_usage(discount_code_id);
CREATE INDEX IF NOT EXISTS idx_discount_usage_org ON billing.discount_usage(organization_id);
CREATE INDEX IF NOT EXISTS idx_discount_usage_user ON billing.discount_usage(user_id);

-- =====================================================
-- ADD FIELDS TO billing.orders
-- =====================================================

ALTER TABLE billing.orders
ADD COLUMN IF NOT EXISTS discount_code_id UUID REFERENCES billing.discount_codes(id) ON DELETE SET NULL;

ALTER TABLE billing.orders
ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0);

ALTER TABLE billing.orders
ADD COLUMN IF NOT EXISTS original_amount DECIMAL(10,2) CHECK (original_amount >= 0);

CREATE INDEX IF NOT EXISTS idx_orders_discount_code ON billing.orders(discount_code_id);

-- =====================================================
-- RLS POLICIES
-- =====================================================

ALTER TABLE billing.discount_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing.discount_usage ENABLE ROW LEVEL SECURITY;

-- Discount codes: Platform admins can manage
CREATE POLICY "Platform admins can manage discount codes"
ON billing.discount_codes
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM core.organization_users ou
    JOIN core.organizations o ON o.id = ou.organization_id
    JOIN core.roles r ON r.id = ou.role_id
    WHERE ou.user_id = auth.uid()
    AND ou.status = 'active'
    AND o.org_type = 'platform'
    AND r.slug = 'platform_super_admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM core.organization_users ou
    JOIN core.organizations o ON o.id = ou.organization_id
    JOIN core.roles r ON r.id = ou.role_id
    WHERE ou.user_id = auth.uid()
    AND ou.status = 'active'
    AND o.org_type = 'platform'
    AND r.slug = 'platform_super_admin'
  )
);

-- Discount usage: Platform admins can view
CREATE POLICY "Platform admins can view discount usage"
ON billing.discount_usage
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM core.organization_users ou
    JOIN core.organizations o ON o.id = ou.organization_id
    JOIN core.roles r ON r.id = ou.role_id
    WHERE ou.user_id = auth.uid()
    AND ou.status = 'active'
    AND o.org_type = 'platform'
    AND r.slug = 'platform_super_admin'
  )
);

-- Discount usage: Service role can manage
CREATE POLICY "Service role can manage discount usage"
ON billing.discount_usage
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- =====================================================
-- VIEWS IN PUBLIC SCHEMA
-- =====================================================

CREATE OR REPLACE VIEW public.discount_codes AS
SELECT * FROM billing.discount_codes;

CREATE OR REPLACE VIEW public.discount_usage AS
SELECT * FROM billing.discount_usage;

ALTER VIEW public.discount_codes SET (security_invoker = true);
ALTER VIEW public.discount_usage SET (security_invoker = true);

GRANT SELECT ON public.discount_codes TO authenticated;
GRANT SELECT ON public.discount_usage TO authenticated;

-- =====================================================
-- PERMISSIONS FOR SERVICE ROLE
-- =====================================================

GRANT ALL ON billing.discount_codes TO service_role;
GRANT ALL ON billing.discount_usage TO service_role;

-- =====================================================
-- FUNCTION: billing.validate_discount_code
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

  v_discount_amount := LEAST(v_discount_amount, v_base_amount);
  v_final_amount := v_base_amount - v_discount_amount;

  IF v_final_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'El descuento no puede dejar el total en $0');
  END IF;

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
    'final_amount', v_final_amount
  );
END;
$$ LANGUAGE plpgsql;

-- Public wrapper for RPC access
CREATE OR REPLACE FUNCTION public.validate_discount_code(
  p_code TEXT,
  p_order_id UUID
) RETURNS JSONB AS $$
BEGIN
  RETURN billing.validate_discount_code(p_code, p_order_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.validate_discount_code(TEXT, UUID) TO authenticated;

