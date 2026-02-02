-- =====================================================
-- Migration: Fix signing triggers with SECURITY DEFINER
-- Description: Los triggers necesitan SECURITY DEFINER para poder actualizar
--              signing.documents sin ser bloqueados por RLS
-- Created: 2026-02-02
-- =====================================================

-- 1. Recrear sync_signer_counts con SECURITY DEFINER
CREATE OR REPLACE FUNCTION signing.sync_signer_counts()
RETURNS TRIGGER AS $$
DECLARE
  v_total INTEGER;
  v_signed INTEGER;
BEGIN
  -- Contar total de firmantes activos (no removidos)
  SELECT COUNT(*) INTO v_total
  FROM signing.signers
  WHERE document_id = COALESCE(NEW.document_id, OLD.document_id)
    AND status != 'removed';
  
  -- Contar firmados
  SELECT COUNT(*) INTO v_signed
  FROM signing.signers
  WHERE document_id = COALESCE(NEW.document_id, OLD.document_id)
    AND status = 'signed';
  
  -- Actualizar documento
  UPDATE signing.documents
  SET signers_count = v_total,
      signed_count = v_signed,
      updated_at = NOW()
  WHERE id = COALESCE(NEW.document_id, OLD.document_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Recrear check_all_signed con SECURITY DEFINER
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
          NULL,
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Recrear log_signer_changes con SECURITY DEFINER
CREATE OR REPLACE FUNCTION signing.log_signer_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO signing.signer_history (document_id, signer_id, action, signer_data, changed_by)
    VALUES (NEW.document_id, NEW.id, 'added', to_jsonb(NEW), COALESCE(auth.uid(), NEW.user_id));
  ELSIF TG_OP = 'UPDATE' AND NEW.status = 'removed' AND OLD.status != 'removed' THEN
    INSERT INTO signing.signer_history (document_id, signer_id, action, signer_data, changed_by)
    VALUES (NEW.document_id, NEW.id, 'removed', to_jsonb(OLD), COALESCE(auth.uid(), NEW.user_id));
  ELSIF TG_OP = 'UPDATE' AND (NEW.email != OLD.email OR NEW.full_name != OLD.full_name OR NEW.rut != OLD.rut) THEN
    INSERT INTO signing.signer_history (document_id, signer_id, action, signer_data, changed_by)
    VALUES (NEW.document_id, NEW.id, 'modified', jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW)), COALESCE(auth.uid(), NEW.user_id));
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. También agregar política permisiva para actualizaciones internas en signing.documents
-- Esto permite que las funciones SECURITY DEFINER puedan actualizar documentos
DROP POLICY IF EXISTS "Internal trigger updates on documents" ON signing.documents;
CREATE POLICY "Internal trigger updates on documents"
ON signing.documents FOR UPDATE
USING (true)
WITH CHECK (true);

-- 5. Agregar política para insertar versiones desde triggers
DROP POLICY IF EXISTS "Allow version inserts from triggers" ON signing.document_versions;
CREATE POLICY "Allow version inserts from triggers"
ON signing.document_versions FOR INSERT
WITH CHECK (true);

DO $$
BEGIN
  RAISE NOTICE '✅ Triggers actualizados con SECURITY DEFINER';
  RAISE NOTICE '  - sync_signer_counts';
  RAISE NOTICE '  - check_all_signed';
  RAISE NOTICE '  - log_signer_changes';
  RAISE NOTICE '  - Políticas permisivas agregadas';
END $$;
