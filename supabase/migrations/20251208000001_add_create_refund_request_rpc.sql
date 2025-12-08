-- =====================================================
-- Migration: Add create_refund_request RPC function
-- Description: Función RPC para crear solicitudes de reembolso (evita problemas con la vista)
-- Created: 2025-12-08
-- =====================================================

SET search_path TO billing, credits, core, public, extensions;

-- =====================================================
-- FUNCTION: create_refund_request
-- Description: Crea una solicitud de reembolso (para evitar problemas con la vista)
-- =====================================================

CREATE OR REPLACE FUNCTION billing.create_refund_request(
  p_order_id UUID,
  p_organization_id UUID,
  p_amount DECIMAL,
  p_currency TEXT,
  p_refund_destination billing.refund_destination,
  p_requested_by UUID DEFAULT NULL,
  p_reason TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_provider TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  order_id UUID,
  organization_id UUID,
  requested_by UUID,
  amount DECIMAL,
  currency TEXT,
  refund_destination billing.refund_destination,
  status billing.refund_status,
  provider TEXT,
  provider_refund_id TEXT,
  reason TEXT,
  notes TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  INSERT INTO billing.refund_requests (
    order_id,
    organization_id,
    requested_by,
    amount,
    currency,
    refund_destination,
    status,
    reason,
    notes,
    provider
  ) VALUES (
    p_order_id,
    p_organization_id,
    p_requested_by,
    p_amount,
    p_currency,
    p_refund_destination,
    'pending',
    p_reason,
    p_notes,
    p_provider
  ) RETURNING *;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute
GRANT EXECUTE ON FUNCTION billing.create_refund_request(UUID, UUID, DECIMAL, TEXT, billing.refund_destination, UUID, TEXT, TEXT, TEXT) TO service_role;

-- =====================================================
-- PUBLIC WRAPPER FUNCTION
-- Description: Wrapper en schema público para que Supabase client pueda encontrarla
-- =====================================================

CREATE OR REPLACE FUNCTION public.create_refund_request(
  p_order_id UUID,
  p_organization_id UUID,
  p_amount DECIMAL,
  p_currency TEXT,
  p_refund_destination TEXT, -- Usar TEXT en lugar del enum para el wrapper
  p_requested_by UUID DEFAULT NULL,
  p_reason TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_provider TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  order_id UUID,
  organization_id UUID,
  requested_by UUID,
  amount DECIMAL,
  currency TEXT,
  refund_destination billing.refund_destination,
  status billing.refund_status,
  provider TEXT,
  provider_refund_id TEXT,
  reason TEXT,
  notes TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  -- Validar que el refund_destination sea válido
  IF p_refund_destination NOT IN ('payment_method', 'wallet') THEN
    RAISE EXCEPTION 'Invalid refund_destination: %. Must be payment_method or wallet', p_refund_destination;
  END IF;
  
  -- Llamar a la función del schema billing
  RETURN QUERY
  SELECT * FROM billing.create_refund_request(
    p_order_id,
    p_organization_id,
    p_amount,
    p_currency,
    p_refund_destination::billing.refund_destination,
    p_requested_by,
    p_reason,
    p_notes,
    p_provider
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute
GRANT EXECUTE ON FUNCTION public.create_refund_request(UUID, UUID, DECIMAL, TEXT, TEXT, UUID, TEXT, TEXT, TEXT) TO service_role;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Función billing.create_refund_request creada exitosamente';
  RAISE NOTICE '✅ Función pública public.create_refund_request creada exitosamente';
END $$;

