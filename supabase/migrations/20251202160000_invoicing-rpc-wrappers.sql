-- =====================================================
-- Migration: Invoicing RPC Wrappers
-- Description: Crea wrappers en public para funciones RPC de invoicing
-- Created: 2025-12-02
-- =====================================================

SET search_path TO invoicing, billing, credits, core, public, extensions;

-- =====================================================
-- PROBLEMA IDENTIFICADO
-- =====================================================
-- Supabase RPC busca funciones en el esquema 'public' por defecto
-- Las funciones están en el esquema 'invoicing'
-- Solución: Crear wrappers en public que llamen a las funciones en invoicing

-- =====================================================
-- WRAPPERS EN PUBLIC
-- =====================================================

-- determine_document_type_by_country
CREATE OR REPLACE FUNCTION public.determine_document_type_by_country(
  p_country_code TEXT,
  p_organization_id UUID
)
RETURNS invoicing.document_type AS $$
BEGIN
  RETURN invoicing.determine_document_type_by_country(p_country_code, p_organization_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.determine_document_type_by_country(TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.determine_document_type_by_country(TEXT, UUID) TO service_role;

-- determine_provider
CREATE OR REPLACE FUNCTION public.determine_provider(
  p_document_type invoicing.document_type
)
RETURNS invoicing.provider_type AS $$
BEGIN
  RETURN invoicing.determine_provider(p_document_type);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.determine_provider(invoicing.document_type) TO authenticated;
GRANT EXECUTE ON FUNCTION public.determine_provider(invoicing.document_type) TO service_role;

-- get_or_create_customer
CREATE OR REPLACE FUNCTION public.get_or_create_customer(
  p_organization_id UUID,
  p_tax_id TEXT,
  p_name TEXT,
  p_email TEXT DEFAULT NULL,
  p_address TEXT DEFAULT NULL,
  p_city TEXT DEFAULT NULL,
  p_state TEXT DEFAULT NULL,
  p_postal_code TEXT DEFAULT NULL,
  p_country TEXT DEFAULT 'CL',
  p_customer_type invoicing.customer_type DEFAULT 'empresa',
  p_giro TEXT DEFAULT NULL
)
RETURNS UUID AS $$
BEGIN
  RETURN invoicing.get_or_create_customer(
    p_organization_id,
    p_tax_id,
    p_name,
    p_email,
    p_address,
    p_city,
    p_state,
    p_postal_code,
    p_country,
    p_customer_type,
    p_giro
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_or_create_customer(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, invoicing.customer_type, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_or_create_customer(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, invoicing.customer_type, TEXT) TO service_role;

-- calculate_document_totals
CREATE OR REPLACE FUNCTION public.calculate_document_totals(
  p_items JSONB,
  p_country_code TEXT
)
RETURNS TABLE (
  subtotal NUMERIC,
  tax NUMERIC,
  total NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM invoicing.calculate_document_totals(p_items, p_country_code);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.calculate_document_totals(JSONB, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_document_totals(JSONB, TEXT) TO service_role;

-- generate_document_number
CREATE OR REPLACE FUNCTION public.generate_document_number(
  p_document_type invoicing.document_type,
  p_organization_id UUID
)
RETURNS TEXT AS $$
BEGIN
  RETURN invoicing.generate_document_number(p_document_type, p_organization_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.generate_document_number(invoicing.document_type, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_document_number(invoicing.document_type, UUID) TO service_role;

-- mark_document_issued
CREATE OR REPLACE FUNCTION public.mark_document_issued(
  p_document_id UUID,
  p_external_id TEXT,
  p_pdf_url TEXT DEFAULT NULL,
  p_xml_url TEXT DEFAULT NULL,
  p_provider_response JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  PERFORM invoicing.mark_document_issued(
    p_document_id,
    p_external_id,
    p_pdf_url,
    p_xml_url,
    p_provider_response
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.mark_document_issued(UUID, TEXT, TEXT, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_document_issued(UUID, TEXT, TEXT, TEXT, JSONB) TO service_role;

-- mark_document_failed
CREATE OR REPLACE FUNCTION public.mark_document_failed(
  p_document_id UUID,
  p_error_message TEXT
)
RETURNS VOID AS $$
BEGIN
  PERFORM invoicing.mark_document_failed(p_document_id, p_error_message);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.mark_document_failed(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_document_failed(UUID, TEXT) TO service_role;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON FUNCTION public.determine_document_type_by_country IS 
'Wrapper para invoicing.determine_document_type_by_country() - permite llamar desde Supabase RPC';

COMMENT ON FUNCTION public.determine_provider IS 
'Wrapper para invoicing.determine_provider() - permite llamar desde Supabase RPC';

COMMENT ON FUNCTION public.get_or_create_customer IS 
'Wrapper para invoicing.get_or_create_customer() - permite llamar desde Supabase RPC';

COMMENT ON FUNCTION public.calculate_document_totals IS 
'Wrapper para invoicing.calculate_document_totals() - permite llamar desde Supabase RPC';

COMMENT ON FUNCTION public.generate_document_number IS 
'Wrapper para invoicing.generate_document_number() - permite llamar desde Supabase RPC';

COMMENT ON FUNCTION public.mark_document_issued IS 
'Wrapper para invoicing.mark_document_issued() - permite llamar desde Supabase RPC';

COMMENT ON FUNCTION public.mark_document_failed IS 
'Wrapper para invoicing.mark_document_failed() - permite llamar desde Supabase RPC';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Wrappers RPC creados en public para invoicing';
  RAISE NOTICE '';
  RAISE NOTICE 'Funciones wrapper creadas:';
  RAISE NOTICE '  ✅ public.determine_document_type_by_country() → invoicing.determine_document_type_by_country()';
  RAISE NOTICE '  ✅ public.determine_provider() → invoicing.determine_provider()';
  RAISE NOTICE '  ✅ public.get_or_create_customer() → invoicing.get_or_create_customer()';
  RAISE NOTICE '  ✅ public.calculate_document_totals() → invoicing.calculate_document_totals()';
  RAISE NOTICE '  ✅ public.generate_document_number() → invoicing.generate_document_number()';
  RAISE NOTICE '  ✅ public.mark_document_issued() → invoicing.mark_document_issued()';
  RAISE NOTICE '  ✅ public.mark_document_failed() → invoicing.mark_document_failed()';
  RAISE NOTICE '';
  RAISE NOTICE 'Ahora Supabase RPC puede encontrar todas las funciones de invoicing';
END $$;

