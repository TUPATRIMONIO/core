-- =====================================================
-- MIGRACIÓN: Habilitar Realtime para signing.documents
-- =====================================================
-- Permite que los cambios en la revisión de documentos
-- se reflejen automáticamente en el dashboard de admin
-- sin necesidad de recargar la página manualmente
-- =====================================================

-- Habilitar REPLICA IDENTITY FULL para que Realtime pueda
-- enviar los datos completos del registro en eventos UPDATE/DELETE
ALTER TABLE signing.documents REPLICA IDENTITY FULL;

-- Agregar la tabla a la publicación de Realtime de Supabase
-- (supabase_realtime es la publicación por defecto)
ALTER PUBLICATION supabase_realtime ADD TABLE signing.documents;

-- Mensaje de éxito
DO $$ 
BEGIN 
  RAISE NOTICE '✅ Realtime habilitado para signing.documents';
  RAISE NOTICE '';
  RAISE NOTICE 'Ahora los cambios en documentos se actualizarán automáticamente en el dashboard de revisión';
END $$;
