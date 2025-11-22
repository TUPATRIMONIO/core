-- =====================================================
-- Migration: Exponer vistas de schemas credits y billing en schema public
-- Description: Crea vistas en public que apuntan a las tablas de credits y billing para facilitar el acceso desde el cliente
-- Created: 2025-11-21
-- =====================================================

-- Las vistas heredan automáticamente las RLS policies de los schemas originales
-- Esto permite acceder a las tablas con .from('credit_accounts') en lugar de .from('credits.credit_accounts')

-- =====================================================
-- VISTAS DE SCHEMA CREDITS
-- =====================================================

-- Credit Accounts
CREATE OR REPLACE VIEW public.credit_accounts AS 
SELECT * FROM credits.credit_accounts;

-- Credit Transactions
CREATE OR REPLACE VIEW public.credit_transactions AS 
SELECT * FROM credits.credit_transactions;

-- Credit Packages
CREATE OR REPLACE VIEW public.credit_packages AS 
SELECT * FROM credits.credit_packages;

-- Credit Prices
CREATE OR REPLACE VIEW public.credit_prices AS 
SELECT * FROM credits.credit_prices;

-- =====================================================
-- VISTAS DE SCHEMA BILLING
-- =====================================================

-- Payment Methods
CREATE OR REPLACE VIEW public.payment_methods AS 
SELECT * FROM billing.payment_methods;

-- Invoices
CREATE OR REPLACE VIEW public.invoices AS 
SELECT * FROM billing.invoices;

-- Invoice Line Items
CREATE OR REPLACE VIEW public.invoice_line_items AS 
SELECT * FROM billing.invoice_line_items;

-- Payments
CREATE OR REPLACE VIEW public.payments AS 
SELECT * FROM billing.payments;

-- Tax Rates
CREATE OR REPLACE VIEW public.tax_rates AS 
SELECT * FROM billing.tax_rates;

-- =====================================================
-- PERMISOS PARA LOS SCHEMAS
-- =====================================================

-- Otorgar USAGE en los schemas credits y billing
GRANT USAGE ON SCHEMA credits TO authenticated;
GRANT USAGE ON SCHEMA billing TO authenticated;

-- =====================================================
-- PERMISOS PARA LAS VISTAS
-- =====================================================

-- Otorgar permisos a authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.credit_accounts TO authenticated;
GRANT SELECT, INSERT ON public.credit_transactions TO authenticated;
GRANT SELECT ON public.credit_packages TO authenticated;
GRANT SELECT ON public.credit_prices TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_methods TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.invoices TO authenticated;
GRANT SELECT, INSERT ON public.invoice_line_items TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.payments TO authenticated;
GRANT SELECT ON public.tax_rates TO authenticated;

-- =====================================================
-- RLS EN VISTAS
-- =====================================================

-- Habilitar RLS en las vistas (heredan políticas de las tablas base)
ALTER VIEW public.credit_accounts SET (security_invoker = true);
ALTER VIEW public.credit_transactions SET (security_invoker = true);
ALTER VIEW public.credit_packages SET (security_invoker = true);
ALTER VIEW public.credit_prices SET (security_invoker = true);

ALTER VIEW public.payment_methods SET (security_invoker = true);
ALTER VIEW public.invoices SET (security_invoker = true);
ALTER VIEW public.invoice_line_items SET (security_invoker = true);
ALTER VIEW public.payments SET (security_invoker = true);
ALTER VIEW public.tax_rates SET (security_invoker = true);

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Vistas de credits y billing creadas en schema public';
  RAISE NOTICE '';
  RAISE NOTICE 'Vistas creadas:';
  RAISE NOTICE '  ✅ credit_accounts';
  RAISE NOTICE '  ✅ credit_transactions';
  RAISE NOTICE '  ✅ credit_packages';
  RAISE NOTICE '  ✅ credit_prices';
  RAISE NOTICE '  ✅ payment_methods';
  RAISE NOTICE '  ✅ invoices';
  RAISE NOTICE '  ✅ invoice_line_items';
  RAISE NOTICE '  ✅ payments';
  RAISE NOTICE '  ✅ tax_rates';
  RAISE NOTICE '';
  RAISE NOTICE 'Las vistas heredan automáticamente las políticas RLS de las tablas base';
END $$;

