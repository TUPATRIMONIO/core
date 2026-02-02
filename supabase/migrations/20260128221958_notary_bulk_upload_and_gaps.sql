-- =====================================================
-- Migration: Notary Bulk Upload + Complete Notarial Flow
-- Description: Implementa subida masiva, notificaciones y versiones faltantes
-- Created: 2026-01-28
-- =====================================================

SET search_path TO signing, core, public, extensions;

-- =====================================================
-- 1. TABLAS PARA SUBIDA MASIVA
-- =====================================================

-- Tabla para batches de subida
CREATE TABLE signing.notary_upload_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notary_office_id UUID NOT NULL REFERENCES signing.notary_offices(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  total_files INTEGER NOT NULL CHECK (total_files > 0),
  processed_files INTEGER DEFAULT 0 CHECK (processed_files >= 0),
  successful_files INTEGER DEFAULT 0 CHECK (successful_files >= 0),
  failed_files INTEGER DEFAULT 0 CHECK (failed_files >= 0),
  results JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notary_upload_batches_office ON signing.notary_upload_batches(notary_office_id);
CREATE INDEX idx_notary_upload_batches_status ON signing.notary_upload_batches(status);
CREATE INDEX idx_notary_upload_batches_created ON signing.notary_upload_batches(created_at DESC);

COMMENT ON TABLE signing.notary_upload_batches IS 'Lotes de subida masiva de documentos notarizados';

-- Tabla para archivos individuales del batch
CREATE TABLE signing.notary_upload_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES signing.notary_upload_batches(id) ON DELETE CASCADE,
  original_filename TEXT NOT NULL,
  temp_storage_path TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'success', 'failed')),
  document_id UUID REFERENCES signing.documents(id) ON DELETE SET NULL,
  assignment_id UUID REFERENCES signing.notary_assignments(id) ON DELETE SET NULL,
  error_message TEXT,
  qr_data TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notary_upload_files_batch ON signing.notary_upload_files(batch_id);
CREATE INDEX idx_notary_upload_files_status ON signing.notary_upload_files(status);
CREATE INDEX idx_notary_upload_files_document ON signing.notary_upload_files(document_id);

COMMENT ON TABLE signing.notary_upload_files IS 'Archivos individuales dentro de un lote de subida masiva';

-- =====================================================
-- 2. NOTIFICACIÓN NOTARY_COMPLETED AL CLIENTE
-- =====================================================

-- Modificar función existente para agregar caso de completed
CREATE OR REPLACE FUNCTION signing.on_notary_assignment_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_doc RECORD;
  v_office RECORD;
  v_user RECORD;
  v_base_url TEXT;
  v_action_url TEXT;
  v_team_email TEXT;
BEGIN
  v_base_url := current_setting('app.settings.public_app_url', true);
  IF v_base_url IS NULL OR v_base_url = '' THEN
    v_base_url := 'https://tupatrimonio.cl';
  END IF;

  v_team_email := current_setting('app.settings.internal_notary_email', true);
  IF v_team_email IS NULL OR v_team_email = '' THEN
    v_team_email := 'soporte@tupatrimonio.cl';
  END IF;

  SELECT d.id, d.title, d.organization_id, d.manager_id, d.created_by
  INTO v_doc
  FROM signing.documents d
  WHERE d.id = NEW.document_id;

  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  SELECT no.id, no.name, no.email
  INTO v_office
  FROM signing.notary_offices no
  WHERE no.id = NEW.notary_office_id;

  SELECT u.id, u.full_name, u.email
  INTO v_user
  FROM core.users u
  WHERE u.id = COALESCE(v_doc.manager_id, v_doc.created_by);

  -- Cuando se asigna a notaría (pending)
  IF TG_OP = 'INSERT'
     OR (NEW.status = 'pending' AND (OLD.status IS NULL OR OLD.status != 'pending')) THEN
    IF v_office.email IS NOT NULL THEN
      v_action_url := v_base_url || '/notary/dashboard';
      PERFORM signing.send_notary_notification(
        'NOTARY_DOCUMENT_ASSIGNED',
        v_office.email,
        COALESCE(v_office.name, v_office.email),
        v_doc.title,
        v_action_url,
        v_doc.organization_id,
        v_doc.id
      );
    END IF;

    IF v_user.email IS NOT NULL THEN
      v_action_url := v_base_url || '/dashboard/signing/documents/' || v_doc.id;
      PERFORM signing.send_notary_notification(
        'NOTARY_IN_PROGRESS',
        v_user.email,
        COALESCE(v_user.full_name, v_user.email),
        v_doc.title,
        v_action_url,
        v_doc.organization_id,
        v_doc.id
      );
    END IF;
  END IF;

  -- Cuando requiere corrección o documentos
  IF NEW.status IN ('needs_correction', 'needs_documents')
     AND (OLD.status IS NULL OR OLD.status != NEW.status) THEN
    UPDATE signing.documents
    SET status = 'notary_observed',
        updated_at = NOW()
    WHERE id = v_doc.id;

    v_action_url := v_base_url || '/admin/notary-queue';
    PERFORM signing.send_notary_notification(
      'NOTARY_NEEDS_CORRECTION',
      v_team_email,
      'Equipo TuPatrimonio',
      v_doc.title,
      v_action_url,
      v_doc.organization_id,
      v_doc.id
    );
  END IF;

  -- Cuando es rechazado
  IF NEW.status = 'rejected'
     AND (OLD.status IS NULL OR OLD.status != 'rejected') THEN
    UPDATE signing.documents
    SET status = 'notary_rejected',
        updated_at = NOW()
    WHERE id = v_doc.id;

    v_action_url := v_base_url || '/admin/notary-queue';
    PERFORM signing.send_notary_notification(
      'NOTARY_REJECTED',
      v_team_email,
      'Equipo TuPatrimonio',
      v_doc.title,
      v_action_url,
      v_doc.organization_id,
      v_doc.id
    );
  END IF;

  -- NUEVO: Cuando se completa (documento notarizado listo)
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    IF v_user.email IS NOT NULL THEN
      v_action_url := v_base_url || '/repository/' || v_doc.id;
      PERFORM signing.send_notary_notification(
        'NOTARY_COMPLETED',
        v_user.email,
        COALESCE(v_user.full_name, v_user.email),
        v_doc.title,
        v_action_url,
        v_doc.organization_id,
        v_doc.id
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION signing.on_notary_assignment_status_change IS 
  'Envía notificaciones según cambios de estado en asignaciones notariales (incluye NOTARY_COMPLETED)';

-- =====================================================
-- 3. VERSIÓN FULLY_SIGNED AUTOMÁTICA
-- =====================================================

-- Modificar trigger check_all_signed para crear versión fully_signed
CREATE OR REPLACE FUNCTION signing.check_all_signed()
RETURNS TRIGGER AS $$
DECLARE
  v_doc RECORD;
  v_next_version INTEGER;
BEGIN
  -- Solo ejecutar si el estado cambió a 'signed'
  IF NEW.status = 'signed' AND (OLD.status IS NULL OR OLD.status != 'signed') THEN
    -- Bloquear el documento para evitar condiciones de carrera
    SELECT * INTO v_doc
    FROM signing.documents
    WHERE id = NEW.document_id
    FOR UPDATE;
    
    -- Verificar si todos firmaron
    IF v_doc.signed_count + 1 >= v_doc.signers_count THEN
      -- Calcular siguiente número de versión
      SELECT COALESCE(MAX(version_number), 0) + 1
      INTO v_next_version
      FROM signing.document_versions
      WHERE document_id = NEW.document_id;

      -- Crear versión fully_signed antes de actualizar estado
      IF v_doc.current_signed_file_path IS NOT NULL THEN
        INSERT INTO signing.document_versions (
          document_id,
          version_number,
          version_type,
          file_path,
          file_name,
          file_size,
          created_by
        )
        VALUES (
          NEW.document_id,
          v_next_version,
          'fully_signed',
          v_doc.current_signed_file_path,
          'signed.pdf',
          NULL, -- Se puede calcular después si es necesario
          NEW.user_id
        );
      END IF;

      -- Actualizar estado según si requiere notaría
      IF v_doc.notary_service = 'none' THEN
        UPDATE signing.documents
        SET status = 'completed',
            completed_at = NOW(),
            updated_at = NOW()
        WHERE id = NEW.document_id;
      ELSE
        UPDATE signing.documents
        SET status = 'pending_notary',
            updated_at = NOW()
        WHERE id = NEW.document_id;
      END IF;
    ELSIF v_doc.signed_count >= 0 THEN
      UPDATE signing.documents
      SET status = 'partially_signed',
          updated_at = NOW()
      WHERE id = NEW.document_id
        AND status = 'pending_signature';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION signing.check_all_signed IS 
  'Verifica si todos firmaron y crea versión fully_signed antes de cambiar estado';

-- =====================================================
-- 4. VISTAS PÚBLICAS PARA NOTARÍAS
-- =====================================================

-- Vista para batches con información de oficina
CREATE OR REPLACE VIEW signing.notary_upload_batches_view AS
SELECT 
  b.*,
  no.name AS notary_office_name,
  cu.full_name AS uploaded_by_name,
  au.email AS uploaded_by_email
FROM signing.notary_upload_batches b
JOIN signing.notary_offices no ON no.id = b.notary_office_id
JOIN core.users cu ON cu.id = b.uploaded_by
LEFT JOIN auth.users au ON au.id = cu.id;

COMMENT ON VIEW signing.notary_upload_batches_view IS 'Vista con información completa de batches de subida';

-- =====================================================
-- 5. PERMISOS RLS
-- =====================================================

-- Habilitar RLS en nuevas tablas
ALTER TABLE signing.notary_upload_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE signing.notary_upload_files ENABLE ROW LEVEL SECURITY;

-- Políticas para notary_upload_batches
CREATE POLICY "Notarios pueden ver sus propios batches"
  ON signing.notary_upload_batches
  FOR SELECT
  USING (
    notary_office_id IN (
      SELECT no.id
      FROM signing.notary_offices no
      JOIN core.organization_users ou ON ou.organization_id = no.organization_id
      WHERE ou.user_id = auth.uid()
        AND ou.status = 'active'
    )
  );

CREATE POLICY "Notarios pueden crear batches"
  ON signing.notary_upload_batches
  FOR INSERT
  WITH CHECK (
    notary_office_id IN (
      SELECT no.id
      FROM signing.notary_offices no
      JOIN core.organization_users ou ON ou.organization_id = no.organization_id
      WHERE ou.user_id = auth.uid()
        AND ou.status = 'active'
    )
    AND uploaded_by = auth.uid()
  );

-- Políticas para notary_upload_files
CREATE POLICY "Notarios pueden ver archivos de sus batches"
  ON signing.notary_upload_files
  FOR SELECT
  USING (
    batch_id IN (
      SELECT b.id
      FROM signing.notary_upload_batches b
      JOIN signing.notary_offices no ON no.id = b.notary_office_id
      JOIN core.organization_users ou ON ou.organization_id = no.organization_id
      WHERE ou.user_id = auth.uid()
        AND ou.status = 'active'
    )
  );

CREATE POLICY "Notarios pueden crear archivos en sus batches"
  ON signing.notary_upload_files
  FOR INSERT
  WITH CHECK (
    batch_id IN (
      SELECT b.id
      FROM signing.notary_upload_batches b
      JOIN signing.notary_offices no ON no.id = b.notary_office_id
      JOIN core.organization_users ou ON ou.organization_id = no.organization_id
      WHERE ou.user_id = auth.uid()
        AND ou.status = 'active'
    )
  );

-- Admins tienen acceso completo
CREATE POLICY "Platform admins full access batches"
  ON signing.notary_upload_batches
  FOR ALL
  USING (public.is_platform_admin());

CREATE POLICY "Platform admins full access files"
  ON signing.notary_upload_files
  FOR ALL
  USING (public.is_platform_admin());

-- =====================================================
-- 6. FUNCIÓN PARA EXTRAER UUID DE URL DE QR
-- =====================================================

CREATE OR REPLACE FUNCTION signing.extract_uuid_from_qr_url(qr_text TEXT)
RETURNS UUID
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_uuid_pattern TEXT := '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
  v_matches TEXT[];
BEGIN
  -- Buscar patrón UUID en el texto
  v_matches := regexp_matches(qr_text, v_uuid_pattern, 'i');
  
  IF v_matches IS NULL OR array_length(v_matches, 1) = 0 THEN
    RETURN NULL;
  END IF;
  
  RETURN v_matches[1]::UUID;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$;

COMMENT ON FUNCTION signing.extract_uuid_from_qr_url IS 
  'Extrae el UUID del documento desde la URL del QR (ej: tupatrimonio.app/repository/UUID)';

-- =====================================================
-- FINALIZACIÓN
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migración completada:';
  RAISE NOTICE '   - Tablas de subida masiva creadas';
  RAISE NOTICE '   - Notificación NOTARY_COMPLETED agregada';
  RAISE NOTICE '   - Versión fully_signed automática implementada';
  RAISE NOTICE '   - Permisos RLS configurados';
  RAISE NOTICE '   - Función de extracción de UUID creada';
END $$;
