-- =====================================================
-- Migration: Cleanup old invoicing schema and billing.invoices
-- Description: Elimina el schema invoicing anterior y las tablas de facturación interna
-- Created: 2025-12-02
-- =====================================================

SET search_path TO billing, credits, core, public, extensions;

-- =====================================================
-- ELIMINAR SCHEMA INVOICING ANTERIOR
-- =====================================================

-- Eliminar todas las tablas del schema invoicing anterior
DROP TABLE IF EXISTS invoicing.issued_documents CASCADE;
DROP TABLE IF EXISTS invoicing.document_requests CASCADE;
DROP TABLE IF EXISTS invoicing.emission_config CASCADE;

-- Eliminar funciones del schema invoicing anterior
DROP FUNCTION IF EXISTS invoicing.on_order_completed() CASCADE;
DROP FUNCTION IF EXISTS invoicing.retry_document_request(UUID) CASCADE;
DROP FUNCTION IF EXISTS invoicing.complete_document_request(UUID, TEXT, TEXT, TEXT, JSONB, TEXT) CASCADE;
DROP FUNCTION IF EXISTS invoicing.fail_document_request(UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS invoicing.create_document_request(UUID, UUID, UUID, invoicing.document_type, JSONB) CASCADE;
DROP FUNCTION IF EXISTS invoicing.get_pending_requests(INTEGER) CASCADE;
DROP FUNCTION IF EXISTS invoicing.determine_provider(invoicing.document_type) CASCADE;
DROP FUNCTION IF EXISTS invoicing.determine_document_type(UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS invoicing.set_webhook_url(TEXT) CASCADE;

-- Eliminar tipos ENUM del schema invoicing anterior
DROP TYPE IF EXISTS invoicing.provider_type CASCADE;
DROP TYPE IF EXISTS invoicing.request_status CASCADE;
DROP TYPE IF EXISTS invoicing.document_type CASCADE;

-- Eliminar vistas públicas del schema invoicing anterior
DROP VIEW IF EXISTS public.document_requests CASCADE;
DROP VIEW IF EXISTS public.issued_documents CASCADE;
DROP VIEW IF EXISTS public.emission_config CASCADE;

-- Eliminar trigger en billing.orders
DROP TRIGGER IF EXISTS trigger_order_completed_invoicing ON billing.orders CASCADE;

-- Eliminar schema invoicing (si está vacío)
-- Nota: PostgreSQL no permite DROP SCHEMA si tiene objetos, así que lo dejamos
-- Se eliminará automáticamente cuando no tenga objetos

-- =====================================================
-- ELIMINAR TABLAS DE FACTURACIÓN INTERNA
-- =====================================================

-- Primero eliminar foreign keys que referencian billing.invoices
ALTER TABLE billing.orders DROP CONSTRAINT IF EXISTS orders_invoice_id_fkey;
ALTER TABLE billing.payments DROP CONSTRAINT IF EXISTS payments_invoice_id_fkey;

-- Recrear vistas sin invoice_id (si existen)
DROP VIEW IF EXISTS public.orders CASCADE;
DROP VIEW IF EXISTS public.payments CASCADE;
DROP VIEW IF EXISTS public.invoices CASCADE;
DROP VIEW IF EXISTS public.invoice_line_items CASCADE;

-- Eliminar columnas invoice_id de billing.orders y billing.payments
ALTER TABLE billing.orders DROP COLUMN IF EXISTS invoice_id;
ALTER TABLE billing.payments DROP COLUMN IF EXISTS invoice_id;

-- Eliminar tablas de facturación interna
DROP TABLE IF EXISTS billing.invoice_line_items CASCADE;
DROP TABLE IF EXISTS billing.invoices CASCADE;

-- Recrear vista public.orders sin invoice_id
CREATE OR REPLACE VIEW public.orders AS 
SELECT * FROM billing.orders;

-- Restaurar permisos y configuración de la vista orders
GRANT SELECT, INSERT, UPDATE ON public.orders TO authenticated;
ALTER VIEW public.orders SET (security_invoker = true);

-- Recrear vista public.payments sin invoice_id
CREATE OR REPLACE VIEW public.payments AS 
SELECT * FROM billing.payments;

-- Restaurar permisos y configuración de la vista payments
GRANT SELECT, INSERT, UPDATE ON public.payments TO authenticated;
ALTER VIEW public.payments SET (security_invoker = true);

-- NOTA: Las vistas public.invoices e public.invoice_line_items NO se recrean
-- porque las tablas billing.invoices e billing.invoice_line_items fueron eliminadas

-- Eliminar función de generación de número de factura interna
DROP FUNCTION IF EXISTS billing.generate_invoice_number() CASCADE;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Limpieza completada';
  RAISE NOTICE '';
  RAISE NOTICE 'Eliminado:';
  RAISE NOTICE '  ✅ Schema invoicing anterior (tablas, funciones, tipos)';
  RAISE NOTICE '  ✅ billing.invoices y billing.invoice_line_items';
  RAISE NOTICE '  ✅ Referencias invoice_id en orders y payments';
  RAISE NOTICE '';
  RAISE NOTICE 'Mantenido:';
  RAISE NOTICE '  ✅ billing.orders';
  RAISE NOTICE '  ✅ billing.payments';
  RAISE NOTICE '  ✅ billing.payment_methods';
  RAISE NOTICE '  ✅ billing.tax_rates';
END $$;

