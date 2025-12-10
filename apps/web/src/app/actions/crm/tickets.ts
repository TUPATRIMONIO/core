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
            return { success: false, error: error.message };
        }

        revalidatePath("/dashboard/crm/tickets");
        return { success: true };
    } catch (err) {
        console.error("Unexpected error updating ticket status:", err);
        return { success: false, error: "Internal server error" };
    }
}
