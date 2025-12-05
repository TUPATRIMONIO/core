-- =====================================================
-- Migration: Fix emission_requests UPDATE via RPC
-- Description: Crear funciones RPC para actualizar emission_requests
-- Created: 2025-12-05
-- =====================================================

SET search_path TO invoicing, billing, credits, core, public, extensions;

-- =====================================================
-- FUNCTION: update_emission_request_status
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_emission_request_status(
  p_request_id UUID,
  p_status TEXT,
  p_attempts INTEGER DEFAULT NULL,
  p_last_error TEXT DEFAULT NULL,
  p_processed_at TIMESTAMPTZ DEFAULT NULL,
  p_completed_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS SETOF public.emission_requests
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE invoicing.emission_requests
  SET 
    status = p_status,
    attempts = COALESCE(p_attempts, attempts),
    last_error = CASE WHEN p_last_error IS NOT NULL THEN p_last_error ELSE last_error END,
    last_error_at = CASE WHEN p_last_error IS NOT NULL THEN NOW() ELSE last_error_at END,
    updated_at = NOW(),
    processed_at = COALESCE(p_processed_at, processed_at),
    completed_at = COALESCE(p_completed_at, completed_at)
  WHERE id = p_request_id;
  
  RETURN QUERY SELECT * FROM public.emission_requests WHERE id = p_request_id;
END;
$$;

-- Grant execute to service_role
GRANT EXECUTE ON FUNCTION public.update_emission_request_status TO service_role;

-- =====================================================
-- FUNCTION: create_invoicing_document_from_request
-- =====================================================

CREATE OR REPLACE FUNCTION public.create_invoicing_document_from_request(
  p_organization_id UUID,
  p_customer_id UUID,
  p_order_id UUID,
  p_emission_request_id UUID,
  p_document_type TEXT,
  p_document_number TEXT,
  p_status TEXT,
  p_external_id TEXT,
  p_external_provider TEXT,
  p_subtotal DECIMAL,
  p_tax_amount DECIMAL,
  p_total DECIMAL,
  p_currency TEXT,
  p_pdf_url TEXT DEFAULT NULL,
  p_xml_url TEXT DEFAULT NULL,
  p_provider_response JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_document_id UUID;
BEGIN
  INSERT INTO invoicing.documents (
    organization_id,
    customer_id,
    order_id,
    emission_request_id,
    document_type,
    document_number,
    status,
    external_id,
    external_provider,
    subtotal,
    tax_amount,
    total,
    currency,
    pdf_url,
    xml_url,
    provider_response,
    issued_at
  ) VALUES (
    p_organization_id,
    p_customer_id,
    p_order_id,
    p_emission_request_id,
    p_document_type::invoicing.document_type,
    p_document_number,
    p_status::invoicing.document_status,
    p_external_id,
    p_external_provider,
    p_subtotal,
    p_tax_amount,
    p_total,
    p_currency,
    p_pdf_url,
    p_xml_url,
    p_provider_response,
    NOW()
  )
  RETURNING id INTO v_document_id;
  
  -- Update emission_request with document_id
  UPDATE invoicing.emission_requests
  SET document_id = v_document_id
  WHERE id = p_emission_request_id;
  
  RETURN v_document_id;
END;
$$;

-- Grant execute to service_role  
GRANT EXECUTE ON FUNCTION public.create_invoicing_document_from_request TO service_role;

-- =====================================================
-- FUNCTION: get_or_create_invoicing_customer
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_or_create_invoicing_customer(
  p_organization_id UUID,
  p_name TEXT,
  p_tax_id TEXT DEFAULT NULL,
  p_email TEXT DEFAULT NULL,
  p_customer_type TEXT DEFAULT 'individual'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_customer_id UUID;
BEGIN
  -- Buscar cliente existente por tax_id o email
  SELECT id INTO v_customer_id
  FROM invoicing.customers
  WHERE organization_id = p_organization_id
    AND (
      (p_tax_id IS NOT NULL AND tax_id = p_tax_id)
      OR (p_email IS NOT NULL AND email = p_email)
    )
  LIMIT 1;
  
  -- Si no existe, crear uno nuevo
  IF v_customer_id IS NULL THEN
    INSERT INTO invoicing.customers (
      organization_id,
      customer_type,
      name,
      tax_id,
      email
    ) VALUES (
      p_organization_id,
      p_customer_type::invoicing.customer_type,
      p_name,
      p_tax_id,
      p_email
    )
    RETURNING id INTO v_customer_id;
  END IF;
  
  RETURN v_customer_id;
END;
$$;

-- Grant execute to service_role
GRANT EXECUTE ON FUNCTION public.get_or_create_invoicing_customer TO service_role;

-- =====================================================
-- FUNCTION: generate_document_number
-- =====================================================

CREATE OR REPLACE FUNCTION public.generate_invoicing_document_number(
  p_document_type TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_prefix TEXT;
  v_date_part TEXT;
  v_random_part TEXT;
BEGIN
  -- Determinar prefijo según tipo de documento
  v_prefix := CASE p_document_type
    WHEN 'factura_electronica' THEN 'FAC'
    WHEN 'boleta_electronica' THEN 'BOL'
    WHEN 'nota_credito' THEN 'NC'
    WHEN 'nota_debito' THEN 'ND'
    WHEN 'stripe_invoice' THEN 'STR'
    ELSE 'DOC'
  END;
  
  v_date_part := TO_CHAR(NOW(), 'YYYYMMDD');
  v_random_part := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
  
  RETURN v_prefix || '-' || v_date_part || '-' || v_random_part;
END;
$$;

-- Grant execute to service_role
GRANT EXECUTE ON FUNCTION public.generate_invoicing_document_number TO service_role;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Funciones RPC para invoicing creadas exitosamente';
  RAISE NOTICE '';
  RAISE NOTICE 'Funciones creadas:';
  RAISE NOTICE '  ✅ update_emission_request_status';
  RAISE NOTICE '  ✅ create_invoicing_document_from_request';
  RAISE NOTICE '  ✅ get_or_create_invoicing_customer';
  RAISE NOTICE '  ✅ generate_invoicing_document_number';
END $$;

