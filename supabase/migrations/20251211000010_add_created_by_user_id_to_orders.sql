-- =====================================================
-- Migration: Add created_by_user_id to orders
-- Description: Agrega referencia al usuario que creó el pedido
-- Created: 2025-12-12
-- =====================================================

-- Agregar columna created_by_user_id
ALTER TABLE billing.orders 
ADD COLUMN IF NOT EXISTS created_by_user_id UUID REFERENCES core.users(id) ON DELETE SET NULL;

-- Índice para búsquedas rápidas por usuario creador
CREATE INDEX IF NOT EXISTS idx_orders_created_by 
ON billing.orders(created_by_user_id);

COMMENT ON COLUMN billing.orders.created_by_user_id IS 'Usuario que creó el pedido (puede ser distinto al contacto asociado)';
