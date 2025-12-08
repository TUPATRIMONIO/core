-- =====================================================
-- Migration: Create email history system
-- Description: Historial de emails enviados desde el sistema
-- Created: 2025-12-07
-- =====================================================

SET search_path TO communications, billing, credits, core, public, extensions;

-- Verificar que el schema communications existe
CREATE SCHEMA IF NOT EXISTS communications;

-- =====================================================
-- ENUMS
-- =====================================================

CREATE TYPE communications.email_provider AS ENUM (
  'gmail',     -- Gmail API
  'sendgrid'   -- SendGrid API
);

CREATE TYPE communications.email_status AS ENUM (
  'pending',   -- Pendiente de envío
  'sent',      -- Enviado exitosamente
  'failed',    -- Falló el envío
  'bounced',   -- Rebotado
  'delivered'  -- Entregado (solo SendGrid)
);

-- =====================================================
-- EMAIL HISTORY TABLE
-- =====================================================

CREATE TABLE communications.email_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES core.organizations(id) ON DELETE SET NULL,
  order_id UUID REFERENCES billing.orders(id) ON DELETE SET NULL,
  
  -- Email details
  to_email TEXT NOT NULL,
  from_email TEXT,
  subject TEXT NOT NULL,
  body_html TEXT,
  body_text TEXT,
  
  -- Provider information
  provider communications.email_provider NOT NULL,
  provider_message_id TEXT, -- ID del mensaje en el proveedor (Gmail message ID o SendGrid message ID)
  
  -- Status
  status communications.email_status NOT NULL DEFAULT 'pending',
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  error_message TEXT,
  
  -- Timestamps
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_email_history_org ON communications.email_history(organization_id);
CREATE INDEX idx_email_history_order ON communications.email_history(order_id);
CREATE INDEX idx_email_history_status ON communications.email_history(status);
CREATE INDEX idx_email_history_provider ON communications.email_history(provider);
CREATE INDEX idx_email_history_created ON communications.email_history(created_at DESC);
CREATE INDEX idx_email_history_to_email ON communications.email_history(to_email);

-- =====================================================
-- VIEWS
-- =====================================================

-- Vista pública para obtener historial de emails con información relacionada
CREATE OR REPLACE VIEW public.email_history AS
SELECT 
  eh.id,
  eh.organization_id,
  eh.order_id,
  eh.to_email,
  eh.from_email,
  eh.subject,
  eh.body_html,
  eh.body_text,
  eh.provider,
  eh.provider_message_id,
  eh.status,
  eh.metadata,
  eh.error_message,
  eh.sent_at,
  eh.created_at,
  o.order_number,
  org.name as organization_name
FROM communications.email_history eh
LEFT JOIN billing.orders o ON o.id = eh.order_id
LEFT JOIN core.organizations org ON org.id = eh.organization_id;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE communications.email_history IS 'Historial de emails enviados desde el sistema';
COMMENT ON COLUMN communications.email_history.provider IS 'Proveedor usado: gmail o sendgrid';
COMMENT ON COLUMN communications.email_history.provider_message_id IS 'ID del mensaje en el proveedor (Gmail message ID o SendGrid message ID)';
COMMENT ON COLUMN communications.email_history.status IS 'Estado del email: pending, sent, failed, bounced, delivered';

-- =====================================================
-- GRANTS
-- =====================================================

GRANT SELECT ON public.email_history TO authenticated;
GRANT SELECT, INSERT, UPDATE ON communications.email_history TO service_role;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Tabla communications.email_history creada exitosamente';
  RAISE NOTICE '';
  RAISE NOTICE 'Tipos creados:';
  RAISE NOTICE '  ✅ email_provider: gmail, sendgrid';
  RAISE NOTICE '  ✅ email_status: pending, sent, failed, bounced, delivered';
END $$;

