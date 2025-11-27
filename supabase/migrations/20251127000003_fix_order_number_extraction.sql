-- =====================================================
-- Migration: Fix order number extraction in generate_order_number
-- Description: Corrige el cálculo del SUBSTRING para extraer correctamente el número secuencial
-- Created: 2025-11-27
-- =====================================================

SET search_path TO billing, core, public, extensions;

-- =====================================================
-- FIX: generate_order_number function
-- =====================================================

CREATE OR REPLACE FUNCTION billing.generate_order_number(org_id UUID)
RETURNS TEXT AS $$
DECLARE
  org_slug TEXT;
  year_part TEXT;
  seq_num INTEGER;
  order_num TEXT;
  max_attempts INTEGER := 10;
  attempt INTEGER := 0;
  lock_key BIGINT;
BEGIN
  -- Obtener slug de la organización
  SELECT slug INTO org_slug
  FROM core.organizations
  WHERE id = org_id;
  
  IF org_slug IS NULL THEN
    RAISE EXCEPTION 'Organization not found: %', org_id;
  END IF;
  
  -- Convertir slug a formato para número de orden (mayúsculas, sin espacios)
  org_slug := UPPER(REPLACE(org_slug, ' ', '-'));
  
  -- Obtener año actual
  year_part := TO_CHAR(NOW(), 'YYYY');
  
  -- Usar hash del org_id para crear un lock único
  lock_key := hashtext(org_id::TEXT || 'order_number')::BIGINT;
  
  -- Intentar generar número único con lock
  WHILE attempt < max_attempts LOOP
    BEGIN
      -- Adquirir lock exclusivo para esta organización
      PERFORM pg_advisory_xact_lock(lock_key);
      
      -- Obtener siguiente número secuencial para esta organización y año
      -- Formato: {ORG_SLUG}-ORD-{YEAR}-{NUMBER}
      -- Ejemplo: TUPATRIMONIO-ORD-2025-00001
      -- Para extraer el número necesitamos: LENGTH(org_slug) + LENGTH('-ORD-') + LENGTH('2025-') + 1
      -- = LENGTH(org_slug) + 5 + 5 + 1 = LENGTH(org_slug) + 11
      SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM LENGTH(org_slug) + 11) AS INTEGER)), 0) + 1
      INTO seq_num
      FROM billing.orders
      WHERE order_number LIKE org_slug || '-ORD-' || year_part || '-%';
      
      -- Generar número de orden
      order_num := org_slug || '-ORD-' || year_part || '-' || LPAD(seq_num::TEXT, 5, '0');
      
      -- Verificar que no existe (double-check)
      IF NOT EXISTS (SELECT 1 FROM billing.orders WHERE order_number = order_num) THEN
        RETURN order_num;
      END IF;
      
      -- Si existe, incrementar y reintentar
      seq_num := seq_num + 1;
      attempt := attempt + 1;
      
    EXCEPTION WHEN OTHERS THEN
      attempt := attempt + 1;
      IF attempt >= max_attempts THEN
        RAISE EXCEPTION 'Failed to generate unique order number after % attempts', max_attempts;
      END IF;
      -- Esperar un poco antes de reintentar
      PERFORM pg_sleep(0.1 * attempt);
    END;
  END LOOP;
  
  RAISE EXCEPTION 'Failed to generate unique order number after % attempts', max_attempts;
END;
$$ LANGUAGE plpgsql;

-- Actualizar wrapper público
CREATE OR REPLACE FUNCTION public.generate_order_number(org_id UUID)
RETURNS TEXT AS $$
BEGIN
  RETURN billing.generate_order_number(org_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON FUNCTION billing.generate_order_number(UUID) IS
'Genera número de orden único por organización en formato {ORG_SLUG}-ORD-{YEAR}-{NUMBER}. Versión corregida del cálculo de SUBSTRING.';

