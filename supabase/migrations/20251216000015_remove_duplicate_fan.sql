-- =====================================================
-- Migration: Remove duplicate FAN product
-- Description: Desactiva el producto FAN duplicado (notary_authorized_cl)
--              y actualiza el precio del producto original (fan_cl)
-- Created: 2025-12-16
-- =====================================================

SET search_path TO signing, core, public, extensions;

-- =====================================================
-- Desactivar el producto duplicado
-- =====================================================

UPDATE signing.products 
SET is_active = false, updated_at = NOW()
WHERE slug = 'notary_authorized_cl';

-- =====================================================
-- Actualizar el producto original con el precio correcto
-- =====================================================

UPDATE signing.products 
SET 
  base_price = 9990,
  updated_at = NOW()
WHERE slug = 'fan_cl';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Producto FAN duplicado (notary_authorized_cl) desactivado';
  RAISE NOTICE '✅ Producto FAN original (fan_cl) actualizado con precio $9.990';
END $$;
