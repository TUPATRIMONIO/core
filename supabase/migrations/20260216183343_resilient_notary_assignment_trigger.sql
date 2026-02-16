-- =====================================================
-- Migration: Resilient Notary Assignment Trigger
-- Description: Modifica la función del trigger para que la asignación
--              de notaría sea resiliente a errores (ej: no hay notarías)
--              sin revertir la transacción principal de firma.
-- Created: 2026-02-16
-- =====================================================

-- Reemplazamos la función del trigger para capturar excepciones
CREATE OR REPLACE FUNCTION signing.on_document_pending_notary()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Solo ejecutar si el estado cambia a 'pending_notary'
  IF NEW.status = 'pending_notary'
     AND (OLD.status IS NULL OR OLD.status != 'pending_notary') THEN
    
    -- Bloque BEGIN/EXCEPTION para capturar errores de asignación
    BEGIN
      PERFORM signing.assign_document_to_notary_system(NEW.id);
    EXCEPTION WHEN OTHERS THEN
      -- Loguear el error como warning pero permitir que la transacción continúe
      -- Esto asegura que el estado 'signed' del firmante y 'pending_notary' del documento se guarden
      RAISE WARNING 'No se pudo asignar notaria al documento %: %', NEW.id, SQLERRM;
    END;
    
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION signing.on_document_pending_notary IS 
  'Trigger function que intenta asignar notaría automáticamente. Captura errores para no revertir la transacción principal.';

DO $$
BEGIN
  RAISE NOTICE '✅ Función signing.on_document_pending_notary actualizada para ser resiliente';
END $$;
