-- =====================================================
-- Migration: Update cover-templates policies for global access
-- Description: Allow all authenticated users to read cover templates
--              Restrict upload/manage to service_role
-- Created: 2026-01-06
-- =====================================================

SET search_path TO storage, core, public, extensions;

-- 1. Eliminar políticas antiguas restrictivas por organización
DROP POLICY IF EXISTS "Org members can upload cover templates" ON storage.objects;
DROP POLICY IF EXISTS "Org members can read cover templates" ON storage.objects;

-- 2. Lectura global para usuarios autenticados
-- Esto permite que cualquier usuario vea las portadas disponibles al configurar documentos
CREATE POLICY "Authenticated users can read cover templates"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'cover-templates');

-- 3. Gestión restringida a service_role (administración del sistema)
-- Evita que usuarios finales borren o modifiquen las portadas globales
CREATE POLICY "Service role can manage cover templates"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'cover-templates');

-- 4. Mantener la política de lectura para service_role (Edge Functions)
-- (Ya existía pero nos aseguramos por si acaso)
DROP POLICY IF EXISTS "Service role can read cover templates" ON storage.objects;
CREATE POLICY "Service role can read cover templates"
ON storage.objects FOR SELECT
TO service_role
USING (bucket_id = 'cover-templates');

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Políticas del bucket cover-templates actualizadas a acceso global';
END $$;

