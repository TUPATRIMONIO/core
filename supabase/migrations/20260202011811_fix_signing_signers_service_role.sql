-- =====================================================
-- Migration: Fix signing_signers view permissions for service_role
-- Description: Agrega permisos completos para service_role en la vista signing_signers
--              y desactiva security_invoker para permitir bypass de RLS
-- Created: 2026-02-02
-- =====================================================

-- 1. Agregar permisos completos para service_role en las vistas
GRANT ALL ON public.signing_signers TO service_role;
GRANT ALL ON public.signing_signers_ordered TO service_role;

-- 2. Para que service_role pueda hacer bypass de RLS a través de la vista,
--    necesitamos crear una regla INSTEAD OF UPDATE o cambiar security_invoker
--    La opción más segura es deshabilitar security_invoker para service_role bypass

-- Opción A: Crear vista separada para service_role sin security_invoker
-- (Esto es más limpio pero requiere cambiar el código)

-- Opción B: Desactivar security_invoker en la vista principal
-- NOTA: Esto significa que las operaciones en la vista usarán el rol del DEFINER (el owner de la vista)
-- que típicamente tiene más permisos. Authenticated users aún estarán limitados por RLS de la tabla base.

-- Por ahora, desactivamos security_invoker para permitir que service_role funcione
ALTER VIEW public.signing_signers SET (security_invoker = false);

-- También agregar permisos directos en la tabla base del schema signing
GRANT ALL ON signing.signers TO service_role;

-- NOTA: service_role ya tiene bypass de RLS por defecto en Supabase
-- No es necesario (ni posible) ejecutar ALTER ROLE en plataformas gestionadas

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Permisos de service_role corregidos para signing_signers';
  RAISE NOTICE '  - GRANT ALL en public.signing_signers';
  RAISE NOTICE '  - GRANT ALL en signing.signers';
  RAISE NOTICE '  - security_invoker = false para permitir bypass de RLS';
END $$;
