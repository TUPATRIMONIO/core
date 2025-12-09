-- =====================================================
-- Migration: Cleanup duplicate tickets by gmail thread
-- Description: Elimina tickets duplicados basándose en thread_id de Gmail
-- Created: 2025-12-10
-- =====================================================

SET search_path TO crm, core, public, extensions;

-- =====================================================
-- PASO 1: Para cada gmail thread_id, mantener solo un ticket
-- =====================================================

-- Encontrar el primer ticket para cada thread (el más antiguo)
CREATE TEMP TABLE first_ticket_per_thread AS
SELECT DISTINCT ON (thread_id)
  thread_id,
  ticket_id as keep_ticket_id
FROM crm.emails
WHERE thread_id IS NOT NULL
  AND ticket_id IS NOT NULL
ORDER BY thread_id, created_at ASC;

-- Mover todos los emails de un thread al ticket correcto
UPDATE crm.emails e
SET ticket_id = fpt.keep_ticket_id
FROM first_ticket_per_thread fpt
WHERE e.thread_id = fpt.thread_id
  AND e.ticket_id != fpt.keep_ticket_id;

-- Eliminar actividades de tickets que ya no tienen emails
DELETE FROM crm.activities a
WHERE a.ticket_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM crm.emails e WHERE e.ticket_id = a.ticket_id
  );

-- Eliminar tickets que ya no tienen emails asociados
DELETE FROM crm.tickets t
WHERE NOT EXISTS (
  SELECT 1 FROM crm.emails e WHERE e.ticket_id = t.id
);

DROP TABLE first_ticket_per_thread;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
DECLARE
  tickets_remaining INT;
BEGIN 
  SELECT COUNT(*) INTO tickets_remaining FROM crm.tickets;
  RAISE NOTICE '✅ Limpieza completada. Tickets restantes: %', tickets_remaining;
END $$;
