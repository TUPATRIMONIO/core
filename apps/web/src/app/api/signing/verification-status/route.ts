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

    // 1. Obtener firmante y documento
    const { data: signer, error: signerError } = await supabase
      .from("signing_signers")
      .select(`
        id,
        status,
        identity_verification_id,
        document:signing_documents (
          metadata
        )
      `)
      .eq("signing_token", token)
      .single();

    if (signerError || !signer) {
      return NextResponse.json(
        { error: "Firmante no encontrado" },
        { status: 404 }
      );
    }

    // 2. Verificar si se requiere Veriff
    const requireVeriff = signer.document?.metadata?.require_veriff_identity === true;

    if (!requireVeriff) {
      return NextResponse.json({
        requiresVeriff: false,
        isVerified: true, // No se requiere, así que se considera "verificado" para el flujo
        status: "not_required"
      });
    }

    // 3. Verificar estado de la verificación
    // Usamos la función RPC existente para verificar validez
    const { data: isValid, error: rpcError } = await supabase.rpc(
      "signer_has_valid_verification",
      { p_signer_id: signer.id }
    );

    if (rpcError) {
      console.error("Error verificando estado Veriff:", rpcError);
      return NextResponse.json(
        { error: "Error verificando estado" },
        { status: 500 }
      );
    }

    // Si tiene ID pero no es válido, obtener detalles de la sesión para saber por qué (opcional)
    let verificationDetails = null;
    if (signer.identity_verification_id) {
        const { data: session } = await supabase
            .from("identity_verification_sessions")
            .select("status, decision_reason, verification_url")
            .eq("id", signer.identity_verification_id)
            .single();
        verificationDetails = session;
    }

    return NextResponse.json({
      requiresVeriff: true,
      isVerified: isValid,
      status: isValid ? "verified" : (verificationDetails?.status || "pending"),
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
