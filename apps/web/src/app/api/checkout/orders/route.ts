import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { OrderStatus } from "@/lib/checkout/core";

/**
 * GET /api/checkout/orders
 * Obtiene todas las órdenes del usuario actual con filtro opcional por estado
 * Query params: ?status=pending_payment|paid|completed|cancelled|refunded
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

    // Obtener parámetros de la query string
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status") as OrderStatus | null;
    const orgIdParam = searchParams.get("organizationId");

    // Determinar qué organizaciones consultar
    let targetOrgIds: string[] = [];

    if (orgIdParam) {
      // Si se proporciona organizationId, verificar membresía
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

    // Construir query base
    // Obtener órdenes primero, luego obtener invoices y payments por separado si existen
    let query = supabase
      .from("orders")
      .select("*")
      .in("organization_id", targetOrgIds);

    // Aplicar filtro por estado si se proporciona
    if (
      statusParam &&
      ["pending_payment", "paid", "completed", "cancelled", "refunded"]
        .includes(statusParam)
    ) {
      query = query.eq("status", statusParam);
    }

    // Ordenar por fecha de creación descendente
    const { data: orders, error: ordersError } = await query.order(
      "created_at",
      { ascending: false },
    );

    if (ordersError) {
      console.error("Error fetching orders:", ordersError);
      return NextResponse.json(
        { error: "Error obteniendo órdenes" },
        { status: 500 },
      );
    }

    // Enriquecer órdenes con información de invoices y payments si existen
    const enrichedOrders = await Promise.all(
      (orders || []).map(async (order) => {
        const enriched: any = { ...order };

        // La información de facturación ahora está en la orden directamente
        // Los documentos tributarios se generan después de completed en invoicing.documents

        // Obtener payment si existe
        if (order.payment_id) {
          const { data: payment } = await supabase
            .from("payments")
            .select("id, status, provider, amount, currency")
            .eq("id", order.payment_id)
            .single();

          if (payment) {
            enriched.payment = payment;
          }
        }

        // Obtener documento de facturación si la orden está completada
        if (order.status === "completed") {
          // Primero buscar documentos con status 'issued'
          const { data: document, error: docError } = await supabase
            .from("invoicing_documents")
            .select(
              "id, document_number, document_type, pdf_url, xml_url, status, external_id",
            )
            .eq("order_id", order.id)
            .eq("status", "issued")
            .maybeSingle();

          if (document) {
            enriched.document = document;
          } else {
            // Si no hay documento con status 'issued', buscar cualquier documento para debugging
            const { data: anyDocument } = await supabase
              .from("invoicing_documents")
              .select(
                "id, document_number, document_type, pdf_url, xml_url, status, external_id",
              )
              .eq("order_id", order.id)
              .maybeSingle();

            if (anyDocument) {
              // Si el documento existe pero no está 'issued', aún así lo mostramos si tiene pdf_url
              if (anyDocument.pdf_url) {
                enriched.document = anyDocument;
              }
            }
          }
        }

        // Obtener información del proceso de firma si aplica
        const { data: signingDoc } = await supabase
          .from("signing_documents")
          .select("id, status, signers_count, signed_count, title")
          .eq("order_id", order.id)
          .maybeSingle();

        if (signingDoc) {
          enriched.signing_document = signingDoc;
        }

        return enriched;
      }),
    );

    return NextResponse.json({ orders: enrichedOrders });
  } catch (error) {
    console.error("Error in GET /api/checkout/orders:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
