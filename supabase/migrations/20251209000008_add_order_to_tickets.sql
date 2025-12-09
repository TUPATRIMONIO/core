-- =====================================================
-- Migration: Add order_id to tickets
-- Description: Agrega relación directa entre tickets y pedidos (orders)
-- Created: 2025-12-10
-- =====================================================

SET search_path TO crm, billing, core, public, extensions;

-- Agregar columna order_id a tickets
ALTER TABLE crm.tickets 
  ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES billing.orders(id) ON DELETE SET NULL;

-- Crear índice para búsquedas eficientes
CREATE INDEX IF NOT EXISTS idx_tickets_order ON crm.tickets(order_id) WHERE order_id IS NOT NULL;

-- Comentario descriptivo
COMMENT ON COLUMN crm.tickets.order_id IS 'Pedido (order) asociado directamente con este ticket. Permite vincular tickets con pedidos para seguimiento completo.';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Columna order_id agregada a crm.tickets exitosamente';
  RAISE NOTICE 'Los tickets ahora pueden vincularse directamente con pedidos';
END $$;

