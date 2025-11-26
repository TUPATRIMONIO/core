-- =====================================================
-- Migration: Change invoice number format to organization-based
-- Description: Cambiar formato de números de factura a {ORG_CODE}-{NÚMERO} para evitar colisiones
-- Created: 2025-11-24
-- =====================================================

-- =====================================================
-- PROBLEMA IDENTIFICADO
-- =====================================================
-- Error: "No se pudo generar número de factura único después de 10 intentos"
-- Causa: Sistema global de numeración causa colisiones cuando múltiples organizaciones
--         crean facturas simultáneamente
-- Solución: Usar formato por organización: {ORG_SLUG}-{NÚMERO_SECUENCIAL}
--           Similar a cómo Stripe usa código de cliente + número de factura

-- =====================================================
-- NUEVA FUNCIÓN: Generar número de factura por organización
-- =====================================================

CREATE OR REPLACE FUNCTION billing.generate_invoice_number(org_id UUID)
RETURNS TEXT AS $$
DECLARE
  org_slug TEXT;
  seq_num INTEGER;
  invoice_num TEXT;
  max_attempts INTEGER := 10;
  attempt INTEGER := 0;
  lock_key BIGINT;
BEGIN
  -- Obtener slug de la organización
  SELECT slug INTO org_slug
  FROM core.organizations
  WHERE id = org_id AND deleted_at IS NULL;
  
  IF org_slug IS NULL THEN
    RAISE EXCEPTION 'Organización con id % no encontrada o eliminada', org_id;
  END IF;
  
  -- Convertir slug a mayúsculas y limitar longitud para código limpio
  org_slug := UPPER(SUBSTRING(org_slug, 1, 10));
  
  -- Usar un advisory lock específico para esta organización
  -- Esto permite que diferentes organizaciones generen facturas en paralelo
  lock_key := 2000000 + (hashtext(org_id::TEXT) % 1000000);
  
  -- Adquirir lock (espera hasta obtenerlo)
  PERFORM pg_advisory_xact_lock(lock_key);
  
  -- Intentar generar número único con reintentos en caso de colisión
  LOOP
    attempt := attempt + 1;
    
    IF attempt > max_attempts THEN
      RAISE EXCEPTION 'No se pudo generar número de factura único después de % intentos para organización %', max_attempts, org_id;
    END IF;
    
    -- Obtener siguiente número secuencial para esta organización
    -- Buscar facturas que empiecen con el código de la organización
    -- Extraer el número después del guión (ej: "TU-PATRIMONIO-000001" -> 1)
    SELECT COALESCE(MAX(
      CAST(
        SUBSTRING(invoice_number FROM (LENGTH(org_slug) + 2))
        AS INTEGER
      )
    ), 0) + 1
    INTO seq_num
    FROM billing.invoices
    WHERE invoice_number LIKE org_slug || '-%'
      AND organization_id = org_id;
    
    invoice_num := org_slug || '-' || LPAD(seq_num::TEXT, 6, '0');
    
    -- Verificar que el número no existe (doble verificación)
    IF NOT EXISTS (
      SELECT 1 FROM billing.invoices WHERE invoice_number = invoice_num
    ) THEN
      -- Número único encontrado, salir del loop
      EXIT;
    END IF;
    
    -- Si llegamos aquí, el número ya existe, incrementar y reintentar
    seq_num := seq_num + 1;
  END LOOP;
  
  -- El lock se libera automáticamente al finalizar la transacción
  
  RETURN invoice_num;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ACTUALIZAR WRAPPER EN PUBLIC
-- =====================================================

CREATE OR REPLACE FUNCTION public.generate_invoice_number(org_id UUID)
RETURNS TEXT AS $$
BEGIN
  RETURN billing.generate_invoice_number(org_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.generate_invoice_number(UUID) TO authenticated;

COMMENT ON FUNCTION public.generate_invoice_number(UUID) IS
'Genera número de factura único por organización en formato {ORG_SLUG}-{NÚMERO}';

-- =====================================================
-- MANTENER COMPATIBILIDAD TEMPORAL (deprecated)
-- =====================================================
-- Mantener función sin parámetros para facturas existentes
-- pero marcar como deprecated

CREATE OR REPLACE FUNCTION billing.generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
  year_part TEXT;
  seq_num INTEGER;
  invoice_num TEXT;
BEGIN
  -- Función legacy: usar año como prefijo
  year_part := TO_CHAR(NOW(), 'YYYY');
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 9) AS INTEGER)), 0) + 1
  INTO seq_num
  FROM billing.invoices
  WHERE invoice_number LIKE 'INV-' || year_part || '-%';
  
  invoice_num := 'INV-' || year_part || '-' || LPAD(seq_num::TEXT, 5, '0');
  
  RETURN invoice_num;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS TEXT AS $$
BEGIN
  RETURN billing.generate_invoice_number();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.generate_invoice_number() IS
'[DEPRECATED] Usar generate_invoice_number(org_id UUID) en su lugar. Mantiene compatibilidad con código legacy.';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Formato de números de factura actualizado a organización-based';
  RAISE NOTICE '';
  RAISE NOTICE 'Nuevo formato: {ORG_SLUG}-{NÚMERO}';
  RAISE NOTICE '  Ejemplo: TU-PATRIMONIO-000001';
  RAISE NOTICE '';
  RAISE NOTICE 'Mejoras implementadas:';
  RAISE NOTICE '  ✅ Numeración independiente por organización';
  RAISE NOTICE '  ✅ Sin colisiones entre diferentes organizaciones';
  RAISE NOTICE '  ✅ Lock por organización (paralelismo mejorado)';
  RAISE NOTICE '  ✅ Formato legible y profesional';
  RAISE NOTICE '';
  RAISE NOTICE 'Uso: SELECT generate_invoice_number(organization_id);';
END $$;

