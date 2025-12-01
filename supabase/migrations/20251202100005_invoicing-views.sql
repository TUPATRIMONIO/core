-- =====================================================
-- Migration: Invoicing public views
-- Description: Vistas públicas para acceso a datos de invoicing
-- Created: 2025-12-02
-- =====================================================

SET search_path TO invoicing, billing, credits, core, public, extensions;

-- =====================================================
-- VIEW: Document Requests (con información relacionada)
-- =====================================================

CREATE OR REPLACE VIEW public.document_requests AS
SELECT 
  dr.id,
  dr.order_id,
  dr.invoice_id,
  dr.organization_id,
  dr.document_type,
  dr.provider,
  dr.status,
  dr.attempts,
  dr.max_attempts,
  dr.last_error,
  dr.last_error_at,
  dr.created_at,
  dr.updated_at,
  dr.processed_at,
  dr.completed_at,
  -- Información relacionada
  o.order_number,
  i.invoice_number,
  o.status as order_status,
  i.status as invoice_status
FROM invoicing.document_requests dr
LEFT JOIN billing.orders o ON o.id = dr.order_id
LEFT JOIN billing.invoices i ON i.id = dr.invoice_id;

-- =====================================================
-- VIEW: Issued Documents (con información relacionada)
-- =====================================================

CREATE OR REPLACE VIEW public.issued_documents AS
SELECT 
  id.id,
  id.request_id,
  id.order_id,
  id.invoice_id,
  id.organization_id,
  id.document_type,
  id.provider,
  id.external_id,
  id.pdf_url,
  id.xml_url,
  id.provider_status,
  id.issued_at,
  id.created_at,
  -- Información relacionada
  dr.status as request_status,
  o.order_number,
  i.invoice_number,
  i.external_provider,
  i.external_document_id,
  i.external_pdf_url,
  i.external_xml_url
FROM invoicing.issued_documents id
LEFT JOIN invoicing.document_requests dr ON dr.id = id.request_id
LEFT JOIN billing.orders o ON o.id = id.order_id
LEFT JOIN billing.invoices i ON i.id = id.invoice_id;

-- =====================================================
-- VIEW: Emission Config (simplificada)
-- =====================================================

CREATE OR REPLACE VIEW public.emission_config AS
SELECT 
  ec.id,
  ec.organization_id,
  ec.auto_emit_on_completion,
  ec.default_document_type,
  ec.haulmer_enabled,
  ec.stripe_enabled,
  ec.created_at,
  ec.updated_at
FROM invoicing.emission_config ec;

-- =====================================================
-- GRANTS
-- =====================================================

-- Grant SELECT a authenticated users
GRANT SELECT ON public.document_requests TO authenticated;
GRANT SELECT ON public.issued_documents TO authenticated;
GRANT SELECT ON public.emission_config TO authenticated;

-- Grant SELECT a service_role (para webhooks)
GRANT SELECT ON public.document_requests TO service_role;
GRANT SELECT ON public.issued_documents TO service_role;
GRANT SELECT ON public.emission_config TO service_role;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON VIEW public.document_requests IS 
'Vista pública de solicitudes de documentos con información relacionada de órdenes e invoices';

COMMENT ON VIEW public.issued_documents IS 
'Vista pública de documentos emitidos con información relacionada';

COMMENT ON VIEW public.emission_config IS 
'Vista pública de configuración de emisión (sin datos sensibles)';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Vistas públicas de invoicing creadas exitosamente';
  RAISE NOTICE '';
  RAISE NOTICE 'Vistas creadas:';
  RAISE NOTICE '  ✅ public.document_requests - Solicitudes con info relacionada';
  RAISE NOTICE '  ✅ public.issued_documents - Documentos emitidos con info relacionada';
  RAISE NOTICE '  ✅ public.emission_config - Configuración simplificada';
  RAISE NOTICE '';
  RAISE NOTICE 'Permisos:';
  RAISE NOTICE '  ✅ SELECT otorgado a authenticated y service_role';
END $$;

