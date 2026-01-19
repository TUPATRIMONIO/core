import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";

/**
 * API Route: POST /api/admin/signing/regenerate-pdf
 *
 * Regenera el PDF con portada/página de firmas usando la Edge Function.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { document_id } = body;

    if (!document_id) {
      return NextResponse.json({ error: "document_id es requerido" }, { status: 400 });
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/pdf-merge-with-cover`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({
          document_id,
          force_regenerate: true,
        }),
      }
    );

    const result = await response.json();

    if (!result.success && !result.skipped) {
      return NextResponse.json(
        { error: "No se pudo regenerar el PDF", details: result.error },
        { status: 500 }
      );
    }

    const serviceSupabase = createServiceRoleClient();

    const { error: resetSignersError } = await serviceSupabase
      .from("signing_signers")
      .update({
        status: "pending",
        signed_at: null,
        signature_ip: null,
        signature_user_agent: null,
        updated_at: new Date().toISOString(),
      })
      .eq("document_id", document_id);

    if (resetSignersError) {
      console.error("Error reseteando firmantes:", resetSignersError);
      return NextResponse.json(
        { error: "No se pudo resetear el estado de los firmantes" },
        { status: 500 }
      );
    }

    const { error: resetDocumentError } = await serviceSupabase
      .from("signing_documents")
      .update({
        status: "pending_signature",
        updated_at: new Date().toISOString(),
      })
      .eq("id", document_id);

    if (resetDocumentError) {
      console.error("Error reseteando documento:", resetDocumentError);
      return NextResponse.json(
        { error: "No se pudo resetear el estado del documento" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "PDF regenerado correctamente",
      path: result.path,
      skipped: result.skipped,
    });
  } catch (error: any) {
    console.error("Error en /api/admin/signing/regenerate-pdf:", error);
    return NextResponse.json(
      { error: "Error interno al regenerar PDF", details: error.message },
      { status: 500 }
    );
  }
}
