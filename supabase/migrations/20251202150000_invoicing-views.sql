-- =====================================================
-- Migration: Invoicing public views
-- Description: Vistas públicas para acceso a datos de invoicing
-- Created: 2025-12-02
-- =====================================================

SET search_path TO invoicing, billing, credits, core, public, extensions;

-- =====================================================
-- VIEW: Documents (con información relacionada)
-- =====================================================

CREATE OR REPLACE VIEW public.invoicing_documents AS
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
  d.issued_at,
  d.voided_at,
  d.order_id,
  d.created_at,
  d.updated_at,
  -- Información relacionada
  c.name as customer_name,
  c.tax_id as customer_tax_id,
  c.email as customer_email,
  o.order_number
FROM invoicing.documents d
LEFT JOIN invoicing.customers c ON c.id = d.customer_id
LEFT JOIN billing.orders o ON o.id = d.order_id;

-- =====================================================
-- VIEW: Customers (simplificada)
-- =====================================================

CREATE OR REPLACE VIEW public.invoicing_customers AS
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
  c.created_at,
  c.updated_at
FROM invoicing.customers c;

-- =====================================================
-- GRANTS
-- =====================================================

-- Grant SELECT a authenticated users
GRANT SELECT ON public.invoicing_documents TO authenticated;
GRANT SELECT ON public.invoicing_customers TO authenticated;

-- Grant SELECT a service_role
GRANT SELECT ON public.invoicing_documents TO service_role;
GRANT SELECT ON public.invoicing_customers TO service_role;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON VIEW public.invoicing_documents IS 
'Vista pública de documentos con información relacionada de customers y orders';

COMMENT ON VIEW public.invoicing_customers IS 
'Vista pública de customers';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Vistas públicas de invoicing creadas exitosamente';
  RAISE NOTICE '';
  RAISE NOTICE 'Vistas creadas:';
  RAISE NOTICE '  ✅ public.invoicing_documents - Documentos con info relacionada';
  RAISE NOTICE '  ✅ public.invoicing_customers - Customers';
  RAISE NOTICE '';
  RAISE NOTICE 'Permisos:';
  RAISE NOTICE '  ✅ SELECT otorgado a authenticated y service_role';
END $$;

