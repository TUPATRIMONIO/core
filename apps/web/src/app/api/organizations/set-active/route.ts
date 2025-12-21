import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json(
                { success: false, error: "No autenticado" },
                { status: 401 },
            );
        }

        const body = await request.json();
        const { organization_id } = body;

        if (!organization_id) {
            return NextResponse.json(
                { success: false, error: "organization_id es requerido" },
                { status: 400 },
            );
        }

        // Verify user is member of this organization
        const { data: membership, error: memberError } = await supabase
            .from("organization_users")
            .select("id")
            .eq("user_id", user.id)
            .eq("organization_id", organization_id)
            .eq("status", "active")
            .single();

        if (memberError || !membership) {
            return NextResponse.json(
                {
                    success: false,
                    error: "No tienes acceso a esta organización",
                },
                { status: 403 },
            );
        }

        // Update last_active_organization_id in users table
        const { error: updateError } = await supabase
            .from("users")
            .update({ last_active_organization_id: organization_id })
            .eq("id", user.id);

        if (updateError) {
            console.error("[API set-active] Error updating user:", updateError);
            return NextResponse.json(
                {
                    success: false,
                    error: "Error al actualizar organización activa",
                },
                { status: 500 },
            );
        }

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        console.error("[API set-active] Error:", error);
        const message = error instanceof Error
            ? error.message
            : "Error interno";
        return NextResponse.json(
            { success: false, error: message },
            { status: 500 },
        );
    }
}
