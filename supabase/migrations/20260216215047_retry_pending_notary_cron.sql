-- =====================================================
-- Migration: Retry Pending Notary Assignments Cron
-- Description: Crea una función para reintentar asignar notaría a documentos
--              en estado 'pending_notary' que no tienen asignación, y programa
--              un cron job para ejecutarla cada 5 minutos.
-- Created: 2026-02-16
-- =====================================================

-- 1. Función para reintentar asignaciones pendientes
CREATE OR REPLACE FUNCTION signing.retry_pending_notary_assignments()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_doc RECORD;
  v_count INTEGER := 0;
BEGIN
  -- Buscar documentos en estado 'pending_notary' que requieren servicio notarial
  -- y que NO tienen un registro en notary_assignments
  FOR v_doc IN
    SELECT d.id
    FROM signing.documents d
    WHERE d.status = 'pending_notary'
      AND d.notary_service != 'none'
      AND NOT EXISTS (
        SELECT 1 FROM signing.notary_assignments na
        WHERE na.document_id = d.id
      )
    ORDER BY d.created_at ASC
  LOOP
    BEGIN
      -- Intentar asignar notaría usando la función del sistema existente
      PERFORM signing.assign_document_to_notary_system(v_doc.id);
      v_count := v_count + 1;
    EXCEPTION WHEN OTHERS THEN
      -- Si falla (ej. no hay notarías disponibles), loguear advertencia y continuar
      RAISE WARNING 'Retry: No se pudo asignar notaría al documento %: %',
        v_doc.id, SQLERRM;
    END;
  END LOOP;

  RETURN v_count;
END;
$$;

COMMENT ON FUNCTION signing.retry_pending_notary_assignments IS 
  'Reintenta asignar notaría a documentos pendientes que no tienen asignación. Retorna cantidad asignada.';

-- 2. Habilitar extensión pg_cron y programar el job
-- Nota: pg_cron debe estar habilitado en el proyecto de Supabase
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- Programar ejecución cada 5 minutos
SELECT cron.schedule(
  'retry-pending-notary-assignments', -- nombre único del job
  '*/5 * * * *',                      -- cron expression (cada 5 min)
  $$SELECT signing.retry_pending_notary_assignments()$$
);

DO $$
BEGIN
  RAISE NOTICE '✅ Función de reintento y cron job configurados correctamente';
END $$;
