-- =====================================================
-- MIGRACIÓN: Habilitar Realtime para notary_assignments
-- =====================================================
-- Permite que los cambios en asignaciones de notaría
-- se reflejen automáticamente en el dashboard sin necesidad
-- de presionar el botón "Actualizar"
-- =====================================================

-- Habilitar REPLICA IDENTITY FULL para que Realtime pueda
-- enviar los datos completos del registro en eventos UPDATE/DELETE
ALTER TABLE signing.notary_assignments REPLICA IDENTITY FULL;

-- Agregar la tabla a la publicación de Realtime de Supabase
-- (supabase_realtime es la publicación por defecto)
ALTER PUBLICATION supabase_realtime ADD TABLE signing.notary_assignments;

-- Mensaje de éxito
DO $$ 
BEGIN 
  RAISE NOTICE '✅ Realtime habilitado para signing.notary_assignments';
  RAISE NOTICE '';
  RAISE NOTICE 'Ahora los cambios en asignaciones de notaría se actualizarán automáticamente en el dashboard';
END $$;
