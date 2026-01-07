-- =====================================================
-- Migration: Add permissions and public wrapper for restart_order
-- Description: Fixes permissions for the restart_order function
-- Created: 2026-01-07
-- =====================================================

SET search_path TO billing, signing, core, public, extensions;

-- 1. Grant execute permissions on billing.restart_order
GRANT EXECUTE ON FUNCTION billing.restart_order(UUID, BOOLEAN, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION billing.restart_order(UUID, BOOLEAN, TEXT, UUID) TO service_role;

-- 2. Create public wrapper function for easier access from APIs
CREATE OR REPLACE FUNCTION public.restart_order(
  p_order_id UUID,
  p_charge_signatures BOOLEAN DEFAULT true,
  p_admin_notes TEXT DEFAULT NULL,
  p_performed_by UUID DEFAULT NULL
) RETURNS JSONB AS $$
BEGIN
  RETURN billing.restart_order(p_order_id, p_charge_signatures, p_admin_notes, p_performed_by);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.restart_order(UUID, BOOLEAN, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.restart_order(UUID, BOOLEAN, TEXT, UUID) TO service_role;

-- Success message
DO $$ 
BEGIN 
  RAISE NOTICE '✅ Permisos de restart_order configurados';
END $$;

