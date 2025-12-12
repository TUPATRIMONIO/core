-- =====================================================
-- Migration: signing.signers - add first_name / last_name
-- Description: Separar nombres y apellidos para futuras verificaciones de identidad
-- Created: 2025-12-12
-- =====================================================

SET search_path TO signing, core, public, extensions;

-- Agregar columnas (sin romper compatibilidad con full_name)
ALTER TABLE signing.signers
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS last_name TEXT;

-- Backfill simple desde full_name
-- Regla: si hay espacios, se separa por el último; si no hay, se deja en first_name.
UPDATE signing.signers
SET
  first_name = CASE
    WHEN (first_name IS NULL OR btrim(first_name) = '') THEN
      CASE
        WHEN full_name ~ '\\s' THEN btrim(regexp_replace(full_name, '\\s+\\S+$', ''))
        ELSE btrim(full_name)
      END
    ELSE first_name
  END,
  last_name = CASE
    WHEN (last_name IS NULL OR btrim(last_name) = '') THEN
      CASE
        WHEN full_name ~ '\\s' THEN btrim(substring(full_name from '\\S+$'))
        ELSE NULL
      END
    ELSE last_name
  END
WHERE first_name IS NULL OR last_name IS NULL OR btrim(first_name) = '' OR btrim(last_name) = '';

COMMENT ON COLUMN signing.signers.first_name IS 'Nombres del firmante (para verificación de identidad)';
COMMENT ON COLUMN signing.signers.last_name IS 'Apellidos del firmante (para verificación de identidad)';

DO $$
BEGIN
  RAISE NOTICE '✅ signing.signers actualizado: first_name / last_name';
END $$;

