-- =====================================================
-- Migration: Cleanup duplicate order history events
-- Description: Elimina eventos duplicados y técnicos del historial
-- Created: 2025-12-01
-- =====================================================

SET search_path TO billing, credits, core, public, extensions;

-- Eliminar eventos duplicados de "Estado actualizado con información adicional"
-- que ocurrieron al mismo tiempo (dentro de 2 segundos) que un cambio de estado
DELETE FROM billing.order_history
WHERE event_description = 'Estado actualizado con información adicional'
AND EXISTS (
  SELECT 1 
  FROM billing.order_history h2
  WHERE h2.order_id = order_history.order_id
  AND h2.event_type = 'status_changed'
  AND h2.id != order_history.id
  AND ABS(EXTRACT(EPOCH FROM (h2.created_at - order_history.created_at))) < 2
);

-- Eliminar eventos técnicos que no deberían estar visibles para el cliente
-- (solo si existen eventos más relevantes para la misma orden)
DELETE FROM billing.order_history
WHERE event_type IN ('invoice_created', 'payment_initiated', 'order_modified')
AND EXISTS (
  SELECT 1 
  FROM billing.order_history h2
  WHERE h2.order_id = order_history.order_id
  AND h2.event_type IN ('order_created', 'status_changed', 'payment_succeeded', 'order_completed', 'order_cancelled')
);

-- Actualizar descripciones antiguas que aún tienen formato técnico
-- a descripciones amigables (por si acaso hay eventos antiguos)
UPDATE billing.order_history
SET event_description = CASE
  WHEN event_description LIKE 'Estado cambiado de pending_payment a paid' THEN 'Pago confirmado'
  WHEN event_description LIKE 'Estado cambiado de paid a completed' THEN 'Pedido completado exitosamente'
  WHEN event_description LIKE 'Estado cambiado de % a cancelled' THEN 'Pedido cancelado'
  WHEN event_description LIKE 'Estado cambiado de % a refunded' THEN 'Pedido reembolsado'
  WHEN event_description LIKE 'Orden creada:%' THEN 'Tu pedido fue creado'
  WHEN event_description LIKE 'Orden expirada%' THEN 'Pedido cancelado'
  ELSE event_description
END
WHERE event_description LIKE 'Estado cambiado de%'
   OR event_description LIKE 'Orden creada:%'
   OR event_description LIKE 'Orden expirada%';

-- Comentario sobre la limpieza
COMMENT ON TABLE billing.order_history IS 'Historial completo de eventos de órdenes para trazabilidad. Eventos técnicos filtrados automáticamente.';

