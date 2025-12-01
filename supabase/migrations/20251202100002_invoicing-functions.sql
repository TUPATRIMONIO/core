-- =====================================================
-- Migration: Invoicing helper functions
-- Description: Funciones helper para el schema invoicing
-- Created: 2025-12-02
-- =====================================================

SET search_path TO invoicing, billing, credits, core, public, extensions;

-- =====================================================
-- FUNCTION: Determinar tipo de documento según organización
-- =====================================================

CREATE OR REPLACE FUNCTION invoicing.determine_document_type(
  p_organization_id UUID,
  p_country_code TEXT DEFAULT NULL
)
RETURNS invoicing.document_type AS $$
DECLARE
  v_config invoicing.emission_config;
  v_country TEXT;
BEGIN
  -- Obtener configuración de la organización
  SELECT * INTO v_config
  FROM invoicing.emission_config
  WHERE organization_id = p_organization_id;
  
  -- Si no hay configuración, usar país para determinar
  IF v_config IS NULL THEN
    -- Obtener país de la organización
    IF p_country_code IS NULL THEN
      SELECT country INTO v_country
      FROM core.organizations
      WHERE id = p_organization_id;
    ELSE
      v_country := p_country_code;
    END IF;
    
    -- Si es Chile, usar factura electrónica por defecto
    IF v_country = 'CL' THEN
      RETURN 'factura_electronica';
    ELSE
      RETURN 'stripe_invoice';
    END IF;
  END IF;
  
  -- Usar configuración de la organización
  RETURN v_config.default_document_type;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCTION: Determinar proveedor según tipo de documento
-- =====================================================

CREATE OR REPLACE FUNCTION invoicing.determine_provider(
  p_document_type invoicing.document_type
)
RETURNS invoicing.provider_type AS $$
BEGIN
  CASE p_document_type
    WHEN 'factura_electronica', 'boleta_electronica' THEN
      RETURN 'haulmer';
    WHEN 'stripe_invoice' THEN
      RETURN 'stripe';
    ELSE
      RAISE EXCEPTION 'Tipo de documento desconocido: %', p_document_type;
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCTION: Crear solicitud de emisión de documento
-- =====================================================

CREATE OR REPLACE FUNCTION invoicing.create_document_request(
  p_order_id UUID,
  p_invoice_id UUID,
  p_organization_id UUID,
  p_document_type invoicing.document_type DEFAULT NULL,
  p_request_data JSONB DEFAULT '{}'::JSONB
)
RETURNS UUID AS $$
DECLARE
  v_document_type invoicing.document_type;
  v_provider invoicing.provider_type;
  v_config invoicing.emission_config;
  v_request_id UUID;
BEGIN
  -- Determinar tipo de documento si no se proporciona
  IF p_document_type IS NULL THEN
    v_document_type := invoicing.determine_document_type(p_organization_id);
  ELSE
    v_document_type := p_document_type;
  END IF;
  
  -- Determinar proveedor
  v_provider := invoicing.determine_provider(v_document_type);
  
  -- Verificar configuración de la organización
  SELECT * INTO v_config
  FROM invoicing.emission_config
  WHERE organization_id = p_organization_id;
  
  -- Verificar si el proveedor está habilitado
  IF v_config IS NOT NULL THEN
    IF v_provider = 'haulmer' AND NOT v_config.haulmer_enabled THEN
      RAISE EXCEPTION 'Haulmer no está habilitado para esta organización';
    END IF;
    IF v_provider = 'stripe' AND NOT v_config.stripe_enabled THEN
      RAISE EXCEPTION 'Stripe no está habilitado para esta organización';
    END IF;
  END IF;
  
  -- Crear solicitud
  INSERT INTO invoicing.document_requests (
    order_id,
    invoice_id,
    organization_id,
    document_type,
    provider,
    request_data
  ) VALUES (
    p_order_id,
    p_invoice_id,
    p_organization_id,
    v_document_type,
    v_provider,
    p_request_data
  ) RETURNING id INTO v_request_id;
  
  RETURN v_request_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: Marcar solicitud como completada
-- =====================================================

CREATE OR REPLACE FUNCTION invoicing.complete_document_request(
  p_request_id UUID,
  p_external_id TEXT,
  p_pdf_url TEXT DEFAULT NULL,
  p_xml_url TEXT DEFAULT NULL,
  p_provider_response JSONB DEFAULT '{}'::JSONB,
  p_provider_status TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_request invoicing.document_requests;
  v_issued_id UUID;
BEGIN
  -- Obtener solicitud
  SELECT * INTO v_request
  FROM invoicing.document_requests
  WHERE id = p_request_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Solicitud no encontrada: %', p_request_id;
  END IF;
  
  -- Actualizar solicitud como completada
  UPDATE invoicing.document_requests
  SET 
    status = 'completed',
    completed_at = NOW(),
    updated_at = NOW()
  WHERE id = p_request_id;
  
  -- Crear registro de documento emitido
  INSERT INTO invoicing.issued_documents (
    request_id,
    order_id,
    invoice_id,
    organization_id,
    document_type,
    provider,
    external_id,
    pdf_url,
    xml_url,
    provider_response,
    provider_status
  ) VALUES (
    p_request_id,
    v_request.order_id,
    v_request.invoice_id,
    v_request.organization_id,
    v_request.document_type,
    v_request.provider,
    p_external_id,
    p_pdf_url,
    p_xml_url,
    p_provider_response,
    p_provider_status
  ) RETURNING id INTO v_issued_id;
  
  -- Actualizar factura en billing.invoices
  UPDATE billing.invoices
  SET 
    external_provider = v_request.provider::TEXT,
    external_document_id = p_external_id,
    external_pdf_url = p_pdf_url,
    external_xml_url = p_xml_url,
    external_status = p_provider_status,
    updated_at = NOW()
  WHERE id = v_request.invoice_id;
  
  RETURN v_issued_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: Marcar solicitud como fallida
-- =====================================================

CREATE OR REPLACE FUNCTION invoicing.fail_document_request(
  p_request_id UUID,
  p_error_message TEXT
)
RETURNS VOID AS $$
DECLARE
  v_request invoicing.document_requests;
BEGIN
  -- Obtener solicitud
  SELECT * INTO v_request
  FROM invoicing.document_requests
  WHERE id = p_request_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Solicitud no encontrada: %', p_request_id;
  END IF;
  
  -- Incrementar intentos
  UPDATE invoicing.document_requests
  SET 
    attempts = attempts + 1,
    last_error = p_error_message,
    last_error_at = NOW(),
    updated_at = NOW(),
    status = CASE 
      WHEN attempts + 1 >= max_attempts THEN 'failed'
      ELSE 'pending'
    END
  WHERE id = p_request_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: Obtener solicitudes pendientes
-- =====================================================

CREATE OR REPLACE FUNCTION invoicing.get_pending_requests(
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  order_id UUID,
  invoice_id UUID,
  organization_id UUID,
  document_type invoicing.document_type,
  provider invoicing.provider_type,
  attempts INTEGER,
  request_data JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    dr.id,
    dr.order_id,
    dr.invoice_id,
    dr.organization_id,
    dr.document_type,
    dr.provider,
    dr.attempts,
    dr.request_data
  FROM invoicing.document_requests dr
  WHERE dr.status = 'pending'
    AND dr.attempts < dr.max_attempts
  ORDER BY dr.created_at ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- GRANTS
-- =====================================================

GRANT EXECUTE ON FUNCTION invoicing.determine_document_type(UUID, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION invoicing.determine_provider(invoicing.document_type) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION invoicing.create_document_request(UUID, UUID, UUID, invoicing.document_type, JSONB) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION invoicing.complete_document_request(UUID, TEXT, TEXT, TEXT, JSONB, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION invoicing.fail_document_request(UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION invoicing.get_pending_requests(INTEGER) TO service_role;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON FUNCTION invoicing.determine_document_type IS 'Determina el tipo de documento a emitir según la organización';
COMMENT ON FUNCTION invoicing.determine_provider IS 'Determina el proveedor según el tipo de documento';
COMMENT ON FUNCTION invoicing.create_document_request IS 'Crea una nueva solicitud de emisión de documento';
COMMENT ON FUNCTION invoicing.complete_document_request IS 'Marca una solicitud como completada y crea registro en issued_documents';
COMMENT ON FUNCTION invoicing.fail_document_request IS 'Marca una solicitud como fallida e incrementa intentos';
COMMENT ON FUNCTION invoicing.get_pending_requests IS 'Obtiene solicitudes pendientes para procesar';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Funciones helper de invoicing creadas exitosamente';
  RAISE NOTICE '';
  RAISE NOTICE 'Funciones creadas:';
  RAISE NOTICE '  ✅ determine_document_type() - Determina tipo de documento';
  RAISE NOTICE '  ✅ determine_provider() - Determina proveedor';
  RAISE NOTICE '  ✅ create_document_request() - Crea solicitud';
  RAISE NOTICE '  ✅ complete_document_request() - Completa solicitud';
  RAISE NOTICE '  ✅ fail_document_request() - Marca como fallida';
  RAISE NOTICE '  ✅ get_pending_requests() - Obtiene pendientes';
END $$;

