-- =====================================================
-- Migration: Invoicing functions
-- Description: Funciones helper para el schema invoicing
-- Created: 2025-12-02
-- =====================================================

SET search_path TO invoicing, billing, credits, core, public, extensions;

-- =====================================================
-- FUNCTION: Generar número de documento
-- =====================================================

CREATE OR REPLACE FUNCTION invoicing.generate_document_number(
  p_document_type invoicing.document_type,
  p_organization_id UUID DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
  year_part TEXT;
  prefix TEXT;
  seq_num INTEGER;
  doc_num TEXT;
  max_attempts INTEGER := 10;
  attempt INTEGER := 0;
BEGIN
  -- Determinar prefijo según tipo
  CASE p_document_type
    WHEN 'factura_electronica' THEN prefix := 'INV';
    WHEN 'boleta_electronica' THEN prefix := 'BOL';
    WHEN 'stripe_invoice' THEN prefix := 'INV';
    ELSE prefix := 'DOC';
  END CASE;
  
  year_part := TO_CHAR(NOW(), 'YYYY');
  
  -- Generar número secuencial
  WHILE attempt < max_attempts LOOP
    BEGIN
      -- Obtener siguiente número secuencial para este tipo y año
      SELECT COALESCE(MAX(CAST(SUBSTRING(document_number FROM LENGTH(prefix) + 6) AS INTEGER)), 0) + 1
      INTO seq_num
      FROM invoicing.documents
      WHERE document_number LIKE prefix || '-' || year_part || '-%';
      
      -- Generar número de documento
      doc_num := prefix || '-' || year_part || '-' || LPAD(seq_num::TEXT, 5, '0');
      
      -- Verificar que no existe (double-check)
      IF NOT EXISTS (SELECT 1 FROM invoicing.documents WHERE document_number = doc_num) THEN
        RETURN doc_num;
      END IF;
      
      -- Si existe, incrementar y reintentar
      seq_num := seq_num + 1;
      attempt := attempt + 1;
      
    EXCEPTION WHEN OTHERS THEN
      attempt := attempt + 1;
      IF attempt >= max_attempts THEN
        RAISE EXCEPTION 'Failed to generate unique document number after % attempts', max_attempts;
      END IF;
      PERFORM pg_sleep(0.1 * attempt);
    END;
  END LOOP;
  
  RAISE EXCEPTION 'Failed to generate unique document number after % attempts', max_attempts;
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
    WHEN 'factura_electronica' THEN
      RETURN 'haulmer';
    WHEN 'boleta_electronica' THEN
      RETURN 'haulmer';
    WHEN 'stripe_invoice' THEN
      RETURN 'stripe';
    ELSE
      RAISE EXCEPTION 'Tipo de documento desconocido: %', p_document_type;
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- FUNCTION: Determinar tipo de documento según país
-- =====================================================

CREATE OR REPLACE FUNCTION invoicing.determine_document_type_by_country(
  p_country_code TEXT,
  p_organization_id UUID DEFAULT NULL
)
RETURNS invoicing.document_type AS $$
DECLARE
  v_settings invoicing.settings;
BEGIN
  -- Si hay configuración de la organización, usar su default
  IF p_organization_id IS NOT NULL THEN
    SELECT * INTO v_settings
    FROM invoicing.settings
    WHERE organization_id = p_organization_id;
    
    IF v_settings IS NOT NULL THEN
      RETURN v_settings.default_document_type;
    END IF;
  END IF;
  
  -- Si es Chile, usar factura electrónica por defecto
  IF UPPER(p_country_code) = 'CL' THEN
    RETURN 'factura_electronica';
  END IF;
  
  -- Otros países usan Stripe Invoice
  RETURN 'stripe_invoice';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCTION: Validar API Key
-- =====================================================

CREATE OR REPLACE FUNCTION invoicing.validate_api_key(
  p_key_hash TEXT
)
RETURNS TABLE (
  api_key_id UUID,
  organization_id UUID,
  permissions JSONB,
  rate_limit_per_minute INTEGER,
  is_valid BOOLEAN
) AS $$
DECLARE
  v_key invoicing.api_keys;
BEGIN
  -- Buscar API key
  SELECT * INTO v_key
  FROM invoicing.api_keys
  WHERE key_hash = p_key_hash
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > NOW());
  
  IF v_key IS NULL THEN
    RETURN QUERY SELECT NULL::UUID, NULL::UUID, NULL::JSONB, NULL::INTEGER, false::BOOLEAN;
    RETURN;
  END IF;
  
  -- Actualizar último uso
  UPDATE invoicing.api_keys
  SET 
    last_used_at = NOW(),
    usage_count = usage_count + 1,
    updated_at = NOW()
  WHERE id = v_key.id;
  
  -- Retornar datos
  RETURN QUERY SELECT 
    v_key.id,
    v_key.organization_id,
    v_key.permissions,
    v_key.rate_limit_per_minute,
    true::BOOLEAN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: Crear o obtener customer
-- =====================================================

CREATE OR REPLACE FUNCTION invoicing.get_or_create_customer(
  p_organization_id UUID,
  p_tax_id TEXT,
  p_name TEXT,
  p_email TEXT DEFAULT NULL,
  p_address TEXT DEFAULT NULL,
  p_city TEXT DEFAULT NULL,
  p_state TEXT DEFAULT NULL,
  p_postal_code TEXT DEFAULT NULL,
  p_country TEXT DEFAULT 'CL',
  p_customer_type invoicing.customer_type DEFAULT 'empresa',
  p_giro TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_customer_id UUID;
BEGIN
  -- Buscar customer existente
  SELECT id INTO v_customer_id
  FROM invoicing.customers
  WHERE organization_id = p_organization_id
    AND tax_id = p_tax_id
    AND country = UPPER(p_country);
  
  -- Si existe, actualizar datos y retornar
  IF v_customer_id IS NOT NULL THEN
    UPDATE invoicing.customers
    SET 
      name = p_name,
      email = COALESCE(p_email, email),
      address = COALESCE(p_address, address),
      city = COALESCE(p_city, city),
      state = COALESCE(p_state, state),
      postal_code = COALESCE(p_postal_code, postal_code),
      giro = COALESCE(p_giro, giro),
      updated_at = NOW()
    WHERE id = v_customer_id;
    
    RETURN v_customer_id;
  END IF;
  
  -- Crear nuevo customer
  INSERT INTO invoicing.customers (
    organization_id,
    tax_id,
    name,
    email,
    address,
    city,
    state,
    postal_code,
    country,
    customer_type,
    giro
  ) VALUES (
    p_organization_id,
    p_tax_id,
    p_name,
    p_email,
    p_address,
    p_city,
    p_state,
    p_postal_code,
    UPPER(p_country),
    p_customer_type,
    p_giro
  ) RETURNING id INTO v_customer_id;
  
  RETURN v_customer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: Calcular totales de documento
-- =====================================================

CREATE OR REPLACE FUNCTION invoicing.calculate_document_totals(
  p_items JSONB,
  p_country_code TEXT DEFAULT 'CL'
)
RETURNS TABLE (
  subtotal DECIMAL(10,2),
  tax DECIMAL(10,2),
  total DECIMAL(10,2)
) AS $$
DECLARE
  v_item JSONB;
  v_subtotal DECIMAL(10,2) := 0;
  v_tax_rate DECIMAL(5,4);
  v_tax DECIMAL(10,2) := 0;
  v_item_total DECIMAL(10,2);
  v_item_subtotal DECIMAL(10,2);
BEGIN
  -- Obtener tasa de impuesto del país
  SELECT rate INTO v_tax_rate
  FROM billing.tax_rates
  WHERE country_code = UPPER(p_country_code)
    AND is_active = true
  ORDER BY created_at DESC
  LIMIT 1;
  
  v_tax_rate := COALESCE(v_tax_rate, 0.00);
  
  -- Calcular subtotal y tax de cada item
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_item_total := (v_item->>'total')::DECIMAL;
    v_item_subtotal := v_item_total;
    
    -- Si el item no es exento, calcular impuesto
    IF NOT COALESCE((v_item->>'tax_exempt')::BOOLEAN, false) THEN
      v_item_subtotal := ROUND(v_item_total / (1 + v_tax_rate));
      v_tax := v_tax + (v_item_total - v_item_subtotal);
    END IF;
    
    v_subtotal := v_subtotal + v_item_subtotal;
  END LOOP;
  
  RETURN QUERY SELECT 
    ROUND(v_subtotal, 2),
    ROUND(v_tax, 2),
    ROUND(v_subtotal + v_tax, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- FUNCTION: Marcar documento como emitido
-- =====================================================

CREATE OR REPLACE FUNCTION invoicing.mark_document_issued(
  p_document_id UUID,
  p_external_id TEXT,
  p_pdf_url TEXT DEFAULT NULL,
  p_xml_url TEXT DEFAULT NULL,
  p_provider_response JSONB DEFAULT '{}'::JSONB
)
RETURNS VOID AS $$
BEGIN
  UPDATE invoicing.documents
  SET 
    status = 'issued',
    external_id = p_external_id,
    pdf_url = p_pdf_url,
    xml_url = p_xml_url,
    provider_response = p_provider_response,
    issued_at = NOW(),
    updated_at = NOW()
  WHERE id = p_document_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: Marcar documento como fallido
-- =====================================================

CREATE OR REPLACE FUNCTION invoicing.mark_document_failed(
  p_document_id UUID,
  p_error_message TEXT
)
RETURNS VOID AS $$
BEGIN
  UPDATE invoicing.documents
  SET 
    status = 'failed',
    metadata = jsonb_set(COALESCE(metadata, '{}'::JSONB), '{last_error}', to_jsonb(p_error_message)),
    updated_at = NOW()
  WHERE id = p_document_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- GRANTS
-- =====================================================

GRANT EXECUTE ON FUNCTION invoicing.generate_document_number(invoicing.document_type, UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION invoicing.determine_provider(invoicing.document_type) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION invoicing.determine_document_type_by_country(TEXT, UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION invoicing.validate_api_key(TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION invoicing.get_or_create_customer(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, invoicing.customer_type, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION invoicing.calculate_document_totals(JSONB, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION invoicing.mark_document_issued(UUID, TEXT, TEXT, TEXT, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION invoicing.mark_document_failed(UUID, TEXT) TO service_role;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON FUNCTION invoicing.generate_document_number IS 'Genera número único de documento (INV-YYYY-NNNNN, BOL-YYYY-NNNNN)';
COMMENT ON FUNCTION invoicing.determine_provider IS 'Determina el proveedor según el tipo de documento';
COMMENT ON FUNCTION invoicing.determine_document_type_by_country IS 'Determina el tipo de documento según el país';
COMMENT ON FUNCTION invoicing.validate_api_key IS 'Valida una API key y retorna sus permisos';
COMMENT ON FUNCTION invoicing.get_or_create_customer IS 'Obtiene o crea un customer';
COMMENT ON FUNCTION invoicing.calculate_document_totals IS 'Calcula subtotal, tax y total de un documento';
COMMENT ON FUNCTION invoicing.mark_document_issued IS 'Marca un documento como emitido exitosamente';
COMMENT ON FUNCTION invoicing.mark_document_failed IS 'Marca un documento como fallido';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Funciones de invoicing creadas exitosamente';
  RAISE NOTICE '';
  RAISE NOTICE 'Funciones creadas:';
  RAISE NOTICE '  ✅ generate_document_number() - Genera número único';
  RAISE NOTICE '  ✅ determine_provider() - Determina proveedor';
  RAISE NOTICE '  ✅ determine_document_type_by_country() - Determina tipo por país';
  RAISE NOTICE '  ✅ validate_api_key() - Valida API keys';
  RAISE NOTICE '  ✅ get_or_create_customer() - Obtiene o crea customer';
  RAISE NOTICE '  ✅ calculate_document_totals() - Calcula totales';
  RAISE NOTICE '  ✅ mark_document_issued() - Marca como emitido';
  RAISE NOTICE '  ✅ mark_document_failed() - Marca como fallido';
END $$;

