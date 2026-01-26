-- Migration: Add Support Tickets Handling to User Deletion
-- Description: Updates delete_user_with_cleanup to handle support_tickets foreign key constraint
-- Created: 2026-01-23

-- Recreate the delete function with support_tickets handling
CREATE OR REPLACE FUNCTION public.delete_user_with_cleanup(
    p_user_id UUID, 
    p_reassign_to UUID DEFAULT NULL, 
    p_delete_data BOOLEAN DEFAULT FALSE
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, core, crm, signing, billing, communications, auth
AS $$
BEGIN
    -- 1. Verificar permisos
    IF NOT public.is_platform_admin() THEN
        RAISE EXCEPTION 'No tienes permisos para realizar esta acción';
    END IF;

    -- 2. No permitir borrarse a sí mismo
    IF p_user_id = auth.uid() THEN
        RAISE EXCEPTION 'No puedes eliminar tu propio usuario';
    END IF;

    -- 3. Manejar reasignación o eliminación de datos dependientes
    
    -- CRM Tickets
    IF p_reassign_to IS NOT NULL THEN
        UPDATE crm.tickets SET assigned_to = p_reassign_to WHERE assigned_to = p_user_id;
        UPDATE crm.tickets SET created_by = p_reassign_to WHERE created_by = p_user_id;
        UPDATE crm.deals SET assigned_to = p_reassign_to WHERE assigned_to = p_user_id;
        UPDATE signing.documents SET created_by = p_reassign_to WHERE created_by = p_user_id;
        UPDATE signing.documents SET manager_id = p_reassign_to WHERE manager_id = p_user_id;
        
        -- Support Tickets
        UPDATE communications.support_tickets SET user_id = p_reassign_to WHERE user_id = p_user_id;
        UPDATE communications.ticket_messages SET sender_id = p_reassign_to WHERE sender_id = p_user_id;
    ELSIF p_delete_data THEN
        UPDATE crm.tickets SET assigned_to = NULL WHERE assigned_to = p_user_id;
        UPDATE crm.tickets SET created_by = NULL WHERE created_by = p_user_id;
        UPDATE crm.deals SET assigned_to = NULL WHERE assigned_to = p_user_id;
        UPDATE billing.orders SET created_by_user_id = NULL WHERE created_by_user_id = p_user_id;
        
        -- Support Tickets - Desvincular usuario pero mantener email
        UPDATE communications.support_tickets SET user_id = NULL WHERE user_id = p_user_id;
        UPDATE communications.ticket_messages SET sender_id = NULL WHERE sender_id = p_user_id;
    END IF;

    -- Core Teams (Liderazgo)
    IF p_reassign_to IS NOT NULL THEN
        UPDATE core.teams SET lead_user_id = p_reassign_to WHERE lead_user_id = p_user_id;
    ELSE
        UPDATE core.teams SET lead_user_id = NULL WHERE lead_user_id = p_user_id;
    END IF;

    -- API Keys
    UPDATE core.api_keys SET is_active = FALSE, revoked_at = NOW(), revoked_by = auth.uid() WHERE created_by = p_user_id;

    -- Eliminar de core.users (esto debería eliminar de auth.users por CASCADE)
    DELETE FROM core.users WHERE id = p_user_id;

    -- Si core.users no tiene CASCADE a auth.users, eliminamos manualmente
    DELETE FROM auth.users WHERE id = p_user_id;

    -- Registrar evento
    INSERT INTO core.system_events (event_type, event_level, message, user_id, metadata)
    VALUES ('user_deleted', 'warning', 'Usuario eliminado permanentemente: ' || p_user_id::text, auth.uid(), 
    jsonb_build_object('deleted_user_id', p_user_id, 'reassigned_to', p_reassign_to, 'data_deleted', p_delete_data));

    RETURN TRUE;
END;
$$;

-- Actualizar también la función de dependencias para incluir support_tickets
CREATE OR REPLACE FUNCTION public.get_user_dependencies(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, core, crm, signing, billing, communications
AS $$
DECLARE
    result JSONB;
BEGIN
    IF NOT public.is_platform_admin() THEN
        RAISE EXCEPTION 'No tienes permisos para realizar esta acción';
    END IF;

    result = jsonb_build_object(
        'organization_users', (SELECT count(*) FROM core.organization_users WHERE user_id = p_user_id),
        'team_members', (SELECT count(*) FROM core.team_members WHERE user_id = p_user_id),
        'team_leads', (SELECT count(*) FROM core.teams WHERE lead_user_id = p_user_id),
        'tickets_assigned', (SELECT count(*) FROM crm.tickets WHERE assigned_to = p_user_id),
        'tickets_created', (SELECT count(*) FROM crm.tickets WHERE created_by = p_user_id),
        'deals_assigned', (SELECT count(*) FROM crm.deals WHERE assigned_to = p_user_id),
        'orders_created', (SELECT count(*) FROM billing.orders WHERE created_by_user_id = p_user_id),
        'signing_documents', (SELECT count(*) FROM signing.documents WHERE created_by = p_user_id),
        'invitations_sent', (SELECT count(*) FROM core.invitations WHERE invited_by = p_user_id),
        'api_keys_created', (SELECT count(*) FROM core.api_keys WHERE created_by = p_user_id),
        'feedback_submitted', (SELECT count(*) FROM public.user_feedback WHERE user_id = p_user_id),
        'email_accounts', (SELECT count(*) FROM communications.email_accounts WHERE owner_user_id = p_user_id),
        'support_tickets', (SELECT count(*) FROM communications.support_tickets WHERE user_id = p_user_id)
    );

    RETURN result;
END;
$$;
