import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireApplicationAccess } from "@/lib/access/api-access-guard";

export const runtime = "nodejs";

/**
 * GET /api/crm/tickets
 * Obtener lista de tickets
 */
export async function GET(request: NextRequest) {
  // Verificar acceso a CRM
  const denied = await requireApplicationAccess(request, "crm_sales");
  if (denied) return denied;

  try {
    const supabase = await createClient();

    // Verificar autenticación
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 },
      );
    }

    // Obtener organización del usuario
    const { data: orgUser } = await supabase
      .from("organization_users")
      .select("organization_id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();

    if (!orgUser) {
      return NextResponse.json(
        { error: "Organización no encontrada" },
        { status: 400 },
      );
    }

    // Obtener tickets
    const { data: tickets, error } = await supabase
      .from("tickets")
      .select("*")
      .eq("organization_id", orgUser.organization_id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching tickets:", error);
      return NextResponse.json(
        { error: error.message || "Error obteniendo tickets" },
        { status: 500 },
      );
    }

    return NextResponse.json(tickets || []);
  } catch (error: any) {
    console.error("Error fetching tickets:", error);
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/crm/tickets
 * Crear un nuevo ticket
 */
// ... imports
import { createServiceRoleClient } from "@/lib/supabase/server";
import { sendEmailWithSharedAccount } from "@/lib/gmail/client";

export async function POST(request: NextRequest) {
  // Verificar acceso a CRM
  const denied = await requireApplicationAccess(request, "crm_sales");
  if (denied) return denied;

  try {
    const supabase = await createClient();
    const serviceSupabase = createServiceRoleClient(); // Para operaciones privilegiadas (email history, associations)
    const body = await request.json();

    // Verificar autenticación
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 },
      );
    }

    // Obtener organización del usuario
    const { data: orgUser } = await supabase
      .from("organization_users")
      .select("organization_id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();

    let organizationId = orgUser?.organization_id;

    // Si no tiene organización, verificar si es platform admin
    if (!organizationId) {
      const { data: isPlatformAdmin } = await supabase.rpc("is_platform_admin");

      if (isPlatformAdmin) {
        // Usar la organización platform para platform admins
        const { data: platformOrg } = await supabase
          .from("organizations")
          .select("id")
          .eq("org_type", "platform")
          .eq("status", "active")
          .single();

        organizationId = platformOrg?.id;
      }
    }

    if (!organizationId) {
      return NextResponse.json(
        { error: "Organización no encontrada" },
        { status: 400 },
      );
    }

    // Validar campos requeridos
    if (!body.subject || !body.description) {
      return NextResponse.json(
        { error: "El asunto y la descripción son requeridos" },
        { status: 400 },
      );
    }

    // Generar número de ticket (usar función SQL si existe, sino generar manualmente)
    const { count } = await supabase
      .from("tickets")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", organizationId);

    const ticketNumber = `TICK-${String((count || 0) + 1).padStart(5, "0")}`;

    // Preparar datos para insertar
    const insertData: any = {
      organization_id: organizationId,
      ticket_number: ticketNumber,
      subject: body.subject,
      description: body.description,
      status: body.status || "new",
      priority: body.priority || "medium",
      category: body.category || "general",
      contact_id: body.contact_id || null, // CRM Contact ID if passed
      company_id: body.company_id || null, // CRM Company ID if passed
      due_date: body.due_date || null,
      created_by: user.id,
    };

    // Note: If passed via associations param (core entities), we will link them after creation

    // Crear ticket
    const { data: newTicket, error } = await supabase
      .from("tickets")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error("Error creating ticket:", error);
      return NextResponse.json(
        { error: error.message || "Error creando ticket" },
        { status: 500 },
      );
    }

    // Manejar Asociaciones (Core y CRM) desde `associations` param
    const associations = body.associations || {};

    // 1. Link Order
    if (associations.orderId) {
      await serviceSupabase.rpc("link_ticket_order", {
        p_ticket_id: newTicket.id,
        p_order_id: associations.orderId,
      });

      // Obtener usuario y organización responsable del pedido para asociarlos
      const { data: orderData } = await serviceSupabase
        .from("orders")
        .select("user_id, organization_id")
        .eq("id", associations.orderId)
        .single();

      // Asociar automáticamente el usuario responsable del pedido
      if (orderData?.user_id && !associations.userId) {
        associations.userId = orderData.user_id;
      }

      // Asociar automáticamente la organización del pedido si no está especificada
      if (orderData?.organization_id && !associations.organizationId) {
        associations.organizationId = orderData.organization_id;
      }
    }

    // 2. Link Core User
    if (associations.userId) {
      await serviceSupabase.rpc("link_ticket_user", {
        p_ticket_id: newTicket.id,
        p_user_id: associations.userId,
      });
    }

    // 3. Link Core Organization
    if (associations.organizationId) {
      await serviceSupabase.rpc("link_ticket_organization", {
        p_ticket_id: newTicket.id,
        p_organization_id: associations.organizationId,
      });
    }

    // 4. Link CRM Contact (explicit association)
    if (associations.contactId) {
      // If not already set in main ticket creation
      if (!insertData.contact_id) {
        await serviceSupabase.rpc("link_ticket_contact", {
          p_ticket_id: newTicket.id,
          p_contact_id: associations.contactId,
        });
      }
    }

    // 5. Link CRM Company (explicit association)
    if (associations.companyId) {
      // If not already set in main ticket creation
      if (!insertData.company_id) {
        await serviceSupabase.rpc("link_ticket_company", {
          p_ticket_id: newTicket.id,
          p_company_id: associations.companyId,
        });
      }
    }

    // Manejar Envío de Email
    if (body.sendEmailNotification) {
      let toEmail = "";

      // Resolver email destino
      if (associations.userId) {
        // Fetch user email
        const { data: userData } = await serviceSupabase.auth.admin.getUserById(
          associations.userId,
        );
        toEmail = userData?.user?.email || "";
      } else if (associations.contactId) {
        const { data: contact } = await serviceSupabase
          .from("crm.contacts")
          .select("email")
          .eq("id", associations.contactId)
          .single();
        toEmail = contact?.email || "";
      } else if (associations.organizationId) {
        const { data: org } = await serviceSupabase
          .from("organizations")
          .select("email")
          .eq("id", associations.organizationId)
          .single();
        toEmail = org?.email || "";
      }

      if (toEmail) {
        try {
          // Get platform org for email sending context
          const { data: platformOrg } = await supabase
            .from("organizations")
            .select("id")
            .eq("org_type", "platform")
            .eq("status", "active")
            .single();

          if (platformOrg) {
            // Send Email with Threading Support
            const { messageId, threadId } = await sendEmailWithSharedAccount(
              platformOrg.id,
              user.id,
              toEmail,
              `[TICKET #${newTicket.ticket_number}] ${body.subject}`, // Add ticket # to subject
              body.description, // HTML Body (assuming description is rich text or plain)
              undefined, // Text body auto-generated
              true, // Include signature
              undefined, // No In-Reply-To (New Thread)
              undefined, // No References
              undefined, // New Thread
            );

            // Create CRM Thread
            let threadIdCrm = null;
            if (threadId) {
              const { data: newThread } = await serviceSupabase
                .from("email_threads")
                .insert({
                  organization_id: platformOrg.id,
                  gmail_thread_id: threadId,
                  contact_id: insertData.contact_id || null, // Link to CRM contact if available
                  subject: body.subject,
                  snippet: body.description.substring(0, 100),
                  participants: [toEmail],
                  last_email_at: new Date().toISOString(),
                  last_email_from: toEmail, // Or 'me'? Technically initiated by us.
                  email_count: 1,
                })
                .select("id")
                .single();
              threadIdCrm = newThread?.id;
            }

            // Save Email to DB for Threading History
            const { data: gmailAccount } = await serviceSupabase
              .from("email_accounts")
              .select("id, email_address")
              .eq("organization_id", platformOrg.id)
              .eq("account_type", "shared")
              .eq("is_active", true)
              .single();

            await serviceSupabase
              .from("emails")
              .insert({
                organization_id: platformOrg.id,
                contact_id: insertData.contact_id || null,
                ticket_id: newTicket.id,
                thread_id_crm: threadIdCrm,
                gmail_message_id: messageId,
                thread_id: threadId,
                from_email: gmailAccount?.email_address ||
                  "contacto@tupatrimonio.app",
                to_emails: [toEmail],
                subject: body.subject,
                body_html: body.description.replace(/\n/g, "<br>"), // Convert newlines to br for HTML
                body_text: body.description, // Plain text keeps newlines
                direction: "outbound", // Sent by us
                status: "sent",
                sent_at: new Date().toISOString(),
                sent_by: user.id,
                sent_from_account_id: gmailAccount?.id || null,
                is_read: true,
                snippet: body.description.substring(0, 100),
              });

            console.log(
              `Ticket creation email sent. Ticket: ${newTicket.id}, Thread: ${threadId}`,
            );
          }
        } catch (emailError) {
          console.error("Failed to send ticket creation email:", emailError);
          // Don't fail the request, just log error. Ticket is created.
        }
      }
    }

    return NextResponse.json(newTicket, { status: 201 });
  } catch (error: any) {
    console.error("Error creating ticket:", error);
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 },
    );
  }
}
