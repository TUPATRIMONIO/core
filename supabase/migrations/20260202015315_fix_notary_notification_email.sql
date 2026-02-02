-- =====================================================
-- Migration: Fix notary notification email fetch
-- Description: Corrige error "column u.email does not exist" en trigger
--              on_notary_assignment_status_change
-- Created: 2026-02-02
-- =====================================================

-- PROBLEMA:
-- El trigger on_notary_assignment_status_change intentaba obtener el email
-- desde core.users (u.email), pero esa tabla no tiene columna email.
-- El email reside en auth.users.

-- SOLUCIÓN:
-- Modificar la consulta para hacer JOIN con auth.users y obtener el email correcto.

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

  -- CORRECCIÓN: Obtener email desde auth.users
  SELECT u.id, u.full_name, au.email
  INTO v_user
  FROM core.users u
  JOIN auth.users au ON au.id = u.id
  WHERE u.id = COALESCE(v_doc.manager_id, v_doc.created_by);

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

  RETURN NEW;
END;
$$;

DO $$
BEGIN
  RAISE NOTICE '✅ Función on_notary_assignment_status_change corregida (auth.users join)';
END $$;
