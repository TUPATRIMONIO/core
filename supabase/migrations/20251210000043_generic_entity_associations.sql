-- =====================================================
-- Migration: Generic Entity Associations
-- Description: Create M:N tables for Contacts, Orders, and Organizations
-- Created: 2025-12-11
-- =====================================================

SET search_path TO crm, core, public, extensions;

-- =====================================================
-- 1. Contact <-> Order (CRM Contact linked to an Order)
-- =====================================================

CREATE TABLE IF NOT EXISTS crm.contact_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id UUID NOT NULL REFERENCES crm.contacts(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES billing.orders(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT unique_contact_order UNIQUE (contact_id, order_id)
);

ALTER TABLE crm.contact_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on contact_orders"
ON crm.contact_orders FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_contact_orders_contact ON crm.contact_orders(contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_orders_order ON crm.contact_orders(order_id);

-- =====================================================
-- 2. Contact <-> Organization (CRM Contact linked to Platform Org)
-- =====================================================

CREATE TABLE IF NOT EXISTS crm.contact_organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id UUID NOT NULL REFERENCES crm.contacts(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT unique_contact_organization UNIQUE (contact_id, organization_id)
);

ALTER TABLE crm.contact_organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on contact_organizations"
ON crm.contact_organizations FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_contact_organizations_contact ON crm.contact_organizations(contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_organizations_org ON crm.contact_organizations(organization_id);

-- =====================================================
-- 3. Order <-> Organization (Extra associations beyond primary org)
-- =====================================================

CREATE TABLE IF NOT EXISTS crm.order_organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES billing.orders(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT unique_order_organization UNIQUE (order_id, organization_id)
);

ALTER TABLE crm.order_organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on order_organizations"
ON crm.order_organizations FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_order_organizations_order ON crm.order_organizations(order_id);
CREATE INDEX IF NOT EXISTS idx_order_organizations_org ON crm.order_organizations(organization_id);

-- =====================================================
-- 4. RPC Functions (Initial versions)
-- =====================================================

CREATE OR REPLACE FUNCTION public.link_contact_order(p_contact_id UUID, p_order_id UUID) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN INSERT INTO crm.contact_orders (contact_id, order_id) VALUES (p_contact_id, p_order_id) ON CONFLICT DO NOTHING; END; $$;

CREATE OR REPLACE FUNCTION public.unlink_contact_order(p_contact_id UUID, p_order_id UUID) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN DELETE FROM crm.contact_orders WHERE contact_id = p_contact_id AND order_id = p_order_id; END; $$;

CREATE OR REPLACE FUNCTION public.link_contact_organization(p_contact_id UUID, p_organization_id UUID) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN INSERT INTO crm.contact_organizations (contact_id, organization_id) VALUES (p_contact_id, p_organization_id) ON CONFLICT DO NOTHING; END; $$;

CREATE OR REPLACE FUNCTION public.unlink_contact_organization(p_contact_id UUID, p_organization_id UUID) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN DELETE FROM crm.contact_organizations WHERE contact_id = p_contact_id AND organization_id = p_organization_id; END; $$;

CREATE OR REPLACE FUNCTION public.link_order_organization(p_order_id UUID, p_organization_id UUID) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN INSERT INTO crm.order_organizations (order_id, organization_id) VALUES (p_order_id, p_organization_id) ON CONFLICT DO NOTHING; END; $$;

CREATE OR REPLACE FUNCTION public.unlink_order_organization(p_order_id UUID, p_organization_id UUID) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN DELETE FROM crm.order_organizations WHERE order_id = p_order_id AND organization_id = p_organization_id; END; $$;

-- Get Order Associations (Initial)
CREATE OR REPLACE FUNCTION public.get_order_associations(p_order_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'contacts', COALESCE((SELECT jsonb_agg(jsonb_build_object('id', c.id, 'name', COALESCE(c.full_name, c.email), 'subtext', c.email)) FROM crm.contact_orders co JOIN crm.contacts c ON c.id = co.contact_id WHERE co.order_id = p_order_id), '[]'::jsonb),
        'organizations', COALESCE((SELECT jsonb_agg(jsonb_build_object('id', o.id, 'name', o.name, 'subtext', COALESCE(o.industry, 'Organización'))) FROM crm.order_organizations oo JOIN core.organizations o ON o.id = oo.organization_id WHERE oo.order_id = p_order_id), '[]'::jsonb)
    ) INTO result;
    RETURN result;
END;
$$;
