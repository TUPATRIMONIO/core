-- =====================================================
-- Migration: Change order numbers to consecutive format
-- Description: Cambia los números de orden a formato consecutivo simple empezando desde #200.000
-- Created: 2025-11-28
-- =====================================================

SET search_path TO billing, core, public, extensions;

-- =====================================================
-- CREATE SEQUENCE FOR ORDER NUMBERS
-- =====================================================

-- Crear secuencia para números de orden consecutivos
-- Empieza en 200000 como solicitado
CREATE SEQUENCE IF NOT EXISTS billing.order_number_seq
  START WITH 200000
  INCREMENT BY 1
  NO MINVALUE
  NO MAXVALUE
  CACHE 1;

-- Si ya existen órdenes con números numéricos, ajustar la secuencia
-- para que continúe desde el máximo existente + 1 (pero mínimo 200000)
DO $$
DECLARE
  max_existing_num BIGINT;
BEGIN
  -- Intentar extraer el número máximo de órdenes existentes
  -- Busca números que sean puramente numéricos (nuevo formato) o que puedan convertirse
  SELECT COALESCE(
    MAX(
      CASE 
        -- Si es un número puro, usarlo directamente
        WHEN order_number ~ '^[0-9]+$' THEN order_number::BIGINT
        -- Si no, intentar extraer números del formato antiguo o usar 0
        ELSE 0
      END
    ),
    0
  ) INTO max_existing_num
  FROM billing.orders;
  
  -- Si hay números mayores a 200000, ajustar la secuencia
  IF max_existing_num >= 200000 THEN
    PERFORM setval('billing.order_number_seq', max_existing_num + 1, false);
  END IF;
END $$;

-- Otorgar permisos para usar la secuencia
GRANT USAGE ON SEQUENCE billing.order_number_seq TO authenticated;
GRANT USAGE ON SEQUENCE billing.order_number_seq TO service_role;

COMMENT ON SEQUENCE billing.order_number_seq IS
'Secuencia para generar números de orden consecutivos. Empieza en 200000.';

-- =====================================================
-- UPDATE: generate_order_number function
-- =====================================================

-- Nueva función simplificada que genera números consecutivos
CREATE OR REPLACE FUNCTION billing.generate_order_number(org_id UUID)
RETURNS TEXT AS $$
DECLARE
  next_num BIGINT;
  order_num TEXT;
BEGIN
  -- Validar que la organización existe (mantener validación)
  IF NOT EXISTS (SELECT 1 FROM core.organizations WHERE id = org_id) THEN
    RAISE EXCEPTION 'Organization not found: %', org_id;
  END IF;
  
  -- Obtener siguiente número de la secuencia
  -- Usamos nextval que es thread-safe y garantiza números únicos consecutivos
  next_num := nextval('billing.order_number_seq');
  
  -- Convertir a texto (formato simple: solo el número)
  order_num := next_num::TEXT;
  
  RETURN order_num;
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
-- UPDATE COMMENTS
-- =====================================================

COMMENT ON FUNCTION billing.generate_order_number(UUID) IS
'Genera número de orden consecutivo único empezando desde 200000. Formato: número simple (ej: 200000, 200001, etc.)';

COMMENT ON COLUMN billing.orders.order_number IS 
'Número único de orden consecutivo empezando desde 200000. Formato: número simple (ej: 200000, 200001, etc.)';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Sistema de números de orden actualizado exitosamente';
  RAISE NOTICE '';
  RAISE NOTICE 'Cambios aplicados:';
  RAISE NOTICE '  ❌ Formato anterior: {ORG_SLUG}-ORD-{YEAR}-{NUMBER} (ej: TUPATRIMONIO-ORD-2025-00001)';
  RAISE NOTICE '  ✅ Formato nuevo: Número consecutivo simple (ej: 200000, 200001, 200002)';
  RAISE NOTICE '';
  RAISE NOTICE '  📊 Secuencia creada: billing.order_number_seq';
  RAISE NOTICE '  🎯 Número inicial: 200000';
  RAISE NOTICE '';
  RAISE NOTICE '  ℹ️  Los códigos largos se mantienen solo para facturas (invoices)';
END $$;

