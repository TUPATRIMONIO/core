import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { signing_token } = body;

    if (!signing_token) {
      return NextResponse.json(
        { error: "Token de firma requerido" },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();

    // 1. Obtener firmante y documento
    const { data: signer, error: signerError } = await supabase
      .from("signing_signers")
      .select(`
        *,
        document:signing_documents (
          organization_id,
          metadata
        )
      `)
      .eq("signing_token", signing_token)
      .single();

    if (signerError || !signer) {
      return NextResponse.json(
        { error: "Firmante no encontrado o token inválido" },
        { status: 404 }
      );
    }

    // Validar expiración del token
    if (new Date(signer.token_expires_at) < new Date()) {
      return NextResponse.json(
        { error: "El token de firma ha expirado" },
        { status: 400 }
      );
    }

    const organizationId = signer.document.organization_id;

    // 2. Obtener configuración de Veriff
    const { data: configData, error: configError } = await supabase.rpc(
      "iv_get_provider_config",
      {
        p_organization_id: organizationId,
        p_provider_slug: "veriff",
      }
    );

    if (configError || !configData) {
      console.error("Error obteniendo configuración Veriff:", configError);
      return NextResponse.json(
        { error: "Error de configuración del servicio de verificación" },
        { status: 500 }
      );
    }

    // 3. Crear sesión de verificación en BD local
    const { data: sessionId, error: createError } = await supabase.rpc(
      "iv_create_verification_session",
      {
        p_organization_id: organizationId,
        p_provider_slug: "veriff",
        p_purpose: "fes_signing",
        p_subject_identifier: signer.rut || null,
        p_subject_email: signer.email,
        p_subject_name: signer.full_name,
        p_subject_phone: signer.phone || null,
        p_reference_type: "signer",
        p_reference_id: signer.id,
        p_metadata: {
          signing_token: signing_token,
          document_id: signer.document_id,
          source: "signing_page"
        },
      }
    );

    if (createError) {
      console.error("Error creando sesión local:", createError);
      return NextResponse.json(
        { error: "Error al iniciar sesión de verificación" },
        { status: 500 }
      );
    }

    // 4. Crear sesión en Veriff API
    const baseUrl = configData.provider.base_url;
    const apiKey = configData.credentials.api_key;
    
    // Usar webhook de Next.js por defecto
    let appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "";
    
    // Veriff requiere HTTPS para URLs de retorno (excepto localhost a veces, pero mejor asegurar)
    // Si la URL es http://app.tupatrimonio.app (producción), forzamos https
    if (appUrl.startsWith("http://") && !appUrl.includes("localhost")) {
      appUrl = appUrl.replace("http://", "https://");
    }

    // El callback es donde el usuario es redirigido al finalizar, no el webhook
    const callbackUrl = `${appUrl}/sign/${signing_token}`;

    const veriffBody = {
      verification: {
        callback: callbackUrl,
        person: {
          firstName: signer.full_name.split(" ")[0] || "",
          lastName: signer.full_name.split(" ").slice(1).join(" ") || "",
        },
        vendorData: sessionId,
        timestamp: new Date().toISOString(),
      },
    };

    const veriffResponse = await fetch(`${baseUrl}/v1/sessions`, {
      method: "POST",
      headers: {
        "X-AUTH-CLIENT": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(veriffBody),
    });

    if (!veriffResponse.ok) {
      const errorText = await veriffResponse.text();
      console.error("Error creando sesión en Veriff:", veriffResponse.status, errorText);
      return NextResponse.json(
        { error: "Error al comunicarse con el proveedor de verificación" },
        { status: 502 }
      );
    }

    const veriffData = await veriffResponse.json();
    const veriffSessionId = veriffData.verification.id;
    const verificationUrl = veriffData.verification.url;
    const sessionToken = veriffData.verification.sessionToken;

    // 5. Actualizar sesión local con datos de Veriff
    const { error: updateError } = await supabase
      .from("identity_verification_sessions")
      .update({
        provider_session_id: veriffSessionId,
        verification_url: verificationUrl,
        metadata: {
            signing_token: signing_token,
            document_id: signer.document_id,
            source: "signing_page",
            veriff_session_token: sessionToken
        }
      })
      .eq("id", sessionId);

    if (updateError) {
        console.error("Error actualizando sesión local con datos Veriff:", updateError);
    }

    // 6. Registrar audit log
    await supabase.rpc("iv_log_audit_event", {
      p_session_id: sessionId,
      p_event_type: "session_created",
      p_event_data: {
        purpose: "fes_signing",
        provider: "veriff",
        veriff_session_id: veriffSessionId,
      },
      p_actor_type: "system",
    });

    return NextResponse.json({
      success: true,
      sessionId: sessionId,
      verificationUrl: verificationUrl,
    });

  } catch (error: any) {
    console.error("Error en start-veriff:", error);
    return NextResponse.json(
      { error: "Error interno del servidor", details: error.message },
      { status: 500 }
    );
  }
}
