import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/organizations/user
 *
 * Obtiene todas las organizaciones a las que pertenece el usuario autenticado
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

        // Obtener todas las organizaciones del usuario
        const { data: organizations, error: orgsError } = await supabase
            .from("organization_users")
            .select(`
        organization_id,
        organizations(
          id,
          name,
          slug,
          org_type
        )
      `)
            .eq("user_id", user.id)
            .eq("status", "active")
            .order("created_at", { ascending: true });

        if (orgsError) {
            console.error("Error fetching user organizations:", orgsError);
            return NextResponse.json(
                { error: "Error al obtener organizaciones" },
                { status: 500 },
            );
        }

        // Transformar datos al formato esperado
        const formattedOrgs = organizations
            ?.filter((org: any) => org.organizations) // Filtrar nulls
            .map((org: any) => ({
                id: org.organizations.id,
                name: org.organizations.name,
                slug: org.organizations.slug,
                org_type: org.organizations.org_type,
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
