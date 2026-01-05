import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/signing/accept-risk
 * Records that a user has accepted the risks for an observed or rejected document
 * This is saved for audit purposes
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Verify user is authenticated
        const { data: { user }, error: authError } = await supabase.auth
            .getUser();
        if (authError || !user) {
            return NextResponse.json(
                { error: "No autenticado" },
                { status: 401 },
            );
        }

        const body = await request.json();
        const { review_id, note } = body;

        if (!review_id) {
            return NextResponse.json(
                { error: "review_id es requerido" },
                { status: 400 },
            );
        }

        // Verify the review exists and belongs to a document the user can access
        const { data: review, error: reviewError } = await supabase
            .from("signing_ai_reviews")
            .select("id, document_id, status")
            .eq("id", review_id)
            .single();

        if (reviewError || !review) {
            return NextResponse.json(
                { error: "Revisión no encontrada" },
                { status: 404 },
            );
        }

        // Only allow accepting risks for 'needs_changes' (observed) or 'rejected' status
        if (review.status !== "needs_changes" && review.status !== "rejected") {
            return NextResponse.json(
                {
                    error:
                        'Solo se pueden aceptar riesgos en documentos con estado "observado" o "rechazado"',
                },
                { status: 400 },
            );
        }

        // Verify user has access to the document
        const { data: document, error: docError } = await supabase
            .from("signing_documents")
            .select("id, organization_id")
            .eq("id", review.document_id)
            .single();

        if (docError || !document) {
            return NextResponse.json(
                { error: "Documento no encontrado" },
                { status: 404 },
            );
        }

        // Check user belongs to the organization
        const { data: orgUser, error: orgError } = await supabase
            .from("organization_users")
            .select("id")
            .eq("organization_id", document.organization_id)
            .eq("user_id", user.id)
            .eq("status", "active")
            .maybeSingle();

        if (orgError || !orgUser) {
            return NextResponse.json(
                { error: "No tienes acceso a este documento" },
                { status: 403 },
            );
        }

        // Update the review with risk acceptance info
        const defaultNote = review.status === "rejected"
            ? "Usuario aceptó continuar con el documento rechazado"
            : "Usuario aceptó continuar con las observaciones indicadas";
            
        const { error: updateError } = await supabase
            .from("signing_ai_reviews")
            .update({
                risk_accepted_at: new Date().toISOString(),
                risk_accepted_by: user.id,
                risk_acceptance_note: note || defaultNote,
            })
            .eq("id", review_id);

        if (updateError) {
            console.error("[accept-risk] Error updating review:", updateError);
            return NextResponse.json(
                { error: "Error al registrar la aceptación de riesgos" },
                { status: 500 },
            );
        }

        return NextResponse.json({
            success: true,
            message: "Aceptación de riesgos registrada correctamente",
            review_id,
            accepted_at: new Date().toISOString(),
        });
    } catch (error) {
        console.error("[accept-risk] Error:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 },
        );
    }
}
