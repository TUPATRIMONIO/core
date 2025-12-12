-- =====================================================
-- Migration: Fix signature types display order
-- Description: Ordena firmas: FES, FESB, FES+ClaveÚnica, FEA
-- Created: 2025-12-12
-- =====================================================

SET search_path TO signing, core, public, extensions;

-- Actualizar orden de visualización
-- 1. FES (10)
-- 2. FESB (20)
-- 3. FES + Clave única (30)
-- 4. FEA (40)

UPDATE signing.products
SET display_order = 10, updated_at = NOW()
WHERE slug = 'fes_cl';

UPDATE signing.products
SET display_order = 20, updated_at = NOW()
WHERE slug = 'fesb_cl';

UPDATE signing.products
SET display_order = 30, updated_at = NOW()
WHERE slug = 'fes_claveunica_cl';

UPDATE signing.products
SET display_order = 40, updated_at = NOW()
WHERE slug = 'fea_cl';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Orden de firmas actualizado: FES → FESB → FES+ClaveÚnica → FEA';
END $$;

