"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateTicketStatus(ticketId: string, newStatus: string) {
    const supabase = await createClient();

    try {
        const { error } = await supabase
            .from("crm.tickets")
            .update({ status: newStatus })
            .eq("id", ticketId);

        if (error) {
            console.error("Error updating ticket status:", error);
            // Fallback for non-crm schema
            const { error: errorPublic } = await supabase
                .from("tickets")
                .update({ status: newStatus })
                .eq("id", ticketId);

            if (errorPublic) {
                return { success: false, error: errorPublic.message };
            }
        }

        revalidatePath("/dashboard/crm/tickets");
        revalidatePath("/admin/communications/tickets");
        return { success: true };
    } catch (err) {
        console.error("Unexpected error updating ticket status:", err);
        return { success: false, error: "Internal server error" };
    }
}

export async function getLatestTickets(filters: {
    date_from?: string;
    date_to?: string;
    from_email?: string;
    to_email?: string;
    subject?: string;
    body_text?: string;
    status?: string;
    priority?: string;
} = {}) {
    const supabase = await createClient();

    // Verify platform admin or get active org
    const { data: isPlatformAdmin } = await supabase.rpc("is_platform_admin");

    let organizationId: string | null = null;

    if (isPlatformAdmin) {
        const { data: platformOrg } = await supabase
            .from("organizations")
            .select("id")
            .eq("org_type", "platform")
            .eq("status", "active")
            .single();

        if (platformOrg) {
            organizationId = platformOrg.id;
        }
    }

    if (!organizationId) {
        const { getUserActiveOrganization } = await import(
            "@/lib/organization/utils"
        );
        const orgResult = await getUserActiveOrganization(supabase);
        organizationId = orgResult.organization?.id || null;
    }

    if (!organizationId) {
        return { success: false, error: "No organization found" };
    }

    // Build query
    let query = supabase
        .from("tickets")
        .select("*")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false });

    if (filters.status && filters.status !== "all") {
        query = query.eq("status", filters.status);
    }

    if (filters.priority && filters.priority !== "all") {
        query = query.eq("priority", filters.priority);
    }

    if (filters.subject) {
        query = query.ilike("subject", `%${filters.subject}%`);
    }

    if (filters.date_from) {
        query = query.gte("created_at", filters.date_from);
    }

    if (filters.date_to) {
        query = query.lte("created_at", filters.date_to);
    }

    const { data: tickets, error } = await query;

    if (error) {
        console.error("Error fetching tickets:", error);
        return { success: false, error: error.message };
    }

    const finalTickets = tickets?.map((t: any) => ({
        ...t,
        owner_name: t.assigned_to
            ? `Usuario ${t.assigned_to.substring(0, 8)}...`
            : null,
    })) || [];

    return { success: true, data: finalTickets };
}
