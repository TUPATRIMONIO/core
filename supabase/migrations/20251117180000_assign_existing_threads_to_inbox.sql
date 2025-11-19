/**
 * Migración: Asignar Threads Existentes a Carpetas
 * 
 * Asigna todos los threads que no tienen carpeta a:
 * - Inbox (si son recibidos)
 * - Sent (si son enviados)
 * 
 * Fecha: 17 Noviembre 2025
 */

-- Asignar threads a Inbox o Sent según su primer email
INSERT INTO crm.thread_labels (thread_id, folder_id)
SELECT DISTINCT ON (et.id)
  et.id,
  CASE 
    WHEN e.direction = 'outbound' THEN f_sent.id
    ELSE f_inbox.id
  END as folder_id
FROM crm.email_threads et
JOIN crm.emails e ON e.thread_id = et.gmail_thread_id AND e.organization_id = et.organization_id
CROSS JOIN LATERAL (
  SELECT id FROM crm.folders 
  WHERE name = 'Inbox' 
  AND organization_id = et.organization_id 
  LIMIT 1
) f_inbox
CROSS JOIN LATERAL (
  SELECT id FROM crm.folders 
  WHERE name = 'Sent' 
  AND organization_id = et.organization_id 
  LIMIT 1
) f_sent
WHERE NOT EXISTS (
  SELECT 1 FROM crm.thread_labels tl 
  WHERE tl.thread_id = et.id
)
ORDER BY et.id, e.sent_at ASC
ON CONFLICT (thread_id, folder_id) DO NOTHING;

-- Log de resultados
DO $$
DECLARE
  assigned_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO assigned_count FROM crm.thread_labels;
  RAISE NOTICE 'Total thread_labels creados: %', assigned_count;
END $$;

