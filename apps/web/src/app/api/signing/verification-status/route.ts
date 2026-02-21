import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Token es requerido" },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();

    // 1. Obtener firmante (sin JOIN a traves de vista)
    const { data: signer, error: signerError } = await supabase
      .from("signing_signers")
      .select("id, status, identity_verification_id, document_id")
      .eq("signing_token", token)
      .single();

    if (signerError || !signer) {
      return NextResponse.json(
        { error: "Firmante no encontrado" },
        { status: 404 }
      );
    }

    // 2. Obtener documento y metadata
    const { data: document, error: docError } = await supabase
      .from("signing_documents")
      .select("metadata")
      .eq("id", signer.document_id)
      .single();

    if (docError || !document) {
      return NextResponse.json(
        { error: "Documento no encontrado" },
        { status: 404 }
      );
    }

    // 3. Verificar si se requiere Veriff
    const requireVeriff = document.metadata?.require_veriff_identity === true;

    if (!requireVeriff) {
      return NextResponse.json({
        requiresVeriff: false,
        isVerified: true, // No se requiere, así que se considera "verificado" para el flujo
        status: "not_required"
      });
    }

    // 4. Verificar estado de la verificación directamente
    let isVerified = false;
    let verificationDetails = null;

    if (signer.identity_verification_id) {
        const { data: session } = await supabase
            .from("identity_verification_sessions")
            .select("status, decision_reason, verification_url, expires_at")
            .eq("id", signer.identity_verification_id)
            .single();
        
        if (session) {
            verificationDetails = session;
            // Validar que esté aprobada y no expirada
            const isApproved = session.status === 'approved';
            const isNotExpired = !session.expires_at || new Date(session.expires_at) > new Date();
            isVerified = isApproved && isNotExpired;
        }
    }

    return NextResponse.json({
      requiresVeriff: true,
      isVerified: isVerified,
      status: isVerified ? "verified" : (verificationDetails?.status || "pending"),
      verificationUrl: verificationDetails?.verification_url
    });

  } catch (error: any) {
    console.error("Error en verification-status:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
