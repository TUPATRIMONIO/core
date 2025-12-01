-- =====================================================
-- Migration: Fix determine_provider syntax
-- Description: Corrige la sintaxis del CASE en determine_provider
-- Created: 2025-12-02
-- =====================================================

SET search_path TO invoicing, billing, credits, core, public, extensions;

-- Corregir función determine_provider
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

-- Actualizar wrapper en public también
CREATE OR REPLACE FUNCTION public.determine_provider(
  p_document_type invoicing.document_type
)
RETURNS invoicing.provider_type AS $$
BEGIN
  RETURN invoicing.determine_provider(p_document_type);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Función determine_provider corregida';
END $$;

