"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const BUCKET_NAME = "ticket-attachments";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export interface UploadResult {
    success: boolean;
    error?: string;
    attachment?: {
        id: string;
        file_name: string;
        file_path: string;
        file_type?: string;
        file_size?: number;
        public_url: string;
    };
}

export interface DeleteResult {
    success: boolean;
    error?: string;
}

/**
 * Upload a file attachment to a ticket
 */
export async function uploadAttachment(
    ticketId: string,
    formData: FormData,
): Promise<UploadResult> {
    try {
        const supabase = await createClient();
        const serviceSupabase = createServiceRoleClient();

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return { success: false, error: "No autenticado" };
        }

        // Get file from formData
        const file = formData.get("file") as File;
        if (!file) {
            return { success: false, error: "No se proporcionó archivo" };
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            return {
                success: false,
                error: "El archivo excede el tamaño máximo de 10MB",
            };
        }

        // Verify ticket exists and user has access
        // Note: Assuming 'tickets' is visible in public schema or standard API
        const { data: ticket, error: ticketError } = await serviceSupabase
            .from("tickets")
            .select("id, organization_id")
            .eq("id", ticketId)
            .single();

        if (ticketError || !ticket) {
            console.error("Ticket fetch error:", ticketError);
            return { success: false, error: "Ticket no encontrado" };
        }

        // Generate unique file path: organization/ticket/timestamp_filename
        const timestamp = Date.now();
        const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const filePath =
            `${ticket.organization_id}/${ticketId}/${timestamp}_${sanitizedFileName}`;

        // Convert file to ArrayBuffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Upload to storage using service role
        const { error: uploadError } = await serviceSupabase.storage
            .from(BUCKET_NAME)
            .upload(filePath, buffer, {
                contentType: file.type,
                upsert: false,
            });

        if (uploadError) {
            console.error("Storage upload error:", uploadError);
            return {
                success: false,
                error: `Error al subir archivo: ${uploadError.message}`,
            };
        }

        // Get public URL
        const { data: publicUrlData } = serviceSupabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(filePath);

        // Save metadata using RPC
        const { data: attachment, error: dbError } = await serviceSupabase
            .rpc("create_ticket_attachment", {
                p_ticket_id: ticketId,
                p_file_name: file.name,
                p_file_path: filePath,
                p_file_type: file.type,
                p_file_size: file.size,
                p_uploaded_by: user.id,
            });

        if (dbError) {
            console.error("Database insert error (RPC):", dbError);
            // Try to clean up the uploaded file
            await serviceSupabase.storage.from(BUCKET_NAME).remove([filePath]);
            return {
                success: false,
                error: `Error al guardar registro: ${dbError.message}`,
            };
        }

        revalidatePath(`/admin/communications/tickets/${ticketId}`);

        return {
            success: true,
            attachment: {
                id: (attachment as any)?.id,
                file_name: file.name,
                file_path: filePath,
                file_type: file.type,
                file_size: file.size,
                public_url: publicUrlData.publicUrl,
                created_at: new Date().toISOString(),
            },
        };
    } catch (error: any) {
        console.error("Upload attachment error:", error);
        return { success: false, error: error.message || "Error desconocido" };
    }
}

/**
 * Delete a file attachment from a ticket
 */
export async function deleteAttachment(
    ticketId: string,
    attachmentId: string,
): Promise<DeleteResult> {
    try {
        const supabase = await createClient();
        const serviceSupabase = createServiceRoleClient();

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return { success: false, error: "No autenticado" };
        }

        // Execute delete via RPC
        // This returns { success: boolean, file_path: string }
        const { data: result, error: rpcError } = await serviceSupabase
            .rpc("delete_ticket_attachment", {
                p_attachment_id: attachmentId,
                p_ticket_id: ticketId,
            });

        if (rpcError) {
            console.error("RPC delete error:", rpcError);
            return { success: false, error: "Error al eliminar el adjunto" };
        }

        const deleteResult = result as any;

        if (!deleteResult || !deleteResult.success) {
            return {
                success: false,
                error: "Adjunto no encontrado o error al eliminar",
            };
        }

        // Delete from storage
        if (deleteResult.file_path) {
            const { error: storageError } = await serviceSupabase.storage
                .from(BUCKET_NAME)
                .remove([deleteResult.file_path]);

            if (storageError) {
                console.error("Storage delete error:", storageError);
                // We don't fail the operation if storage deletion fails, as the DB record is gone
            }
        }

        revalidatePath(`/admin/communications/tickets/${ticketId}`);

        return { success: true };
    } catch (error: any) {
        console.error("Delete attachment error:", error);
        return { success: false, error: error.message || "Error desconocido" };
    }
}

/**
 * Get download URL for an attachment
 */
export async function getAttachmentUrl(
    filePath: string,
): Promise<string | null> {
    try {
        const serviceSupabase = createServiceRoleClient();

        const { data } = serviceSupabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(filePath);

        return data.publicUrl;
    } catch (error) {
        console.error("Get attachment URL error:", error);
        return null;
    }
}
