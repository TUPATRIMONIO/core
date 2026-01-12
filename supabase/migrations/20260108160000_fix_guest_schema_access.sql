-- Nueva migración: Otorgar permisos de acceso al schema signing para invitados
-- Fecha: 2026-01-08 16:00:00

-- 1. Otorgar permisos de USAGE a los schemas (CRITICO para que anon pueda acceder)
GRANT USAGE ON SCHEMA signing TO anon, authenticated;
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- 2. Asegurar que el rol anon pueda ver todas las tablas del schema signing
-- (necesario para las vistas que consumen de este schema)
GRANT SELECT ON ALL TABLES IN SCHEMA signing TO anon, authenticated;

-- 3. Asegurar políticas RLS adicionales si no se crearon correctamente
ALTER TABLE signing.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE signing.document_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE signing.country_settings ENABLE ROW LEVEL SECURITY;

-- 4. Permisos SELECT explícitos en vistas públicas por si acaso
GRANT SELECT ON public.signing_products TO anon, authenticated;
GRANT SELECT ON public.signing_document_types TO anon, authenticated;
GRANT SELECT ON public.signing_country_settings TO anon, authenticated;
GRANT SELECT ON public.ai_prompts TO anon, authenticated;



