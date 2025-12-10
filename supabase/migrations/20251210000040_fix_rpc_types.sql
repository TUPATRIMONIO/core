-- =====================================================
-- Migration: Fix RPC Type Mismatches
-- Description: Explicitly cast varchar columns to text in RPCs to avoid 42804 errors
-- Created: 2025-12-10
-- =====================================================

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
            COALESCE(NULLIF(TRIM(COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, '')), ''), au.email)::TEXT AS top_text,
            au.email::TEXT AS sub_text,
            u.avatar_url::TEXT AS avatar,
            'platform'::TEXT AS source,
            TRUE AS is_linked,
            1 AS priority
        FROM core.users u
        JOIN auth.users au ON u.id = au.id
        
        UNION ALL
        
        -- CRM contacts not linked to a user
        SELECT 
            c.id,
            COALESCE(c.full_name, c.email)::TEXT AS top_text,
            c.email::TEXT AS sub_text,
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
            COALESCE(NULLIF(TRIM(COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, '')), ''), au.email)::TEXT AS top_text,
            au.email::TEXT AS sub_text,
            u.avatar_url::TEXT AS avatar,
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
            COALESCE(c.full_name, c.email)::TEXT AS top_text,
            c.email::TEXT AS sub_text,
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

-- Unified fetch companies (ensure casting here too for safety)
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
            o.name::TEXT AS top_text,
            COALESCE(o.industry, 'Organización')::TEXT AS sub_text,
            'platform'::TEXT AS source,
            TRUE AS is_linked,
            1 AS priority
        FROM core.organizations o
        
        UNION ALL
        
        -- CRM companies not linked
        SELECT 
            c.id,
            c.name::TEXT AS top_text,
            COALESCE(c.industry, 'Empresa CRM')::TEXT AS sub_text,
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
            o.name::TEXT AS top_text,
            COALESCE(o.industry, 'Organización')::TEXT AS sub_text,
            'platform'::TEXT AS source,
            TRUE AS is_linked,
            1 AS priority
        FROM core.organizations o
        WHERE o.name ILIKE '%' || p_query || '%'
        
        UNION ALL
        
        SELECT 
            c.id,
            c.name::TEXT AS top_text,
            COALESCE(c.industry, 'Empresa CRM')::TEXT AS sub_text,
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
