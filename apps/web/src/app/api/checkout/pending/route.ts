import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/checkout/pending
 * Obtiene las órdenes pendientes del usuario actual
 * Query params:
 *   - organizationId: Filtrar por organización específica (opcional)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verificar autenticación
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 },
      );
    }

    // Obtener parámetro de organización de la query string
    const { searchParams } = new URL(request.url);
    const orgIdParam = searchParams.get("organizationId");

    // Si se proporciona organizationId, verificar que el usuario pertenezca a ella
    let targetOrgIds: string[] = [];

    if (orgIdParam) {
      // Verificar membresía para la organización específica
      const { data: membership, error: membershipError } = await supabase
        .from("organization_users")
        .select("organization_id")
        .eq("user_id", user.id)
        .eq("organization_id", orgIdParam)
        .eq("status", "active")
        .single();

      if (membershipError || !membership) {
        // Usuario no pertenece a esta organización
        return NextResponse.json({ orders: [] });
      }

      targetOrgIds = [membership.organization_id];
    } else {
      // Sin filtro: obtener todas las organizaciones del usuario
      const { data: memberships, error: membershipsError } = await supabase
        .from("organization_users")
        .select("organization_id")
        .eq("user_id", user.id)
        .eq("status", "active");

      if (membershipsError) {
        console.error("Error fetching memberships:", membershipsError);
        return NextResponse.json(
          { error: "Error obteniendo membresías" },
          { status: 500 },
        );
      }

      if (!memberships || memberships.length === 0) {
        return NextResponse.json({ orders: [] });
      }

      targetOrgIds = memberships.map((m) => m.organization_id);
    }

    // Obtener órdenes pendientes de las organizaciones
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select("*")
      .in("organization_id", targetOrgIds)
      .eq("status", "pending_payment")
      .order("created_at", { ascending: false });

    if (ordersError) {
      console.error("Error fetching orders:", ordersError);
      return NextResponse.json(
        { error: "Error obteniendo órdenes" },
        { status: 500 },
      );
    }

    return NextResponse.json({ orders: orders || [] });
  } catch (error) {
    console.error("Error in GET /api/checkout/pending:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
