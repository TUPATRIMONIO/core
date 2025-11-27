-- =====================================================
-- Migration: Add Transbank as payment provider
-- Description: Agrega 'transbank' como provider válido en las tablas de billing
-- Created: 2025-01-01
-- =====================================================

-- Agregar tipos de método de pago para Transbank
ALTER TYPE billing.payment_method_type ADD VALUE IF NOT EXISTS 'transbank_oneclick';

-- Actualizar constraint en payment_methods para incluir 'transbank'
ALTER TABLE billing.payment_methods
  DROP CONSTRAINT IF EXISTS payment_methods_provider_check;

ALTER TABLE billing.payment_methods
  ADD CONSTRAINT payment_methods_provider_check 
  CHECK (provider IN ('stripe', 'dlocal', 'transbank'));

-- Actualizar constraint en payments para incluir 'transbank'
ALTER TABLE billing.payments
  DROP CONSTRAINT IF EXISTS payments_provider_check;

ALTER TABLE billing.payments
  ADD CONSTRAINT payments_provider_check 
  CHECK (provider IN ('stripe', 'dlocal', 'transbank'));

-- Comentarios
COMMENT ON CONSTRAINT payment_methods_provider_check ON billing.payment_methods IS 
  'Permite stripe, dlocal y transbank como proveedores de pago';

COMMENT ON CONSTRAINT payments_provider_check ON billing.payments IS 
  'Permite stripe, dlocal y transbank como proveedores de pago';

