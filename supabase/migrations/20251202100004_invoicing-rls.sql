-- =====================================================
-- Migration: RLS Policies for invoicing schema
-- Description: Políticas de seguridad para schema invoicing
-- Created: 2025-12-02
-- =====================================================

SET search_path TO invoicing, billing, credits, core, public, extensions;

-- =====================================================
-- ENABLE RLS ON ALL TABLES
-- =====================================================

ALTER TABLE invoicing.emission_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoicing.document_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoicing.issued_documents ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- EMISSION CONFIG POLICIES
-- =====================================================

-- SELECT: Usuarios pueden ver configuración de sus organizaciones
CREATE POLICY "Users can view own org emission config"
ON invoicing.emission_config
FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id 
    FROM core.organization_users 
    WHERE user_id = auth.uid() 
    AND status = 'active'
  )
);

-- INSERT: Usuarios pueden crear configuración para sus organizaciones
CREATE POLICY "Users can create emission config for own org"
ON invoicing.emission_config
FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id 
    FROM core.organization_users 
    WHERE user_id = auth.uid() 
    AND status = 'active'
  )
);

-- UPDATE: Solo owners y billing managers pueden actualizar
CREATE POLICY "Billing managers can update emission config"
ON invoicing.emission_config
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
-- DOCUMENT REQUESTS POLICIES
-- =====================================================

-- SELECT: Usuarios pueden ver solicitudes de sus organizaciones
CREATE POLICY "Users can view own org document requests"
ON invoicing.document_requests
FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id 
    FROM core.organization_users 
    WHERE user_id = auth.uid() 
    AND status = 'active'
  )
);

-- INSERT: Solo sistema puede crear solicitudes (via trigger)
-- No permitimos INSERT directo desde usuarios

-- UPDATE: Solo sistema puede actualizar solicitudes
-- No permitimos UPDATE directo desde usuarios

-- =====================================================
-- ISSUED DOCUMENTS POLICIES
-- =====================================================

-- SELECT: Usuarios pueden ver documentos emitidos de sus organizaciones
CREATE POLICY "Users can view own org issued documents"
ON invoicing.issued_documents
FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id 
    FROM core.organization_users 
    WHERE user_id = auth.uid() 
    AND status = 'active'
  )
);

-- INSERT: Solo sistema puede crear documentos emitidos
-- No permitimos INSERT directo desde usuarios

-- =====================================================
-- SERVICE ROLE BYPASS
-- =====================================================

-- El service_role puede hacer todo (usado por webhooks y funciones)
-- Esto se maneja automáticamente por Supabase, pero lo documentamos aquí

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON POLICY "Users can view own org emission config" ON invoicing.emission_config IS 
'Permite a usuarios ver configuración de emisión de sus organizaciones';

COMMENT ON POLICY "Users can create emission config for own org" ON invoicing.emission_config IS 
'Permite a usuarios crear configuración de emisión para sus organizaciones';

COMMENT ON POLICY "Billing managers can update emission config" ON invoicing.emission_config IS 
'Solo owners y billing managers pueden actualizar configuración';

COMMENT ON POLICY "Users can view own org document requests" ON invoicing.document_requests IS 
'Permite a usuarios ver solicitudes de documentos de sus organizaciones';

COMMENT ON POLICY "Users can view own org issued documents" ON invoicing.issued_documents IS 
'Permite a usuarios ver documentos emitidos de sus organizaciones';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Políticas RLS de invoicing creadas exitosamente';
  RAISE NOTICE '';
  RAISE NOTICE 'Políticas creadas:';
  RAISE NOTICE '  ✅ emission_config - SELECT, INSERT, UPDATE';
  RAISE NOTICE '  ✅ document_requests - SELECT';
  RAISE NOTICE '  ✅ issued_documents - SELECT';
  RAISE NOTICE '';
  RAISE NOTICE 'Nota: INSERT/UPDATE en document_requests e issued_documents';
  RAISE NOTICE 'solo está permitido para service_role (sistema)';
END $$;

