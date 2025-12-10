-- Unified Contact/Company Linking Strategy
-- Links CRM contacts/companies with core users/organizations
-- FIXED: Joins auth.users for email access since core.users doesn't have email column

-- ============================================
-- 1. Add linking columns to CRM tables
-- ============================================

-- Link contacts to platform users
ALTER TABLE crm.contacts 
ADD COLUMN IF NOT EXISTS linked_user_id UUID REFERENCES core.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_contacts_linked_user 
ON crm.contacts(linked_user_id) WHERE linked_user_id IS NOT NULL;

-- Link companies to platform organizations
ALTER TABLE crm.companies 
ADD COLUMN IF NOT EXISTS linked_organization_id UUID REFERENCES core.organizations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_companies_linked_org 
ON crm.companies(linked_organization_id) WHERE linked_organization_id IS NOT NULL;

-- ============================================
-- 2. Auto-link triggers
-- ============================================

-- Trigger: When a CRM contact is created, check if user exists by email in auth.users AND core.users
CREATE OR REPLACE FUNCTION crm.auto_link_contact_to_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Only try to link if not already linked and has email
    IF NEW.linked_user_id IS NULL AND NEW.email IS NOT NULL THEN
        SELECT u.id INTO NEW.linked_user_id
        FROM core.users u
        JOIN auth.users au ON u.id = au.id
        WHERE LOWER(au.email) = LOWER(NEW.email)
        LIMIT 1;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_auto_link_contact ON crm.contacts;
CREATE TRIGGER trg_auto_link_contact
    BEFORE INSERT OR UPDATE OF email ON crm.contacts
    FOR EACH ROW
    EXECUTE FUNCTION crm.auto_link_contact_to_user();

-- Trigger: When a platform user is created, link existing CRM contacts
-- Note: NEW.email might not be available in core.users trigger if column doesn't exist, need to lookup in auth.users
CREATE OR REPLACE FUNCTION core.auto_link_user_to_contacts()
RETURNS TRIGGER AS $$
DECLARE
    user_email TEXT;
BEGIN
    -- Get email from auth.users
    SELECT email INTO user_email FROM auth.users WHERE id = NEW.id;

    -- Update any CRM contacts with matching email
    IF user_email IS NOT NULL THEN
        UPDATE crm.contacts
        SET linked_user_id = NEW.id
        WHERE LOWER(email) = LOWER(user_email)
          AND linked_user_id IS NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_auto_link_user ON core.users;
CREATE TRIGGER trg_auto_link_user
    AFTER INSERT ON core.users
    FOR EACH ROW
    EXECUTE FUNCTION core.auto_link_user_to_contacts();

-- Trigger: When a CRM company is created, check if org exists by name
CREATE OR REPLACE FUNCTION crm.auto_link_company_to_org()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.linked_organization_id IS NULL AND NEW.name IS NOT NULL THEN
        SELECT id INTO NEW.linked_organization_id
        FROM core.organizations
        WHERE LOWER(name) = LOWER(NEW.name)
        LIMIT 1;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_auto_link_company ON crm.companies;
CREATE TRIGGER trg_auto_link_company
    BEFORE INSERT OR UPDATE OF name ON crm.companies
    FOR EACH ROW
    EXECUTE FUNCTION crm.auto_link_company_to_org();

-- ============================================
-- 3. Backfill existing data
-- ============================================

-- Link existing contacts to users by email (joining auth.users)
UPDATE crm.contacts c
SET linked_user_id = u.id
FROM core.users u
JOIN auth.users au ON u.id = au.id
WHERE LOWER(c.email) = LOWER(au.email)
  AND c.linked_user_id IS NULL;

-- Link existing companies to organizations by name
UPDATE crm.companies c
SET linked_organization_id = o.id
FROM core.organizations o
WHERE LOWER(c.name) = LOWER(o.name)
  AND c.linked_organization_id IS NULL;

-- ============================================
-- 4. Updated RPC functions for unified search
-- ============================================

-- Drop old functions first
DROP FUNCTION IF EXISTS public.fetch_association_contacts(BOOLEAN, INT, INT);
DROP FUNCTION IF EXISTS public.fetch_association_companies(BOOLEAN, INT, INT);
DROP FUNCTION IF EXISTS public.search_association_contacts(BOOLEAN, TEXT, INT);
DROP FUNCTION IF EXISTS public.search_association_companies(BOOLEAN, TEXT, INT);
DROP FUNCTION IF EXISTS public.fetch_association_contacts(INT, INT);
DROP FUNCTION IF EXISTS public.fetch_association_companies(INT, INT);
DROP FUNCTION IF EXISTS public.search_association_contacts(TEXT, INT);
DROP FUNCTION IF EXISTS public.search_association_companies(TEXT, INT);

-- Unified fetch contacts: returns both sources, deduplicates by email
CREATE OR REPLACE FUNCTION public.fetch_association_contacts(
    p_offset INT DEFAULT 0,
    p_limit INT DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    top_text TEXT,
    sub_text TEXT,
    avatar TEXT,
    source TEXT,
    is_linked BOOLEAN,
    total_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_total BIGINT;
BEGIN
    -- Count unique contacts (platform users + unlinked CRM contacts)
    SELECT COUNT(*) INTO v_total FROM (
        SELECT u.id FROM core.users u
        UNION
        SELECT c.id FROM crm.contacts c WHERE c.linked_user_id IS NULL
    ) unified;
    
    RETURN QUERY
    WITH unified_contacts AS (
        -- Platform users first (joining auth.users for email)
        SELECT 
            u.id,
            COALESCE(NULLIF(TRIM(COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, '')), ''), au.email) AS top_text,
            au.email AS sub_text,
            u.avatar_url AS avatar,
            'platform'::TEXT AS source,
            TRUE AS is_linked,
            1 AS priority
        FROM core.users u
        JOIN auth.users au ON u.id = au.id
        
        UNION ALL
        
        -- CRM contacts not linked to a user
        SELECT 
            c.id,
            COALESCE(c.full_name, c.email) AS top_text,
            c.email AS sub_text,
            NULL::TEXT AS avatar,
            'crm'::TEXT AS source,
            FALSE AS is_linked,
            2 AS priority
        FROM crm.contacts c
        WHERE c.linked_user_id IS NULL
    )
    SELECT 
        uc.id,
        uc.top_text,
        uc.sub_text,
        uc.avatar,
        uc.source,
        uc.is_linked,
        v_total AS total_count
    FROM unified_contacts uc
    ORDER BY uc.priority, uc.top_text
    OFFSET p_offset
    LIMIT p_limit;
END;
$$;

-- Unified fetch companies (unchanged mostly, but redefined for safety)
CREATE OR REPLACE FUNCTION public.fetch_association_companies(
    p_offset INT DEFAULT 0,
    p_limit INT DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    top_text TEXT,
    sub_text TEXT,
    source TEXT,
    is_linked BOOLEAN,
    total_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_total BIGINT;
BEGIN
    SELECT COUNT(*) INTO v_total FROM (
        SELECT o.id FROM core.organizations o
        UNION
        SELECT c.id FROM crm.companies c WHERE c.linked_organization_id IS NULL
    ) unified;
    
    RETURN QUERY
    WITH unified_companies AS (
        -- Platform organizations first
        SELECT 
            o.id,
            o.name AS top_text,
            COALESCE(o.industry, 'Organización') AS sub_text,
            'platform'::TEXT AS source,
            TRUE AS is_linked,
            1 AS priority
        FROM core.organizations o
        
        UNION ALL
        
        -- CRM companies not linked
        SELECT 
            c.id,
            c.name AS top_text,
            COALESCE(c.industry, 'Empresa CRM') AS sub_text,
            'crm'::TEXT AS source,
            FALSE AS is_linked,
            2 AS priority
        FROM crm.companies c
        WHERE c.linked_organization_id IS NULL
    )
    SELECT 
        uc.id,
        uc.top_text,
        uc.sub_text,
        uc.source,
        uc.is_linked,
        v_total AS total_count
    FROM unified_companies uc
    ORDER BY uc.priority, uc.top_text
    OFFSET p_offset
    LIMIT p_limit;
END;
$$;

-- Unified search contacts
CREATE OR REPLACE FUNCTION public.search_association_contacts(
    p_query TEXT,
    p_limit INT DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    top_text TEXT,
    sub_text TEXT,
    avatar TEXT,
    source TEXT,
    is_linked BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH unified_contacts AS (
        SELECT 
            u.id,
            COALESCE(NULLIF(TRIM(COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, '')), ''), au.email) AS top_text,
            au.email AS sub_text,
            u.avatar_url AS avatar,
            'platform'::TEXT AS source,
            TRUE AS is_linked,
            1 AS priority
        FROM core.users u
        JOIN auth.users au ON u.id = au.id
        WHERE 
            u.first_name ILIKE '%' || p_query || '%' OR
            u.last_name ILIKE '%' || p_query || '%' OR
            au.email ILIKE '%' || p_query || '%'
        
        UNION ALL
        
        SELECT 
            c.id,
            COALESCE(c.full_name, c.email) AS top_text,
            c.email AS sub_text,
            NULL::TEXT AS avatar,
            'crm'::TEXT AS source,
            FALSE AS is_linked,
            2 AS priority
        FROM crm.contacts c
        WHERE c.linked_user_id IS NULL
          AND (c.full_name ILIKE '%' || p_query || '%' OR c.email ILIKE '%' || p_query || '%')
    )
    SELECT 
        uc.id,
        uc.top_text,
        uc.sub_text,
        uc.avatar,
        uc.source,
        uc.is_linked
    FROM unified_contacts uc
    ORDER BY uc.priority, uc.top_text
    LIMIT p_limit;
END;
$$;

-- Unified search companies
CREATE OR REPLACE FUNCTION public.search_association_companies(
    p_query TEXT,
    p_limit INT DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    top_text TEXT,
    sub_text TEXT,
    source TEXT,
    is_linked BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH unified_companies AS (
        SELECT 
            o.id,
            o.name AS top_text,
            COALESCE(o.industry, 'Organización') AS sub_text,
            'platform'::TEXT AS source,
            TRUE AS is_linked,
            1 AS priority
        FROM core.organizations o
        WHERE o.name ILIKE '%' || p_query || '%'
        
        UNION ALL
        
        SELECT 
            c.id,
            c.name AS top_text,
            COALESCE(c.industry, 'Empresa CRM') AS sub_text,
            'crm'::TEXT AS source,
            FALSE AS is_linked,
            2 AS priority
        FROM crm.companies c
        WHERE c.linked_organization_id IS NULL
          AND c.name ILIKE '%' || p_query || '%'
    )
    SELECT 
        uc.id,
        uc.top_text,
        uc.sub_text,
        uc.source,
        uc.is_linked
    FROM unified_companies uc
    ORDER BY uc.priority, uc.top_text
    LIMIT p_limit;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.fetch_association_contacts TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.fetch_association_companies TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.search_association_contacts TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.search_association_companies TO authenticated, service_role;
