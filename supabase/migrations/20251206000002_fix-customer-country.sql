-- =====================================================
-- Migration: Fix get_or_create_invoicing_customer - add country
-- Description: Agregar parámetro country a la función RPC
-- Created: 2025-12-06
-- =====================================================

SET search_path TO invoicing, billing, credits, core, public, extensions;

-- =====================================================
-- DROP: Eliminar versiones anteriores de la función
-- =====================================================

DROP FUNCTION IF EXISTS public.get_or_create_invoicing_customer(UUID, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.get_or_create_invoicing_customer(UUID, TEXT, TEXT, TEXT, TEXT, TEXT);

-- =====================================================
-- FIX: get_or_create_invoicing_customer - agregar country
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_or_create_invoicing_customer(
  p_organization_id UUID,
  p_name TEXT,
  p_tax_id TEXT DEFAULT NULL,
  p_email TEXT DEFAULT NULL,
  p_customer_type TEXT DEFAULT 'persona_natural',
  p_country TEXT DEFAULT 'CL'  -- Agregar país, default Chile
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_customer_id UUID;
  v_country TEXT;
BEGIN
  -- Usar el país proporcionado o intentar obtenerlo de la organización
  v_country := COALESCE(p_country, 'CL');
  
  -- Buscar cliente existente por tax_id
  SELECT id INTO v_customer_id
  FROM invoicing.customers
  WHERE organization_id = p_organization_id
    AND tax_id = p_tax_id
    AND country = v_country
  LIMIT 1;
  
  -- Si no existe por tax_id, buscar por email
  IF v_customer_id IS NULL AND p_email IS NOT NULL THEN
    SELECT id INTO v_customer_id
    FROM invoicing.customers
    WHERE organization_id = p_organization_id
      AND email = p_email
      AND country = v_country
    LIMIT 1;
  END IF;
  
  -- Si no existe, crear uno nuevo
  IF v_customer_id IS NULL THEN
    INSERT INTO invoicing.customers (
      organization_id,
      customer_type,
      name,
      tax_id,
      email,
      country
    ) VALUES (
      p_organization_id,
      p_customer_type::invoicing.customer_type,
      p_name,
      COALESCE(p_tax_id, 'SIN-RUT'),  -- Usar placeholder si no hay tax_id
      p_email,
      v_country
    )
    RETURNING id INTO v_customer_id;
  END IF;
  
  RETURN v_customer_id;
END;
$$;

-- =====================================================
-- GRANTS
-- =====================================================

GRANT EXECUTE ON FUNCTION public.get_or_create_invoicing_customer(UUID, TEXT, TEXT, TEXT, TEXT, TEXT) TO service_role;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Función get_or_create_invoicing_customer corregida';
  RAISE NOTICE '  - Agregado parámetro p_country con default CL';
  RAISE NOTICE '  - Agregado fallback para tax_id NULL';
END $$;

