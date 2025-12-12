-- =====================================================
-- Migration: Fix signing notification columns
-- Description: Corrige referencia a columna inexistente 'name' por 'full_name' en notificaciones
-- Created: 2025-12-12
-- =====================================================

SET search_path TO signing, core, public, extensions;

-- =====================================================
-- FUNCTION: Notificar cuando documento pasa a firma (CORREGIDA)
-- =====================================================

CREATE OR REPLACE FUNCTION signing.notify_signers_on_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  signer_record RECORD;
  action_url TEXT;
  base_url TEXT;
  signing_token TEXT;
BEGIN
  -- Solo procesar si el estado cambió a 'pending_signature' o 'partially_signed'
  IF (NEW.status = 'pending_signature' OR NEW.status = 'partially_signed') 
     AND (OLD.status IS NULL OR (OLD.status != 'pending_signature' AND OLD.status != 'partially_signed')) THEN
    
    -- Obtener URL base
    base_url := current_setting('app.settings.public_app_url', true);
    IF base_url IS NULL OR base_url = '' THEN
      base_url := 'https://tupatrimonio.cl';
    END IF;

    -- Notificar al siguiente firmante (si es secuencial) o a todos (si es simultáneo)
    FOR signer_record IN
      SELECT 
        s.id,
        s.document_id,
        s.email,
        s.full_name, -- CORREGIDO: s.name -> s.full_name
        s.signing_token,
        s.signing_order,
        d.title as document_title,
        d.organization_id,
        d.signing_order as doc_signing_order
      FROM signing.signers s
      JOIN signing.documents d ON d.id = s.document_id
      WHERE s.document_id = NEW.id
        AND s.status = 'pending'
        AND (
          -- Si es simultáneo, notificar a todos
          d.signing_order = 'simultaneous'
          OR
          -- Si es secuencial, solo al primero en orden
          (d.signing_order = 'sequential' AND s.signing_order = (
            SELECT MIN(s2.signing_order) 
            FROM signing.signers s2 
            WHERE s2.document_id = NEW.id AND s2.status = 'pending'
          ))
        )
    LOOP
      -- Construir URL de acción (portal público de firma)
      signing_token := signer_record.signing_token;
      IF signing_token IS NULL THEN
        -- Generar token si no existe (debería existir, pero por seguridad)
        signing_token := encode(gen_random_bytes(32), 'hex');
        UPDATE signing.signers SET signing_token = signing_token WHERE id = signer_record.id;
      END IF;

      action_url := base_url || '/sign/' || signing_token;

      -- Invocar función de notificación
      PERFORM signing.invoke_notification_function(
        jsonb_build_object(
          'type', 'SIGNING_REQUEST',
          'recipient_email', signer_record.email,
          'recipient_name', signer_record.full_name, -- CORREGIDO
          'document_title', signer_record.document_title,
          'action_url', action_url,
          'org_id', signer_record.organization_id::text,
          'document_id', signer_record.document_id::text,
          'signer_id', signer_record.id::text
        )
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

-- =====================================================
-- FUNCTION: Notificar cuando se completa la firma (CORREGIDA)
-- =====================================================

CREATE OR REPLACE FUNCTION signing.notify_completion_on_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  signer_record RECORD;
  action_url TEXT;
  base_url TEXT;
BEGIN
  -- Solo procesar si el estado cambió a 'signed' o 'completed'
  IF (NEW.status = 'signed' OR NEW.status = 'completed') 
     AND (OLD.status IS NULL OR (OLD.status != 'signed' AND OLD.status != 'completed')) THEN
    
    base_url := current_setting('app.settings.public_app_url', true);
    IF base_url IS NULL OR base_url = '' THEN
      base_url := 'https://tupatrimonio.cl';
    END IF;

    -- Notificar a todos los firmantes que el documento está completo
    FOR signer_record IN
      SELECT DISTINCT
        s.email,
        s.full_name, -- CORREGIDO: s.name -> s.full_name
        d.title as document_title,
        d.organization_id,
        d.id as document_id
      FROM signing.signers s
      JOIN signing.documents d ON d.id = s.document_id
      WHERE s.document_id = NEW.id
        AND s.status = 'signed'
    LOOP
      action_url := base_url || '/dashboard/signing/documents/' || signer_record.document_id;

      PERFORM signing.invoke_notification_function(
        jsonb_build_object(
          'type', 'SIGNING_COMPLETED',
          'recipient_email', signer_record.email,
          'recipient_name', signer_record.full_name, -- CORREGIDO
          'document_title', signer_record.document_title,
          'action_url', action_url,
          'org_id', signer_record.organization_id::text,
          'document_id', signer_record.document_id::text
        )
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Funciones de notificación corregidas (full_name)';
END $$;
