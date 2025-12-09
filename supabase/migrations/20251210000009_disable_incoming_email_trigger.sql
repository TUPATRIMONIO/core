/**
 * Migración: Desactivar Trigger Duplicador de Tickets
 * 
 * Problema:
 * El trigger `trigger_handle_incoming_email` estaba creando tickets duplicados
 * porque actuaba en paralelo con la lógica de TypeScript.
 * 
 * Solución:
 * Desactivar el trigger y dejar que TypeScript maneje la creación de tickets.
 * 
 * Fecha: 10 Diciembre 2025
 */

SET search_path TO crm, core, public, extensions;

-- =====================================================
-- DESACTIVAR TRIGGER
-- =====================================================

DROP TRIGGER IF EXISTS trigger_handle_incoming_email ON crm.emails;

-- Opcional: Eliminar la función asociada si ya no se usa en otro lado
-- DROP FUNCTION IF EXISTS crm.handle_incoming_email();

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Trigger trigger_handle_incoming_email eliminado';
  RAISE NOTICE '✅ La creación de tickets ahora es manejada exclusivamente por la API';
END $$;

