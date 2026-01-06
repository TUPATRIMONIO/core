-- =====================================================
-- Migration: Disable PostgreSQL AI Review Trigger
-- Description: Desactiva el trigger de base de datos que iniciaba la revisión IA
--             porque ahora se maneja desde Next.js para mayor seguridad (secrets).
-- Created: 2026-01-06
-- =====================================================

-- 1. Eliminar el trigger de la tabla billing.orders
DROP TRIGGER IF EXISTS trigger_internal_review_on_paid ON billing.orders;

-- 2. Mantener la función signing.trigger_internal_review_on_paid() 
-- por si se necesita para llamadas manuales, pero ya no se ejecutará automáticamente.

-- Mensaje de éxito
DO $$ 
BEGIN 
  RAISE NOTICE '✅ Trigger trigger_internal_review_on_paid eliminado de billing.orders';
  RAISE NOTICE '   La revisión IA ahora es disparada por Next.js después del pago.';
END $$;

