-- =====================================================
-- Migration: CDS Provider Helper Functions
-- Description: Funciones auxiliares para CDS
-- Created: 2025-12-16
-- =====================================================

SET search_path TO signing, core, public, extensions;

-- =====================================================
-- FUNCIÓN: Obtener configuración de CDS por organización
-- =====================================================

CREATE OR REPLACE FUNCTION signing.get_cds_config(p_organization_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_provider RECORD;
  v_config RECORD;
  v_base_url TEXT;
BEGIN
  -- Obtener proveedor CDS
  SELECT * INTO v_provider
  FROM signing.providers
  WHERE slug = 'cds'
    AND is_active = true;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Proveedor CDS no encontrado o inactivo';
  END IF;
  
  -- Obtener configuración de la organización
  SELECT * INTO v_config
  FROM signing.provider_configs
  WHERE organization_id = p_organization_id
    AND provider_id = v_provider.id
    AND is_active = true;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Configuración de CDS no encontrada para organización %', p_organization_id;
  END IF;
  
  -- Determinar URL base según modo de prueba
  v_base_url := CASE 
    WHEN v_config.is_test_mode THEN v_provider.test_url
    ELSE v_provider.base_url
  END;
  
  -- Retornar configuración completa
  RETURN jsonb_build_object(
    'provider_id', v_provider.id,
    'provider_name', v_provider.name,
    'base_url', v_base_url,
    'is_test_mode', v_config.is_test_mode,
    'credentials', v_config.credentials,
    'endpoints', v_provider.endpoints,
    'webhook_url', v_config.webhook_url,
    'webhook_secret', v_config.webhook_secret
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION signing.get_cds_config(UUID) TO authenticated, service_role;

-- =====================================================
-- VISTA: Estado de enrolamiento de firmantes
-- =====================================================

CREATE OR REPLACE VIEW signing.signers_enrollment_status AS
SELECT 
  s.id,
  s.document_id,
  s.user_id,
  s.email,
  s.full_name,
  s.rut,
  s.status,
  s.signing_order,
  s.is_foreigner,
  s.fea_vigente,
  s.fea_fecha_vencimiento,
  s.certificate_blocked,
  s.signing_token,
  s.token_expires_at,
  s.signed_at,
  
  -- Información del documento
  d.title AS document_title,
  d.status AS document_status,
  d.organization_id,
  
  -- Estado de enrolamiento
  CASE 
    WHEN s.is_foreigner THEN 'foreigner'
    WHEN s.status = 'needs_enrollment' THEN 'needs_enrollment'
    WHEN s.status = 'enrolled' AND s.fea_vigente = true THEN 'ready_to_sign'
    WHEN s.status = 'enrolled' AND s.fea_vigente = false THEN 'expired_certificate'
    WHEN s.status = 'certificate_blocked' THEN 'blocked'
    WHEN s.status = 'sf_blocked' THEN 'sf_blocked'
    WHEN s.status = 'signed' THEN 'signed'
    ELSE 'pending'
  END AS enrollment_status,
  
  -- Indicadores
  (s.fea_fecha_vencimiento IS NOT NULL AND s.fea_fecha_vencimiento > NOW()) AS certificate_valid,
  (s.token_expires_at > NOW()) AS token_valid,
  
  -- Puede firmar ahora
  (
    s.status IN ('enrolled', 'pending') 
    AND s.fea_vigente = true 
    AND s.token_expires_at > NOW()
    AND NOT s.certificate_blocked
  ) AS can_sign_now

FROM signing.signers s
JOIN signing.documents d ON d.id = s.document_id
WHERE s.status != 'removed';

GRANT SELECT ON signing.signers_enrollment_status TO authenticated, service_role;

-- =====================================================
-- FUNCIÓN: Verificar si documento está listo para enviar a firma
-- =====================================================

CREATE OR REPLACE FUNCTION signing.is_document_ready_for_signing(p_document_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_doc RECORD;
  v_total_signers INTEGER;
  v_enrolled_signers INTEGER;
  v_needs_enrollment INTEGER;
BEGIN
  -- Obtener documento
  SELECT * INTO v_doc
  FROM signing.documents
  WHERE id = p_document_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'ready', false,
      'reason', 'Documento no encontrado'
    );
  END IF;
  
  -- Validar estado del documento
  IF v_doc.status NOT IN ('draft', 'approved') THEN
    RETURN jsonb_build_object(
      'ready', false,
      'reason', format('El documento debe estar en estado draft o approved. Estado actual: %s', v_doc.status)
    );
  END IF;
  
  -- Contar firmantes
  SELECT COUNT(*) INTO v_total_signers
  FROM signing.signers
  WHERE document_id = p_document_id
    AND status != 'removed';
  
  IF v_total_signers = 0 THEN
    RETURN jsonb_build_object(
      'ready', false,
      'reason', 'El documento debe tener al menos un firmante'
    );
  END IF;
  
  -- Contar firmantes enrolados
  SELECT COUNT(*) INTO v_enrolled_signers
  FROM signing.signers
  WHERE document_id = p_document_id
    AND status = 'enrolled'
    AND fea_vigente = true;
  
  -- Contar firmantes que necesitan enrolamiento
  SELECT COUNT(*) INTO v_needs_enrollment
  FROM signing.signers
  WHERE document_id = p_document_id
    AND status = 'needs_enrollment';
  
  IF v_enrolled_signers = 0 AND v_needs_enrollment > 0 THEN
    RETURN jsonb_build_object(
      'ready', false,
      'reason', 'Todos los firmantes necesitan enrolamiento FEA',
      'total_signers', v_total_signers,
      'enrolled_signers', v_enrolled_signers,
      'needs_enrollment', v_needs_enrollment
    );
  END IF;
  
  RETURN jsonb_build_object(
    'ready', true,
    'total_signers', v_total_signers,
    'enrolled_signers', v_enrolled_signers,
    'needs_enrollment', v_needs_enrollment,
    'message', CASE 
      WHEN v_needs_enrollment > 0 THEN 
        format('%s firmante(s) necesitan enrolamiento antes de poder firmar', v_needs_enrollment)
      ELSE 
        'Documento listo para firma'
    END
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION signing.is_document_ready_for_signing(UUID) TO authenticated, service_role;

-- =====================================================
-- COMENTARIOS
-- =====================================================

COMMENT ON FUNCTION signing.get_cds_config IS 'Obtiene la configuración completa de CDS para una organización';
COMMENT ON VIEW signing.signers_enrollment_status IS 'Vista con estado de enrolamiento FEA de firmantes';
COMMENT ON FUNCTION signing.is_document_ready_for_signing IS 'Verifica si un documento está listo para iniciar proceso de firma';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Funciones auxiliares de CDS creadas exitosamente';
  RAISE NOTICE '';
  RAISE NOTICE 'Funciones creadas:';
  RAISE NOTICE '  - signing.get_cds_config(organization_id)';
  RAISE NOTICE '  - signing.is_document_ready_for_signing(document_id)';
  RAISE NOTICE '';
  RAISE NOTICE 'Vistas creadas:';
  RAISE NOTICE '  - signing.signers_enrollment_status';
END $$;
