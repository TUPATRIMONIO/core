-- =====================================================
-- Migration: Invoicing CRUD Functions
-- Description: Funciones RPC en public para CRUD en schema invoicing
-- (El cliente Supabase JS solo puede acceder a public y graphql_public)
-- Created: 2025-12-02
-- =====================================================

SET search_path TO invoicing, billing, credits, core, public, extensions;

-- =====================================================
-- CREATE DOCUMENT
-- =====================================================

CREATE OR REPLACE FUNCTION public.create_invoicing_document(
  p_organization_id UUID,
  p_customer_id UUID,
  p_document_number TEXT,
  p_document_type invoicing.document_type,
  p_provider invoicing.provider_type,
  p_status invoicing.document_status,
  p_subtotal NUMERIC,
  p_tax NUMERIC,
  p_total NUMERIC,
  p_currency TEXT,
  p_order_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::JSONB
)
RETURNS UUID AS $$
DECLARE
  v_document_id UUID;
BEGIN
  INSERT INTO invoicing.documents (
    organization_id,
    customer_id,
    document_number,
    document_type,
    provider,
    status,
    subtotal,
    tax,
    total,
    currency,
    order_id,
    metadata
  ) VALUES (
    p_organization_id,
    p_customer_id,
    p_document_number,
    p_document_type,
    p_provider,
    p_status,
    p_subtotal,
    p_tax,
    p_total,
    p_currency,
    p_order_id,
    p_metadata
  )
  RETURNING id INTO v_document_id;
  
  RETURN v_document_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- CREATE DOCUMENT ITEMS
-- =====================================================

CREATE OR REPLACE FUNCTION public.create_invoicing_document_items(
  p_document_id UUID,
  p_items JSONB
)
RETURNS VOID AS $$
DECLARE
  v_item JSONB;
BEGIN
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO invoicing.document_items (
      document_id,
      description,
      quantity,
      unit_price,
      total,
      tax_exempt
    ) VALUES (
      p_document_id,
      v_item->>'description',
      (v_item->>'quantity')::NUMERIC,
      (v_item->>'unit_price')::NUMERIC,
      (v_item->>'total')::NUMERIC,
      COALESCE((v_item->>'tax_exempt')::BOOLEAN, false)
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- GET DOCUMENT BY ID
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_invoicing_document(
  p_document_id UUID
)
RETURNS TABLE (
  id UUID,
  organization_id UUID,
  customer_id UUID,
  document_number TEXT,
  document_type invoicing.document_type,
  provider invoicing.provider_type,
  status invoicing.document_status,
  subtotal NUMERIC,
  tax NUMERIC,
  total NUMERIC,
  currency TEXT,
  external_id TEXT,
  pdf_url TEXT,
  xml_url TEXT,
  order_id UUID,
  metadata JSONB,
  issued_at TIMESTAMPTZ,
  voided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id,
    d.organization_id,
    d.customer_id,
    d.document_number,
    d.document_type,
    d.provider,
    d.status,
    d.subtotal,
    d.tax,
    d.total,
    d.currency,
    d.external_id,
    d.pdf_url,
    d.xml_url,
    d.order_id,
    d.metadata,
    d.issued_at,
    d.voided_at,
    d.created_at,
    d.updated_at
  FROM invoicing.documents d
  WHERE d.id = p_document_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- GET CUSTOMER BY ID
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_invoicing_customer(
  p_customer_id UUID
)
RETURNS TABLE (
  id UUID,
  organization_id UUID,
  tax_id TEXT,
  name TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT,
  customer_type invoicing.customer_type,
  giro TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.organization_id,
    c.tax_id,
    c.name,
    c.email,
    c.address,
    c.city,
    c.state,
    c.postal_code,
    c.country,
    c.customer_type,
    c.giro,
    c.metadata,
    c.created_at,
    c.updated_at
  FROM invoicing.customers c
  WHERE c.id = p_customer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- LIST DOCUMENTS BY ORGANIZATION
-- =====================================================

CREATE OR REPLACE FUNCTION public.list_invoicing_documents(
  p_organization_id UUID,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0,
  p_status invoicing.document_status DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  organization_id UUID,
  customer_id UUID,
  document_number TEXT,
  document_type invoicing.document_type,
  provider invoicing.provider_type,
  status invoicing.document_status,
  subtotal NUMERIC,
  tax NUMERIC,
  total NUMERIC,
  currency TEXT,
  external_id TEXT,
  pdf_url TEXT,
  xml_url TEXT,
  order_id UUID,
  issued_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id,
    d.organization_id,
    d.customer_id,
    d.document_number,
    d.document_type,
    d.provider,
    d.status,
    d.subtotal,
    d.tax,
    d.total,
    d.currency,
    d.external_id,
    d.pdf_url,
    d.xml_url,
    d.order_id,
    d.issued_at,
    d.created_at
  FROM invoicing.documents d
  WHERE d.organization_id = p_organization_id
    AND (p_status IS NULL OR d.status = p_status)
  ORDER BY d.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- VOID DOCUMENT
-- =====================================================

CREATE OR REPLACE FUNCTION public.void_invoicing_document(
  p_document_id UUID,
  p_organization_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_updated BOOLEAN := false;
BEGIN
  UPDATE invoicing.documents
  SET 
    status = 'voided',
    voided_at = NOW(),
    updated_at = NOW()
  WHERE id = p_document_id
    AND organization_id = p_organization_id
    AND status = 'issued';
  
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- LIST CUSTOMERS BY ORGANIZATION
-- =====================================================

CREATE OR REPLACE FUNCTION public.list_invoicing_customers(
  p_organization_id UUID,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0,
  p_search TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  organization_id UUID,
  tax_id TEXT,
  name TEXT,
  email TEXT,
  country TEXT,
  customer_type invoicing.customer_type,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.organization_id,
    c.tax_id,
    c.name,
    c.email,
    c.country,
    c.customer_type,
    c.created_at
  FROM invoicing.customers c
  WHERE c.organization_id = p_organization_id
    AND (p_search IS NULL OR c.name ILIKE '%' || p_search || '%' OR c.tax_id ILIKE '%' || p_search || '%')
  ORDER BY c.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- UPDATE CUSTOMER
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_invoicing_customer(
  p_customer_id UUID,
  p_organization_id UUID,
  p_name TEXT DEFAULT NULL,
  p_email TEXT DEFAULT NULL,
  p_address TEXT DEFAULT NULL,
  p_city TEXT DEFAULT NULL,
  p_state TEXT DEFAULT NULL,
  p_postal_code TEXT DEFAULT NULL,
  p_country TEXT DEFAULT NULL,
  p_giro TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_updated BOOLEAN := false;
BEGIN
  UPDATE invoicing.customers
  SET 
    name = COALESCE(p_name, name),
    email = COALESCE(p_email, email),
    address = COALESCE(p_address, address),
    city = COALESCE(p_city, city),
    state = COALESCE(p_state, state),
    postal_code = COALESCE(p_postal_code, postal_code),
    country = COALESCE(p_country, country),
    giro = COALESCE(p_giro, giro),
    updated_at = NOW()
  WHERE id = p_customer_id
    AND organization_id = p_organization_id;
  
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- GRANTS
-- =====================================================

GRANT EXECUTE ON FUNCTION public.create_invoicing_document TO service_role;
GRANT EXECUTE ON FUNCTION public.create_invoicing_document_items TO service_role;
GRANT EXECUTE ON FUNCTION public.get_invoicing_document TO service_role, authenticated;
GRANT EXECUTE ON FUNCTION public.get_invoicing_customer TO service_role, authenticated;
GRANT EXECUTE ON FUNCTION public.list_invoicing_documents TO service_role, authenticated;
GRANT EXECUTE ON FUNCTION public.void_invoicing_document TO service_role;
GRANT EXECUTE ON FUNCTION public.list_invoicing_customers TO service_role, authenticated;
GRANT EXECUTE ON FUNCTION public.update_invoicing_customer TO service_role;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Funciones CRUD de invoicing creadas exitosamente';
  RAISE NOTICE '';
  RAISE NOTICE 'Funciones creadas en public:';
  RAISE NOTICE '  ✅ create_invoicing_document - Crear documento';
  RAISE NOTICE '  ✅ create_invoicing_document_items - Crear items';
  RAISE NOTICE '  ✅ get_invoicing_document - Obtener documento';
  RAISE NOTICE '  ✅ get_invoicing_customer - Obtener customer';
  RAISE NOTICE '  ✅ list_invoicing_documents - Listar documentos';
  RAISE NOTICE '  ✅ void_invoicing_document - Anular documento';
  RAISE NOTICE '  ✅ list_invoicing_customers - Listar customers';
  RAISE NOTICE '  ✅ update_invoicing_customer - Actualizar customer';
END $$;

