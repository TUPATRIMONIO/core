// =====================================================
// Edge Function: identity-verification
// Description: API interna para gestionar verificaciones de identidad
// Created: 2026-02-04
// =====================================================

import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const VERIFF_API_KEY = Deno.env.get("VERIFF_API_KEY") || "";

interface CreateSessionRequest {
  organizationId: string;
  providerSlug?: string; // default: 'veriff'
  purpose: string;
  subjectIdentifier: string;
  subjectEmail: string;
  subjectName?: string;
  subjectPhone?: string;
  referenceType?: string;
  referenceId?: string;
  metadata?: any;
}

interface VeriffSessionResponse {
  status: string;
  verification: {
    id: string;
    url: string;
    vendorData?: string;
    host?: string;
    status?: string;
    sessionToken?: string;
  };
}

serve(async (req) => {
  const url = new URL(req.url);
  const path = url.pathname.replace("/identity-verification", "");

  // Extraer JWT del header Authorization
  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (!token) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Crear cliente con el token del usuario
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  // Verificar usuario autenticado
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Invalid token" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Ruteo de operaciones
    if (req.method === "POST" && path === "/create") {
      return await handleCreateSession(req, supabase, user.id);
    } else if (req.method === "GET" && path.startsWith("/session/")) {
      const sessionId = path.replace("/session/", "");
      return await handleGetSession(supabase, sessionId);
    } else if (req.method === "GET" && path === "/history") {
      const orgId = url.searchParams.get("organizationId");
      const identifier = url.searchParams.get("identifier");
      const email = url.searchParams.get("email");
      return await handleGetHistory(supabase, orgId, identifier, email);
    } else if (req.method === "POST" && path === "/verify-status") {
      return await handleVerifyStatus(req, supabase);
    } else {
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    console.error("Error en identity-verification:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});

// =====================================================
// HANDLER: Crear sesión de verificación
// =====================================================

async function handleCreateSession(req: Request, supabase: any, userId: string) {
  const body: CreateSessionRequest = await req.json();

  // Validar campos requeridos
  if (
    !body.organizationId ||
    !body.purpose ||
    !body.subjectIdentifier ||
    !body.subjectEmail
  ) {
    return new Response(
      JSON.stringify({ error: "Missing required fields" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Crear sesión en nuestra base de datos
  const { data: sessionId, error: createError } = await supabase.rpc(
    "identity_verifications.create_verification_session",
    {
      p_organization_id: body.organizationId,
      p_provider_slug: body.providerSlug || "veriff",
      p_purpose: body.purpose,
      p_subject_identifier: body.subjectIdentifier,
      p_subject_email: body.subjectEmail,
      p_subject_name: body.subjectName,
      p_subject_phone: body.subjectPhone,
      p_reference_type: body.referenceType,
      p_reference_id: body.referenceId,
      p_metadata: body.metadata || {},
    }
  );

  if (createError) {
    console.error("Error creando sesión:", createError);
    return new Response(JSON.stringify({ error: createError.message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Obtener configuración del proveedor
  const { data: providerConfig, error: configError } = await supabase.rpc(
    "identity_verifications.get_provider_config",
    {
      p_organization_id: body.organizationId,
      p_provider_slug: body.providerSlug || "veriff",
    }
  );

  if (configError) {
    console.error("Error obteniendo config:", configError);
    return new Response(JSON.stringify({ error: configError.message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Crear sesión en Veriff
  const veriffSession = await createVeriffSession(
    providerConfig,
    sessionId,
    body
  );

  if (!veriffSession) {
    return new Response(
      JSON.stringify({ error: "Failed to create Veriff session" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Actualizar nuestra sesión con los datos de Veriff
  await supabase
    .from("identity_verifications.verification_sessions")
    .update({
      provider_session_id: veriffSession.verification.id,
      verification_url: veriffSession.verification.url,
      metadata: {
        ...body.metadata,
        veriff_session_token: veriffSession.verification.sessionToken,
      },
    })
    .eq("id", sessionId);

  // Registrar en audit log
  await supabase.rpc("identity_verifications.log_audit_event", {
    p_session_id: sessionId,
    p_event_type: "session_created",
    p_event_data: {
      purpose: body.purpose,
      provider: body.providerSlug || "veriff",
      veriff_session_id: veriffSession.verification.id,
    },
    p_actor_type: "user",
    p_actor_id: userId,
  });

  return new Response(
    JSON.stringify({
      success: true,
      sessionId: sessionId,
      verificationUrl: veriffSession.verification.url,
      providerSessionId: veriffSession.verification.id,
    }),
    {
      status: 201,
      headers: { "Content-Type": "application/json" },
    }
  );
}

// =====================================================
// HANDLER: Obtener sesión completa
// =====================================================

async function handleGetSession(supabase: any, sessionId: string) {
  const { data, error } = await supabase.rpc(
    "identity_verifications.get_verification_session_full",
    {
      p_session_id: sessionId,
    }
  );

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

// =====================================================
// HANDLER: Obtener historial de verificaciones
// =====================================================

async function handleGetHistory(
  supabase: any,
  orgId: string | null,
  identifier: string | null,
  email: string | null
) {
  if (!orgId || (!identifier && !email)) {
    return new Response(
      JSON.stringify({ error: "Missing organizationId and identifier/email" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const { data, error } = await supabase.rpc(
    "identity_verifications.find_previous_verifications",
    {
      p_organization_id: orgId,
      p_subject_identifier: identifier,
      p_subject_email: email,
      p_only_approved: true,
      p_limit: 10,
    }
  );

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ verifications: data }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

// =====================================================
// HANDLER: Verificar estado de una sesión
// =====================================================

async function handleVerifyStatus(req: Request, supabase: any) {
  const { sessionId } = await req.json();

  if (!sessionId) {
    return new Response(JSON.stringify({ error: "Missing sessionId" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { data: isValid, error } = await supabase.rpc(
    "identity_verifications.is_verification_valid",
    {
      p_session_id: sessionId,
    }
  );

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ valid: isValid }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

// =====================================================
// HELPER: Crear sesión en Veriff
// =====================================================

async function createVeriffSession(
  providerConfig: any,
  ourSessionId: string,
  body: CreateSessionRequest
): Promise<VeriffSessionResponse | null> {
  try {
    const baseUrl = providerConfig.provider.base_url;
    const apiKey = providerConfig.credentials.api_key;
    const apiSecret = providerConfig.credentials.api_secret;

    // Construir webhook URL (debe apuntar a nuestra edge function)
    const webhookUrl =
      providerConfig.webhook_url ||
      `${SUPABASE_URL}/functions/v1/veriff-webhook`;

    const requestBody = {
      verification: {
        callback: webhookUrl,
        person: {
          firstName: body.subjectName?.split(" ")[0] || "",
          lastName: body.subjectName?.split(" ").slice(1).join(" ") || "",
        },
        vendorData: ourSessionId, // Nuestro ID para correlacionar
        timestamp: new Date().toISOString(),
      },
    };

    const response = await fetch(`${baseUrl}/v1/sessions`, {
      method: "POST",
      headers: {
        "X-AUTH-CLIENT": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error creando sesión en Veriff:", response.status, errorText);
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error en createVeriffSession:", error);
    return null;
  }
}
