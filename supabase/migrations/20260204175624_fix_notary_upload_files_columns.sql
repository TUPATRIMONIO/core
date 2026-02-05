-- =====================================================
-- Migration: Fix notary upload files columns
-- Description: Agrega columnas faltantes a la tabla existente
-- Created: 2026-02-04
-- =====================================================

SET search_path TO signing, core, public, extensions;

-- Agregar columnas faltantes a notary_upload_files
DO $$
BEGIN
  -- Columna detected_document_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'signing' 
    AND table_name = 'notary_upload_files' 
    AND column_name = 'detected_document_id'
  ) THEN
    ALTER TABLE signing.notary_upload_files 
    ADD COLUMN detected_document_id UUID REFERENCES signing.documents(id) ON DELETE SET NULL;
    RAISE NOTICE 'Columna detected_document_id agregada';
  END IF;

  -- Columna detected_verification_code
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'signing' 
    AND table_name = 'notary_upload_files' 
    AND column_name = 'detected_verification_code'
  ) THEN
    ALTER TABLE signing.notary_upload_files 
    ADD COLUMN detected_verification_code TEXT;
    RAISE NOTICE 'Columna detected_verification_code agregada';
  END IF;

  -- Columna qr_data
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'signing' 
    AND table_name = 'notary_upload_files' 
    AND column_name = 'qr_data'
  ) THEN
    ALTER TABLE signing.notary_upload_files 
    ADD COLUMN qr_data JSONB;
    RAISE NOTICE 'Columna qr_data agregada';
  END IF;

  -- Columna final_storage_path
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'signing' 
    AND table_name = 'notary_upload_files' 
    AND column_name = 'final_storage_path'
  ) THEN
    ALTER TABLE signing.notary_upload_files 
    ADD COLUMN final_storage_path TEXT;
    RAISE NOTICE 'Columna final_storage_path agregada';
  END IF;

  -- Columna error_message
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'signing' 
    AND table_name = 'notary_upload_files' 
    AND column_name = 'error_message'
  ) THEN
    ALTER TABLE signing.notary_upload_files 
    ADD COLUMN error_message TEXT;
    RAISE NOTICE 'Columna error_message agregada';
  END IF;

  -- Columna processed_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'signing' 
    AND table_name = 'notary_upload_files' 
    AND column_name = 'processed_at'
  ) THEN
    ALTER TABLE signing.notary_upload_files 
    ADD COLUMN processed_at TIMESTAMPTZ;
    RAISE NOTICE 'Columna processed_at agregada';
  END IF;

  -- Columna created_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'signing' 
    AND table_name = 'notary_upload_files' 
    AND column_name = 'created_at'
  ) THEN
    ALTER TABLE signing.notary_upload_files 
    ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
    RAISE NOTICE 'Columna created_at agregada';
  END IF;

  -- Columna updated_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'signing' 
    AND table_name = 'notary_upload_files' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE signing.notary_upload_files 
    ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
    RAISE NOTICE 'Columna updated_at agregada';
  END IF;

  -- Columnas para notary_upload_batches también
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'signing' 
    AND table_name = 'notary_upload_batches' 
    AND column_name = 'created_at'
  ) THEN
    ALTER TABLE signing.notary_upload_batches 
    ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
    RAISE NOTICE 'Columna created_at agregada a batches';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'signing' 
    AND table_name = 'notary_upload_batches' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE signing.notary_upload_batches 
    ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
    RAISE NOTICE 'Columna updated_at agregada a batches';
  END IF;
END $$;

-- Crear índice si no existe
CREATE INDEX IF NOT EXISTS idx_notary_upload_files_document 
  ON signing.notary_upload_files(detected_document_id) 
  WHERE detected_document_id IS NOT NULL;

-- Crear triggers si no existen
DROP TRIGGER IF EXISTS update_notary_upload_batches_updated_at ON signing.notary_upload_batches;
CREATE TRIGGER update_notary_upload_batches_updated_at
  BEFORE UPDATE ON signing.notary_upload_batches
  FOR EACH ROW EXECUTE FUNCTION signing.update_updated_at();

DROP TRIGGER IF EXISTS update_notary_upload_files_updated_at ON signing.notary_upload_files;
CREATE TRIGGER update_notary_upload_files_updated_at
  BEFORE UPDATE ON signing.notary_upload_files
  FOR EACH ROW EXECUTE FUNCTION signing.update_updated_at();

-- =====================================================
-- RLS (asegurar que esté habilitado)
-- =====================================================

ALTER TABLE signing.notary_upload_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE signing.notary_upload_files ENABLE ROW LEVEL SECURITY;

-- notary_upload_batches
DROP POLICY IF EXISTS "Notary users can view own office batches" ON signing.notary_upload_batches;
CREATE POLICY "Notary users can view own office batches"
ON signing.notary_upload_batches FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM signing.notary_offices no
    WHERE no.id = notary_office_id
      AND signing.user_belongs_to_org(no.organization_id)
  )
);

DROP POLICY IF EXISTS "Notary users can insert batches for own office" ON signing.notary_upload_batches;
CREATE POLICY "Notary users can insert batches for own office"
ON signing.notary_upload_batches FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM signing.notary_offices no
    WHERE no.id = notary_office_id
      AND signing.user_belongs_to_org(no.organization_id)
  )
);

DROP POLICY IF EXISTS "Notary users can update own office batches" ON signing.notary_upload_batches;
CREATE POLICY "Notary users can update own office batches"
ON signing.notary_upload_batches FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM signing.notary_offices no
    WHERE no.id = notary_office_id
      AND signing.user_belongs_to_org(no.organization_id)
  )
);

-- notary_upload_files
DROP POLICY IF EXISTS "Notary users can view own office batch files" ON signing.notary_upload_files;
CREATE POLICY "Notary users can view own office batch files"
ON signing.notary_upload_files FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM signing.notary_upload_batches nub
    JOIN signing.notary_offices no ON no.id = nub.notary_office_id
    WHERE nub.id = batch_id
      AND signing.user_belongs_to_org(no.organization_id)
  )
);

DROP POLICY IF EXISTS "Notary users can insert files to own office batches" ON signing.notary_upload_files;
CREATE POLICY "Notary users can insert files to own office batches"
ON signing.notary_upload_files FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM signing.notary_upload_batches nub
    JOIN signing.notary_offices no ON no.id = nub.notary_office_id
    WHERE nub.id = batch_id
      AND signing.user_belongs_to_org(no.organization_id)
  )
);

DROP POLICY IF EXISTS "Notary users can update own office batch files" ON signing.notary_upload_files;
CREATE POLICY "Notary users can update own office batch files"
ON signing.notary_upload_files FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM signing.notary_upload_batches nub
    JOIN signing.notary_offices no ON no.id = nub.notary_office_id
    WHERE nub.id = batch_id
      AND signing.user_belongs_to_org(no.organization_id)
  )
);

-- Grants para tablas base
GRANT SELECT, INSERT, UPDATE ON signing.notary_upload_batches TO authenticated;
GRANT SELECT, INSERT, UPDATE ON signing.notary_upload_files TO authenticated;
GRANT ALL ON signing.notary_upload_batches TO service_role;
GRANT ALL ON signing.notary_upload_files TO service_role;

-- Recrear vistas con todas las columnas
DROP VIEW IF EXISTS public.signing_notary_upload_batches CASCADE;
DROP VIEW IF EXISTS public.signing_notary_upload_files CASCADE;

CREATE VIEW public.signing_notary_upload_batches AS
SELECT * FROM signing.notary_upload_batches;

CREATE VIEW public.signing_notary_upload_files AS
SELECT * FROM signing.notary_upload_files;

-- Reglas INSTEAD OF para permitir INSERT/UPDATE via views

-- BATCHES: INSERT
CREATE RULE insert_signing_notary_upload_batches AS
ON INSERT TO public.signing_notary_upload_batches
DO INSTEAD
INSERT INTO signing.notary_upload_batches (
  id, notary_office_id, uploaded_by, status, total_files, processed_files, 
  successful_files, failed_files, results, created_at, updated_at
)
VALUES (
  COALESCE(NEW.id, gen_random_uuid()),
  NEW.notary_office_id,
  NEW.uploaded_by,
  COALESCE(NEW.status, 'pending'),
  COALESCE(NEW.total_files, 0),
  COALESCE(NEW.processed_files, 0),
  COALESCE(NEW.successful_files, 0),
  COALESCE(NEW.failed_files, 0),
  NEW.results,
  COALESCE(NEW.created_at, NOW()),
  COALESCE(NEW.updated_at, NOW())
)
RETURNING *;

-- BATCHES: UPDATE
CREATE RULE update_signing_notary_upload_batches AS
ON UPDATE TO public.signing_notary_upload_batches
DO INSTEAD
UPDATE signing.notary_upload_batches SET
  status = COALESCE(NEW.status, status),
  total_files = COALESCE(NEW.total_files, total_files),
  processed_files = COALESCE(NEW.processed_files, processed_files),
  successful_files = COALESCE(NEW.successful_files, successful_files),
  failed_files = COALESCE(NEW.failed_files, failed_files),
  results = COALESCE(NEW.results, results),
  updated_at = NOW()
WHERE id = OLD.id
RETURNING *;

-- FILES: INSERT
CREATE RULE insert_signing_notary_upload_files AS
ON INSERT TO public.signing_notary_upload_files
DO INSTEAD
INSERT INTO signing.notary_upload_files (
  id, batch_id, original_filename, temp_storage_path, status, 
  qr_data, detected_document_id, detected_verification_code,
  final_storage_path, error_message, processed_at, created_at, updated_at
)
VALUES (
  COALESCE(NEW.id, gen_random_uuid()),
  NEW.batch_id,
  NEW.original_filename,
  NEW.temp_storage_path,
  COALESCE(NEW.status, 'pending'),
  NEW.qr_data,
  NEW.detected_document_id,
  NEW.detected_verification_code,
  NEW.final_storage_path,
  NEW.error_message,
  NEW.processed_at,
  COALESCE(NEW.created_at, NOW()),
  COALESCE(NEW.updated_at, NOW())
)
RETURNING *;

-- FILES: UPDATE
CREATE RULE update_signing_notary_upload_files AS
ON UPDATE TO public.signing_notary_upload_files
DO INSTEAD
UPDATE signing.notary_upload_files SET
  status = COALESCE(NEW.status, status),
  qr_data = COALESCE(NEW.qr_data, qr_data),
  detected_document_id = NEW.detected_document_id,
  detected_verification_code = NEW.detected_verification_code,
  final_storage_path = NEW.final_storage_path,
  error_message = NEW.error_message,
  processed_at = NEW.processed_at,
  updated_at = NOW()
WHERE id = OLD.id
RETURNING *;

-- Grants
GRANT SELECT, INSERT, UPDATE ON public.signing_notary_upload_batches TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.signing_notary_upload_files TO authenticated;
GRANT ALL ON public.signing_notary_upload_batches TO service_role;
GRANT ALL ON public.signing_notary_upload_files TO service_role;

-- Wrapper público para extract_uuid_from_qr_url
CREATE OR REPLACE FUNCTION public.extract_uuid_from_qr_url(qr_text TEXT)
RETURNS UUID
LANGUAGE sql
IMMUTABLE
SECURITY DEFINER
AS $$
  SELECT signing.extract_uuid_from_qr_url(qr_text);
$$;

GRANT EXECUTE ON FUNCTION public.extract_uuid_from_qr_url TO authenticated;
GRANT EXECUTE ON FUNCTION public.extract_uuid_from_qr_url TO service_role;

DO $$
BEGIN
  RAISE NOTICE '✅ Notary upload files columns fixed and views recreated';
  RAISE NOTICE '✅ Wrapper público extract_uuid_from_qr_url creado';
END $$;
