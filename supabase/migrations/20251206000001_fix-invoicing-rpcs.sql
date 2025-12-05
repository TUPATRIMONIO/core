-- =====================================================
-- Migration: Fix invoicing RPC functions
-- Description: Corregir cast de enums y default values
-- Created: 2025-12-06
-- =====================================================

SET search_path TO invoicing, billing, credits, core, public, extensions;

-- =====================================================
-- FIX: update_emission_request_status - agregar cast
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_emission_request_status(
  p_request_id UUID,
  p_status TEXT,
  p_attempts INTEGER DEFAULT NULL,
  p_last_error TEXT DEFAULT NULL,
  p_processed_at TIMESTAMPTZ DEFAULT NULL,
  p_completed_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS SETOF public.emission_requests
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE invoicing.emission_requests
  SET 
    status = p_status::invoicing.request_status,  -- Agregar cast explícito
    attempts = COALESCE(p_attempts, attempts),
    last_error = CASE WHEN p_last_error IS NOT NULL THEN p_last_error ELSE last_error END,
    last_error_at = CASE WHEN p_last_error IS NOT NULL THEN NOW() ELSE last_error_at END,
    updated_at = NOW(),
    processed_at = COALESCE(p_processed_at, processed_at),
    completed_at = COALESCE(p_completed_at, completed_at)
  WHERE id = p_request_id;
  
  RETURN QUERY SELECT * FROM public.emission_requests WHERE id = p_request_id;
END;
$$;

-- =====================================================
-- FIX: get_or_create_invoicing_customer - cambiar default
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_or_create_invoicing_customer(
  p_organization_id UUID,
  p_name TEXT,
  p_tax_id TEXT DEFAULT NULL,
  p_email TEXT DEFAULT NULL,
  p_customer_type TEXT DEFAULT 'persona_natural'  -- Cambiado de 'individual'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_customer_id UUID;
BEGIN
  -- Buscar cliente existente por tax_id o email
  SELECT id INTO v_customer_id
  FROM invoicing.customers
  WHERE organization_id = p_organization_id
    AND (
      (p_tax_id IS NOT NULL AND tax_id = p_tax_id)
      OR (p_email IS NOT NULL AND email = p_email)
    )
  LIMIT 1;
  
  -- Si no existe, crear uno nuevo
  IF v_customer_id IS NULL THEN
    INSERT INTO invoicing.customers (
      organization_id,
      customer_type,
      name,
      tax_id,
      email
    ) VALUES (
      p_organization_id,
      p_customer_type::invoicing.customer_type,
      p_name,
      p_tax_id,
      p_email
    )
    RETURNING id INTO v_customer_id;
  END IF;
  
  RETURN v_customer_id;
END;
$$;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Funciones RPC corregidas';
  RAISE NOTICE '  - update_emission_request_status: Agregado cast a invoicing.request_status';
  RAISE NOTICE '  - get_or_create_invoicing_customer: Cambiado default de individual a persona_natural';
END $$;

