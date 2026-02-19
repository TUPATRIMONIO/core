-- =====================================================
-- Migration: Add storage policies for identity-verifications
-- Description: Permitir que service_role (backend) suba y lea archivos
--              en el bucket identity-verifications para el respaldo automático
-- Created: 2026-02-19
-- =====================================================

-- Eliminar políticas si ya existen para evitar conflictos
DROP POLICY IF EXISTS "Service role can upload verification media" ON storage.objects;
DROP POLICY IF EXISTS "Service role can read verification media" ON storage.objects;

-- 1. Política para permitir INSERT (subida) por service_role
CREATE POLICY "Service role can upload verification media"
ON storage.objects FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'identity-verifications');

-- 2. Política para permitir SELECT (lectura) por service_role
CREATE POLICY "Service role can read verification media"
ON storage.objects FOR SELECT
TO service_role
USING (bucket_id = 'identity-verifications');
