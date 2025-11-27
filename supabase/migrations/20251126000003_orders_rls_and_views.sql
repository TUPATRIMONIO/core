-- =====================================================
-- Migration: RLS Policies and Views for orders
-- Description: Políticas de seguridad y vistas públicas para billing.orders
-- Created: 2025-01-01
-- =====================================================

SET search_path TO billing, credits, core, public, extensions;

-- =====================================================
-- ENABLE RLS ON ORDERS TABLE
-- =====================================================

ALTER TABLE billing.orders ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- ORDERS RLS POLICIES
-- =====================================================

-- Orders: SELECT
CREATE POLICY "Users can view own org orders"
ON billing.orders
FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id 
    FROM core.organization_users 
    WHERE user_id = auth.uid() 
    AND status = 'active'
  )
);

-- Orders: INSERT (users can create orders for their org)
CREATE POLICY "Users can create orders for own org"
ON billing.orders
FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id 
    FROM core.organization_users 
    WHERE user_id = auth.uid() 
    AND status = 'active'
  )
);

-- Orders: UPDATE (users can update their own orders, especially status)
CREATE POLICY "Users can update own org orders"
ON billing.orders
FOR UPDATE
USING (
  organization_id IN (
    SELECT organization_id 
    FROM core.organization_users 
    WHERE user_id = auth.uid() 
    AND status = 'active'
  )
)
WITH CHECK (
  organization_id IN (
    SELECT organization_id 
    FROM core.organization_users 
    WHERE user_id = auth.uid() 
    AND status = 'active'
  )
);

-- =====================================================
-- PUBLIC VIEW FOR ORDERS
-- =====================================================

-- Orders view
CREATE OR REPLACE VIEW public.orders AS 
SELECT * FROM billing.orders;

-- =====================================================
-- PERMISSIONS
-- =====================================================

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON public.orders TO authenticated;

-- Grant service role full access (for webhooks and server-side operations)
GRANT ALL ON billing.orders TO service_role;

-- =====================================================
-- RLS ON VIEW
-- =====================================================

-- Habilitar RLS en la vista (hereda políticas de la tabla base)
ALTER VIEW public.orders SET (security_invoker = true);

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Políticas RLS y vistas creadas para billing.orders';
  RAISE NOTICE '';
  RAISE NOTICE 'RLS habilitado en:';
  RAISE NOTICE '  ✅ billing.orders';
  RAISE NOTICE '';
  RAISE NOTICE 'Vista creada:';
  RAISE NOTICE '  ✅ public.orders';
  RAISE NOTICE '';
  RAISE NOTICE 'Permisos otorgados a service_role para webhooks';
END $$;

