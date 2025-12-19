import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

interface RouteParams {
    params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/organizations/[id]/apps
 * Obtiene todas las aplicaciones con su estado para una organización
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id: organizationId } = await params;
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

        // Usar la función RPC para obtener apps
        const { data: apps, error: appsError } = await supabase
            .rpc("get_organization_apps", {
                p_organization_id: organizationId,
            });

        if (appsError) {
            console.error("Error fetching organization apps:", appsError);
            return NextResponse.json({ error: "Error obteniendo apps" }, {
                status: 500,
            });
        }

        return NextResponse.json({
            success: true,
            organization_id: organizationId,
            apps: apps || [],
        });
    } catch (error: any) {
        console.error(
            "Error in GET /api/admin/organizations/[id]/apps:",
            error,
        );
        return NextResponse.json(
            { error: error.message || "Error interno" },
            { status: 500 },
        );
    }
}

/**
 * PATCH /api/admin/organizations/[id]/apps
 * Habilita o deshabilita una aplicación para esta organización
 * Body: { application_id: string, is_enabled: boolean }
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const { id: organizationId } = await params;
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
        const { application_id, is_enabled } = body;
        if (!application_id || typeof is_enabled !== "boolean") {
            return NextResponse.json(
                { error: "application_id y is_enabled son requeridos" },
                { status: 400 },
            );
        }

        // Usar la función RPC para toggle
        const { data: result, error: toggleError } = await supabase
            .rpc("toggle_organization_app", {
                p_organization_id: organizationId,
                p_application_id: application_id,
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
            "Error in PATCH /api/admin/organizations/[id]/apps:",
            error,
        );
        return NextResponse.json(
            { error: error.message || "Error interno" },
            { status: 500 },
        );
    }
}
