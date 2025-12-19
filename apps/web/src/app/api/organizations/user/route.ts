import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/organizations/user
 *
 * Obtiene todas las organizaciones a las que pertenece el usuario autenticado
 * Incluye información completa del miembro: rol, permisos y apps habilitadas
 */
export async function GET() {
    try {
        const supabase = await createClient();

        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
            return NextResponse.json(
                { error: "No autenticado" },
                { status: 401 },
            );
        }

        // Obtener todas las organizaciones del usuario con rol y permisos
        const { data: memberships, error: membershipsError } = await supabase
            .from("organization_users")
            .select(`
                organization_id,
                role_id,
                additional_permissions,
                organizations(
                    id,
                    name,
                    slug,
                    org_type
                ),
                roles(
                    id,
                    name,
                    slug,
                    permissions,
                    level
                )
            `)
            .eq("user_id", user.id)
            .eq("status", "active")
            .order("created_at", { ascending: true });

        if (membershipsError) {
            console.error("Error fetching user memberships:", membershipsError);
            return NextResponse.json(
                { error: "Error al obtener organizaciones" },
                { status: 500 },
            );
        }

        // Obtener IDs de organizaciones para buscar apps habilitadas
        const orgIds = memberships
            ?.filter((m: any) => m.organizations)
            .map((m: any) => m.organization_id) || [];

        // Obtener apps habilitadas para todas las organizaciones del usuario
        let enabledAppsMap: Record<string, string[]> = {};

        if (orgIds.length > 0) {
            const { data: orgApps, error: appsError } = await supabase
                .from("organization_applications")
                .select(`
                    organization_id,
                    is_enabled,
                    applications(
                        slug,
                        is_active
                    )
                `)
                .in("organization_id", orgIds)
                .eq("is_enabled", true);

            if (appsError) {
                console.error("Error fetching organization apps:", appsError);
                // No es crítico, continuamos sin apps
            } else if (orgApps) {
                // Construir mapa de org_id -> [app_slugs]
                orgApps.forEach((oa: any) => {
                    if (oa.applications?.is_active) {
                        if (!enabledAppsMap[oa.organization_id]) {
                            enabledAppsMap[oa.organization_id] = [];
                        }
                        enabledAppsMap[oa.organization_id].push(
                            oa.applications.slug,
                        );
                    }
                });
            }
        }

        // Transformar datos al formato esperado con contexto completo
        const formattedOrgs = memberships
            ?.filter((m: any) => m.organizations)
            .map((m: any) => ({
                id: m.organizations.id,
                name: m.organizations.name,
                slug: m.organizations.slug,
                org_type: m.organizations.org_type,
                // Información del miembro
                membership: {
                    role_id: m.roles?.id || null,
                    role_name: m.roles?.name || null,
                    role_slug: m.roles?.slug || null,
                    role_level: m.roles?.level || 0,
                    permissions: m.roles?.permissions || {},
                    additional_permissions: m.additional_permissions || {},
                },
                // Apps habilitadas para esta organización
                enabled_apps: enabledAppsMap[m.organization_id] || [],
            })) || [];

        return NextResponse.json({
            success: true,
            data: formattedOrgs,
        });
    } catch (error: any) {
        console.error("Error in GET /api/organizations/user:", error);
        return NextResponse.json(
            { error: error.message || "Error interno del servidor" },
            { status: 500 },
        );
    }
}
