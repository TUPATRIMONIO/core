import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getSendGridConfig, sendEmail } from "../_shared/sendgrid-config.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MarketingEmailPayload {
  type: "newsletter" | "waitlist_welcome" | "campaign" | "announcement";
  recipient_email: string;
  recipient_name: string;
  subject: string;
  html_content: string;
  text_content: string;
  org_id?: string;
  campaign_id?: string;
  metadata?: Record<string, any>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const payload: MarketingEmailPayload = await req.json();

    if (!payload.type || !payload.recipient_email || !payload.subject || 
        !payload.html_content) {
      throw new Error("Payload incompleto. Requiere: type, recipient_email, subject, html_content");
    }

    // Usar configuración de marketing
    const config = getSendGridConfig("marketing");
    console.log(`[send-marketing-email] Enviando desde: ${config.fromEmail} (${config.fromName}) → ${payload.recipient_email}`);

    // Enviar email usando helper
    await sendEmail(
      config,
      payload.recipient_email,
      payload.recipient_name || "Usuario",
      payload.subject,
      payload.html_content,
      payload.text_content || "",
      {
        campaign_id: payload.campaign_id || "",
        email_type: payload.type,
      }
    );

    // Registrar en email_history para auditoría
    try {
      await supabaseClient
        .from("email_history")
        .insert({
          organization_id: payload.org_id || null,
          to_email: payload.recipient_email,
          from_email: config.fromEmail,
          subject: payload.subject,
          body_html: payload.html_content,
          body_text: payload.text_content,
          provider: "sendgrid",
          status: "sent",
          sent_at: new Date().toISOString(),
          metadata: {
            email_type: payload.type,
            campaign_id: payload.campaign_id,
            purpose: "marketing",
            ...payload.metadata,
          },
        });
      console.log(`[send-marketing-email] Email registrado en historial`);
    } catch (logError) {
      // No fallar si el logging falla
      console.error("[send-marketing-email] Error registrando en email_history:", logError);
    }

    return new Response(
      JSON.stringify({ success: true, message: "Email de marketing enviado exitosamente" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[send-marketing-email] Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || "Error desconocido al enviar email de marketing" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});


