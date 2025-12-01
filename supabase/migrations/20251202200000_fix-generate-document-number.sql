-- =====================================================
-- Migration: Fix generate_document_number function
-- Description: Simplifica la generación de número interno de tracking
-- Created: 2025-12-02
-- 
-- NOTA: Este document_number es solo un identificador INTERNO de tracking.
-- El número REAL del documento tributario viene del proveedor externo:
--   - Haulmer: devuelve el FOLIO en la respuesta
--   - Stripe: genera el invoice_number automáticamente
-- El número real se guarda en el campo external_id
-- =====================================================

SET search_path TO invoicing, billing, credits, core, public, extensions;

-- Recrear función con lógica simplificada
-- Genera un número de tracking interno único basado en timestamp
CREATE OR REPLACE FUNCTION invoicing.generate_document_number(
  p_document_type invoicing.document_type,
  p_organization_id UUID DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
  prefix TEXT;
  year_part TEXT;
  random_part TEXT;
  random_num INTEGER;
BEGIN
  -- Determinar prefijo según tipo
  CASE p_document_type
    WHEN 'factura_electronica' THEN prefix := 'FAC';
    WHEN 'boleta_electronica' THEN prefix := 'BOL';
    WHEN 'stripe_invoice' THEN prefix := 'STR';
    ELSE prefix := 'DOC';
  END CASE;
  
  year_part := TO_CHAR(NOW(), 'YYYYMMDD');
  
  -- Generar parte aleatoria única (timestamp en microsegundos + random)
  random_num := (EXTRACT(EPOCH FROM NOW()) * 1000000)::BIGINT % 1000000 + FLOOR(RANDOM() * 1000)::INTEGER;
  random_part := LPAD(random_num::TEXT, 9, '0');
  
  -- Formato: FAC-20251201-000123456
  RETURN prefix || '-' || year_part || '-' || random_part;
END;
$$ LANGUAGE plpgsql;

-- También actualizar el wrapper en public
CREATE OR REPLACE FUNCTION public.generate_document_number(
  p_document_type invoicing.document_type,
  p_organization_id UUID
)
RETURNS TEXT AS $$
BEGIN
  RETURN invoicing.generate_document_number(p_document_type, p_organization_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grants
GRANT EXECUTE ON FUNCTION invoicing.generate_document_number(invoicing.document_type, UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.generate_document_number(invoicing.document_type, UUID) TO authenticated, service_role;

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Función generate_document_number corregida';
END $$;

