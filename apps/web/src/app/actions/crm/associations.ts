"use server";

import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type AssociationType =
    | "contact"
    | "company"
    | "order"
    | "ticket"
    | "application"
    | "organization";
export type EntityType =
    | "ticket"
    | "order"
    | "organization"
    | "contact"
    | "user";

// ... (rest of imports/helpers)

/**
 * Helper to check if the current user belongs to the platform organization
 */
async function isPlatformOrganization(): Promise<boolean> {
    const supabase = await createClient();
    const serviceSupabase = createServiceRoleClient();

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    // Get user's active organization (use service role for schema access)
    const { data: userData } = await serviceSupabase
        .schema("core")
        .from("users")
        .select("active_organization_id")
        .eq("id", user.id)
        .single();

    if (!userData?.active_organization_id) return false;

    // Check if organization is platform type
    const { data: org } = await serviceSupabase
        .schema("core")
        .from("organizations")
        .select("org_type")
        .eq("id", userData.active_organization_id)
        .single();

    return org?.org_type === "platform";
}

const PAGE_SIZE = 10;

/**
 * Fetch entities with pagination (for initial list display)
 * Uses unified RPC functions that return both platform and CRM entities
 */
export async function fetchEntities(
    type: AssociationType,
    page: number = 0,
): Promise<{ success: boolean; data?: any[]; total?: number; error?: string }> {
    const supabase = await createClient();
    const offset = page * PAGE_SIZE;

    try {
        let data: any[] = [];
        let total = 0;

        switch (type) {
            case "contact": {
                const { data: results, error } = await supabase.rpc(
                    "fetch_association_contacts",
                    { p_offset: offset, p_limit: PAGE_SIZE },
                );

                if (error) {
                    console.error("Error fetching contacts:", error);
                    return { success: false, error: error.message };
                }

                if (results && results.length > 0) {
                    total = results[0].total_count;
                    data = results.map((r: any) => ({
                        id: r.id,
                        top_text: r.top_text,
                        sub_text: r.sub_text,
                        avatar: r.avatar,
                        source: r.source,
                        is_linked: r.is_linked,
                    }));
                }
                break;
            }

            case "company": {
                const { data: results, error } = await supabase.rpc(
                    "fetch_association_companies",
                    { p_offset: offset, p_limit: PAGE_SIZE },
                );

                if (error) {
                    console.error("Error fetching companies:", error);
                    return { success: false, error: error.message };
                }

                if (results && results.length > 0) {
                    total = results[0].total_count;
                    data = results.map((r: any) => ({
                        id: r.id,
                        top_text: r.top_text,
                        sub_text: r.sub_text,
                        source: r.source,
                        is_linked: r.is_linked,
                    }));
                }
                break;
            }

            case "order": {
                const { data: results, error } = await supabase.rpc(
                    "fetch_association_orders",
                    { p_offset: offset, p_limit: PAGE_SIZE },
                );

                if (error) {
                    console.error("Error fetching orders:", error);
                    return { success: false, error: error.message };
                }

                if (results && results.length > 0) {
                    total = results[0].total_count;
                    data = results.map((r: any) => ({
                        id: r.id,
                        top_text: r.top_text,
                        sub_text: r.sub_text,
                        source: "order",
                    }));
                }
                break;
            }

            case "ticket": {
                // Fetch tickets for association
                // First, get platform organization
                const { data: platformOrg } = await supabase
                    .from("organizations")
                    .select("id")
                    .eq("org_type", "platform")
                    .eq("status", "active")
                    .single();

                if (!platformOrg) {
                    return { success: false, error: "No se encontró la organización platform" };
                }

                const serviceSupabase = createServiceRoleClient();
                const { data: tickets, error, count } = await serviceSupabase
                    .from("tickets")
                    .select("id, ticket_number, subject, status", {
                        count: "exact",
                    })
                    .eq("organization_id", platformOrg.id)
                    .order("created_at", { ascending: false })
                    .range(offset, offset + PAGE_SIZE - 1);

                if (error) {
                    console.error("Error fetching tickets:", error);
                    return { success: false, error: error.message };
                }

                total = count || 0;
                data = (tickets || []).map((t: any) => ({
                    id: t.id,
                    top_text: `${t.ticket_number} ${t.subject}`,
                    sub_text: t.status,
                    source: "ticket",
                }));
                break;
            }

            case "application": {
                const serviceSupabase = createServiceRoleClient();
                const { data: apps, error, count } = await serviceSupabase
                    .schema("core")
                    .from("applications")
                    .select("id, name, slug", { count: "exact" })
                    .range(offset, offset + PAGE_SIZE - 1);

                if (error) {
                    console.error("Error fetching applications:", error);
                    return { success: false, error: error.message };
                }

                total = count || 0;
                data = (apps || []).map((a: any) => ({
                    id: a.id,
                    top_text: a.name,
                    sub_text: a.slug,
                    source: "application",
                }));
                break;
            }
        }

        return { success: true, data, total };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

export async function searchEntities(type: AssociationType, query: string) {
    const supabase = await createClient();
    const LIMIT = 10;

    try {
        let data: any[] = [];

        switch (type) {
            case "contact": {
                const { data: results, error } = await supabase.rpc(
                    "search_association_contacts",
                    { p_query: query, p_limit: LIMIT },
                );

                if (error) {
                    console.error("Error searching contacts:", error);
                    return { success: true, data: [] };
                }

                data = (results || []).map((r: any) => ({
                    id: r.id,
                    top_text: r.top_text,
                    sub_text: r.sub_text,
                    avatar: r.avatar,
                    source: r.source,
                    is_linked: r.is_linked,
                }));
                break;
            }

            case "company": {
                const { data: results, error } = await supabase.rpc(
                    "search_association_companies",
                    { p_query: query, p_limit: LIMIT },
                );

                if (error) {
                    console.error("Error searching companies:", error);
                    return { success: true, data: [] };
                }

                data = (results || []).map((r: any) => ({
                    id: r.id,
                    top_text: r.top_text,
                    sub_text: r.sub_text,
                    source: r.source,
                    is_linked: r.is_linked,
                }));
                break;
            }

            case "order": {
                const { data: results, error } = await supabase.rpc(
                    "search_association_orders",
                    { p_query: query, p_limit: LIMIT },
                );

                if (error) {
                    console.error("Error searching orders:", error);
                    return { success: true, data: [] };
                }

                data = (results || []).map((r: any) => ({
                    id: r.id,
                    top_text: r.top_text,
                    sub_text: r.sub_text,
                    source: "order",
                }));
                break;
            }

            case "ticket": {
                // First, get platform organization
                const { data: platformOrg } = await supabase
                    .from("organizations")
                    .select("id")
                    .eq("org_type", "platform")
                    .eq("status", "active")
                    .single();

                if (!platformOrg) {
                    return { success: true, data: [] };
                }

                const serviceSupabase = createServiceRoleClient();
                const { data: tickets, error } = await serviceSupabase
                    .from("tickets")
                    .select("id, ticket_number, subject, status")
                    .eq("organization_id", platformOrg.id)
                    .or(`ticket_number.ilike.%${query}%,subject.ilike.%${query}%`)
                    .limit(LIMIT);

                if (error) {
                    console.error("Error searching tickets:", error);
                    return { success: true, data: [] };
                }

                data = (tickets || []).map((t: any) => ({
                    id: t.id,
                    top_text: `${t.ticket_number} ${t.subject}`,
                    sub_text: t.status,
                    source: "ticket",
                }));
                break;
            }

            case "application": {
                const serviceSupabase = createServiceRoleClient();
                const { data: apps, error } = await serviceSupabase
                    .schema("core")
                    .from("applications")
                    .select("id, name, slug")
                    .ilike("name", `%${query}%`)
                    .limit(LIMIT);

                if (error) {
                    console.error("Error searching applications:", error);
                    return { success: true, data: [] };
                }

                data = (apps || []).map((a: any) => ({
                    id: a.id,
                    top_text: a.name,
                    sub_text: a.slug,
                    source: "application",
                }));
                break;
            }
        }

        return { success: true, data };
    } catch (err: any) {
        console.error("Unexpected error searching:", err);
        return { success: false, error: err.message };
    }
}

/**
 * Generic link function that works across all entity types
 * @param sourceType - The type of entity initiating the link (ticket, order, organization, contact)
 * @param sourceId - The ID of the source entity
 * @param targetType - The type of entity being linked to
 * @param targetId - The ID of the target entity
 * @param targetSource - For contacts/companies, whether it's 'platform' or 'crm'
 */
export async function linkEntityGeneric(
    sourceType: EntityType,
    sourceId: string,
    targetType: AssociationType,
    targetId: string,
    targetSource?: string,
) {
    const supabase = await createClient();
    const isPlatform = await isPlatformOrganization();

    try {
        let error = null;
        const linkKey = `${sourceType}-${targetType}`;

        switch (linkKey) {
            // Ticket associations (existing)
            case "ticket-contact":
                if (
                    targetSource === "platform" ||
                    (targetSource === undefined && isPlatform)
                ) {
                    const { error: e } = await supabase.rpc(
                        "link_ticket_user",
                        { p_ticket_id: sourceId, p_user_id: targetId },
                    );
                    error = e;
                } else {
                    const { error: e } = await supabase.rpc(
                        "link_ticket_contact",
                        { p_ticket_id: sourceId, p_contact_id: targetId },
                    );
                    error = e;
                }
                break;
            case "ticket-company":
                if (
                    targetSource === "platform" ||
                    (targetSource === undefined && isPlatform)
                ) {
                    const { error: e } = await supabase.rpc(
                        "link_ticket_organization",
                        { p_ticket_id: sourceId, p_organization_id: targetId },
                    );
                    error = e;
                } else {
                    const { error: e } = await supabase.rpc(
                        "link_ticket_company",
                        { p_ticket_id: sourceId, p_company_id: targetId },
                    );
                    error = e;
                }
                break;
            case "ticket-order":
                const { error: ticketOrderErr } = await supabase.rpc(
                    "link_ticket_order",
                    { p_ticket_id: sourceId, p_order_id: targetId },
                );
                error = ticketOrderErr;
                break;

            // Order associations (new)
            case "order-contact":
                if (targetSource === "platform") {
                    const { error: userOrderErr } = await supabase.rpc(
                        "link_user_order",
                        { p_user_id: targetId, p_order_id: sourceId },
                    );
                    error = userOrderErr;
                } else {
                    const { error: orderContactErr } = await supabase.rpc(
                        "link_contact_order",
                        { p_contact_id: targetId, p_order_id: sourceId },
                    );
                    error = orderContactErr;
                }
                break;
            case "order-organization":
            case "order-company":
                const { error: orderOrgErr } = await supabase.rpc(
                    "link_order_organization",
                    { p_order_id: sourceId, p_organization_id: targetId },
                );
                error = orderOrgErr;
                break;
            case "order-ticket":
                const { error: orderTicketErr } = await supabase.rpc(
                    "link_ticket_order",
                    { p_ticket_id: targetId, p_order_id: sourceId },
                );
                error = orderTicketErr;
                break;

            // Organization associations (new)
            case "organization-contact":
                if (targetSource === "platform") {
                    const { error: userOrgErr } = await supabase.rpc(
                        "link_user_organization_link",
                        { p_user_id: targetId, p_organization_id: sourceId },
                    );
                    error = userOrgErr;
                } else {
                    const { error: orgContactErr } = await supabase.rpc(
                        "link_contact_organization",
                        { p_contact_id: targetId, p_organization_id: sourceId },
                    );
                    error = orgContactErr;
                }
                break;
            case "organization-order":
                const { error: orgOrderErr } = await supabase.rpc(
                    "link_order_organization",
                    { p_order_id: targetId, p_organization_id: sourceId },
                );
                error = orgOrderErr;
                break;
            case "organization-ticket":
                const { error: orgTicketErr } = await supabase.rpc(
                    "link_ticket_organization",
                    { p_ticket_id: targetId, p_organization_id: sourceId },
                );
                error = orgTicketErr;
                break;

            // Contact associations (new)
            case "contact-order":
                const { error: contactOrderErr } = await supabase.rpc(
                    "link_contact_order",
                    { p_contact_id: sourceId, p_order_id: targetId },
                );
                error = contactOrderErr;
                break;
            case "contact-company":
                const { error: contactOrgErr } = await supabase.rpc(
                    "link_contact_organization",
                    { p_contact_id: sourceId, p_organization_id: targetId },
                );
                error = contactOrgErr;
                break;
            case "contact-ticket":
                const { error: contactTicketErr } = await supabase.rpc(
                    "link_ticket_contact",
                    { p_ticket_id: targetId, p_contact_id: sourceId },
                );
                error = contactTicketErr;
                break;

            // User associations (new)
            case "user-organization":
                const { error: userOrgErr } = await supabase.rpc(
                    "link_user_organization_link",
                    { p_user_id: sourceId, p_organization_id: targetId },
                );
                error = userOrgErr;
                break;
            case "user-order":
                const { error: userOrderErr } = await supabase.rpc(
                    "link_user_order",
                    { p_user_id: sourceId, p_order_id: targetId },
                );
                error = userOrderErr;
                break;
            case "user-ticket":
                const { error: userTicketErr } = await supabase.rpc(
                    "link_ticket_user",
                    { p_ticket_id: targetId, p_user_id: sourceId },
                );
                error = userTicketErr;
                break;

            // Organization Applications
            case "organization-application":
                const { error: appErr } = await supabase.rpc(
                    "enable_org_application",
                    { p_org_id: sourceId, p_app_id: targetId },
                );
                error = appErr;
                break;

            default:
                return {
                    success: false,
                    error: `Unsupported link: ${linkKey}`,
                };
        }

        if (error) {
            if (error.code === "23505") {
                return { success: false, error: "Ya está asociado" };
            }
            console.error(`Error linking ${linkKey}:`, error);
            return { success: false, error: error.message };
        }

        revalidatePath("/admin", "layout");
        return { success: true };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

/**
 * Generic unlink function
 */
export async function unlinkEntityGeneric(
    sourceType: EntityType,
    sourceId: string,
    targetType: AssociationType,
    targetId: string,
) {
    const supabase = await createClient();
    const isPlatform = await isPlatformOrganization();

    try {
        let error = null;
        const linkKey = `${sourceType}-${targetType}`;

        switch (linkKey) {
            // Ticket associations
            case "ticket-contact":
                if (isPlatform) {
                    const { error: e } = await supabase.rpc(
                        "unlink_ticket_user",
                        { p_ticket_id: sourceId, p_user_id: targetId },
                    );
                    error = e;
                } else {
                    const { error: e } = await supabase.rpc(
                        "unlink_ticket_contact",
                        { p_ticket_id: sourceId, p_contact_id: targetId },
                    );
                    error = e;
                }
                break;
            case "ticket-company":
                if (isPlatform) {
                    const { error: e } = await supabase.rpc(
                        "unlink_ticket_organization",
                        { p_ticket_id: sourceId, p_organization_id: targetId },
                    );
                    error = e;
                } else {
                    const { error: e } = await supabase.rpc(
                        "unlink_ticket_company",
                        { p_ticket_id: sourceId, p_company_id: targetId },
                    );
                    error = e;
                }
                break;
            case "ticket-order":
                const { error: ticketOrderErr } = await supabase.rpc(
                    "unlink_ticket_order",
                    { p_ticket_id: sourceId, p_order_id: targetId },
                );
                error = ticketOrderErr;
                break;

            // Order associations
            case "order-contact":
                // Try unlink user
                await supabase.rpc("unlink_user_order", {
                    p_user_id: targetId,
                    p_order_id: sourceId,
                });
                // Try unlink contact
                const { error: orderContactErr } = await supabase.rpc(
                    "unlink_contact_order",
                    { p_contact_id: targetId, p_order_id: sourceId },
                );
                error = orderContactErr;
                break;
            case "order-organization":
            case "order-company":
                const { error: orderOrgErr } = await supabase.rpc(
                    "unlink_order_organization",
                    { p_order_id: sourceId, p_organization_id: targetId },
                );
                error = orderOrgErr;
                break;
            case "order-ticket":
                const { error: orderTicketErr } = await supabase.rpc(
                    "unlink_ticket_order",
                    { p_ticket_id: targetId, p_order_id: sourceId },
                );
                error = orderTicketErr;
                break;

            // Organization associations
            case "organization-contact":
                // Try unlink user
                await supabase.rpc("unlink_user_organization_link", {
                    p_user_id: targetId,
                    p_organization_id: sourceId,
                });
                // Try unlink contact
                const { error: orgContactErr } = await supabase.rpc(
                    "unlink_contact_organization",
                    { p_contact_id: targetId, p_organization_id: sourceId },
                );
                error = orgContactErr;
                break;
            case "organization-order":
                const { error: orgOrderErr } = await supabase.rpc(
                    "unlink_order_organization",
                    { p_order_id: targetId, p_organization_id: sourceId },
                );
                error = orgOrderErr;
                break;
            case "organization-ticket":
                const { error: orgTicketErr } = await supabase.rpc(
                    "unlink_ticket_organization",
                    { p_ticket_id: targetId, p_organization_id: sourceId },
                );
                error = orgTicketErr;
                break;

            // Contact associations
            case "contact-order":
                const { error: contactOrderErr } = await supabase.rpc(
                    "unlink_contact_order",
                    { p_contact_id: sourceId, p_order_id: targetId },
                );
                error = contactOrderErr;
                break;
            case "contact-company":
                const { error: contactOrgErr } = await supabase.rpc(
                    "unlink_contact_organization",
                    { p_contact_id: sourceId, p_organization_id: targetId },
                );
                error = contactOrgErr;
                break;
            case "contact-ticket":
                const { error: contactTicketErr } = await supabase.rpc(
                    "unlink_ticket_contact",
                    { p_ticket_id: targetId, p_contact_id: sourceId },
                );
                error = contactTicketErr;
                break;

            // User associations
            case "user-organization":
                const { error: userOrgErr } = await supabase.rpc(
                    "unlink_user_organization_link",
                    { p_user_id: sourceId, p_organization_id: targetId },
                );
                error = userOrgErr;
                break;
            case "user-order":
                const { error: userOrderErr } = await supabase.rpc(
                    "unlink_user_order",
                    { p_user_id: sourceId, p_order_id: targetId },
                );
                error = userOrderErr;
                break;
            case "user-ticket":
                const { error: userTicketErr } = await supabase.rpc(
                    "unlink_ticket_user",
                    { p_ticket_id: targetId, p_user_id: sourceId },
                );
                error = userTicketErr;
                break;

            // Organization Applications
            case "organization-application":
                const { error: appErr } = await supabase.rpc(
                    "disable_org_application",
                    { p_org_id: sourceId, p_app_id: targetId },
                );
                error = appErr;
                break;

            default:
                return {
                    success: false,
                    error: `Unsupported unlink: ${linkKey}`,
                };
        }

        if (error) {
            console.error(`Error unlinking ${linkKey}:`, error);
            return { success: false, error: error.message };
        }

        revalidatePath("/admin", "layout");
        return { success: true };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

/**
 * Get associations for a specific entity
 */
export async function getEntityAssociations(
    entityType: EntityType,
    entityId: string,
): Promise<{ success: boolean; data?: any; error?: string }> {
    const supabase = await createClient();

    try {
        let rpcName = "";
        let paramName = "";

        switch (entityType) {
            case "ticket":
                rpcName = "get_ticket_associations";
                paramName = "p_ticket_id";
                break;
            case "order":
                rpcName = "get_order_associations";
                paramName = "p_order_id";
                break;
            case "organization":
                rpcName = "get_organization_associations";
                paramName = "p_organization_id";
                break;
            case "contact":
                rpcName = "get_contact_associations";
                paramName = "p_contact_id";
                break;
            case "user":
                rpcName = "get_user_associations";
                paramName = "p_user_id";
                break;
            default:
                return {
                    success: false,
                    error: `Unknown entity type: ${entityType}`,
                };
        }

        const { data, error } = await supabase.rpc(rpcName, {
            [paramName]: entityId,
        });

        if (error) {
            console.error(`Error getting ${entityType} associations:`, error);
            return { success: false, error: error.message };
        }

        return { success: true, data };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

// =====================================================
// Legacy functions for backward compatibility
// =====================================================

export async function linkEntity(
    ticketId: string,
    type: AssociationType,
    entityId: string,
    source?: string,
) {
    return linkEntityGeneric("ticket", ticketId, type, entityId, source);
}

export async function unlinkEntity(
    ticketId: string,
    type: AssociationType,
    entityId: string,
) {
    return unlinkEntityGeneric("ticket", ticketId, type, entityId);
}
