-- =====================================================
-- Migration: Fix generate_order_number function
-- Description: Corrige el uso de hashmac que no existe en PostgreSQL estándar
-- Created: 2025-11-27
-- =====================================================

SET search_path TO billing, credits, core, public, extensions;

-- =====================================================
-- FIX: Reemplazar función generate_order_number
-- =====================================================
-- El problema: hashmac() no existe en PostgreSQL estándar
-- La solución: Usar hashtext() que está disponible en PostgreSQL estándar

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
  -- hashtext está disponible en PostgreSQL estándar y genera un hash entero
  lock_key := hashtext(org_id::TEXT || 'order_number')::BIGINT;
  
  -- Intentar generar número único con lock
  WHILE attempt < max_attempts LOOP
    BEGIN
      -- Adquirir lock exclusivo para esta organización
      PERFORM pg_advisory_xact_lock(lock_key);
      
      -- Obtener siguiente número secuencial para esta organización y año
      SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM LENGTH(org_slug) + 6) AS INTEGER)), 0) + 1
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

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Función generate_order_number corregida exitosamente';
  RAISE NOTICE '';
  RAISE NOTICE 'Cambio aplicado:';
  RAISE NOTICE '  ❌ hashmac() (no existe en PostgreSQL estándar)';
  RAISE NOTICE '  ✅ hashtext() (disponible en PostgreSQL estándar)';
END $$;

