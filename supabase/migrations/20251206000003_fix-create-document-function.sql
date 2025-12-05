-- =====================================================
-- Migration: Fix create_invoicing_document_from_request
-- Description: Corregir nombres de columnas que no existen
-- Created: 2025-12-06
-- =====================================================

SET search_path TO invoicing, billing, credits, core, public, extensions;

-- =====================================================
-- DROP: Eliminar versión anterior
-- =====================================================

DROP FUNCTION IF EXISTS public.create_invoicing_document_from_request(UUID, UUID, UUID, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, DECIMAL, DECIMAL, DECIMAL, TEXT, TEXT, TEXT, JSONB);

-- =====================================================
-- CREATE: Nueva versión con columnas correctas
-- emission_request_id -> no existe, removido
-- external_provider -> provider
-- tax_amount -> tax
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
    document_type,
    document_number,
    status,
    external_id,
    provider,
    subtotal,
    tax,
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
    p_document_type::invoicing.document_type,
    p_document_number,
    p_status::invoicing.document_status,
    p_external_id,
    p_external_provider::invoicing.provider_type,
    p_subtotal,
    p_tax_amount,
    p_total,
    p_currency,
    p_pdf_url,
    p_xml_url,
    COALESCE(p_provider_response, '{}'::jsonb),
    NOW()
  )
  RETURNING id INTO v_document_id;
  
  -- Vincular documento con emission_request
  UPDATE invoicing.emission_requests
  SET document_id = v_document_id
  WHERE id = p_emission_request_id;
  
  RETURN v_document_id;
END;
$$;

-- =====================================================
-- GRANTS
-- =====================================================

GRANT EXECUTE ON FUNCTION public.create_invoicing_document_from_request(UUID, UUID, UUID, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, DECIMAL, DECIMAL, DECIMAL, TEXT, TEXT, TEXT, JSONB) TO service_role;

-- =====================================================
-- RESET: Resetear emission_requests fallidas
-- =====================================================

UPDATE invoicing.emission_requests 
SET status = 'pending', attempts = 0, last_error = NULL 
WHERE status = 'failed';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Función create_invoicing_document_from_request corregida';
  RAISE NOTICE '  - Removido: emission_request_id (no existe en tabla)';
  RAISE NOTICE '  - Cambiado: external_provider -> provider';
  RAISE NOTICE '  - Cambiado: tax_amount -> tax';
  RAISE NOTICE '  - Reseteadas emission_requests fallidas';
END $$;

