-- =====================================================
-- Migration: Create missing ticket link tables
-- Description: Create link tables for Tickets <-> Core Users and Tickets <-> Core Organizations
-- Created: 2025-12-10
-- =====================================================

SET search_path TO crm, core, public, extensions;

-- =====================================================
-- 1. Ticket <-> Core Users
-- =====================================================

CREATE TABLE IF NOT EXISTS crm.ticket_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES crm.tickets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Prevent duplicate links
    CONSTRAINT unique_ticket_user UNIQUE (ticket_id, user_id)
);

-- Enable RLS
ALTER TABLE crm.ticket_users ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ticket_users' AND policyname = 'Users can view ticket_users of their org') THEN
        CREATE POLICY "Users can view ticket_users of their org"
        ON crm.ticket_users FOR SELECT
        USING (
          EXISTS (
            SELECT 1 FROM crm.tickets t
            WHERE t.id = ticket_id
            AND t.organization_id IN (
                SELECT organization_id FROM core.organization_users 
                WHERE user_id = auth.uid() AND status = 'active'
            )
          )
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ticket_users' AND policyname = 'Users can create ticket_users in their org') THEN
        CREATE POLICY "Users can create ticket_users in their org"
        ON crm.ticket_users FOR INSERT
        WITH CHECK (
          EXISTS (
            SELECT 1 FROM crm.tickets t
            WHERE t.id = ticket_id
            AND t.organization_id IN (
                SELECT organization_id FROM core.organization_users 
                WHERE user_id = auth.uid() AND status = 'active'
            )
          )
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ticket_users' AND policyname = 'Users can delete ticket_users in their org') THEN
        CREATE POLICY "Users can delete ticket_users in their org"
        ON crm.ticket_users FOR DELETE
        USING (
          EXISTS (
            SELECT 1 FROM crm.tickets t
            WHERE t.id = ticket_id
            AND t.organization_id IN (
                SELECT organization_id FROM core.organization_users 
                WHERE user_id = auth.uid() AND status = 'active'
            )
          )
        );
    END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ticket_users_ticket ON crm.ticket_users(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_users_user ON crm.ticket_users(user_id);


-- =====================================================
-- 2. Ticket <-> Core Organizations
-- =====================================================

CREATE TABLE IF NOT EXISTS crm.ticket_organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES crm.tickets(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Prevent duplicate links
    CONSTRAINT unique_ticket_organization UNIQUE (ticket_id, organization_id)
);

-- Enable RLS
ALTER TABLE crm.ticket_organizations ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ticket_organizations' AND policyname = 'Users can view ticket_organizations of their org') THEN
        CREATE POLICY "Users can view ticket_organizations of their org"
        ON crm.ticket_organizations FOR SELECT
        USING (
          EXISTS (
            SELECT 1 FROM crm.tickets t
            WHERE t.id = ticket_id
            AND t.organization_id IN (
                SELECT organization_id FROM core.organization_users 
                WHERE user_id = auth.uid() AND status = 'active'
            )
          )
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ticket_organizations' AND policyname = 'Users can create ticket_organizations in their org') THEN
        CREATE POLICY "Users can create ticket_organizations in their org"
        ON crm.ticket_organizations FOR INSERT
        WITH CHECK (
          EXISTS (
            SELECT 1 FROM crm.tickets t
            WHERE t.id = ticket_id
            AND t.organization_id IN (
                SELECT organization_id FROM core.organization_users 
                WHERE user_id = auth.uid() AND status = 'active'
            )
          )
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ticket_organizations' AND policyname = 'Users can delete ticket_organizations in their org') THEN
        CREATE POLICY "Users can delete ticket_organizations in their org"
        ON crm.ticket_organizations FOR DELETE
        USING (
          EXISTS (
            SELECT 1 FROM crm.tickets t
            WHERE t.id = ticket_id
            AND t.organization_id IN (
                SELECT organization_id FROM core.organization_users 
                WHERE user_id = auth.uid() AND status = 'active'
            )
          )
        );
    END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ticket_organizations_ticket ON crm.ticket_organizations(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_organizations_organization ON crm.ticket_organizations(organization_id);

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Tablas de asociación ticket_users y ticket_organizations creadas exitosamente';
END $$;
