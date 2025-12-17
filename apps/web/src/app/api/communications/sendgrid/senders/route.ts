/**
 * API Route: Gestión de Sender Identities
 *
 * GET: Listar sender identities de la organización
 * POST: Crear o actualizar sender identity
 * DELETE: Eliminar sender identity
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserActiveOrganization } from "@/lib/organization/utils";
import {
    deleteSenderIdentity,
    getSenderIdentities,
    upsertSenderIdentity,
} from "@/lib/sendgrid/accounts";
import type { SenderIdentityInput } from "@/lib/sendgrid/types";

export async function GET() {
    const supabase = await createClient();

    // Verificar autenticación
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener organización activa del usuario
    const { organization, error: orgError } = await getUserActiveOrganization(
        supabase,
    );

    if (!organization) {
        return NextResponse.json(
            { error: orgError || "No se encontró organización" },
            { status: 404 },
        );
    }

    try {
        const senders = await getSenderIdentities(organization.id);

        return NextResponse.json({
            data: senders,
        });
    } catch (error: any) {
        console.error("Error al obtener sender identities:", error);
        return NextResponse.json(
            { error: error.message || "Error al obtener sender identities" },
            { status: 500 },
        );
    }
}

export async function POST(request: NextRequest) {
    const supabase = await createClient();

    // Verificar autenticación
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener organización activa del usuario
    const { organization, error: orgError } = await getUserActiveOrganization(
        supabase,
    );

    if (!organization) {
        return NextResponse.json(
            { error: orgError || "No se encontró organización" },
            { status: 404 },
        );
    }

    // Verificar permisos - obtener rol del usuario en la organización
    const { data: orgUserRole } = await supabase
        .from("organization_users")
        .select("role:roles(level)")
        .eq("user_id", user.id)
        .eq("organization_id", organization.id)
        .eq("status", "active")
        .single();

    // Verificar permisos (solo admins)
    const roleLevel = (orgUserRole?.role as any)?.level || 0;
    if (roleLevel < 7) {
        return NextResponse.json(
            {
                error:
                    "No tienes permisos para gestionar remitentes. Se requiere rol de administrador.",
            },
            { status: 403 },
        );
    }

    try {
        const body = await request.json();
        const input: SenderIdentityInput = {
            purpose: body.purpose,
            from_email: body.from_email,
            from_name: body.from_name,
            reply_to_email: body.reply_to_email,
            is_default: body.is_default,
        };

        // Validaciones
        if (
            !input.purpose ||
            !["transactional", "marketing"].includes(input.purpose)
        ) {
            return NextResponse.json(
                {
                    error:
                        'Propósito inválido. Debe ser "transactional" o "marketing".',
                },
                { status: 400 },
            );
        }

        if (!input.from_email || !input.from_name) {
            return NextResponse.json(
                { error: "Email y nombre del remitente son requeridos." },
                { status: 400 },
            );
        }

        const result = await upsertSenderIdentity(
            organization.id,
            input,
            user.id,
        );

        if (!result.success) {
            return NextResponse.json(
                { error: result.error },
                { status: 400 },
            );
        }

        return NextResponse.json({
            data: result.data,
            message: "Remitente guardado exitosamente",
        });
    } catch (error: any) {
        console.error("Error al guardar sender identity:", error);
        return NextResponse.json(
            { error: error.message || "Error al guardar remitente" },
            { status: 500 },
        );
    }
}

export async function DELETE(request: NextRequest) {
    const supabase = await createClient();

    // Verificar autenticación
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener organización activa del usuario
    const { organization, error: orgError } = await getUserActiveOrganization(
        supabase,
    );

    if (!organization) {
        return NextResponse.json(
            { error: orgError || "No se encontró organización" },
            { status: 404 },
        );
    }

    // Verificar permisos - obtener rol del usuario en la organización
    const { data: orgUserRole } = await supabase
        .from("organization_users")
        .select("role:roles(level)")
        .eq("user_id", user.id)
        .eq("organization_id", organization.id)
        .eq("status", "active")
        .single();

    // Verificar permisos (solo admins)
    const roleLevel = (orgUserRole?.role as any)?.level || 0;
    if (roleLevel < 7) {
        return NextResponse.json(
            { error: "No tienes permisos para eliminar remitentes." },
            { status: 403 },
        );
    }

    try {
        const { searchParams } = new URL(request.url);
        const senderId = searchParams.get("id");

        if (!senderId) {
            return NextResponse.json(
                { error: "ID del remitente requerido" },
                { status: 400 },
            );
        }

        const result = await deleteSenderIdentity(
            senderId,
            organization.id,
        );

        if (!result.success) {
            return NextResponse.json(
                { error: result.error },
                { status: 400 },
            );
        }

        return NextResponse.json({
            message: "Remitente eliminado exitosamente",
        });
    } catch (error: any) {
        console.error("Error al eliminar sender identity:", error);
        return NextResponse.json(
            { error: error.message || "Error al eliminar remitente" },
            { status: 500 },
        );
    }
}
