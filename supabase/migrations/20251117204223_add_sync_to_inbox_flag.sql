/**
 * Migración: Agregar flag sync_to_inbox a email_accounts
 * 
 * Propósito: Permitir que ciertas cuentas (como notificaciones@) se usen
 * solo para envío, sin que sus emails aparezcan en el inbox del CRM.
 * 
 * Fecha: 17 Noviembre 2025
 */

-- ============================================================================
-- 1. AGREGAR COLUMNA sync_to_inbox
-- ============================================================================

ALTER TABLE crm.email_accounts 
ADD COLUMN IF NOT EXISTS sync_to_inbox BOOLEAN DEFAULT true;

COMMENT ON COLUMN crm.email_accounts.sync_to_inbox IS 
'Si false, los emails de esta cuenta no se sincronizan ni aparecen en el inbox del CRM. Útil para cuentas de notificaciones automatizadas (notificaciones@, no-reply@)';

-- ============================================================================
-- 2. ÍNDICE PARA OPTIMIZAR CONSULTAS
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_email_accounts_inbox_sync 
ON crm.email_accounts(organization_id, is_active, sync_to_inbox) 
WHERE is_active = true AND sync_to_inbox = true;

COMMENT ON INDEX crm.idx_email_accounts_inbox_sync IS 
'Optimiza queries de cuentas activas que deben sincronizarse con el inbox';

-- ============================================================================
-- 3. AGREGAR COLUMNA A email_threads PARA RASTREAR CUENTA DE ORIGEN
-- ============================================================================

-- Necesitamos saber de qué cuenta proviene cada thread para poder filtrarlos
ALTER TABLE crm.email_threads 
ADD COLUMN IF NOT EXISTS received_in_account_id UUID REFERENCES crm.email_accounts(id) ON DELETE SET NULL;

ALTER TABLE crm.email_threads 
ADD COLUMN IF NOT EXISTS sent_from_account_id UUID REFERENCES crm.email_accounts(id) ON DELETE SET NULL;

COMMENT ON COLUMN crm.email_threads.received_in_account_id IS 
'Cuenta principal donde se recibió este thread (si es inbound)';

COMMENT ON COLUMN crm.email_threads.sent_from_account_id IS 
'Cuenta desde donde se envió este thread (si es outbound y no tiene respuestas)';

-- Índice para filtrar threads por cuenta
CREATE INDEX IF NOT EXISTS idx_email_threads_received_account 
ON crm.email_threads(received_in_account_id) 
WHERE received_in_account_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_email_threads_sent_account 
ON crm.email_threads(sent_from_account_id) 
WHERE sent_from_account_id IS NOT NULL;

-- ============================================================================
-- 4. ACTUALIZAR threads EXISTENTES CON DATOS DE CUENTA
-- ============================================================================

-- Actualizar threads con la cuenta de recepción/envío basándose en los emails existentes
UPDATE crm.email_threads t
SET received_in_account_id = (
  SELECT e.received_in_account_id 
  FROM crm.emails e 
  WHERE e.thread_id = t.gmail_thread_id 
  AND e.received_in_account_id IS NOT NULL 
  AND e.organization_id = t.organization_id
  LIMIT 1
)
WHERE t.received_in_account_id IS NULL;

UPDATE crm.email_threads t
SET sent_from_account_id = (
  SELECT e.sent_from_account_id 
  FROM crm.emails e 
  WHERE e.thread_id = t.gmail_thread_id 
  AND e.sent_from_account_id IS NOT NULL 
  AND e.organization_id = t.organization_id
  LIMIT 1
)
WHERE t.sent_from_account_id IS NULL;

-- ============================================================================
-- 5. DOCUMENTACIÓN
-- ============================================================================

COMMENT ON TABLE crm.email_accounts IS 
'Cuentas de Gmail/SMTP conectadas al CRM. Pueden ser compartidas o personales. 
El flag sync_to_inbox controla si los emails de esta cuenta aparecen en el inbox.';


