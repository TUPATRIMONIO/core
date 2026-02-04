-- =====================================================
-- Migration: Identity Verifications RLS Policies
-- Description: Políticas de seguridad Row Level Security para el schema identity_verifications
-- Created: 2026-02-04
-- =====================================================

SET search_path TO identity_verifications, core, public, extensions;

-- =====================================================
-- HABILITAR RLS EN TODAS LAS TABLAS
-- =====================================================

ALTER TABLE identity_verifications.providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE identity_verifications.provider_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE identity_verifications.verification_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE identity_verifications.verification_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE identity_verifications.verification_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE identity_verifications.verification_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE identity_verifications.audit_log ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- FUNCIÓN HELPER: Verificar si usuario pertenece a org
-- =====================================================

CREATE OR REPLACE FUNCTION identity_verifications.user_belongs_to_org(p_org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM core.organization_users
    WHERE user_id = auth.uid()
      AND organization_id = p_org_id
      AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- POLÍTICAS: providers (Tabla de referencia pública)
-- =====================================================

-- Todos pueden leer proveedores activos (tabla de referencia)
CREATE POLICY "Anyone can view active providers"
ON identity_verifications.providers
FOR SELECT
USING (is_active = true);

-- Solo platform admins pueden modificar proveedores
CREATE POLICY "Platform admins can manage providers"
ON identity_verifications.providers
FOR ALL
USING (public.is_platform_admin())
WITH CHECK (public.is_platform_admin());

-- =====================================================
-- POLÍTICAS: provider_configs
-- =====================================================

-- Usuarios pueden ver configs de su organización
CREATE POLICY "Users can view own org provider configs"
ON identity_verifications.provider_configs
FOR SELECT
USING (
  identity_verifications.user_belongs_to_org(organization_id)
);

-- Admins de org pueden gestionar configs
CREATE POLICY "Org admins can manage provider configs"
ON identity_verifications.provider_configs
FOR ALL
USING (
  identity_verifications.user_belongs_to_org(organization_id)
  AND public.user_has_role_in_org(organization_id, 'org_admin')
)
WITH CHECK (
  identity_verifications.user_belongs_to_org(organization_id)
  AND public.user_has_role_in_org(organization_id, 'org_admin')
);

-- Platform admins acceso total
CREATE POLICY "Platform admins full access to provider configs"
ON identity_verifications.provider_configs
FOR ALL
USING (public.is_platform_admin())
WITH CHECK (public.is_platform_admin());

-- =====================================================
-- POLÍTICAS: verification_sessions
-- =====================================================

-- Usuarios pueden ver sesiones de su organización
CREATE POLICY "Users can view own org verification sessions"
ON identity_verifications.verification_sessions
FOR SELECT
USING (
  identity_verifications.user_belongs_to_org(organization_id)
);

-- Usuarios pueden crear sesiones para su organización
CREATE POLICY "Users can create verification sessions for own org"
ON identity_verifications.verification_sessions
FOR INSERT
WITH CHECK (
  identity_verifications.user_belongs_to_org(organization_id)
);

-- Usuarios pueden actualizar sesiones de su organización
CREATE POLICY "Users can update own org verification sessions"
ON identity_verifications.verification_sessions
FOR UPDATE
USING (
  identity_verifications.user_belongs_to_org(organization_id)
)
WITH CHECK (
  identity_verifications.user_belongs_to_org(organization_id)
);

-- Platform admins acceso total
CREATE POLICY "Platform admins full access to sessions"
ON identity_verifications.verification_sessions
FOR ALL
USING (public.is_platform_admin())
WITH CHECK (public.is_platform_admin());

-- =====================================================
-- POLÍTICAS: verification_attempts
-- =====================================================

-- Usuarios pueden ver intentos de sesiones de su org
CREATE POLICY "Users can view attempts from own org sessions"
ON identity_verifications.verification_attempts
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM identity_verifications.verification_sessions s
    WHERE s.id = verification_attempts.session_id
      AND identity_verifications.user_belongs_to_org(s.organization_id)
  )
);

-- Sistema puede crear intentos (via service_role)
-- Usuarios autenticados también pueden crear intentos
CREATE POLICY "Authenticated users can create attempts"
ON identity_verifications.verification_attempts
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM identity_verifications.verification_sessions s
    WHERE s.id = verification_attempts.session_id
      AND identity_verifications.user_belongs_to_org(s.organization_id)
  )
);

-- Platform admins acceso total
CREATE POLICY "Platform admins full access to attempts"
ON identity_verifications.verification_attempts
FOR ALL
USING (public.is_platform_admin())
WITH CHECK (public.is_platform_admin());

-- =====================================================
-- POLÍTICAS: verification_documents
-- =====================================================

-- Usuarios pueden ver documentos de sesiones de su org
CREATE POLICY "Users can view documents from own org sessions"
ON identity_verifications.verification_documents
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM identity_verifications.verification_sessions s
    WHERE s.id = verification_documents.session_id
      AND identity_verifications.user_belongs_to_org(s.organization_id)
  )
);

-- Sistema puede crear documentos (via service_role desde webhook)
CREATE POLICY "Service role can create documents"
ON identity_verifications.verification_documents
FOR INSERT
WITH CHECK (true); -- Solo accesible via service_role

-- Platform admins acceso total
CREATE POLICY "Platform admins full access to documents"
ON identity_verifications.verification_documents
FOR ALL
USING (public.is_platform_admin())
WITH CHECK (public.is_platform_admin());

-- =====================================================
-- POLÍTICAS: verification_media
-- =====================================================

-- Usuarios pueden ver media de sesiones de su org
CREATE POLICY "Users can view media from own org sessions"
ON identity_verifications.verification_media
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM identity_verifications.verification_sessions s
    WHERE s.id = verification_media.session_id
      AND identity_verifications.user_belongs_to_org(s.organization_id)
  )
);

-- Sistema puede crear media (via service_role desde webhook)
CREATE POLICY "Service role can create media"
ON identity_verifications.verification_media
FOR INSERT
WITH CHECK (true); -- Solo accesible via service_role

-- Platform admins acceso total
CREATE POLICY "Platform admins full access to media"
ON identity_verifications.verification_media
FOR ALL
USING (public.is_platform_admin())
WITH CHECK (public.is_platform_admin());

-- =====================================================
-- POLÍTICAS: audit_log (Solo lectura para usuarios)
-- =====================================================

-- Usuarios pueden ver audit logs de sesiones de su org
CREATE POLICY "Users can view audit logs from own org sessions"
ON identity_verifications.audit_log
FOR SELECT
USING (
  session_id IS NULL -- Eventos globales visibles
  OR EXISTS (
    SELECT 1
    FROM identity_verifications.verification_sessions s
    WHERE s.id = audit_log.session_id
      AND identity_verifications.user_belongs_to_org(s.organization_id)
  )
);

-- Sistema puede insertar logs (via service_role o triggers)
CREATE POLICY "Service role can create audit logs"
ON identity_verifications.audit_log
FOR INSERT
WITH CHECK (true); -- Solo accesible via service_role o triggers

-- Platform admins pueden ver todo
CREATE POLICY "Platform admins can view all audit logs"
ON identity_verifications.audit_log
FOR SELECT
USING (public.is_platform_admin());

-- NOTA: NO permitir UPDATE ni DELETE en audit_log (inmutable)

-- =====================================================
-- GRANTS
-- =====================================================

-- Revocar acceso público por defecto
REVOKE ALL ON ALL TABLES IN SCHEMA identity_verifications FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA identity_verifications FROM anon;

-- Grants para authenticated
GRANT USAGE ON SCHEMA identity_verifications TO authenticated;
GRANT SELECT ON identity_verifications.providers TO authenticated;
GRANT SELECT, INSERT, UPDATE ON identity_verifications.provider_configs TO authenticated;
GRANT SELECT, INSERT, UPDATE ON identity_verifications.verification_sessions TO authenticated;
GRANT SELECT, INSERT ON identity_verifications.verification_attempts TO authenticated;
GRANT SELECT ON identity_verifications.verification_documents TO authenticated;
GRANT SELECT ON identity_verifications.verification_media TO authenticated;
GRANT SELECT ON identity_verifications.audit_log TO authenticated;

-- Grants para service_role (acceso total, bypass RLS)
GRANT ALL ON ALL TABLES IN SCHEMA identity_verifications TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA identity_verifications TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA identity_verifications TO service_role;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON POLICY "Anyone can view active providers" ON identity_verifications.providers IS 
  'Proveedores activos son visibles para todos (tabla de referencia)';

COMMENT ON POLICY "Users can view own org verification sessions" ON identity_verifications.verification_sessions IS 
  'Usuarios solo ven sesiones de su propia organización';

COMMENT ON POLICY "Service role can create audit logs" ON identity_verifications.audit_log IS 
  'Audit log es inmutable, solo inserción desde sistema';

-- Success message
DO $$ 
BEGIN 
  RAISE NOTICE '✅ Políticas RLS aplicadas exitosamente';
  RAISE NOTICE '';
  RAISE NOTICE 'Tablas protegidas:';
  RAISE NOTICE '  - identity_verifications.providers (público lectura)';
  RAISE NOTICE '  - identity_verifications.provider_configs (por org)';
  RAISE NOTICE '  - identity_verifications.verification_sessions (por org)';
  RAISE NOTICE '  - identity_verifications.verification_attempts (por org)';
  RAISE NOTICE '  - identity_verifications.verification_documents (por org)';
  RAISE NOTICE '  - identity_verifications.verification_media (por org)';
  RAISE NOTICE '  - identity_verifications.audit_log (inmutable, solo lectura)';
END $$;
