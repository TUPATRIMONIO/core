export async function sendPlatformAdminAlert(params: {
  documentId: string;
  documentTitle: string;
  organizationId: string;
  errorType: string;
  errorDetails: string;
}): Promise<void> {
  const adminEmail = Deno.env.get("PLATFORM_ADMIN_EMAIL");

  if (!adminEmail) {
    console.warn(
      "[AdminAlert] PLATFORM_ADMIN_EMAIL no configurado. No se enviará alerta.",
    );
    return;
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      console.error(
        "[AdminAlert] Faltan variables de entorno SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY",
      );
      return;
    }

    const notificationUrl = `${supabaseUrl}/functions/v1/send-signing-notification`;
    const appUrl = Deno.env.get("PUBLIC_APP_URL") || "https://tupatrimonio.app";

    const payload = {
      type: "PLATFORM_ADMIN_ALERT",
      recipient_email: adminEmail,
      recipient_name: "Platform Admin",
      document_title: params.documentTitle,
      document_id: params.documentId,
      org_id: params.organizationId,
      action_url: `${appUrl}/dashboard/signing/documents/${params.documentId}`,
      alert_details: `Tipo: ${params.errorType}\nDetalle: ${params.errorDetails}`,
    };

    console.log(
      `[AdminAlert] Enviando alerta a ${adminEmail} para documento ${params.documentId}`,
    );

    const response = await fetch(notificationUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `[AdminAlert] Error enviando alerta: ${response.status} - ${errorText}`,
      );
    } else {
      console.log("[AdminAlert] Alerta enviada exitosamente");
    }
  } catch (error) {
    console.error("[AdminAlert] Error inesperado enviando alerta:", error);
    // No relanzamos el error para no afectar el flujo principal que llamó a esta alerta
  }
}
