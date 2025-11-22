-- =====================================================
-- Migration: Expose credits functions in public schema
-- Description: Crea funciones wrapper en public que llaman a las funciones de credits
-- Created: 2025-11-21
-- =====================================================

-- =====================================================
-- WRAPPER FUNCTIONS IN PUBLIC SCHEMA
-- =====================================================

-- reserve_credits
CREATE OR REPLACE FUNCTION public.reserve_credits(
  org_id_param UUID,
  amount_param DECIMAL,
  service_code_param TEXT DEFAULT NULL,
  reference_id_param UUID DEFAULT NULL,
  description_param TEXT DEFAULT NULL
)
RETURNS UUID AS $$
BEGIN
  RETURN credits.reserve_credits(
    org_id_param,
    amount_param,
    service_code_param,
    reference_id_param,
    description_param
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- confirm_credits
CREATE OR REPLACE FUNCTION public.confirm_credits(
  org_id_param UUID,
  transaction_id_param UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN credits.confirm_credits(org_id_param, transaction_id_param);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- release_credits
CREATE OR REPLACE FUNCTION public.release_credits(
  org_id_param UUID,
  transaction_id_param UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN credits.release_credits(org_id_param, transaction_id_param);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- add_credits
CREATE OR REPLACE FUNCTION public.add_credits(
  org_id_param UUID,
  amount_param DECIMAL,
  source_param TEXT DEFAULT 'manual',
  metadata_param JSONB DEFAULT '{}'::jsonb,
  description_param TEXT DEFAULT NULL
)
RETURNS UUID AS $$
BEGIN
  RETURN credits.add_credits(
    org_id_param,
    amount_param,
    source_param,
    metadata_param,
    description_param
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- get_balance
CREATE OR REPLACE FUNCTION public.get_balance(
  org_id_param UUID
)
RETURNS DECIMAL AS $$
BEGIN
  RETURN credits.get_balance(org_id_param);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- check_auto_recharge
CREATE OR REPLACE FUNCTION public.check_auto_recharge(
  org_id_param UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN credits.check_auto_recharge(org_id_param);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- GRANT EXECUTE TO authenticated
-- =====================================================

GRANT EXECUTE ON FUNCTION public.reserve_credits TO authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_credits TO authenticated;
GRANT EXECUTE ON FUNCTION public.release_credits TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_credits TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_balance TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_auto_recharge TO authenticated;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Funciones de créditos expuestas en schema public';
  RAISE NOTICE '';
  RAISE NOTICE 'Funciones wrapper creadas:';
  RAISE NOTICE '  ✅ public.reserve_credits() → credits.reserve_credits()';
  RAISE NOTICE '  ✅ public.confirm_credits() → credits.confirm_credits()';
  RAISE NOTICE '  ✅ public.release_credits() → credits.release_credits()';
  RAISE NOTICE '  ✅ public.add_credits() → credits.add_credits()';
  RAISE NOTICE '  ✅ public.get_balance() → credits.get_balance()';
  RAISE NOTICE '  ✅ public.check_auto_recharge() → credits.check_auto_recharge()';
  RAISE NOTICE '';
  RAISE NOTICE 'Las funciones ahora son accesibles desde el cliente Supabase';
END $$;

