-- =====================================================
-- Migration: Create Notifications Schema
-- Description: Sistema de notificaciones para eventos de billing y otros
-- Created: 2025-11-22
-- =====================================================

SET search_path TO core, public, extensions;

-- =====================================================
-- ENUMS
-- =====================================================

CREATE TYPE core.notification_type AS ENUM (
  'credits_added',
  'credits_low',
  'payment_succeeded',
  'payment_failed',
  'auto_recharge_executed',
  'auto_recharge_failed',
  'subscription_created',
  'subscription_updated',
  'subscription_cancelled',
  'invoice_paid',
  'invoice_overdue',
  'general'
);

CREATE TYPE core.notification_status AS ENUM ('unread', 'read', 'archived');

-- =====================================================
-- NOTIFICATIONS TABLE
-- =====================================================

CREATE TABLE core.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Multi-tenancy
  organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES core.users(id) ON DELETE CASCADE, -- NULL = notificación para toda la organización
  
  -- Notification details
  type core.notification_type NOT NULL,
  status core.notification_status NOT NULL DEFAULT 'unread',
  title TEXT NOT NULL CHECK (length(title) >= 1 AND length(title) <= 200),
  message TEXT NOT NULL CHECK (length(message) >= 1 AND length(message) <= 1000),
  
  -- Action link (opcional)
  action_url TEXT,
  action_label TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::JSONB, -- Datos adicionales (ej: amount, invoice_id, etc.)
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at TIMESTAMPTZ,
  
  -- Indexes
  CONSTRAINT valid_action CHECK (
    (action_url IS NULL AND action_label IS NULL) OR
    (action_url IS NOT NULL AND action_label IS NOT NULL)
  )
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_notifications_org_user ON core.notifications(organization_id, user_id, status);
CREATE INDEX idx_notifications_created ON core.notifications(created_at DESC);
CREATE INDEX idx_notifications_type ON core.notifications(type);
CREATE INDEX idx_notifications_status ON core.notifications(status);

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE core.notifications IS 'Notificaciones para usuarios y organizaciones';
COMMENT ON COLUMN core.notifications.user_id IS 'NULL = notificación para todos los usuarios de la organización';
COMMENT ON COLUMN core.notifications.metadata IS 'Datos adicionales en formato JSON (ej: {"amount": 500, "invoice_id": "..."})';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Schema de notificaciones creado';
  RAISE NOTICE '';
  RAISE NOTICE 'Tablas creadas:';
  RAISE NOTICE '  ✅ notifications';
END $$;

