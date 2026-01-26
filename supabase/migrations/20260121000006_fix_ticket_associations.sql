-- =====================================================
-- Migration: Fix Ticket Associations for Support Tickets
-- Description: Crea asociaciones automáticas y vistas faltantes
-- Created: 2026-01-21
-- =====================================================

SET search_path TO crm, core, public, extensions;

-- 1. Crear vistas públicas para asociaciones (si no existen)
CREATE OR REPLACE VIEW public.crm_ticket_users AS
SELECT * FROM crm.ticket_users;

CREATE OR REPLACE VIEW public.crm_ticket_contacts AS
SELECT * FROM crm.ticket_contacts;

-- 2. Permisos
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_ticket_users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_ticket_contacts TO authenticated;
GRANT ALL ON public.crm_ticket_users TO service_role;
GRANT ALL ON public.crm_ticket_contacts TO service_role;

-- 3. RLS en vistas
ALTER VIEW public.crm_ticket_users SET (security_invoker = true);
ALTER VIEW public.crm_ticket_contacts SET (security_invoker = true);

-- 4. Crear asociaciones automáticas para tickets existentes que tengan user_id
-- Esto vincula automáticamente los tickets de soporte con sus usuarios
INSERT INTO crm.ticket_users (ticket_id, user_id)
SELECT id, user_id
FROM crm.tickets
WHERE user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM crm.ticket_users 
    WHERE ticket_id = crm.tickets.id 
    AND user_id = crm.tickets.user_id
  )
ON CONFLICT DO NOTHING;

-- 5. Trigger para crear asociación automática al crear ticket con user_id
CREATE OR REPLACE FUNCTION crm.auto_associate_ticket_user()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id IS NOT NULL THEN
    INSERT INTO crm.ticket_users (ticket_id, user_id)
    VALUES (NEW.id, NEW.user_id)
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear trigger solo si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'auto_associate_ticket_user_trigger'
  ) THEN
    CREATE TRIGGER auto_associate_ticket_user_trigger
      AFTER INSERT ON crm.tickets
      FOR EACH ROW
      EXECUTE FUNCTION crm.auto_associate_ticket_user();
  END IF;
END $$;
