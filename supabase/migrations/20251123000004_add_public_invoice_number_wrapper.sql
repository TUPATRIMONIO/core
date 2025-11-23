-- =====================================================
-- Migration: Add public wrapper for generate_invoice_number
-- Description: Crea función wrapper en public para que Supabase RPC pueda encontrarla
-- Created: 2025-11-23
-- =====================================================

-- =====================================================
-- PROBLEMA IDENTIFICADO
-- =====================================================
-- Supabase RPC busca funciones en el esquema 'public' por defecto
-- La función generate_invoice_number está en el esquema 'billing'
-- Solución: Crear wrapper en public que llame a la función en billing

-- =====================================================
-- CREAR WRAPPER EN PUBLIC
-- =====================================================

CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS TEXT AS $$
BEGIN
  RETURN billing.generate_invoice_number();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.generate_invoice_number() TO authenticated;

COMMENT ON FUNCTION public.generate_invoice_number() IS
'Wrapper para billing.generate_invoice_number() - permite llamar desde Supabase RPC';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Función wrapper creada en public.generate_invoice_number()';
  RAISE NOTICE '';
  RAISE NOTICE 'Ahora Supabase RPC puede encontrar la función:';
  RAISE NOTICE '  ✅ public.generate_invoice_number() → billing.generate_invoice_number()';
  RAISE NOTICE '';
  RAISE NOTICE 'La función mantiene todas las mejoras de thread-safety';
END $$;

