-- =====================================================
-- Migration: Improved cleanup duplicate order history events
-- Description: Elimina eventos duplicados y técnicos más agresivamente
-- Created: 2025-12-01
-- =====================================================

SET search_path TO billing, credits, core, public, extensions;

-- =====================================================
-- 1. ELIMINAR EVENTOS POR DESCRIPCIÓN ESPECÍFICA
-- =====================================================

-- Eliminar eventos con descripciones técnicas o duplicadas
DELETE FROM billing.order_history
WHERE event_description LIKE '%Pago exitoso vía%'
   OR event_description LIKE '%Factura creada%'
   OR event_description LIKE '%Pago iniciado vía%'
   OR event_description LIKE '%Pago iniciado%'
   OR event_description = 'Estado actualizado con información adicional'
   OR (event_description = 'Pedido completado' AND event_type = 'status_changed')
   OR event_description LIKE 'Estado cambiado de%'; -- Eliminar descripciones técnicas antiguas

-- =====================================================
-- 2. DEDUPLICAR EVENTOS POR CAMBIO DE ESTADO
-- =====================================================

-- Si hay múltiples eventos para el mismo cambio de estado (ej: pending_payment -> paid),
-- mantener solo el más reciente
DELETE FROM billing.order_history h1
WHERE h1.event_type = 'status_changed'
AND EXISTS (
  SELECT 1
  FROM billing.order_history h2
  WHERE h2.order_id = h1.order_id
  AND h2.from_status = h1.from_status
  AND h2.to_status = h1.to_status
  AND h2.id != h1.id
  AND h2.created_at > h1.created_at
);

-- =====================================================
-- 3. DEDUPLICAR EVENTOS DE COMPLETADO
-- =====================================================

-- Si hay "Pedido completado" (status_changed) y "Pedido completado exitosamente" (order_completed)
-- para la misma orden, eliminar el de status_changed
DELETE FROM billing.order_history h1
WHERE h1.event_type = 'status_changed'
AND h1.to_status = 'completed'
AND EXISTS (
  SELECT 1
  FROM billing.order_history h2
  WHERE h2.order_id = h1.order_id
  AND h2.event_type = 'order_completed'
  AND h2.event_description = 'Pedido completado exitosamente'
);

-- =====================================================
-- 4. ACTUALIZAR DESCRIPCIONES ANTIGUAS RESTANTES
-- =====================================================

-- Asegurar que todas las descripciones estén en formato amigable
UPDATE billing.order_history
SET event_description = CASE
  WHEN event_type = 'order_created' THEN 'Tu pedido fue creado'
  WHEN event_type = 'status_changed' AND to_status = 'paid' THEN 'Pago confirmado'
  WHEN event_type = 'status_changed' AND to_status = 'completed' THEN 'Pedido completado exitosamente'
  WHEN event_type = 'order_completed' THEN 'Pedido completado exitosamente'
  WHEN event_type = 'status_changed' AND to_status = 'cancelled' THEN 'Pedido cancelado'
  WHEN event_type = 'order_cancelled' THEN 'Pedido cancelado'
  WHEN event_type = 'status_changed' AND to_status = 'refunded' THEN 'Pedido reembolsado'
  WHEN event_type = 'order_refunded' THEN 'Pedido reembolsado'
  ELSE event_description
END
WHERE (
  (event_type = 'order_created' AND event_description != 'Tu pedido fue creado')
  OR (event_type = 'status_changed' AND to_status = 'paid' AND event_description != 'Pago confirmado')
  OR (event_type = 'status_changed' AND to_status = 'completed' AND event_description != 'Pedido completado exitosamente')
  OR (event_type = 'order_completed' AND event_description != 'Pedido completado exitosamente')
  OR (event_type = 'status_changed' AND to_status = 'cancelled' AND event_description != 'Pedido cancelado')
  OR (event_type = 'order_cancelled' AND event_description != 'Pedido cancelado')
  OR (event_type = 'status_changed' AND to_status = 'refunded' AND event_description != 'Pedido reembolsado')
  OR (event_type = 'order_refunded' AND event_description != 'Pedido reembolsado')
);

-- =====================================================
-- COMENTARIOS
-- =====================================================

COMMENT ON TABLE billing.order_history IS 'Historial completo de eventos de órdenes para trazabilidad. Eventos técnicos y duplicados filtrados automáticamente.';

