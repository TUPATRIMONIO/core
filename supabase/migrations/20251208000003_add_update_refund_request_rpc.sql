-- =====================================================
-- Migration: Add update_refund_request RPC function
-- Description: Función RPC para actualizar solicitudes de reembolso (evita problemas con la vista)
-- Created: 2025-12-08
-- =====================================================

SET search_path TO billing, credits, core, public, extensions;

-- =====================================================
-- FUNCTION: update_refund_request
-- Description: Actualiza una solicitud de reembolso
-- =====================================================

CREATE OR REPLACE FUNCTION billing.update_refund_request(
  p_refund_request_id UUID,
  p_status billing.refund_status DEFAULT NULL,
  p_provider_refund_id TEXT DEFAULT NULL,
  p_processed_at TIMESTAMPTZ DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS billing.refund_requests AS $$
DECLARE
  v_refund_request billing.refund_requests;
BEGIN
  UPDATE billing.refund_requests
  SET 
    status = COALESCE(p_status, status),
    provider_refund_id = COALESCE(p_provider_refund_id, provider_refund_id),
    processed_at = COALESCE(p_processed_at, processed_at),
    notes = COALESCE(p_notes, notes),
    updated_at = NOW()
  WHERE id = p_refund_request_id
  RETURNING * INTO v_refund_request;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Refund request not found: %', p_refund_request_id;
  END IF;
  
  RETURN v_refund_request;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute
GRANT EXECUTE ON FUNCTION billing.update_refund_request(UUID, billing.refund_status, TEXT, TIMESTAMPTZ, TEXT) TO service_role;

-- =====================================================
-- PUBLIC WRAPPER FUNCTION
-- Description: Wrapper en schema público para que Supabase client pueda encontrarla
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_refund_request(
  p_refund_request_id UUID,
  p_status TEXT DEFAULT NULL,
  p_provider_refund_id TEXT DEFAULT NULL,
  p_processed_at TIMESTAMPTZ DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
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
  -- Validar que el status sea válido si se proporciona
  IF p_status IS NOT NULL AND p_status NOT IN ('pending', 'approved', 'processing', 'completed', 'rejected') THEN
    RAISE EXCEPTION 'Invalid refund_status: %. Must be pending, approved, processing, completed, or rejected', p_status;
  END IF;
  
  -- Llamar a la función del schema billing
  RETURN QUERY
  SELECT * FROM billing.update_refund_request(
    p_refund_request_id,
    CASE WHEN p_status IS NOT NULL THEN p_status::billing.refund_status ELSE NULL END,
    p_provider_refund_id,
    p_processed_at,
    p_notes
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute
GRANT EXECUTE ON FUNCTION public.update_refund_request(UUID, TEXT, TEXT, TIMESTAMPTZ, TEXT) TO service_role;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Función billing.update_refund_request creada exitosamente';
  RAISE NOTICE '✅ Función pública public.update_refund_request creada exitosamente';
END $$;

