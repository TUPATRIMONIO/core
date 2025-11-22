-- =====================================================
-- Migration: Grant permissions to authenticated users on credits and billing tables
-- Description: Otorga permisos necesarios para que las vistas funcionen correctamente
-- Created: 2025-11-21
-- =====================================================

-- =====================================================
-- GRANT PERMISSIONS TO authenticated FOR TABLE ACCESS
-- =====================================================

-- Otorgar permisos en las tablas base del schema credits
GRANT SELECT, INSERT, UPDATE, DELETE ON credits.credit_accounts TO authenticated;
GRANT SELECT, INSERT ON credits.credit_transactions TO authenticated;
GRANT SELECT ON credits.credit_packages TO authenticated;
GRANT SELECT ON credits.credit_prices TO authenticated;

-- Otorgar permisos en las tablas base del schema billing
GRANT SELECT, INSERT, UPDATE, DELETE ON billing.payment_methods TO authenticated;
GRANT SELECT, INSERT, UPDATE ON billing.invoices TO authenticated;
GRANT SELECT, INSERT ON billing.invoice_line_items TO authenticated;
GRANT SELECT, INSERT, UPDATE ON billing.payments TO authenticated;
GRANT SELECT ON billing.tax_rates TO authenticated;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Permisos GRANT otorgados en tablas base de credits y billing';
  RAISE NOTICE '';
  RAISE NOTICE 'Permisos otorgados a authenticated:';
  RAISE NOTICE '  ✅ credits.credit_accounts - SELECT, INSERT, UPDATE, DELETE';
  RAISE NOTICE '  ✅ credits.credit_transactions - SELECT, INSERT';
  RAISE NOTICE '  ✅ credits.credit_packages - SELECT';
  RAISE NOTICE '  ✅ credits.credit_prices - SELECT';
  RAISE NOTICE '  ✅ billing.payment_methods - SELECT, INSERT, UPDATE, DELETE';
  RAISE NOTICE '  ✅ billing.invoices - SELECT, INSERT, UPDATE';
  RAISE NOTICE '  ✅ billing.invoice_line_items - SELECT, INSERT';
  RAISE NOTICE '  ✅ billing.payments - SELECT, INSERT, UPDATE';
  RAISE NOTICE '  ✅ billing.tax_rates - SELECT';
  RAISE NOTICE '';
  RAISE NOTICE 'Las vistas en public ahora funcionarán correctamente';
  RAISE NOTICE 'Las políticas RLS siguen controlando el acceso a nivel de fila';
END $$;

