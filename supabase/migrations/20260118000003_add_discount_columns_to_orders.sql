-- =====================================================
-- Migration: Add discount columns to orders
-- Description: Adds discount tracking columns to billing.orders
-- Created: 2026-01-18
-- =====================================================

-- Agregar columna para referencia al código de descuento
ALTER TABLE billing.orders
ADD COLUMN IF NOT EXISTS discount_code_id UUID;

-- Agregar columna para el monto del descuento aplicado
ALTER TABLE billing.orders
ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2) DEFAULT 0;

-- Agregar columna para guardar el monto original antes del descuento
ALTER TABLE billing.orders
ADD COLUMN IF NOT EXISTS original_amount DECIMAL(10,2);

-- Crear índice para búsquedas por código de descuento
CREATE INDEX IF NOT EXISTS idx_orders_discount_code ON billing.orders(discount_code_id);

-- Comentarios para documentación
COMMENT ON COLUMN billing.orders.discount_code_id IS 'Referencia al código de descuento aplicado';
COMMENT ON COLUMN billing.orders.discount_amount IS 'Monto del descuento aplicado a la orden';
COMMENT ON COLUMN billing.orders.original_amount IS 'Monto original de la orden antes del descuento';
