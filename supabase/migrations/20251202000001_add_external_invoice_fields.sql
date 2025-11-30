-- =====================================================
-- Migration: Add external invoice fields
-- Description: Agregar campos para tracking de facturas externas (Stripe/Haulmer)
-- Created: 2025-12-02
-- =====================================================

SET search_path TO billing, core, public, extensions;

-- =====================================================
-- ADD EXTERNAL INVOICE FIELDS TO INVOICES TABLE
-- =====================================================

ALTER TABLE billing.invoices
ADD COLUMN IF NOT EXISTS external_provider TEXT CHECK (external_provider IN ('stripe', 'haulmer')),
ADD COLUMN IF NOT EXISTS external_document_id TEXT,
ADD COLUMN IF NOT EXISTS external_pdf_url TEXT,
ADD COLUMN IF NOT EXISTS external_xml_url TEXT,
ADD COLUMN IF NOT EXISTS external_status TEXT;

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_invoices_external_provider ON billing.invoices(external_provider);
CREATE INDEX IF NOT EXISTS idx_invoices_external_document_id ON billing.invoices(external_document_id) WHERE external_document_id IS NOT NULL;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON COLUMN billing.invoices.external_provider IS 'Proveedor externo que generó la factura: stripe o haulmer';
COMMENT ON COLUMN billing.invoices.external_document_id IS 'ID del documento en el proveedor externo';
COMMENT ON COLUMN billing.invoices.external_pdf_url IS 'URL del PDF de la factura generada por el proveedor externo';
COMMENT ON COLUMN billing.invoices.external_xml_url IS 'URL del XML de la factura (solo Haulmer)';
COMMENT ON COLUMN billing.invoices.external_status IS 'Estado de la factura en el proveedor externo';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Campos de facturación externa agregados exitosamente';
  RAISE NOTICE '';
  RAISE NOTICE 'Campos agregados:';
  RAISE NOTICE '  ✅ external_provider - stripe | haulmer';
  RAISE NOTICE '  ✅ external_document_id - ID en proveedor externo';
  RAISE NOTICE '  ✅ external_pdf_url - URL del PDF';
  RAISE NOTICE '  ✅ external_xml_url - URL del XML (Haulmer)';
  RAISE NOTICE '  ✅ external_status - Estado en proveedor externo';
END $$;

