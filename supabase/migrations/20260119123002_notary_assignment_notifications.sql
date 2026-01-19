-- =====================================================
-- Migration: Notary assignment notifications + document status sync
-- Description: Send notifications and sync document status from notary assignments
-- Created: 2026-01-19
-- =====================================================

SET search_path TO signing, core, public, extensions;

-- =====================================================
-- FUNCTION: signing.send_notary_notification
-- =====================================================

CREATE OR REPLACE FUNCTION signing.send_notary_notification(
  p_type TEXT,
  p_recipient_email TEXT,
  p_recipient_name TEXT,
  p_document_title TEXT,
  p_action_url TEXT,
  p_org_id UUID,
  p_document_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  function_url TEXT;
  response_status INT;
  response_body TEXT;
  payload JSONB;
BEGIN
  function_url := current_setting('app.settings.supabase_url', true) || '/functions/v1/send-signing-notification';
  IF function_url IS NULL OR function_url = '/functions/v1/send-signing-notification' THEN
    function_url := 'http://localhost:54321/functions/v1/send-signing-notification';
  END IF;

  payload := jsonb_build_object(
    'type', p_type,
    'recipient_email', p_recipient_email,
    'recipient_name', p_recipient_name,
    'document_title', p_document_title,
    'action_url', p_action_url,
    'org_id', p_org_id::text,
    'document_id', p_document_id::text
  );

  SELECT status, content INTO response_status, response_body
  FROM net.http_post(
    url := function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.supabase_service_role_key', true)
    ),
    body := payload::text
  );

  IF response_status != 200 THEN
    RAISE WARNING 'Error al enviar notificación notarial a %: % - %',
      p_recipient_email, response_status, response_body;
  END IF;
END;
$$;

-- =====================================================
-- FUNCTION: signing.on_notary_assignment_status_change
-- =====================================================

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

-- =====================================================
-- TRIGGER: Notary assignment status changes
-- =====================================================

DROP TRIGGER IF EXISTS trigger_notary_assignment_status_change ON signing.notary_assignments;

CREATE TRIGGER trigger_notary_assignment_status_change
  AFTER INSERT OR UPDATE OF status ON signing.notary_assignments
  FOR EACH ROW
  EXECUTE FUNCTION signing.on_notary_assignment_status_change();

DO $$
BEGIN
  RAISE NOTICE '✅ Trigger de notificaciones notariales configurado';
END $$;
