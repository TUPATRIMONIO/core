import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface RouteParams {
    params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/applications/[id]/organizations
 * Obtiene todas las organizaciones con su estado para una aplicación
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id: applicationId } = await params;
        const supabase = await createClient();

        // Verificar autenticación
        const { data: { user }, error: authError } = await supabase.auth
            .getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "No autenticado" }, {
                status: 401,
            });
        }

        // Verificar si es platform admin
        const { data: isPlatformAdmin } = await supabase.rpc(
            "is_platform_admin",
        );
        if (!isPlatformAdmin) {
            return NextResponse.json({ error: "No autorizado" }, {
                status: 403,
            });
        }

        // Usar la función RPC para obtener organizaciones
        const { data: organizations, error: orgsError } = await supabase
            .rpc("get_application_organizations", {
                p_application_id: applicationId,
            });

        if (orgsError) {
            console.error(
                "Error fetching application organizations:",
                orgsError,
            );
            return NextResponse.json({
                error: "Error obteniendo organizaciones",
            }, { status: 500 });
        }

        // Contar habilitadas vs deshabilitadas
        const enabled = organizations?.filter((o: any) =>
            o.is_enabled
        ).length || 0;
        const disabled = (organizations?.length || 0) - enabled;

        return NextResponse.json({
            success: true,
            application_id: applicationId,
            organizations: organizations || [],
            summary: {
                total: organizations?.length || 0,
                enabled,
                disabled,
            },
        });
    } catch (error: any) {
        console.error(
            "Error in GET /api/admin/applications/[id]/organizations:",
            error,
        );
        return NextResponse.json(
            { error: error.message || "Error interno" },
            { status: 500 },
        );
    }
}

/**
 * PATCH /api/admin/applications/[id]/organizations
 * Habilita o deshabilita esta aplicación para una organización
 * Body: { organization_id: string, is_enabled: boolean }
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const { id: applicationId } = await params;
        const supabase = await createClient();
        const body = await request.json();

        // Verificar autenticación
        const { data: { user }, error: authError } = await supabase.auth
            .getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "No autenticado" }, {
                status: 401,
            });
        }

        // Verificar si es platform admin
        const { data: isPlatformAdmin } = await supabase.rpc(
            "is_platform_admin",
        );
        if (!isPlatformAdmin) {
            return NextResponse.json({ error: "No autorizado" }, {
                status: 403,
            });
        }

        // Validar body
        const { organization_id, is_enabled } = body;
        if (!organization_id || typeof is_enabled !== "boolean") {
            return NextResponse.json(
                { error: "organization_id y is_enabled son requeridos" },
                { status: 400 },
            );
        }

        // Usar la función RPC para toggle
        const { data: result, error: toggleError } = await supabase
            .rpc("toggle_organization_app", {
                p_organization_id: organization_id,
                p_application_id: applicationId,
                p_is_enabled: is_enabled,
            });

        if (toggleError) {
            console.error("Error toggling app:", toggleError);
            return NextResponse.json({ error: "Error actualizando app" }, {
                status: 500,
            });
        }

        if (result && !result.success) {
            return NextResponse.json({ error: result.error }, { status: 400 });
        }

        return NextResponse.json({
            success: true,
            ...result,
        });
    } catch (error: any) {
        console.error(
            "Error in PATCH /api/admin/applications/[id]/organizations:",
            error,
        );
        return NextResponse.json(
            { error: error.message || "Error interno" },
            { status: 500 },
        );
    }
}
