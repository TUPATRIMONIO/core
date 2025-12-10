-- RPC functions for linking entities to tickets
-- This allows access to the 'crm' schema which is not exposed via PostgREST

-- ============================================
-- CONTACTS / USERS
-- ============================================

-- Link Ticket -> User (Platform)
CREATE OR REPLACE FUNCTION public.link_ticket_user(
    p_ticket_id UUID,
    p_user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO crm.ticket_users (ticket_id, user_id)
    VALUES (p_ticket_id, p_user_id)
    ON CONFLICT DO NOTHING;
END;
$$;

-- Unlink Ticket -> User (Platform)
CREATE OR REPLACE FUNCTION public.unlink_ticket_user(
    p_ticket_id UUID,
    p_user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM crm.ticket_users
    WHERE ticket_id = p_ticket_id AND user_id = p_user_id;
END;
$$;

-- Link Ticket -> Contact (CRM)
CREATE OR REPLACE FUNCTION public.link_ticket_contact(
    p_ticket_id UUID,
    p_contact_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO crm.ticket_contacts (ticket_id, contact_id)
    VALUES (p_ticket_id, p_contact_id)
    ON CONFLICT DO NOTHING;
END;
$$;

-- Unlink Ticket -> Contact (CRM)
CREATE OR REPLACE FUNCTION public.unlink_ticket_contact(
    p_ticket_id UUID,
    p_contact_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM crm.ticket_contacts
    WHERE ticket_id = p_ticket_id AND contact_id = p_contact_id;
END;
$$;


-- ============================================
-- COMPANIES / ORGANIZATIONS
-- ============================================

-- Link Ticket -> Organization (Platform)
CREATE OR REPLACE FUNCTION public.link_ticket_organization(
    p_ticket_id UUID,
    p_organization_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO crm.ticket_organizations (ticket_id, organization_id)
    VALUES (p_ticket_id, p_organization_id)
    ON CONFLICT DO NOTHING;
END;
$$;

-- Unlink Ticket -> Organization (Platform)
CREATE OR REPLACE FUNCTION public.unlink_ticket_organization(
    p_ticket_id UUID,
    p_organization_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM crm.ticket_organizations
    WHERE ticket_id = p_ticket_id AND organization_id = p_organization_id;
END;
$$;

-- Link Ticket -> Company (CRM)
CREATE OR REPLACE FUNCTION public.link_ticket_company(
    p_ticket_id UUID,
    p_company_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO crm.ticket_companies (ticket_id, company_id)
    VALUES (p_ticket_id, p_company_id)
    ON CONFLICT DO NOTHING;
END;
$$;

-- Unlink Ticket -> Company (CRM)
CREATE OR REPLACE FUNCTION public.unlink_ticket_company(
    p_ticket_id UUID,
    p_company_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM crm.ticket_companies
    WHERE ticket_id = p_ticket_id AND company_id = p_company_id;
END;
$$;


-- ============================================
-- ORDERS
-- ============================================

-- Link Ticket -> Order
CREATE OR REPLACE FUNCTION public.link_ticket_order(
    p_ticket_id UUID,
    p_order_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO crm.ticket_orders (ticket_id, order_id)
    VALUES (p_ticket_id, p_order_id)
    ON CONFLICT DO NOTHING;
END;
$$;

-- Unlink Ticket -> Order
CREATE OR REPLACE FUNCTION public.unlink_ticket_order(
    p_ticket_id UUID,
    p_order_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM crm.ticket_orders
    WHERE ticket_id = p_ticket_id AND order_id = p_order_id;
END;
$$;

-- Grant Execute Permissions
GRANT EXECUTE ON FUNCTION public.link_ticket_user TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.unlink_ticket_user TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.link_ticket_contact TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.unlink_ticket_contact TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.link_ticket_organization TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.unlink_ticket_organization TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.link_ticket_company TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.unlink_ticket_company TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.link_ticket_order TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.unlink_ticket_order TO authenticated, service_role;
