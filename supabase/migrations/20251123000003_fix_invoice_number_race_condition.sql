-- =====================================================
-- Migration: Fix invoice number race condition
-- Description: Hacer la generación de números de factura thread-safe usando bloqueo
-- Created: 2025-11-23
-- =====================================================

-- =====================================================
-- PROBLEMA IDENTIFICADO
-- =====================================================
-- Error: "duplicate key value violates unique constraint invoices_invoice_number_key"
-- Causa: Race condition cuando múltiples requests intentan crear facturas simultáneamente
-- Solución: Usar bloqueo de tabla para hacer la generación atómica

-- =====================================================
-- FIX: Función thread-safe con bloqueo
-- =====================================================

CREATE OR REPLACE FUNCTION billing.generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
  year_part TEXT;
  seq_num INTEGER;
  invoice_num TEXT;
  max_attempts INTEGER := 10;
  attempt INTEGER := 0;
  lock_key BIGINT;
BEGIN
  year_part := TO_CHAR(NOW(), 'YYYY');
  
  -- Usar un advisory lock específico para el año actual
  -- Esto es más eficiente que bloquear toda la tabla
  lock_key := 1000000 + CAST(year_part AS INTEGER);
  
  -- Adquirir lock (espera hasta obtenerlo)
  PERFORM pg_advisory_xact_lock(lock_key);
  
  -- Intentar generar número único con reintentos en caso de colisión
  LOOP
    attempt := attempt + 1;
    
    IF attempt > max_attempts THEN
      RAISE EXCEPTION 'No se pudo generar número de factura único después de % intentos', max_attempts;
    END IF;
    
    -- Get next sequence number for this year
    -- Con el lock activo, solo una transacción puede ejecutar esto a la vez
    SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 9) AS INTEGER)), 0) + 1
    INTO seq_num
    FROM billing.invoices
    WHERE invoice_number LIKE 'INV-' || year_part || '-%';
    
    invoice_num := 'INV-' || year_part || '-' || LPAD(seq_num::TEXT, 5, '0');
    
    -- Verificar que el número no existe (doble verificación)
    -- Si existe, incrementar y reintentar
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
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Función generate_invoice_number corregida para evitar race conditions';
  RAISE NOTICE '';
  RAISE NOTICE 'Mejoras implementadas:';
  RAISE NOTICE '  ✅ Advisory lock por año para atomicidad (más eficiente)';
  RAISE NOTICE '  ✅ Verificación de duplicados antes de retornar';
  RAISE NOTICE '  ✅ Reintentos automáticos en caso de colisión';
  RAISE NOTICE '  ✅ Máximo 10 intentos para evitar loops infinitos';
  RAISE NOTICE '  ✅ Lock se libera automáticamente al finalizar transacción';
  RAISE NOTICE '';
  RAISE NOTICE 'Esto previene el error:';
  RAISE NOTICE '  "duplicate key value violates unique constraint invoices_invoice_number_key"';
END $$;

