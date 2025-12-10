"use server";

import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type AssociationType = "contact" | "company" | "order";

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
        }

        return { success: true, data };
    } catch (err: any) {
        console.error("Unexpected error searching:", err);
        return { success: false, error: err.message };
    }
}

export async function linkEntity(
    ticketId: string,
    type: AssociationType,
    entityId: string,
    source?: string,
) {
    const supabase = await createClient();
    const isPlatform = await isPlatformOrganization();

    try {
        let error = null;

        switch (type) {
            case "contact":
                if (
                    source === "platform" ||
                    (source === undefined && isPlatform)
                ) {
                    // Platform: Link to core.users via ticket_users
                    const { error: userLinkError } = await supabase.rpc(
                        "link_ticket_user",
                        { p_ticket_id: ticketId, p_user_id: entityId },
                    );
                    error = userLinkError;
                } else {
                    // Client: Link to crm.contacts via ticket_contacts
                    const { error: contactLinkError } = await supabase.rpc(
                        "link_ticket_contact",
                        { p_ticket_id: ticketId, p_contact_id: entityId },
                    );
                    error = contactLinkError;
                }
                break;

            case "company":
                if (
                    source === "platform" ||
                    (source === undefined && isPlatform)
                ) {
                    // Platform: Link to core.organizations via ticket_organizations
                    const { error: orgLinkError } = await supabase.rpc(
                        "link_ticket_organization",
                        { p_ticket_id: ticketId, p_organization_id: entityId },
                    );
                    error = orgLinkError;
                } else {
                    // Client: Link to crm.companies via ticket_companies
                    const { error: companyLinkError } = await supabase.rpc(
                        "link_ticket_company",
                        { p_ticket_id: ticketId, p_company_id: entityId },
                    );
                    error = companyLinkError;
                }
                break;

            case "order":
                const { error: orderErr } = await supabase.rpc(
                    "link_ticket_order",
                    { p_ticket_id: ticketId, p_order_id: entityId },
                );
                error = orderErr;
                break;
        }

        if (error) {
            // Check for duplicate key error (code 23505)
            if (error.code === "23505") {
                return { success: false, error: "Ya está asociado" };
            }
            console.error(`Error linking ${type}:`, error);
            return { success: false, error: error.message };
        }

        revalidatePath("/admin/communications/tickets/[id]", "page");
        return { success: true };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

export async function unlinkEntity(
    ticketId: string,
    type: AssociationType,
    entityId: string,
) {
    const supabase = await createClient();
    const isPlatform = await isPlatformOrganization();

    try {
        let error = null;

        switch (type) {
            case "contact":
                if (isPlatform) {
                    // Platform: Delete from ticket_users
                    const { error: userErr } = await supabase.rpc(
                        "unlink_ticket_user",
                        { p_ticket_id: ticketId, p_user_id: entityId },
                    );
                    error = userErr;
                } else {
                    // Client: Delete from ticket_contacts
                    const { error: contactErr } = await supabase.rpc(
                        "unlink_ticket_contact",
                        { p_ticket_id: ticketId, p_contact_id: entityId },
                    );
                    error = contactErr;
                }
                break;

            case "company":
                if (isPlatform) {
                    // Platform: Delete from ticket_organizations
                    const { error: orgErr } = await supabase.rpc(
                        "unlink_ticket_organization",
                        { p_ticket_id: ticketId, p_organization_id: entityId },
                    );
                    error = orgErr;
                } else {
                    // Client: Delete from ticket_companies
                    const { error: companyErr } = await supabase.rpc(
                        "unlink_ticket_company",
                        { p_ticket_id: ticketId, p_company_id: entityId },
                    );
                    error = companyErr;
                }
                break;

            case "order":
                const { error: orderErr } = await supabase.rpc(
                    "unlink_ticket_order",
                    { p_ticket_id: ticketId, p_order_id: entityId },
                );
                error = orderErr;
                break;
        }

        if (error) {
            console.error(`Error unlinking ${type}:`, error);
            return { success: false, error: error.message };
        }

        revalidatePath("/admin/communications/tickets/[id]", "page");
        return { success: true };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}
