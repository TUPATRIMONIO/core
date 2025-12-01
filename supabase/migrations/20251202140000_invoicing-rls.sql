-- =====================================================
-- Migration: RLS Policies for invoicing schema
-- Description: Políticas de seguridad para schema invoicing
-- Created: 2025-12-02
-- =====================================================

SET search_path TO invoicing, billing, credits, core, public, extensions;

-- =====================================================
-- ENABLE RLS ON ALL TABLES
-- =====================================================

ALTER TABLE invoicing.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoicing.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoicing.document_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoicing.emission_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoicing.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoicing.settings ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- CUSTOMERS POLICIES
-- =====================================================

-- SELECT: Usuarios pueden ver customers de sus organizaciones
CREATE POLICY "Users can view own org customers"
ON invoicing.customers
FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id 
    FROM core.organization_users 
    WHERE user_id = auth.uid() 
    AND status = 'active'
  )
);

-- INSERT: Usuarios pueden crear customers para sus organizaciones
CREATE POLICY "Users can create customers for own org"
ON invoicing.customers
FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id 
    FROM core.organization_users 
    WHERE user_id = auth.uid() 
    AND status = 'active'
  )
);

-- UPDATE: Usuarios pueden actualizar customers de sus organizaciones
CREATE POLICY "Users can update own org customers"
ON invoicing.customers
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
-- DOCUMENTS POLICIES
-- =====================================================

-- SELECT: Usuarios pueden ver documentos de sus organizaciones
CREATE POLICY "Users can view own org documents"
ON invoicing.documents
FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id 
    FROM core.organization_users 
    WHERE user_id = auth.uid() 
    AND status = 'active'
  )
);

-- INSERT: Usuarios pueden crear documentos para sus organizaciones
CREATE POLICY "Users can create documents for own org"
ON invoicing.documents
FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id 
    FROM core.organization_users 
    WHERE user_id = auth.uid() 
    AND status = 'active'
  )
);

-- UPDATE: Solo sistema puede actualizar documentos (via service_role)
-- No permitimos UPDATE directo desde usuarios autenticados

-- =====================================================
-- DOCUMENT ITEMS POLICIES
-- =====================================================

-- SELECT: Usuarios pueden ver items de documentos de sus organizaciones
CREATE POLICY "Users can view own org document items"
ON invoicing.document_items
FOR SELECT
USING (
  document_id IN (
    SELECT id 
    FROM invoicing.documents 
    WHERE organization_id IN (
      SELECT organization_id 
      FROM core.organization_users 
      WHERE user_id = auth.uid() 
      AND status = 'active'
    )
  )
);

-- INSERT: Usuarios pueden crear items para documentos de sus organizaciones
CREATE POLICY "Users can create items for own org documents"
ON invoicing.document_items
FOR INSERT
WITH CHECK (
  document_id IN (
    SELECT id 
    FROM invoicing.documents 
    WHERE organization_id IN (
      SELECT organization_id 
      FROM core.organization_users 
      WHERE user_id = auth.uid() 
      AND status = 'active'
    )
  )
);

-- =====================================================
-- EMISSION REQUESTS POLICIES
-- =====================================================

-- SELECT: Usuarios pueden ver solicitudes de sus organizaciones
CREATE POLICY "Users can view own org emission requests"
ON invoicing.emission_requests
FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id 
    FROM core.organization_users 
    WHERE user_id = auth.uid() 
    AND status = 'active'
  )
);

-- INSERT: Solo sistema puede crear solicitudes
-- No permitimos INSERT directo desde usuarios

-- =====================================================
-- API KEYS POLICIES
-- =====================================================

-- SELECT: Usuarios pueden ver API keys de sus organizaciones (solo metadata, no hash)
CREATE POLICY "Users can view own org api keys"
ON invoicing.api_keys
FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id 
    FROM core.organization_users 
    WHERE user_id = auth.uid() 
    AND status = 'active'
  )
);

-- INSERT: Solo owners y billing managers pueden crear API keys
CREATE POLICY "Billing managers can create api keys"
ON invoicing.api_keys
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

-- UPDATE: Solo owners y billing managers pueden actualizar API keys
CREATE POLICY "Billing managers can update api keys"
ON invoicing.api_keys
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

-- =====================================================
-- SETTINGS POLICIES
-- =====================================================

-- SELECT: Usuarios pueden ver settings de sus organizaciones
CREATE POLICY "Users can view own org settings"
ON invoicing.settings
FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id 
    FROM core.organization_users 
    WHERE user_id = auth.uid() 
    AND status = 'active'
  )
);

-- INSERT: Usuarios pueden crear settings para sus organizaciones
CREATE POLICY "Users can create settings for own org"
ON invoicing.settings
FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id 
    FROM core.organization_users 
    WHERE user_id = auth.uid() 
    AND status = 'active'
  )
);

-- UPDATE: Solo owners y billing managers pueden actualizar settings
CREATE POLICY "Billing managers can update settings"
ON invoicing.settings
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

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON POLICY "Users can view own org customers" ON invoicing.customers IS 
'Permite a usuarios ver customers de sus organizaciones';

COMMENT ON POLICY "Users can create customers for own org" ON invoicing.customers IS 
'Permite a usuarios crear customers para sus organizaciones';

COMMENT ON POLICY "Users can view own org documents" ON invoicing.documents IS 
'Permite a usuarios ver documentos de sus organizaciones';

COMMENT ON POLICY "Users can create documents for own org" ON invoicing.documents IS 
'Permite a usuarios crear documentos para sus organizaciones';

COMMENT ON POLICY "Billing managers can create api keys" ON invoicing.api_keys IS 
'Solo owners y billing managers pueden crear API keys';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Políticas RLS de invoicing creadas exitosamente';
  RAISE NOTICE '';
  RAISE NOTICE 'Políticas creadas:';
  RAISE NOTICE '  ✅ customers - SELECT, INSERT, UPDATE';
  RAISE NOTICE '  ✅ documents - SELECT, INSERT';
  RAISE NOTICE '  ✅ document_items - SELECT, INSERT';
  RAISE NOTICE '  ✅ emission_requests - SELECT';
  RAISE NOTICE '  ✅ api_keys - SELECT, INSERT, UPDATE (solo billing managers)';
  RAISE NOTICE '  ✅ settings - SELECT, INSERT, UPDATE (solo billing managers)';
  RAISE NOTICE '';
  RAISE NOTICE 'Nota: UPDATE en documents solo permitido para service_role (sistema)';
END $$;

