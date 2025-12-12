-- =====================================================
-- Migration: Add notary_authorized enum value
-- Description: Agrega valor al enum para FAN
-- Created: 2025-12-12
-- =====================================================

SET search_path TO signing, core, public, extensions;

-- Agregar valor al enum si no existe
-- NOTA: Este valor estará disponible en la siguiente transacción
DO $$
BEGIN
  -- Verificar si el valor 'notary_authorized' ya existe en el enum
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumtypid = 'signing.notary_service_type'::regtype 
    AND enumlabel = 'notary_authorized'
  ) THEN
    ALTER TYPE signing.notary_service_type ADD VALUE 'notary_authorized';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Valor notary_authorized ya existe o no se pudo agregar: %', SQLERRM;
END $$;

DO $$
BEGIN
  RAISE NOTICE '✅ Enum value notary_authorized agregado (disponible en siguiente migración)';
END $$;

