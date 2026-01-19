-- =====================================================
-- Migration: Refresh orders view
-- Description: Recreate public.orders view to include discount columns
-- Created: 2026-01-18
-- =====================================================

-- Recrear la vista pública de orders para incluir las nuevas columnas
DROP VIEW IF EXISTS public.orders;

CREATE VIEW public.orders AS
SELECT * FROM billing.orders;

ALTER VIEW public.orders SET (security_invoker = true);

-- Otorgar permisos
GRANT SELECT ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
