-- =====================================================
-- Migration: Ticket Associations (Many-to-Many)
-- Description: Create link tables for Tickets <-> Companies and Tickets <-> Orders
-- Created: 2025-12-10
-- =====================================================

SET search_path TO crm, billing, core, public, extensions;

-- =====================================================
-- 1. Ticket <-> Companies (Organizations)
-- =====================================================

CREATE TABLE IF NOT EXISTS crm.ticket_companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES crm.tickets(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES crm.companies(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Prevent duplicate links
    CONSTRAINT unique_ticket_company UNIQUE (ticket_id, company_id)
);

-- Enable RLS
ALTER TABLE crm.ticket_companies ENABLE ROW LEVEL SECURITY;

-- Policies (Inherit from Ticket access usually, but for now allow organization members)
CREATE POLICY "Users can view ticket_companies of their org"
ON crm.ticket_companies FOR SELECT
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

CREATE POLICY "Users can create ticket_companies in their org"
ON crm.ticket_companies FOR INSERT
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

CREATE POLICY "Users can delete ticket_companies in their org"
ON crm.ticket_companies FOR DELETE
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ticket_companies_ticket ON crm.ticket_companies(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_companies_company ON crm.ticket_companies(company_id);

-- =====================================================
-- 2. Ticket <-> Orders (Pedidos)
-- =====================================================

CREATE TABLE IF NOT EXISTS crm.ticket_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES crm.tickets(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES billing.orders(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Prevent duplicate links
    CONSTRAINT unique_ticket_order UNIQUE (ticket_id, order_id)
);

-- Enable RLS
ALTER TABLE crm.ticket_orders ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view ticket_orders of their org"
ON crm.ticket_orders FOR SELECT
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

CREATE POLICY "Users can create ticket_orders in their org"
ON crm.ticket_orders FOR INSERT
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

CREATE POLICY "Users can delete ticket_orders in their org"
ON crm.ticket_orders FOR DELETE
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ticket_orders_ticket ON crm.ticket_orders(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_orders_order ON crm.ticket_orders(order_id);

-- =====================================================
-- 3. Ticket <-> Contacts (Ensure it exists as per previous assumption)
-- =====================================================

-- Verify ticket_contacts exists (it was referenced in code, but good to be safe)
CREATE TABLE IF NOT EXISTS crm.ticket_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES crm.tickets(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES crm.contacts(id) ON DELETE CASCADE,
    contact_role TEXT DEFAULT 'participant', -- 'primary', 'participant', 'cc'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT unique_ticket_contact UNIQUE (ticket_id, contact_id)
);

-- Enable RLS for ticket_contacts if newly created
ALTER TABLE crm.ticket_contacts ENABLE ROW LEVEL SECURITY;

-- Policies (Safe to re-run if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ticket_contacts' AND policyname = 'Users can view ticket_contacts of their org') THEN
        CREATE POLICY "Users can view ticket_contacts of their org"
        ON crm.ticket_contacts FOR SELECT
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

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ticket_contacts' AND policyname = 'Users can create ticket_contacts in their org') THEN
        CREATE POLICY "Users can create ticket_contacts in their org"
        ON crm.ticket_contacts FOR INSERT
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

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ticket_contacts' AND policyname = 'Users can delete ticket_contacts in their org') THEN
        CREATE POLICY "Users can delete ticket_contacts in their org"
        ON crm.ticket_contacts FOR DELETE
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
CREATE INDEX IF NOT EXISTS idx_ticket_contacts_ticket ON crm.ticket_contacts(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_contacts_contact ON crm.ticket_contacts(contact_id);

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Tablas de asociación (Companies, Orders, Contacts) configuradas exitosamente';
END $$;
