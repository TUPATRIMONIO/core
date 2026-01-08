-- Migración: Corrección final de acceso a catálogos para invitados
-- Descripción: Deshabilitar security_invoker en vistas de catálogo para permitir lectura pública sin depender de RLS complejo en tablas base.
-- Fecha: 2026-01-08 17:30:00

-- 1. Asegurar USAGE en los schemas de servicios para que las vistas puedan acceder
GRANT USAGE ON SCHEMA signing TO anon, authenticated;
GRANT USAGE ON SCHEMA credits TO anon, authenticated;

-- 2. Deshabilitar security_invoker en las vistas de catálogo
-- Esto permite que la vista use los permisos del creador (postgres) para leer las tablas,
-- requiriendo únicamente que el usuario tenga GRANT SELECT sobre la vista.
-- Este es el comportamiento que ya tiene signing_document_types y que funciona correctamente.

ALTER VIEW public.signing_products SET (security_invoker = false);
ALTER VIEW public.signing_country_settings SET (security_invoker = false);
ALTER VIEW public.credit_prices SET (security_invoker = false);

-- 3. Asegurar permisos de SELECT sobre las vistas para los roles públicos
GRANT SELECT ON public.signing_products TO anon, authenticated;
GRANT SELECT ON public.signing_country_settings TO anon, authenticated;
GRANT SELECT ON public.signing_document_types TO anon, authenticated;
GRANT SELECT ON public.credit_prices TO anon, authenticated;
GRANT SELECT ON public.ai_prompts TO anon, authenticated;

-- 4. Notificar éxito
DO $$
BEGIN
  RAISE NOTICE '✅ Acceso de invitado a catálogos corregido mediante desactivación de security_invoker en vistas.';
END $$;

