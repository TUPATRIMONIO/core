-- =====================================================
-- Migration: Add public wrapper for add_refund_credits
-- Description: Wrapper en schema público para que Supabase client pueda encontrar la función add_refund_credits
-- Created: 2025-12-08
-- =====================================================

SET search_path TO credits, core, public, extensions;

-- =====================================================
-- PUBLIC WRAPPER FOR add_refund_credits
-- Description: Wrapper en schema público para que Supabase client pueda encontrarla
-- =====================================================

CREATE OR REPLACE FUNCTION public.add_refund_credits(
  org_id UUID,
  amount DECIMAL,
  order_id_param UUID,
  metadata_param JSONB DEFAULT '{}'::JSONB,
  description_param TEXT DEFAULT NULL
)
RETURNS UUID AS $$
BEGIN
  -- Llamar a la función del schema credits
  RETURN credits.add_refund_credits(
    org_id,
    amount,
    order_id_param,
    metadata_param,
    description_param
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute
GRANT EXECUTE ON FUNCTION public.add_refund_credits(UUID, DECIMAL, UUID, JSONB, TEXT) TO service_role;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Función pública public.add_refund_credits creada exitosamente';
END $$;

