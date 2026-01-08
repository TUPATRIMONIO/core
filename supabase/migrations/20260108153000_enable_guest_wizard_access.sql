-- Migración para habilitar el flujo de invitados en el wizard de firma
-- Fecha: 2026-01-08 15:30:00

-- 1. Permitir que cualquier persona vea los productos de firma (necesario para el paso 2)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'signing' AND tablename = 'products' AND policyname = 'Permitir lectura pública de productos de firma'
    ) THEN
        CREATE POLICY "Permitir lectura pública de productos de firma" 
        ON signing.products FOR SELECT 
        TO anon, authenticated 
        USING (is_active = true);
    END IF;
END $$;

-- 2. Permitir que cualquier persona vea los tipos de documentos (necesario para el paso 1)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'signing' AND tablename = 'document_types' AND policyname = 'Permitir lectura pública de tipos de documentos'
    ) THEN
        CREATE POLICY "Permitir lectura pública de tipos de documentos" 
        ON signing.document_types FOR SELECT 
        TO anon, authenticated 
        USING (is_active = true);
    END IF;
END $$;

-- 3. Permitir lectura pública de configuraciones de país (necesario para el paso 1)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'signing' AND tablename = 'country_settings' AND policyname = 'Permitir lectura pública de settings de país'
    ) THEN
        CREATE POLICY "Permitir lectura pública de settings de país" 
        ON signing.country_settings FOR SELECT 
        TO anon, authenticated 
        USING (true);
    END IF;
END $$;

-- 4. Asegurar permisos de lectura para el rol anon en el schema público (o donde estén estas tablas)
-- Nota: En Supabase, anon usualmente ya tiene permisos de SELECT si RLS lo permite, 
-- pero nos aseguramos por si acaso.
GRANT SELECT ON signing.products TO anon;
GRANT SELECT ON signing.document_types TO anon;
GRANT SELECT ON signing.country_settings TO anon;
GRANT SELECT ON ai_prompts TO anon; -- Necesario para verificar disponibilidad de IA

-- 5. Política para AI Prompts (necesario para el paso 1)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'ai_prompts' AND policyname = 'Permitir lectura pública de prompts activos'
    ) THEN
        CREATE POLICY "Permitir lectura pública de prompts activos" 
        ON public.ai_prompts FOR SELECT 
        TO anon, authenticated 
        USING (is_active = true);
    END IF;
END $$;
