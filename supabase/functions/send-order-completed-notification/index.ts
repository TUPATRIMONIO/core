import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getSendGridConfig, sendEmail } from "../_shared/sendgrid-config.ts";

// Configuración CORS
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface OrderCompletedPayload {
  order_id: string;
}

serve(async (req) => {
  // Manejo de preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const payload: OrderCompletedPayload = await req.json();

    if (!payload.order_id) {
      throw new Error("Payload incompleto. Requiere: order_id");
    }

    console.log(`[send-order-completed] Iniciando para orden: ${payload.order_id}`);

    // 1. Obtener pedido
    const { data: order, error: orderError } = await supabaseClient
      .from("billing_orders") // Usando vista pública si existe, o tabla directa
      .select("*")
      .eq("id", payload.order_id)
      .single();

    if (orderError || !order) {
        // Intentar con tabla directa si falla vista
        const { data: orderDirect, error: orderDirectError } = await supabaseClient
            .schema('billing')
            .from('orders')
            .select('*')
            .eq('id', payload.order_id)
            .single();
            
        if (orderDirectError || !orderDirect) {
            throw new Error(`Pedido no encontrado: ${payload.order_id}`);
        }
        // Asignar orderDirect a order para continuar
        Object.assign(order || {}, orderDirect);
    }

    // 2. Obtener documento asociado
    const { data: document, error: docError } = await supabaseClient
      .from("signing_documents") // Vista pública
      .select("*")
      .eq("order_id", payload.order_id)
      .maybeSingle();

    if (docError) {
        throw new Error(`Error buscando documento: ${docError.message}`);
    }

    if (!document) {
        console.log(`[send-order-completed] Orden ${payload.order_id} no tiene documento de firma asociado. Terminando.`);
        return new Response(JSON.stringify({ success: true, message: "No signing document found" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    console.log(`[send-order-completed] Documento encontrado: ${document.id} - ${document.title}`);

    // 3. Obtener versiones del documento (firmado y notariado)
    const { data: versions, error: versionsError } = await supabaseClient
      .from("signing_document_versions")
      .select("*")
      .eq("document_id", document.id)
      .in("version_type", ["fully_signed", "notarized"])
      .order("version_number", { ascending: false });

    const signedVersion = versions?.find(v => v.version_type === 'fully_signed');
    const notarizedVersion = versions?.find(v => v.version_type === 'notarized');

    // 4. Generar Signed URLs (60 min validez)
    let signedUrl = "";
    let notarizedUrl = "";

    if (signedVersion?.file_path) {
        const { data } = await supabaseClient.storage
            .from("docs-signed") // Asumiendo bucket correcto
            .createSignedUrl(signedVersion.file_path, 3600);
        signedUrl = data?.signedUrl || "";
    } else if (document.current_signed_file_path) {
         // Fallback a current_signed_file_path
         const { data } = await supabaseClient.storage
            .from("docs-signed")
            .createSignedUrl(document.current_signed_file_path, 3600);
        signedUrl = data?.signedUrl || "";
    }

    if (notarizedVersion?.file_path) {
        const { data } = await supabaseClient.storage
            .from("docs-notarized")
            .createSignedUrl(notarizedVersion.file_path, 3600);
        notarizedUrl = data?.signedUrl || "";
    }

    // 5. Obtener Gestor
    const managerId = document.manager_id || document.created_by;
    let managerEmail = "";
    let managerName = "Gestor";

    if (managerId) {
        const { data: userData } = await supabaseClient.auth.admin.getUserById(managerId);
        managerEmail = userData?.user?.email || "";
        
        const { data: profileData } = await supabaseClient
            .from("users") // core.users via public view
            .select("full_name")
            .eq("id", managerId)
            .single();
        managerName = profileData?.full_name || "Gestor";
    }

    // 6. Obtener Firmantes
    const { data: signers, error: signersError } = await supabaseClient
        .from("signing_signers")
        .select("email, full_name")
        .eq("document_id", document.id)
        .neq("status", "removed");

    // Preparar lista de destinatarios
    const recipients = [];

    // Agregar gestor
    if (managerEmail) {
        recipients.push({ email: managerEmail, name: managerName, type: "manager" });
    }

    // Agregar firmantes si corresponde
    if (document.send_to_signers_on_complete && signers) {
        signers.forEach((s: any) => {
            // Evitar duplicados si el gestor también es firmante
            if (s.email !== managerEmail) {
                recipients.push({ email: s.email, name: s.full_name, type: "signer" });
            }
        });
    }

    console.log(`[send-order-completed] Enviando a ${recipients.length} destinatarios`);

    // Config SendGrid
    const config = getSendGridConfig("transactional");
    const googleReviewUrl = Deno.env.get("GOOGLE_REVIEW_URL") || "https://g.page/Tu-patrimonio-chile/review?gm";

    // Enviar emails
    for (const recipient of recipients) {
        const emailContent = generateEmailContent({
            recipientName: recipient.name,
            documentTitle: document.title,
            signedUrl,
            notarizedUrl,
            googleReviewUrl,
            hasNotaryService: document.notary_service !== 'none'
        });

        await sendEmail(
            config,
            recipient.email,
            recipient.name,
            emailContent.subject,
            emailContent.html,
            emailContent.text,
            {
                organization_id: document.organization_id,
                document_id: document.id,
                notification_type: "ORDER_COMPLETED",
                recipient_type: recipient.type
            }
        );

        // Log history
        await supabaseClient.from("email_history").insert({
            organization_id: document.organization_id,
            to_email: recipient.email,
            from_email: config.fromEmail,
            subject: emailContent.subject,
            body_html: emailContent.html,
            body_text: emailContent.text,
            provider: "sendgrid",
            status: "sent",
            sent_at: new Date().toISOString(),
            metadata: {
                document_id: document.id,
                notification_type: "ORDER_COMPLETED",
                order_id: payload.order_id
            }
        });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Notificaciones enviadas a ${recipients.length} destinatarios`,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error: any) {
    console.error("[send-order-completed] Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Error desconocido",
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

function generateEmailContent(data: {
    recipientName: string;
    documentTitle: string;
    signedUrl: string;
    notarizedUrl: string;
    googleReviewUrl: string;
    hasNotaryService: boolean;
}) {
    const subject = `Tu documento está listo: ${data.documentTitle}`;
    
    // Botones de descarga
    let downloadButtons = "";
    let textLinks = "";

    if (data.signedUrl) {
        downloadButtons += `
            <a href="${data.signedUrl}" style="background-color: #800039; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; margin: 5px;">
                Descargar Firmado
            </a>
        `;
        textLinks += `Descargar Firmado: ${data.signedUrl}\n`;
    }

    if (data.notarizedUrl) {
        downloadButtons += `
            <a href="${data.notarizedUrl}" style="background-color: #4a4a4a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; margin: 5px;">
                Descargar Notarizado
            </a>
        `;
        textLinks += `Descargar Notarizado: ${data.notarizedUrl}\n`;
    }

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 0; background-color: #f9f9f9;">
      
      <!-- Header -->
      <div style="background-color: #10b981; color: white; padding: 30px 20px; text-align: center; border-radius: 0 0 0 0;">
        <h1 style="margin: 0; font-size: 24px;">¡Tu documento está listo!</h1>
      </div>

      <div style="background-color: white; padding: 30px; margin: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
        <p style="font-size: 16px;">Hola <strong>${data.recipientName}</strong>,</p>
        
        <p>Te informamos que el proceso para el documento <strong>"${data.documentTitle}"</strong> ha finalizado exitosamente.</p>
        
        ${data.hasNotaryService ? 
            '<p>El documento ha sido firmado por todas las partes y legalizado ante notario.</p>' : 
            '<p>El documento ha sido firmado electrónicamente por todas las partes.</p>'
        }

        <!-- Download Section -->
        <div style="text-align: center; margin: 30px 0; padding: 20px; background-color: #f0f0f0; border-radius: 8px;">
            <p style="margin-top: 0; font-size: 14px; color: #666; margin-bottom: 15px;">Descarga tus documentos aquí (enlaces válidos por 60 min):</p>
            ${downloadButtons}
        </div>

        <!-- Review Section -->
        <div style="border-top: 1px solid #eee; margin-top: 30px; padding-top: 30px; text-align: center;">
            <h3 style="color: #800039; margin-bottom: 10px;">¿Qué te pareció nuestro servicio?</h3>
            
            <p style="font-size: 18px; margin-bottom: 5px;">⭐⭐⭐⭐⭐</p>
            
            <p style="font-size: 15px; color: #444; max-width: 400px; margin: 0 auto 20px auto;">
                Déjanos una reseña de <strong>5 estrellas en Google</strong> y obtén un <span style="color: #10b981; font-weight: bold;">20% de descuento</span> en tu próxima compra.
            </p>

            <a href="${data.googleReviewUrl}" style="background-color: #fff; color: #800039; border: 2px solid #800039; padding: 10px 20px; text-decoration: none; border-radius: 50px; display: inline-block; font-weight: bold; font-size: 14px;">
                Dejar mi reseña en Google
            </a>

            <p style="font-size: 12px; color: #888; margin-top: 15px;">
                *Para reclamar tu descuento, envíanos una captura de tu reseña a <a href="mailto:contacto@tupatrimonio.app" style="color: #888;">contacto@tupatrimonio.app</a>
            </p>
        </div>

      </div>

      <!-- Footer -->
      <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
        <p style="margin: 5px 0;">TuPatrimonio.app - Simplificando tus trámites legales</p>
        <p style="margin: 5px 0;">Este es un mensaje automático, por favor no responder.</p>
      </div>

    </body>
    </html>
    `;

    const text = `
¡Tu documento está listo!

Hola ${data.recipientName},

Te informamos que el proceso para el documento "${data.documentTitle}" ha finalizado exitosamente.

${textLinks}

(Los enlaces son válidos por 60 minutos)

---
¿Qué te pareció nuestro servicio?

Déjanos una reseña de 5 estrellas en Google y obtén un 20% de descuento en tu próxima compra.

Enlace para reseña: ${data.googleReviewUrl}

Para reclamar tu descuento, envíanos una captura de tu reseña a contacto@tupatrimonio.app
---

TuPatrimonio.app
    `;

    return { subject, html, text };
}
