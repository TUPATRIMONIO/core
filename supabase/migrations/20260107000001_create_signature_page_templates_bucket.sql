-- =====================================================
-- Migration: Create signature-page-templates bucket
-- Description: Bucket for signature page templates
-- Created: 2026-01-07
-- =====================================================

-- =====================================================
-- BUCKET: signature-page-templates
-- =====================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'signature-page-templates',
  'signature-page-templates',
  false, -- Privado por defecto, accesible vía service role o políticas
  10485760, -- 10MB max
  ARRAY['application/pdf']
) ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- POLICIES: signature-page-templates
-- =====================================================

-- Permitir lectura a usuarios autenticados
DROP POLICY IF EXISTS "Authenticated users can view signature templates" ON storage.objects;
CREATE POLICY "Authenticated users can view signature templates"
ON storage.objects FOR SELECT
USING (bucket_id = 'signature-page-templates' AND auth.role() = 'authenticated');

-- Permitir gestión total al service role (Edge Functions)
DROP POLICY IF EXISTS "Service role can manage signature templates" ON storage.objects;
CREATE POLICY "Service role can manage signature templates"
ON storage.objects FOR ALL
USING (bucket_id = 'signature-page-templates' AND auth.role() = 'service_role');

-- Solo admins de la plataforma pueden gestionar los archivos
DROP POLICY IF EXISTS "Admins can manage signature templates" ON storage.objects;
CREATE POLICY "Admins can manage signature templates"
ON storage.objects FOR ALL
USING (
  bucket_id = 'signature-page-templates'
  AND (
    EXISTS (
      SELECT 1 FROM core.organization_users ou
      JOIN core.organizations o ON o.id = ou.organization_id
      JOIN core.roles r ON r.id = ou.role_id
      WHERE ou.user_id = auth.uid()
        AND o.org_type = 'platform'
        AND r.level >= 9
    )
  )
);

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Bucket creado: signature-page-templates';
END $$;



