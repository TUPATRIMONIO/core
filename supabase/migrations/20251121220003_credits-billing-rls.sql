-- =====================================================
-- Migration: RLS Policies for credits and billing schemas
-- Description: Políticas de seguridad para schemas credits y billing
-- Created: 2025-11-21
-- =====================================================

SET search_path TO credits, billing, core, public, extensions;

-- =====================================================
-- ENABLE RLS ON ALL TABLES
-- =====================================================

ALTER TABLE credits.credit_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE credits.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE credits.credit_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE credits.credit_prices ENABLE ROW LEVEL SECURITY;

ALTER TABLE billing.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing.invoice_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing.tax_rates ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- CREDITS SCHEMA POLICIES
-- =====================================================

-- Credit Accounts: SELECT
CREATE POLICY "Users can view own org credit accounts"
ON credits.credit_accounts
FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id 
    FROM core.organization_users 
    WHERE user_id = auth.uid() 
    AND status = 'active'
  )
);

-- Credit Accounts: INSERT (auto-create on first use)
CREATE POLICY "Users can create credit account for own org"
ON credits.credit_accounts
FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id 
    FROM core.organization_users 
    WHERE user_id = auth.uid() 
    AND status = 'active'
  )
);

-- Credit Accounts: UPDATE (only billing managers and owners)
CREATE POLICY "Billing managers can update credit accounts"
ON credits.credit_accounts
FOR UPDATE
USING (
  organization_id IN (
    SELECT ou.organization_id 
    FROM core.organization_users ou
    JOIN core.roles r ON r.id = ou.role_id
    WHERE ou.user_id = auth.uid() 
    AND ou.status = 'active'
    AND (
      r.slug = 'owner' 
      OR r.slug = 'billing_manager'
      OR (r.permissions->'billing'->>'manage')::boolean = true
    )
  )
)
WITH CHECK (
  organization_id IN (
    SELECT ou.organization_id 
    FROM core.organization_users ou
    JOIN core.roles r ON r.id = ou.role_id
    WHERE ou.user_id = auth.uid() 
    AND ou.status = 'active'
    AND (
      r.slug = 'owner' 
      OR r.slug = 'billing_manager'
      OR (r.permissions->'billing'->>'manage')::boolean = true
    )
  )
);

-- Credit Transactions: SELECT
CREATE POLICY "Users can view own org credit transactions"
ON credits.credit_transactions
FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id 
    FROM core.organization_users 
    WHERE user_id = auth.uid() 
    AND status = 'active'
  )
);

-- Credit Transactions: INSERT (system can create transactions)
CREATE POLICY "System can create credit transactions"
ON credits.credit_transactions
FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id 
    FROM core.organization_users 
    WHERE user_id = auth.uid() 
    AND status = 'active'
  )
);

-- Credit Packages: SELECT (public, everyone can see packages)
CREATE POLICY "Everyone can view active credit packages"
ON credits.credit_packages
FOR SELECT
USING (is_active = true);

-- Credit Packages: INSERT/UPDATE/DELETE (platform admins only)
CREATE POLICY "Platform admins can manage credit packages"
ON credits.credit_packages
FOR ALL
USING (
  EXISTS (
    SELECT 1 
    FROM core.organization_users ou
    JOIN core.organizations o ON o.id = ou.organization_id
    JOIN core.roles r ON r.id = ou.role_id
    WHERE ou.user_id = auth.uid()
    AND ou.status = 'active'
    AND o.org_type = 'platform'
    AND r.slug = 'platform_super_admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM core.organization_users ou
    JOIN core.organizations o ON o.id = ou.organization_id
    JOIN core.roles r ON r.id = ou.role_id
    WHERE ou.user_id = auth.uid()
    AND ou.status = 'active'
    AND o.org_type = 'platform'
    AND r.slug = 'platform_super_admin'
  )
);

-- Credit Prices: SELECT (public)
CREATE POLICY "Everyone can view credit prices"
ON credits.credit_prices
FOR SELECT
USING (true);

-- Credit Prices: INSERT/UPDATE/DELETE (platform admins only)
CREATE POLICY "Platform admins can manage credit prices"
ON credits.credit_prices
FOR ALL
USING (
  EXISTS (
    SELECT 1 
    FROM core.organization_users ou
    JOIN core.organizations o ON o.id = ou.organization_id
    JOIN core.roles r ON r.id = ou.role_id
    WHERE ou.user_id = auth.uid()
    AND ou.status = 'active'
    AND o.org_type = 'platform'
    AND r.slug = 'platform_super_admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM core.organization_users ou
    JOIN core.organizations o ON o.id = ou.organization_id
    JOIN core.roles r ON r.id = ou.role_id
    WHERE ou.user_id = auth.uid()
    AND ou.status = 'active'
    AND o.org_type = 'platform'
    AND r.slug = 'platform_super_admin'
  )
);

-- =====================================================
-- BILLING SCHEMA POLICIES
-- =====================================================

-- Payment Methods: SELECT
CREATE POLICY "Users can view own org payment methods"
ON billing.payment_methods
FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id 
    FROM core.organization_users 
    WHERE user_id = auth.uid() 
    AND status = 'active'
  )
  AND deleted_at IS NULL
);

-- Payment Methods: INSERT (billing managers and owners)
CREATE POLICY "Billing managers can add payment methods"
ON billing.payment_methods
FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT ou.organization_id 
    FROM core.organization_users ou
    JOIN core.roles r ON r.id = ou.role_id
    WHERE ou.user_id = auth.uid() 
    AND ou.status = 'active'
    AND (
      r.slug = 'owner' 
      OR r.slug = 'billing_manager'
      OR (r.permissions->'billing'->>'manage')::boolean = true
    )
  )
);

-- Payment Methods: UPDATE (billing managers and owners)
CREATE POLICY "Billing managers can update payment methods"
ON billing.payment_methods
FOR UPDATE
USING (
  organization_id IN (
    SELECT ou.organization_id 
    FROM core.organization_users ou
    JOIN core.roles r ON r.id = ou.role_id
    WHERE ou.user_id = auth.uid() 
    AND ou.status = 'active'
    AND (
      r.slug = 'owner' 
      OR r.slug = 'billing_manager'
      OR (r.permissions->'billing'->>'manage')::boolean = true
    )
  )
  AND deleted_at IS NULL
)
WITH CHECK (
  organization_id IN (
    SELECT ou.organization_id 
    FROM core.organization_users ou
    JOIN core.roles r ON r.id = ou.role_id
    WHERE ou.user_id = auth.uid() 
    AND ou.status = 'active'
    AND (
      r.slug = 'owner' 
      OR r.slug = 'billing_manager'
      OR (r.permissions->'billing'->>'manage')::boolean = true
    )
  )
);

-- Payment Methods: DELETE (soft delete, billing managers and owners)
CREATE POLICY "Billing managers can delete payment methods"
ON billing.payment_methods
FOR UPDATE -- Using UPDATE for soft delete
USING (
  organization_id IN (
    SELECT ou.organization_id 
    FROM core.organization_users ou
    JOIN core.roles r ON r.id = ou.role_id
    WHERE ou.user_id = auth.uid() 
    AND ou.status = 'active'
    AND (
      r.slug = 'owner' 
      OR r.slug = 'billing_manager'
      OR (r.permissions->'billing'->>'manage')::boolean = true
    )
  )
  AND deleted_at IS NULL
);

-- Invoices: SELECT
CREATE POLICY "Users can view own org invoices"
ON billing.invoices
FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id 
    FROM core.organization_users 
    WHERE user_id = auth.uid() 
    AND status = 'active'
  )
);

-- Invoices: INSERT (system creates invoices)
CREATE POLICY "System can create invoices"
ON billing.invoices
FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id 
    FROM core.organization_users 
    WHERE user_id = auth.uid() 
    AND status = 'active'
  )
);

-- Invoices: UPDATE (billing managers and owners, or system)
CREATE POLICY "Billing managers can update invoices"
ON billing.invoices
FOR UPDATE
USING (
  organization_id IN (
    SELECT ou.organization_id 
    FROM core.organization_users ou
    JOIN core.roles r ON r.id = ou.role_id
    WHERE ou.user_id = auth.uid() 
    AND ou.status = 'active'
    AND (
      r.slug = 'owner' 
      OR r.slug = 'billing_manager'
      OR (r.permissions->'billing'->>'manage')::boolean = true
    )
  )
);

-- Invoice Line Items: SELECT (through invoice)
CREATE POLICY "Users can view own org invoice line items"
ON billing.invoice_line_items
FOR SELECT
USING (
  invoice_id IN (
    SELECT id 
    FROM billing.invoices 
    WHERE organization_id IN (
      SELECT organization_id 
      FROM core.organization_users 
      WHERE user_id = auth.uid() 
      AND status = 'active'
    )
  )
);

-- Invoice Line Items: INSERT (system creates line items)
CREATE POLICY "System can create invoice line items"
ON billing.invoice_line_items
FOR INSERT
WITH CHECK (
  invoice_id IN (
    SELECT id 
    FROM billing.invoices 
    WHERE organization_id IN (
      SELECT organization_id 
      FROM core.organization_users 
      WHERE user_id = auth.uid() 
      AND status = 'active'
    )
  )
);

-- Payments: SELECT
CREATE POLICY "Users can view own org payments"
ON billing.payments
FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id 
    FROM core.organization_users 
    WHERE user_id = auth.uid() 
    AND status = 'active'
  )
);

-- Payments: INSERT (system creates payments)
CREATE POLICY "System can create payments"
ON billing.payments
FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id 
    FROM core.organization_users 
    WHERE user_id = auth.uid() 
    AND status = 'active'
  )
);

-- Payments: UPDATE (system updates payment status)
CREATE POLICY "System can update payments"
ON billing.payments
FOR UPDATE
USING (
  organization_id IN (
    SELECT organization_id 
    FROM core.organization_users 
    WHERE user_id = auth.uid() 
    AND status = 'active'
  )
);

-- Tax Rates: SELECT (public, everyone can see tax rates)
CREATE POLICY "Everyone can view active tax rates"
ON billing.tax_rates
FOR SELECT
USING (is_active = true);

-- Tax Rates: INSERT/UPDATE/DELETE (platform admins only)
CREATE POLICY "Platform admins can manage tax rates"
ON billing.tax_rates
FOR ALL
USING (
  EXISTS (
    SELECT 1 
    FROM core.organization_users ou
    JOIN core.organizations o ON o.id = ou.organization_id
    JOIN core.roles r ON r.id = ou.role_id
    WHERE ou.user_id = auth.uid()
    AND ou.status = 'active'
    AND o.org_type = 'platform'
    AND r.slug = 'platform_super_admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM core.organization_users ou
    JOIN core.organizations o ON o.id = ou.organization_id
    JOIN core.roles r ON r.id = ou.role_id
    WHERE ou.user_id = auth.uid()
    AND ou.status = 'active'
    AND o.org_type = 'platform'
    AND r.slug = 'platform_super_admin'
  )
);

-- =====================================================
-- GRANT PERMISSIONS TO SERVICE ROLE
-- =====================================================

-- Grant service role full access (for webhooks and server-side operations)
GRANT ALL ON SCHEMA credits TO service_role;
GRANT ALL ON SCHEMA billing TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA credits TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA billing TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA credits TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA billing TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA credits TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA billing TO service_role;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Políticas RLS creadas exitosamente';
  RAISE NOTICE '';
  RAISE NOTICE 'RLS habilitado en:';
  RAISE NOTICE '  ✅ credits.credit_accounts';
  RAISE NOTICE '  ✅ credits.credit_transactions';
  RAISE NOTICE '  ✅ credits.credit_packages';
  RAISE NOTICE '  ✅ credits.credit_prices';
  RAISE NOTICE '  ✅ billing.payment_methods';
  RAISE NOTICE '  ✅ billing.invoices';
  RAISE NOTICE '  ✅ billing.invoice_line_items';
  RAISE NOTICE '  ✅ billing.payments';
  RAISE NOTICE '  ✅ billing.tax_rates';
  RAISE NOTICE '';
  RAISE NOTICE 'Permisos otorgados a service_role para webhooks';
END $$;

