-- =====================================================
-- Migration: Add unique constraint on gmail_message_id
-- Description: Previene duplicados de emails a nivel de base de datos
-- Created: 2025-12-10
-- =====================================================

SET search_path TO crm, core, public, extensions;

-- =====================================================
-- ÍNDICE ÚNICO para gmail_message_id
-- =====================================================

-- Primero eliminar duplicados existentes (mantener solo el más antiguo)
WITH duplicates AS (
  SELECT id, gmail_message_id, organization_id,
         ROW_NUMBER() OVER (PARTITION BY organization_id, gmail_message_id ORDER BY created_at ASC) as rn
  FROM crm.emails
  WHERE gmail_message_id IS NOT NULL
)
DELETE FROM crm.emails 
WHERE id IN (SELECT id FROM duplicates WHERE rn > 1);

-- Agregar constraint único (si no existe)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'emails_org_gmail_message_id_unique'
  ) THEN
    ALTER TABLE crm.emails 
      ADD CONSTRAINT emails_org_gmail_message_id_unique 
      UNIQUE (organization_id, gmail_message_id);
    RAISE NOTICE '✅ Constraint emails_org_gmail_message_id_unique creado';
  ELSE
    RAISE NOTICE '⏭️ Constraint emails_org_gmail_message_id_unique ya existe';
  END IF;
END $$;

-- =====================================================
-- FUNCIÓN RPC para verificar si email existe
-- =====================================================

CREATE OR REPLACE FUNCTION public.check_email_exists(
  p_organization_id UUID,
  p_gmail_message_id TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM crm.emails 
    WHERE organization_id = p_organization_id 
      AND gmail_message_id = p_gmail_message_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.check_email_exists(UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.check_email_exists(UUID, TEXT) TO authenticated;

-- =====================================================
-- LIMPIAR TICKETS DUPLICADOS
-- =====================================================

-- Identificar tickets duplicados por subject y contact_id
-- Mantener solo el más antiguo y eliminar los demás
WITH ticket_duplicates AS (
  SELECT id, subject, contact_id, organization_id,
         ROW_NUMBER() OVER (
           PARTITION BY organization_id, contact_id, LOWER(TRIM(subject)) 
           ORDER BY created_at ASC
         ) as rn
  FROM crm.tickets
  WHERE contact_id IS NOT NULL
)
DELETE FROM crm.tickets 
WHERE id IN (SELECT id FROM ticket_duplicates WHERE rn > 1);

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Constraint único en gmail_message_id creado';
  RAISE NOTICE '✅ Tickets duplicados eliminados';
  RAISE NOTICE '✅ Función check_email_exists creada';
END $$;







